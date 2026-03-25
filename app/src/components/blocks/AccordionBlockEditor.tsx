import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus, GripVertical, Loader2, ArrowLeft, Check } from 'lucide-react';
import type { AccordionBlockData, AccordionItem, AccordionIcon, AccordionStyle } from '../../types';
import { translateBatch } from '../../services/translationService';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ACCORDION_TEMPLATES } from '../../lib/accordionTemplates';
import { ACCORDION_ICON_MAP, ACCORDION_ICON_OPTIONS, ACCORDION_STYLE_OPTIONS } from '../../lib/accordionStyles';

interface AccordionBlockEditorProps {
  data: AccordionBlockData;
  language: string;
  availableLanguages?: string[];
  onChange: (data: AccordionBlockData) => void;
}

// Mini style previews — tiny wireframe showing each style
function StylePreview({ style, isSelected }: { style: AccordionStyle; isSelected: boolean }) {
  const previewStyles: Record<AccordionStyle, React.ReactNode> = {
    minimal: (
      <div className="space-y-0 w-full">
        <div className="border-t border-neutral-600 pt-1 flex justify-between items-center">
          <div className="h-1.5 w-14 bg-neutral-300 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
        <div className="border-t border-neutral-600 pt-1 flex justify-between items-center">
          <div className="h-1.5 w-10 bg-neutral-400 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
        <div className="border-t border-b border-neutral-600 pt-1 pb-1 flex justify-between items-center">
          <div className="h-1.5 w-12 bg-neutral-400 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
      </div>
    ),
    card: (
      <div className="space-y-1 w-full">
        <div className="bg-neutral-700/60 rounded px-1.5 py-1 flex justify-between items-center">
          <div className="h-1.5 w-12 bg-neutral-300 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
        <div className="bg-neutral-700/40 rounded px-1.5 py-1 flex justify-between items-center">
          <div className="h-1.5 w-10 bg-neutral-400 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
        <div className="bg-neutral-700/40 rounded px-1.5 py-1 flex justify-between items-center">
          <div className="h-1.5 w-14 bg-neutral-400 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
      </div>
    ),
    bordered: (
      <div className="border-l-2 border-neutral-500 w-full">
        <div className="border-b border-neutral-600/50 pl-2 py-1 flex justify-between items-center">
          <div className="h-1.5 w-12 bg-neutral-300 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
        <div className="border-b border-neutral-600/50 pl-2 py-1 flex justify-between items-center border-l-2 border-l-blue-500 -ml-[2px]">
          <div className="h-1.5 w-10 bg-white rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 -rotate-[135deg] translate-y-0.5" />
        </div>
        <div className="pl-2 py-1 flex justify-between items-center">
          <div className="h-1.5 w-14 bg-neutral-400 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
      </div>
    ),
    museum: (
      <div className="w-full">
        <div className="border-b border-neutral-700/30 py-1 flex justify-between items-center">
          <div className="h-1.5 w-12 bg-neutral-400 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
        <div className="border-l-2 border-amber-500/70 border-b border-neutral-700/30 pl-1.5 py-1 flex justify-between items-center">
          <div className="h-1.5 w-10 bg-amber-400 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-amber-400 -rotate-[135deg] translate-y-0.5" />
        </div>
        <div className="border-b border-neutral-700/30 py-1 flex justify-between items-center">
          <div className="h-1.5 w-14 bg-neutral-400 rounded-full" />
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
      </div>
    ),
    faq: (
      <div className="space-y-0.5 w-full">
        <div className="bg-neutral-800/50 rounded px-1.5 py-1 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <div className="text-[6px] text-neutral-400 font-bold">Q:</div>
            <div className="h-1.5 w-10 bg-white rounded-full" />
          </div>
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 -rotate-[135deg] translate-y-0.5" />
        </div>
        <div className="bg-neutral-800/20 rounded px-1.5 py-1 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <div className="text-[6px] text-neutral-400 font-bold">Q:</div>
            <div className="h-1.5 w-12 bg-neutral-400 rounded-full" />
          </div>
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
        <div className="rounded px-1.5 py-1 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <div className="text-[6px] text-neutral-400 font-bold">Q:</div>
            <div className="h-1.5 w-8 bg-neutral-400 rounded-full" />
          </div>
          <div className="h-1.5 w-1.5 border-b border-r border-neutral-400 rotate-45 -translate-y-0.5" />
        </div>
      </div>
    ),
  };

  return (
    <div className={`w-full h-12 flex items-center px-2 rounded-md ${isSelected ? 'bg-neutral-800' : 'bg-neutral-900/50'}`}>
      {previewStyles[style]}
    </div>
  );
}

export function AccordionBlockEditor({
  data,
  language,
  availableLanguages = ['en'],
  onChange,
}: AccordionBlockEditorProps) {
  const [activeLang, setActiveLang] = useState(language);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    () => new Set(data.items.length > 0 ? [data.items[0].id] : [])
  );
  // Show template picker when block is new (single empty-ish item)
  const isNewBlock = data.items.length <= 1 && !data.items[0]?.content?.[language];
  const [page, setPage] = useState<'templates' | 'editor'>(isNewBlock ? 'templates' : 'editor');
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  // 'idle' = needs translation, 'done' = translations are current
  const [translateState, setTranslateState] = useState<'idle' | 'done'>('idle');

  const primaryLang = availableLanguages[0] || 'en';
  const targetLangs = availableLanguages.filter(l => l !== primaryLang);

  function generateId() {
    return `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function updateItems(items: AccordionItem[]) {
    onChange({ ...data, items });
    // Any content change invalidates translations
    setTranslateState('idle');
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
    setPage('editor');
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
      // Use onChange directly so we don't reset translateState
      onChange({ ...data, items: updatedItems });
      setTranslateState('done');
    } catch (err) {
      console.error('Translate all failed:', err);
    } finally {
      setIsTranslatingAll(false);
    }
  }

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

  // =========================================================================
  // PAGE 1: Template Picker
  // =========================================================================
  if (page === 'templates') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
            Choose a Template
          </label>
          <div className="space-y-3">
            {ACCORDION_TEMPLATES.map(template => {
              const TemplateIcon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="w-full text-left rounded-lg border border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/5 transition-colors overflow-hidden"
                >
                  {/* Template header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-elevated)]">
                    <TemplateIcon className="w-5 h-5 text-[var(--color-accent-primary)] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">{template.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{template.description}</div>
                    </div>
                    <StylePreview style={template.style} isSelected={false} />
                  </div>
                  {/* Preset sections preview */}
                  <div className="px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1">
                    {template.items.map((item, i) => {
                      const ItemIcon = item.icon && item.icon !== 'none' ? ACCORDION_ICON_MAP[item.icon] : null;
                      return (
                        <span key={i} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                          {ItemIcon && <ItemIcon className="w-3 h-3 text-[var(--color-text-muted)]" />}
                          {item.heading.en}
                        </span>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skip link if there's already content */}
        {!isNewBlock && (
          <button
            onClick={() => setPage('editor')}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Skip — keep current sections
          </button>
        )}
      </div>
    );
  }

  // =========================================================================
  // PAGE 2: Section Editor
  // =========================================================================
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back to templates */}
      <button
        onClick={() => setPage('templates')}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Change Template
      </button>

      {/* Style Selector with previews */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Style</label>
        <div className="grid grid-cols-5 gap-2">
          {ACCORDION_STYLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...data, style: opt.value })}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors ${
                data.style === opt.value
                  ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                  : 'border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]'
              }`}
            >
              <StylePreview style={opt.value} isSelected={data.style === opt.value} />
              <span className={`text-xs font-medium ${
                data.style === opt.value
                  ? 'text-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)]'
              }`}>
                {opt.label}
              </span>
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
        <div className="flex items-center gap-3 flex-wrap">
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
              disabled={isTranslatingAll || translateState === 'done'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                translateState === 'done'
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/20'
              } disabled:opacity-60`}
            >
              {isTranslatingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Translating…
                </>
              ) : translateState === 'done' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Translated
                </>
              ) : (
                '🌐 Translate All'
              )}
            </button>
          )}
        </div>
      )}

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
                    <input
                      type="text"
                      value={heading}
                      onChange={e => updateItem(item.id, {
                        heading: { ...item.heading, [activeLang]: e.target.value },
                      })}
                      placeholder="Section heading…"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                    />
                  </div>

                  {/* Content */}
                  <textarea
                    value={item.content[activeLang] || ''}
                    onChange={e => updateItem(item.id, {
                      content: { ...item.content, [activeLang]: e.target.value },
                    })}
                    placeholder="Section content…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-y"
                  />

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
    </div>
  );
}
