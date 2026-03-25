import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img', 'br', 'hr', 'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'strong', 'em', 'b', 'i', 'u', 'code', 'pre', 'blockquote',
  'figure', 'figcaption', 'details', 'summary',
  'dl', 'dt', 'dd', 'abbr', 'sub', 'sup', 'mark',
  'link', 'style',
];

const IFRAME_TAGS = [...ALLOWED_TAGS, 'iframe'];

// When rendering inside a sandboxed iframe (srcdoc), scripts are safe
const SANDBOXED_TAGS = [...ALLOWED_TAGS, 'script', 'noscript', 'canvas', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'g', 'defs', 'use', 'symbol', 'input', 'button', 'label', 'select', 'option', 'form', 'textarea'];

const ALLOWED_ATTRS = [
  'class', 'style', 'href', 'target', 'rel', 'src', 'alt', 'title',
  'width', 'height', 'loading', 'id',
  // Table attrs
  'colspan', 'rowspan',
  // iframe attrs (only when allowIframes=true)
  'frameborder', 'allowfullscreen', 'sandbox', 'allow',
];

const SANDBOXED_ATTRS = [
  ...ALLOWED_ATTRS,
  // Form/interactive attrs
  'type', 'value', 'name', 'placeholder', 'checked', 'disabled', 'for', 'min', 'max', 'step',
  // SVG attrs
  'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'x', 'y', 'rx', 'ry',
  'transform', 'opacity', 'points', 'x1', 'y1', 'x2', 'y2',
  // Data attrs for JS widgets
  'data-*',
];

/**
 * Sanitize HTML content, stripping dangerous elements.
 * @param html Raw HTML string
 * @param options.allowIframes Allow iframe tags (for embed mode)
 * @param options.sandboxed Allow scripts + interactive elements (for srcdoc iframe rendering)
 */
export function sanitizeHtml(html: string, allowIframes = false, sandboxed = false): string {
  if (sandboxed) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: SANDBOXED_TAGS,
      ALLOWED_ATTR: SANDBOXED_ATTRS,
      ALLOW_DATA_ATTR: true,
      ADD_ATTR: ['target'],
      FORCE_BODY: true,
    });
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowIframes ? IFRAME_TAGS : ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
    ADD_ATTR: ['target'],
  });
}

/**
 * Extract the src attribute from an iframe embed code.
 * Returns null if no iframe src found.
 */
export function extractIframeSrc(embedCode: string): string | null {
  const match = embedCode.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}
