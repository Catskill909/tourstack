import {
  Info, HelpCircle, Clock, Star, AlertTriangle, Lightbulb,
  BookOpen, Eye, Palette, Shield, Accessibility, Camera,
  MapPin, Ticket, Timer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AccordionIcon, AccordionStyle } from '../types';

export const ACCORDION_ICON_MAP: Record<AccordionIcon, LucideIcon | null> = {
  none: null,
  info: Info,
  question: HelpCircle,
  history: Clock,
  star: Star,
  warning: AlertTriangle,
  lightbulb: Lightbulb,
  book: BookOpen,
  eye: Eye,
  palette: Palette,
  shield: Shield,
  accessibility: Accessibility,
  camera: Camera,
  'map-pin': MapPin,
  ticket: Ticket,
  clock: Timer,
};

export const ACCORDION_ICON_OPTIONS: { value: AccordionIcon; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'info', label: 'Info' },
  { value: 'question', label: 'Question' },
  { value: 'history', label: 'History' },
  { value: 'star', label: 'Star' },
  { value: 'warning', label: 'Warning' },
  { value: 'lightbulb', label: 'Lightbulb' },
  { value: 'book', label: 'Book' },
  { value: 'eye', label: 'Eye' },
  { value: 'palette', label: 'Palette' },
  { value: 'shield', label: 'Shield' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'camera', label: 'Camera' },
  { value: 'map-pin', label: 'Map Pin' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'clock', label: 'Clock' },
];

export const ACCORDION_STYLES: Record<AccordionStyle, {
  container: string;
  item: (isOpen: boolean) => string;
  heading: (isOpen: boolean) => string;
  content: string;
}> = {
  minimal: {
    container: 'divide-y divide-neutral-700',
    item: () => '',
    heading: (isOpen) =>
      `flex items-center justify-between w-full py-3 text-left text-sm font-medium ${isOpen ? 'text-white' : 'text-neutral-300'} hover:text-white transition-colors`,
    content: 'pb-3 pl-1 text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap',
  },
  card: {
    container: 'space-y-2',
    item: (isOpen) =>
      `rounded-lg ${isOpen ? 'bg-neutral-800/70' : 'bg-neutral-800/40'} transition-colors`,
    heading: (isOpen) =>
      `flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium ${isOpen ? 'text-white' : 'text-neutral-300'} hover:text-white`,
    content: 'px-4 pb-3 text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap',
  },
  bordered: {
    container: 'border-l-2 border-neutral-600 divide-y divide-neutral-700/50',
    item: () => '',
    heading: (isOpen) =>
      `flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium ${isOpen ? 'text-white border-l-2 border-blue-500 -ml-[2px]' : 'text-neutral-300'} hover:text-white`,
    content: 'px-4 pb-3 text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap',
  },
  museum: {
    container: 'divide-y divide-neutral-700/30',
    item: (isOpen) =>
      `${isOpen ? 'border-l-2 border-amber-500/70' : ''}`,
    heading: (isOpen) =>
      `flex items-center justify-between w-full px-4 py-3.5 text-left text-sm tracking-wide ${isOpen ? 'text-amber-400 font-semibold' : 'text-neutral-300 font-medium'} hover:text-amber-300 transition-colors uppercase`,
    content: 'px-4 pb-4 text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap bg-gradient-to-b from-neutral-800/30 to-transparent',
  },
  faq: {
    container: 'space-y-1',
    item: (isOpen) =>
      `rounded-lg ${isOpen ? 'bg-neutral-800/50' : ''} ${!isOpen ? 'odd:bg-neutral-800/20' : ''}`,
    heading: (isOpen) =>
      `flex items-center justify-between w-full px-4 py-3 text-left text-sm font-semibold ${isOpen ? 'text-white' : 'text-neutral-200'} hover:text-white`,
    content: 'px-4 pb-3 text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap',
  },
};

export const ACCORDION_STYLE_OPTIONS: { value: AccordionStyle; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'card', label: 'Card' },
  { value: 'bordered', label: 'Bordered' },
  { value: 'museum', label: 'Museum' },
  { value: 'faq', label: 'FAQ' },
];
