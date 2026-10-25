import sanitizeHtml from "sanitize-html";

export const RICH_TEXT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote', 'code'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard',
  transformTags: {
    a: (tagName, attribs) => {
      const next: Record<string, string> = { ...attribs, rel: 'noopener noreferrer' };
      if (attribs.target === '_blank') {
        next.target = '_blank';
      } else {
        delete next.target;
      }
      return { tagName, attribs: next };
    },
  },
};

export const stripHtmlTags = (html: string) => html.replace(/<[^>]*>/g, '').trim();

/** 入库与展示共用，防止存储型 XSS */
export const sanitizeRichText = (html: string) => {
  if (!html || typeof html !== 'string') return '';
  return sanitizeHtml(html, RICH_TEXT_SANITIZE_OPTIONS);
};

export const sanitizeRichTextForDisplay = sanitizeRichText;
