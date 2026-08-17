import { sanitizeHtml } from "./sanitizeHtml";

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (match, code) => {
      const value = Number(code);
      return Number.isInteger(value) && value >= 0 && value <= 0x10ffff
        ? String.fromCodePoint(value)
        : match;
    })
    .replace(/&#x([0-9a-f]+);/gi, (match, code) => {
      const value = parseInt(code, 16);
      return Number.isInteger(value) && value >= 0 && value <= 0x10ffff
        ? String.fromCodePoint(value)
        : match;
    });

const ACTIVITY_HTML_TAG_PATTERN =
  /<\/?(?:a|b|blockquote|br|code|div|em|h[1-6]|hr|i|img|li|ol|p|pre|s|span|strong|table|tbody|td|th|thead|tr|u|ul)\b[^>]*>/i;

const hasActivityHtmlTags = (value?: string | null): boolean =>
  ACTIVITY_HTML_TAG_PATTERN.test(String(value || ""));

/**
 * Some legacy activity fields contain the editor HTML in the plain-text field,
 * or contain that HTML encoded once (and occasionally twice) as entities. Only
 * decode when the result is recognisable activity markup; the caller still
 * sanitizes the result before it reaches dangerouslySetInnerHTML.
 */
const normalizeActivityHtmlCandidate = (value?: string | null): string => {
  const source = String(value || "");
  if (!source) return source;

  let decoded = source;
  let htmlCandidate = hasActivityHtmlTags(source) ? source : "";
  for (let pass = 0; pass < 3; pass += 1) {
    const next = decodeHtmlEntities(decoded);
    if (next === decoded) break;
    decoded = next;
    if (hasActivityHtmlTags(decoded)) htmlCandidate = decoded;
  }

  return htmlCandidate || source;
};

export const activityHtmlToPlainText = (value?: string | null): string => {
  const safeHtml = sanitizeHtml(value);
  if (!safeHtml) return "";

  if (typeof DOMParser !== "undefined") {
    const document = new DOMParser().parseFromString(safeHtml, "text/html");
    document.body.querySelectorAll("br").forEach((node) => node.replaceWith("\n"));
    document.body
      .querySelectorAll("p,div,blockquote,pre,h1,h2,h3,h4,h5,h6,li,tr")
      .forEach((node) => node.append("\n"));
    return String(document.body.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return decodeHtmlEntities(
    safeHtml
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(p|div|blockquote|pre|h[1-6]|li|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const hasMeaningfulActivityHtml = (value?: string | null): boolean => {
  const safeHtml = sanitizeHtml(value);
  return Boolean(
    activityHtmlToPlainText(safeHtml) || /<(img|hr)\b[^>]*>/i.test(safeHtml)
  );
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const inlineText = (value: string): string =>
  escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");

export const plainTextToActivityHtml = (value?: string | null): string => {
  const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (!listType || !listItems.length) return;
    blocks.push(
      `<${listType}>${listItems.map((item) => `<li>${inlineText(item)}</li>`).join("")}</${listType}>`
    );
    listType = null;
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    const bullet = /^[-*\u2022]\s+(.+)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(line);
    if (bullet || numbered) {
      const nextType = bullet ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((bullet || numbered)![1]);
      return;
    }

    flushList();
    blocks.push(`<p>${inlineText(line)}</p>`);
  });

  flushList();
  return blocks.join("");
};

export const getActivityRichTextHtml = (
  html?: string | null,
  plainText?: string | null
): string => {
  const normalizedHtml = normalizeActivityHtmlCandidate(html);
  if (hasMeaningfulActivityHtml(normalizedHtml)) {
    return sanitizeHtml(normalizedHtml);
  }

  const normalizedFallback = normalizeActivityHtmlCandidate(plainText);
  return sanitizeHtml(
    hasActivityHtmlTags(normalizedFallback)
      ? normalizedFallback
      : plainTextToActivityHtml(plainText)
  );
};

export const activityRichTextProps = (
  html?: string | null,
  plainText?: string | null
): { __html: string } => ({
  __html: getActivityRichTextHtml(html, plainText),
});
