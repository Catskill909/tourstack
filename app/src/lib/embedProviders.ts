import type { HtmlEmbedProvider } from '../types';

interface EmbedProviderConfig {
  name: string;
  urlPatterns: RegExp[];
  toEmbedUrl: (url: string) => string;
  defaultAspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | '21:9' | 'auto';
}

const EMBED_PROVIDERS: Record<HtmlEmbedProvider, EmbedProviderConfig> = {
  sketchfab: {
    name: 'Sketchfab 3D Model',
    urlPatterns: [/sketchfab\.com\/3d-models\/([\w-]+)/],
    toEmbedUrl: (url) => {
      const match = url.match(/sketchfab\.com\/3d-models\/([\w-]+)/);
      const slug = match?.[1] || '';
      const id = slug.split('-').pop();
      return `https://sketchfab.com/models/${id}/embed`;
    },
    defaultAspectRatio: '16:9',
  },
  matterport: {
    name: 'Matterport Virtual Tour',
    urlPatterns: [/my\.matterport\.com\/show\/\?m=([\w]+)/, /matterport\.com.*m=([\w]+)/],
    toEmbedUrl: (url) => {
      const match = url.match(/m=([\w]+)/);
      return `https://my.matterport.com/show/?m=${match?.[1]}&play=1`;
    },
    defaultAspectRatio: '16:9',
  },
  youtube: {
    name: 'YouTube',
    urlPatterns: [
      /youtube\.com\/watch\?v=([\w-]+)/,
      /youtu\.be\/([\w-]+)/,
      /youtube\.com\/playlist\?list=([\w-]+)/,
      /youtube\.com\/embed\/([\w-]+)/,
    ],
    toEmbedUrl: (url) => {
      const playlist = url.match(/list=([\w-]+)/);
      if (playlist) return `https://www.youtube.com/embed/videoseries?list=${playlist[1]}`;
      const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/);
      return `https://www.youtube.com/embed/${match?.[1]}`;
    },
    defaultAspectRatio: '16:9',
  },
  vimeo: {
    name: 'Vimeo',
    urlPatterns: [/vimeo\.com\/(\d+)/],
    toEmbedUrl: (url) => {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return `https://player.vimeo.com/video/${match?.[1]}`;
    },
    defaultAspectRatio: '16:9',
  },
  spotify: {
    name: 'Spotify',
    urlPatterns: [/open\.spotify\.com\/(track|album|playlist|episode)\/([\w]+)/],
    toEmbedUrl: (url) => {
      const match = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([\w]+)/);
      if (!match) return url;
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    },
    defaultAspectRatio: '4:3',
  },
  soundcloud: {
    name: 'SoundCloud',
    urlPatterns: [/soundcloud\.com\//],
    toEmbedUrl: (url) => {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&visual=true`;
    },
    defaultAspectRatio: '16:9',
  },
  'google-arts': {
    name: 'Google Arts & Culture',
    urlPatterns: [/artsandculture\.google\.com/],
    toEmbedUrl: (url) => url,
    defaultAspectRatio: '16:9',
  },
  'google-maps': {
    name: 'Google Maps',
    urlPatterns: [/google\.com\/maps\/embed/, /google\.com\/maps\//],
    toEmbedUrl: (url) => {
      if (url.includes('/embed')) return url;
      return url;
    },
    defaultAspectRatio: '16:9',
  },
  'google-forms': {
    name: 'Google Forms',
    urlPatterns: [/docs\.google\.com\/forms/],
    toEmbedUrl: (url) => {
      if (url.includes('/viewform')) {
        return url.replace('/viewform', '/viewform?embedded=true');
      }
      return url;
    },
    defaultAspectRatio: 'auto',
  },
  typeform: {
    name: 'Typeform',
    urlPatterns: [/typeform\.com\/to\/([\w]+)/],
    toEmbedUrl: (url) => url,
    defaultAspectRatio: 'auto',
  },
  instagram: {
    name: 'Instagram',
    urlPatterns: [/instagram\.com\/(p|reel)\/([\w-]+)/],
    toEmbedUrl: (url) => {
      const match = url.match(/instagram\.com\/(p|reel)\/([\w-]+)/);
      return `https://www.instagram.com/${match?.[1]}/${match?.[2]}/embed`;
    },
    defaultAspectRatio: '1:1',
  },
  twitter: {
    name: 'X (Twitter)',
    urlPatterns: [/twitter\.com\/\w+\/status\/(\d+)/, /x\.com\/\w+\/status\/(\d+)/],
    toEmbedUrl: (url) => url, // Twitter embeds use their JS widget, not simple iframes
    defaultAspectRatio: 'auto',
  },
  codepen: {
    name: 'CodePen',
    urlPatterns: [/codepen\.io\/([\w-]+)\/pen\/([\w]+)/],
    toEmbedUrl: (url) => {
      return url.replace('/pen/', '/embed/') + '?default-tab=result';
    },
    defaultAspectRatio: '16:9',
  },
  custom: {
    name: 'Custom URL',
    urlPatterns: [],
    toEmbedUrl: (url) => url,
    defaultAspectRatio: '16:9',
  },
};

export function detectProvider(url: string): HtmlEmbedProvider {
  for (const [key, config] of Object.entries(EMBED_PROVIDERS)) {
    if (key === 'custom') continue;
    if (config.urlPatterns.some(p => p.test(url))) {
      return key as HtmlEmbedProvider;
    }
  }
  return 'custom';
}

export function generateEmbedUrl(url: string, provider: HtmlEmbedProvider): string {
  return EMBED_PROVIDERS[provider]?.toEmbedUrl(url) ?? url;
}

export function getProviderName(provider: HtmlEmbedProvider): string {
  return EMBED_PROVIDERS[provider]?.name ?? 'Custom';
}

export function getDefaultAspectRatio(provider: HtmlEmbedProvider): '16:9' | '4:3' | '1:1' | '9:16' | '21:9' | 'auto' {
  return EMBED_PROVIDERS[provider]?.defaultAspectRatio ?? '16:9';
}
