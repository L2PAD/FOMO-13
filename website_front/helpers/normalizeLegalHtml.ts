const ENCODED_BLOCK_TAG_PATTERN =
  /&lt;\s*\/?\s*(?:article|header|main|section|h[1-6]|p|ul|ol|li|blockquote|table|thead|tbody|tr|th|td)\b/gi;

const decodeHtmlEntity = (_match: string, entity: string): string => {
  const normalized = entity.toLowerCase();

  if (normalized === "amp") return "&";
  if (normalized === "lt") return "<";
  if (normalized === "gt") return ">";
  if (normalized === "quot") return '"';
  if (normalized === "apos") return "'";
  if (normalized === "nbsp") return " ";

  const isHex = normalized.startsWith("#x");
  const isDecimal = normalized.startsWith("#");
  if (!isHex && !isDecimal) return _match;

  const codePoint = Number.parseInt(
    normalized.slice(isHex ? 2 : 1),
    isHex ? 16 : 10
  );
  if (
    !Number.isFinite(codePoint) ||
    codePoint < 0 ||
    codePoint > 0x10ffff ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return _match;
  }

  return String.fromCodePoint(codePoint);
};

const decodeHtmlEntities = (value: string): string =>
  value.replace(
    /&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|nbsp);/gi,
    decodeHtmlEntity
  );

/**
 * Rich-text editors can save pasted HTML source as escaped text inside paragraphs.
 * Convert only documents that clearly contain several encoded block tags; valid
 * HTML from the editor is returned unchanged and is sanitized by the caller.
 */
export const normalizeLegalHtml = (value?: string | null): string => {
  const html = String(value || "");
  const encodedTags = html.match(ENCODED_BLOCK_TAG_PATTERN);

  if (!encodedTags || encodedTags.length < 2) return html;

  const encodedSource = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|pre)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  return decodeHtmlEntities(encodedSource).trim();
};
