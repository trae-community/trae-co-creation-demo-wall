import sanitizeHtml from "sanitize-html";

export const RICH_TEXT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote', 'code'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
};

export const stripHtmlTags = (html: string) => html.replace(/<[^>]*>/g, '').trim();

export const sanitizeRichText = (html: string) =>
  sanitizeHtml(html, RICH_TEXT_SANITIZE_OPTIONS);
