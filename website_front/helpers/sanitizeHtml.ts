const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const ALLOWED_ATTRS = new Set([
  "alt",
  "class",
  "colspan",
  "height",
  "href",
  "rel",
  "rowspan",
  "src",
  "target",
  "title",
  "width",
]);
const URL_ATTRS = new Set(["href", "src"]);
const SAFE_URL_PATTERN = /^(https?:|mailto:|tel:|\/|#)/i;
const BLOCKED_CONTENT_TAGS = new Set([
  "base",
  "embed",
  "form",
  "iframe",
  "link",
  "math",
  "meta",
  "noscript",
  "object",
  "script",
  "style",
  "svg",
  "template",
]);
const VOID_TAGS = new Set(["br", "hr", "img"]);

const escapeAttributeValue = (value: string): string =>
  value
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");

const sanitizeTagFallback = (
  _match: string,
  closing: string,
  rawTagName: string,
  rawAttributes: string
): string => {
  const tagName = rawTagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tagName) || BLOCKED_CONTENT_TAGS.has(tagName)) return "";
  if (closing) return VOID_TAGS.has(tagName) ? "" : `</${tagName}>`;

  const attributes = new Map<string, string>();
  const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let attributeMatch: RegExpExecArray | null;

  while ((attributeMatch = attributePattern.exec(rawAttributes))) {
    const name = String(attributeMatch[1] || "").toLowerCase();
    const value = String(
      attributeMatch[2] ?? attributeMatch[3] ?? attributeMatch[4] ?? ""
    );

    if (
      !value ||
      name.startsWith("on") ||
      name === "style" ||
      !ALLOWED_ATTRS.has(name) ||
      (URL_ATTRS.has(name) && !isSafeUrl(value))
    ) {
      continue;
    }

    attributes.set(name, value);
  }

  if (tagName === "a") {
    const rel = new Set(
      String(attributes.get("rel") || "")
        .split(/\s+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    );
    rel.add("noopener");
    rel.add("noreferrer");
    attributes.set("rel", Array.from(rel).join(" "));
  }

  const serializedAttributes = Array.from(attributes.entries())
    .map(([name, value]) => ` ${name}="${escapeAttributeValue(value)}"`)
    .join("");

  return `<${tagName}${serializedAttributes}>`;
};

const stripUnsafeHtmlFallback = (html: string): string => {
  let stripped = html.replace(/<!--[\s\S]*?-->|<![^>]*>/g, "");
  const blockedPairPattern = /<\s*(base|embed|form|iframe|link|math|meta|noscript|object|script|style|svg|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;

  for (let pass = 0; pass < 5; pass += 1) {
    const next = stripped.replace(blockedPairPattern, "");
    if (next === stripped) break;
    stripped = next;
  }

  return stripped.replace(
    /<\s*(\/?)\s*([a-z][a-z0-9:-]*)([^>]*)>/gi,
    sanitizeTagFallback
  );
};

const isSafeUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return SAFE_URL_PATTERN.test(trimmed);
};

const sanitizeElement = (element: Element): void => {
  const tagName = element.tagName.toLowerCase();

  if (BLOCKED_CONTENT_TAGS.has(tagName)) {
    element.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(tagName)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  Array.from(element.attributes).forEach((attr) => {
    const attrName = attr.name.toLowerCase();
    const attrValue = attr.value || "";

    if (attrName.startsWith("on") || attrName === "style" || !ALLOWED_ATTRS.has(attrName)) {
      element.removeAttribute(attr.name);
      return;
    }

    if (URL_ATTRS.has(attrName) && !isSafeUrl(attrValue)) {
      element.removeAttribute(attr.name);
    }
  });

  if (tagName === "a") {
    const rel = new Set(
      String(element.getAttribute("rel") || "")
        .split(/\s+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    );
    rel.add("noopener");
    rel.add("noreferrer");
    element.setAttribute("rel", Array.from(rel).join(" "));
  }
};

export const sanitizeHtml = (value?: string | null): string => {
  const html = String(value || "");
  if (!html) return "";

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return stripUnsafeHtmlFallback(html);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  Array.from(doc.body.querySelectorAll("*")).forEach(sanitizeElement);
  return doc.body.innerHTML;
};

export const sanitizedHtml = (value?: string | null): { __html: string } => ({
  __html: sanitizeHtml(value),
});

