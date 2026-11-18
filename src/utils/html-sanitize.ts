import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'div', 'span', 'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'strong', 'b', 'em', 'i', 'u', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'blockquote',
];

const ALLOWED_ATTR = ['class', 'title'];

/**
 * Sanitizes untrusted HTML. Fails closed: if DOMPurify is unavailable
 * (for example outside a browser), returns an empty string instead of raw HTML.
 */
export function sanitizeRawHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml) return '';
  if (typeof window !== 'undefined' && typeof DOMPurify?.sanitize === 'function') {
    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
    });
  }
  return '';
}
