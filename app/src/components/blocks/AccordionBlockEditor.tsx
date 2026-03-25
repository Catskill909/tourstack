import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus, GripVertical, Loader2 } from 'lucide-react';
import type { AccordionBlockData, AccordionItem, AccordionIcon } from '../../types';
import type { TranslationProvider } from '../../services/translationService';
import { translateBatch } from '../../services/translationService';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { MagicTranslateButton } from '../MagicTranslateButton';
import { ACCORDION_TEMPLATES } from '../../lib/accordionTemplates';
import { ACCORDION_ICON_MAP, ACCORDION_ICON_OPTIONS, ACCORDION_STYLE_OPTIONS } from '../../lib/accordionStyles';

interface AccordionBlockEditorProps {
  data: AccordionBlockData;
  language: string;
  availableLanguages?: string[];
  translationProvider?: TranslationProvider;
  onChange: (data: AccordionBlockData) => void;
}

export function AccordionBlockEditor({
  data,
  language,
  availableLanguages = ['en'],
  translationProvider = 'libretranslate',
  onChange,
}: AccordionBlockEditorProps) {
  const [activeLang, setActiveLang] = useState(language);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    () => new Set(data.items.length > 0 ? [data.items[0].id] : [])
  );
  const [showTemplates, setShowTemplates] = useState(data.items.length <= 1 && !data.items[0]?.content?.[language]);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  const primaryLang = availableLanguages[0] || 'en';
  const targetLangs = availableLanguages.filter(l => l !== primaryLang);

  function generateId() {
    return `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function updateItems(items: AccordionItem[]) {
    onChange({ ...data, items });
  }

  function updateItem(id: string, updates: Partial<AccordionItem>) {
    const items = data.items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    updateItems(items);
  }

  function addItem() {
    const newItem: AccordionItem = {
      id: generateId(),
      heading: { [activeLang]: '' },
      content: { [activeLang]: '' },
      icon: 'none',
      defaultOpen: false,
    };
    updateItems([...data.items, newItem]);
    setExpandedItems(prev => new Set([...prev, newItem.id]));
  }

  function deleteItem(id: string) {
    updateItems(data.items.filter(item => item.id !== id));
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= data.items.length) return;
    const items = [...data.items];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    updateItems(items);
  }

  function applyTemplate(templateId: string) {
    const template = ACCORDION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const items: AccordionItem[] = template.items.map(item => ({
      ...item,
      id: generateId(),
    }));
    onChange({
      ...data,
      items,
      style: template.style,
    });
    setExpandedItems(new Set([items[0]?.id].filter(Boolean)));
    setShowTemplates(false);
  }

  function toggleItemExpanded(id: string) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleTranslateAll() {
    if (targetLangs.length === 0) return;
    setIsTranslatingAll(true);
    try {
      const sourceTexts: string[] = [];
      data.items.forEach(item => {
        sourceTexts.push(item.heading[primaryLang] || '');
        sourceTexts.push(item.content[primaryLang] || '');
      });

      let updatedItems = [...data.items];
      for (const targetLang of targetLangs) {
        const translations = await translateBatch(sourceTexts, primaryLang, targetLang);
        updatedItems = updatedItems.map((item, i) => ({
          ...item,
          heading: { ...item.heading, [targetLang]: translations[i * 2] || '' },
          content: { ...item.content, [targetLang]: translations[i * 2 + 1] || '' },
        }));
      }
      updateItems(updatedItems);
    } catch (err) {
      console.error('Translate all failed:', err);
    } finally {
      setIsTranslatingAll(false);
    }
  }

  // Build content map for language switcher
  function buildContentMap(): { [lang: string]: string } {
    const map: { [lang: string]: string } = {};
    for (const lang of availableLanguages) {
      const hasContent = data.items.some(
        item => (item.heading[lang] || '').trim() || (item.content[lang] || '').trim()
      );
      map[lang] = hasContent ? 'filled' : '';
    }
    return map;
  }

  return (
    <div className="space-y-6">
      {/* Template Picker */}
      {showTemplates && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Choose a Template
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ACCORDION_TEMPLATES.map(template => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10 transition-colors text-center"
                >
                  <Icon className="w-5 h-5 text-[var(--color-accent-primary)]" />
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{template.name}</span>
                </button>
              );
            })}
          </div>
          {data.items.length > 0 && (
            <button
              onClick={() => setShowTemplates(false)}
              className="mt-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              Skip — keep current sections
            </button>
          )}
        </div>
      )}

      {/* Style Selector */}
      {!showTemplates && (
        <>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {ACCORDION_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ ...data, style: opt.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    data.style === opt.value
                      ? 'bg-[var(--color-accent-primary)] text-white'
                      : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Settings</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.allowMultipleOpen}
                  onChange={e => onChange({ ...data, allowMultipleOpen: e.target.checked })}
                  className="rounded"
                />
                Allow multiple open
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showExpandAll}
                  onChange={e => onChange({ ...data, showExpandAll: e.target.checked })}
                  className="rounded"
                />
                Show Expand/Collapse All
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.numberedItems}
                  onChange={e => onChange({ ...data, numberedItems: e.target.checked })}
                  className="rounded"
                />
                Numbered items
              </label>
            </div>
          </div>

          {/* Language Bar */}
          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-3">
              <LanguageSwitcher
                availableLanguages={availableLanguages}
                activeLanguage={activeLang}
                onChange={setActiveLang}
                contentMap={buildContentMap()}
                size="sm"
              />
              {targetLangs.length > 0 && (
                <button
                  onClick={handleTranslateAll}
                  disabled={isTranslatingAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/20 transition-colors disabled:opacity-50"
                >
                  {isTranslatingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Translating…
                    </>
                  ) : (
                    '🌐 Translate All'
                  )}
                </button>
              )}
            </div>
          )}

          {/* Change Template button */}
          <button
            onClick={() => setShowTemplates(true)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition-colors"
          >
            Change Template…
          </button>

          {/* Sections */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Sections ({data.items.length})
            </label>

            {data.items.map((item, index) => {
              const isExpanded = expandedItems.has(item.id);
              const IconComp = item.icon && item.icon !== 'none' ? ACCORDION_ICON_MAP[item.icon] : null;
              const heading = item.heading[activeLang] || '';

              return (
                <div
                  key={item.id}
                  className="border border-[var(--color-border-default)] rounded-lg overflow-hidden"
                >
                  {/* Item Header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-elevated)] cursor-pointer"
                    onClick={() => toggleItemExpanded(item.id)}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
                    {data.numberedItems && (
                      <span className="text-xs text-[var(--color-text-muted)] font-medium">{index + 1}.</span>
                    )}
                    {IconComp && <IconComp className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />}
                    <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">
                      {heading || <span className="italic text-[var(--color-text-muted)]">Untitled section</span>}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); moveItem(index, -1); }}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-[var(--color-bg-hover)] disabled:opacity-30"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); moveItem(index, 1); }}
                        disabled={index === data.items.length - 1}
                        className="p-1 rounded hover:bg-[var(--color-bg-hover)] disabled:opacity-30"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                        className="p-1 rounded hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400"
                        title="Delete section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Item Body */}
                  {isExpanded && (
                    <div className="px-3 py-3 space-y-3 border-t border-[var(--color-border-default)]">
                      {/* Icon picker + Heading */}
                      <div className="flex gap-2">
                        <select
                          value={item.icon || 'none'}
                          onChange={e => updateItem(item.id, { icon: e.target.value as AccordionIcon })}
                          className="w-28 px-2 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)]"
                        >
                          {ACCORDION_ICON_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            type="text"
                            value={heading}
                            onChange={e => updateItem(item.id, {
                              heading: { ...item.heading, [activeLang]: e.target.value },
                            })}
                            placeholder="Section heading…"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                          />
                          {availableLanguages.length > 1 && (
                            <MagicTranslateButton
                              sourceText={item.heading[primaryLang] || ''}
                              sourceLang={primaryLang}
                              targetLangs={targetLangs}
                              provider={translationProvider}
                              size="sm"
                              onTranslate={translations => {
                                updateItem(item.id, {
                                  heading: { ...item.heading, ...translations },
                                });
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-1">
                          <textarea
                            value={item.content[activeLang] || ''}
                            onChange={e => updateItem(item.id, {
                              content: { ...item.content, [activeLang]: e.target.value },
                            })}
                            placeholder="Section content…"
                            rows={3}
                            className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-y"
                          />
                        </div>
                        {availableLanguages.length > 1 && (
                          <div className="mt-1 flex justify-end">
                            <MagicTranslateButton
                              sourceText={item.content[primaryLang] || ''}
                              sourceLang={primaryLang}
                              targetLangs={targetLangs}
                              provider={translationProvider}
                              size="sm"
                              onTranslate={translations => {
                                updateItem(item.id, {
                                  content: { ...item.content, ...translations },
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Default open */}
                      <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.defaultOpen || false}
                          onChange={e => updateItem(item.id, { defaultOpen: e.target.checked })}
                          className="rounded"
                        />
                        Start expanded
                      </label>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Section button */}
            <button
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-[var(--color-border-default)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] hover:border-[var(--color-accent-primary)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>
        </>
      )}
    </div>
  );
}
