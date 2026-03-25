import { HelpCircle, Palette, Lightbulb, Info, FileText, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AccordionItem, AccordionStyle } from '../types';

export interface AccordionTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  style: AccordionStyle;
  items: Omit<AccordionItem, 'id'>[];
}

export const ACCORDION_TEMPLATES: AccordionTemplate[] = [
  {
    id: 'faq',
    name: 'Visitor FAQ',
    description: 'Common questions visitors ask at museum stops',
    icon: HelpCircle,
    style: 'faq',
    items: [
      { heading: { en: 'What am I looking at?' }, content: { en: '' }, icon: 'question' },
      { heading: { en: 'How old is this?' }, content: { en: '' }, icon: 'question' },
      { heading: { en: 'Why is this important?' }, content: { en: '' }, icon: 'question' },
      { heading: { en: 'Where was this found?' }, content: { en: '' }, icon: 'question' },
      { heading: { en: 'Can I take photos?' }, content: { en: '' }, icon: 'camera' },
    ],
  },
  {
    id: 'artwork-details',
    name: 'Artwork Details',
    description: 'Technical information about a work of art',
    icon: Palette,
    style: 'museum',
    items: [
      { heading: { en: 'About the Artist' }, content: { en: '' }, icon: 'palette' },
      { heading: { en: 'Materials & Technique' }, content: { en: '' }, icon: 'eye' },
      { heading: { en: 'Provenance' }, content: { en: '' }, icon: 'history' },
      { heading: { en: 'Conservation Notes' }, content: { en: '' }, icon: 'shield' },
      { heading: { en: 'Bibliography' }, content: { en: '' }, icon: 'book' },
    ],
  },
  {
    id: 'did-you-know',
    name: 'Did You Know?',
    description: 'Fun facts and deeper context for curious visitors',
    icon: Lightbulb,
    style: 'card',
    items: [
      { heading: { en: 'Fun Fact' }, content: { en: '' }, icon: 'lightbulb', defaultOpen: true },
      { heading: { en: 'Historical Context' }, content: { en: '' }, icon: 'history' },
      { heading: { en: 'Look Closer' }, content: { en: '' }, icon: 'eye' },
    ],
  },
  {
    id: 'visitor-info',
    name: 'Visitor Information',
    description: 'Practical details for museum visitors',
    icon: Info,
    style: 'bordered',
    items: [
      { heading: { en: 'Opening Hours' }, content: { en: '' }, icon: 'clock' },
      { heading: { en: 'Admission' }, content: { en: '' }, icon: 'ticket' },
      { heading: { en: 'Accessibility' }, content: { en: '' }, icon: 'accessibility' },
      { heading: { en: 'Getting Here' }, content: { en: '' }, icon: 'map-pin' },
      { heading: { en: 'Photography Policy' }, content: { en: '' }, icon: 'camera' },
    ],
  },
  {
    id: 'artifact-record',
    name: 'Artifact Record',
    description: 'Catalog-style details for museum objects',
    icon: FileText,
    style: 'minimal',
    items: [
      { heading: { en: 'Object Description' }, content: { en: '' }, icon: 'info' },
      { heading: { en: 'Date & Origin' }, content: { en: '' }, icon: 'history' },
      { heading: { en: 'Dimensions & Materials' }, content: { en: '' }, icon: 'eye' },
      { heading: { en: 'Accession Information' }, content: { en: '' }, icon: 'book' },
      { heading: { en: 'Related Objects' }, content: { en: '' }, icon: 'star' },
    ],
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start with an empty accordion',
    icon: Plus,
    style: 'minimal',
    items: [
      { heading: { en: 'Section 1' }, content: { en: '' }, icon: 'none' },
    ],
  },
];
