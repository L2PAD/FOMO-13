import { BadRequestException } from "@nestjs/common";

const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function sanitizeInfoValue(value: unknown, depth = 0): any {
  if (depth > 30) {
    throw new BadRequestException("Payload nesting is too deep");
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (Array.isArray(value)) {
    if (value.length > 10_000) {
      throw new BadRequestException("Payload array is too large");
    }
    return value.map((item) => sanitizeInfoValue(item, depth + 1));
  }

  if (typeof value !== "object") {
    throw new BadRequestException("Unsupported payload value");
  }

  const result: Record<string, any> = Object.create(null);
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (
      !key ||
      key.startsWith("$") ||
      key.includes(".") ||
      BLOCKED_KEYS.has(key)
    ) {
      throw new BadRequestException(`Unsafe payload key: ${key || "<empty>"}`);
    }
    result[key] = sanitizeInfoValue(child, depth + 1);
  }

  return result;
}

function copyAlias(
  target: Record<string, any>,
  sourceKey: string,
  targetKey: string
): void {
  if (target[targetKey] === undefined && target[sourceKey] !== undefined) {
    target[targetKey] = target[sourceKey];
  }
}

function moveAlias(
  target: Record<string, any>,
  sourceKey: string,
  targetKey: string
): void {
  copyAlias(target, sourceKey, targetKey);
  if (sourceKey !== targetKey) delete target[sourceKey];
}

function localizeLegacyField(
  target: Record<string, any>,
  sourceBase: string,
  targetBase = sourceBase
): void {
  moveAlias(target, sourceBase, `${targetBase}_en`);
  if (sourceBase !== targetBase) {
    moveAlias(target, `${sourceBase}_en`, `${targetBase}_en`);
    moveAlias(target, `${sourceBase}_ru`, `${targetBase}_ru`);
  }
}

function normalizeLocalizedItems(input: unknown, fields: string[]): unknown {
  if (!Array.isArray(input)) return input;
  return input.map((source) => {
    const item = sanitizeInfoValue(source);
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    fields.forEach((field) => localizeLegacyField(item, field));
    return item;
  });
}

function toSnakeCaseKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

function normalizeKeysToSnakeCase(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeKeysToSnakeCase(item));
  }
  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  const result: Record<string, any> = Object.create(null);
  const entries = Object.entries(value);
  for (const [key, child] of entries) {
    const normalizedKey = toSnakeCaseKey(key);
    if (result[normalizedKey] === undefined) {
      result[normalizedKey] = normalizeKeysToSnakeCase(child);
    }
  }
  for (const [key, child] of entries) {
    const normalizedKey = toSnakeCaseKey(key);
    if (key === normalizedKey) {
      result[normalizedKey] = normalizeKeysToSnakeCase(child);
    }
  }
  return result;
}

function normalizeUtilityItems(
  features: unknown,
  stats: unknown
): {
  features: unknown;
  stats: unknown;
} {
  const normalizedFeatures = Array.isArray(features)
    ? features.map((feature) => {
        const next = sanitizeInfoValue(feature);
        if (next && typeof next === "object") {
          moveAlias(next, "en", "title_en");
          moveAlias(next, "ru", "title_ru");
          localizeLegacyField(next, "title");
          localizeLegacyField(next, "description");
        }
        return next;
      })
    : features;

  const normalizedStats = Array.isArray(stats)
    ? stats.map((stat) => {
        const next = sanitizeInfoValue(stat);
        if (next && typeof next === "object") {
          moveAlias(next, "label", "label_en");
        }
        return next;
      })
    : stats;

  return { features: normalizedFeatures, stats: normalizedStats };
}

export function normalizeInfoPayload(
  resource: string,
  input: unknown
): Record<string, any> {
  const data = normalizeKeysToSnakeCase(sanitizeInfoValue(input || {}));

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new BadRequestException("Payload must be an object");
  }

  switch (resource) {
    case "navigation-items":
      localizeLegacyField(data, "label");
      if (!data.key) {
        data.key = String(data.href || data.id || "item")
          .replace(/^#/, "")
          .replace(/[^a-zA-Z0-9_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase();
      }
      break;
    case "hero-settings":
      moveAlias(data, "badge_text", "badge_en");
      moveAlias(data, "title", "title_line1_en");
      moveAlias(data, "title_highlight", "title_line2_en");
      moveAlias(data, "buttons", "action_buttons");
      localizeLegacyField(data, "badge");
      localizeLegacyField(data, "title_line1");
      localizeLegacyField(data, "title_line2");
      localizeLegacyField(data, "subtitle");
      break;
    case "hero-buttons":
      localizeLegacyField(data, "text");
      moveAlias(data, "href", "link");
      if (data.primary === undefined && data.variant !== undefined) {
        data.primary = data.variant === "primary";
      }
      delete data.variant;
      break;
    case "about-settings":
      [
        "badge",
        "title",
        "title_highlight",
        "subtitle",
        "description",
        "social_engagement",
        "data_analytics",
        "seamless_access",
        "description_end",
        "whitepaper_button_text",
      ].forEach((field) => localizeLegacyField(data, field));
      moveAlias(data, "whitepaper_button_link", "whitepaper_url");
      data.features = normalizeLocalizedItems(data.features, [
        "title",
        "description",
      ]);
      break;
    case "platform-settings":
      moveAlias(data, "services", "services_list");
      moveAlias(data, "section_badge", "section_badge_en");
      moveAlias(data, "section_title", "section_title_en");
      moveAlias(data, "section_subtitle", "section_intro_en");
      moveAlias(data, "cta_button_text", "cta_button_text_en");
      moveAlias(data, "cta_left_text", "cta_left_text_en");
      break;
    case "footer-settings":
      moveAlias(data, "nav_sections", "navigation_sections");
      break;
    case "community-settings":
      moveAlias(data, "section_title", "title_en");
      moveAlias(data, "section_subtitle", "description_en");
      localizeLegacyField(data, "section_badge");
      localizeLegacyField(data, "title");
      localizeLegacyField(data, "description");
      localizeLegacyField(data, "subscribe_title");
      data.features = normalizeLocalizedItems(data.features, [
        "title",
        "description",
      ]);
      break;
    case "utilities-settings":
      moveAlias(data, "badge", "section_badge_en");
      moveAlias(data, "badge_text_en", "section_badge_en");
      moveAlias(data, "badge_text_ru", "section_badge_ru");
      moveAlias(data, "title", "section_title_en");
      moveAlias(data, "title_en", "section_title_en");
      moveAlias(data, "title_ru", "section_title_ru");
      moveAlias(data, "subtitle", "section_description_en");
      moveAlias(data, "subtitle_en", "section_description_en");
      moveAlias(data, "subtitle_ru", "section_description_ru");
      moveAlias(data, "click_hint", "bottom_hint_en");
      moveAlias(data, "click_back_hint", "bottom_hint_ru");
      break;
    case "partners":
      localizeLegacyField(data, "name");
      localizeLegacyField(data, "description");
      if (data.image_url_hover === undefined) data.image_url_hover = null;
      break;
    case "utilities": {
      localizeLegacyField(data, "title");
      localizeLegacyField(data, "subtitle");
      localizeLegacyField(data, "short_description");
      localizeLegacyField(data, "full_description");
      localizeLegacyField(data, "button_text");
      const normalized = normalizeUtilityItems(data.features, data.stats);
      data.features = normalized.features || [];
      data.stats = normalized.stats || [];
      break;
    }
    case "utility-nav-buttons":
      localizeLegacyField(data, "label");
      break;
    case "drawer-cards":
      localizeLegacyField(data, "title");
      localizeLegacyField(data, "description");
      break;
    case "roadmap":
      moveAlias(data, "section_badge", "badge_en");
      moveAlias(data, "section_badge_en", "badge_en");
      moveAlias(data, "section_badge_ru", "badge_ru");
      moveAlias(data, "section_title", "title_en");
      moveAlias(data, "section_title_en", "title_en");
      moveAlias(data, "section_title_ru", "title_ru");
      moveAlias(data, "section_subtitle", "subtitle_en");
      moveAlias(data, "section_subtitle_en", "subtitle_en");
      moveAlias(data, "section_subtitle_ru", "subtitle_ru");
      if (Array.isArray(data.tasks)) {
        data.tasks = data.tasks.map((task) =>
          normalizeInfoPayload("roadmap-task", task)
        );
      }
      break;
    case "roadmap-task":
      moveAlias(data, "name", "title_en");
      moveAlias(data, "name_en", "title_en");
      moveAlias(data, "name_ru", "title_ru");
      localizeLegacyField(data, "title");
      localizeLegacyField(data, "description");
      break;
    case "evolution-levels":
      localizeLegacyField(data, "rank");
      localizeLegacyField(data, "next_level");
      localizeLegacyField(data, "description");
      localizeLegacyField(data, "back_title");
      localizeLegacyField(data, "back_description");
      break;
    case "evolution-badges":
      localizeLegacyField(data, "name");
      localizeLegacyField(data, "condition");
      localizeLegacyField(data, "description");
      localizeLegacyField(data, "back_title");
      localizeLegacyField(data, "back_description");
      break;
    case "team-members":
      localizeLegacyField(data, "name");
      localizeLegacyField(data, "position");
      localizeLegacyField(data, "bio");
      break;
    case "faq":
      localizeLegacyField(data, "question");
      localizeLegacyField(data, "answer");
      break;
    case "arena-predictions":
    case "p2p-deals":
      localizeLegacyField(data, "title");
      localizeLegacyField(data, "description");
      if (resource === "p2p-deals") {
        if (typeof data.seller_address === "string") {
          data.seller_address = data.seller_address.toLowerCase();
        }
        if (typeof data.buyer_address === "string") {
          data.buyer_address = data.buyer_address.toLowerCase();
        }
      }
      break;
    case "influence-entities":
      localizeLegacyField(data, "description");
      break;
    case "earlyland-opportunities":
      localizeLegacyField(data, "name");
      localizeLegacyField(data, "description");
      break;
    case "cookie-consent-settings":
      localizeLegacyField(data, "title");
      localizeLegacyField(data, "description");
      localizeLegacyField(data, "accept_button_text");
      localizeLegacyField(data, "decline_button_text");
      break;
    case "seo-settings":
      moveAlias(data, "title", "site_title");
      moveAlias(data, "title_ru", "site_title_ru");
      moveAlias(data, "description", "site_description");
      moveAlias(data, "description_ru", "site_description_ru");
      moveAlias(data, "keywords", "site_keywords");
      moveAlias(data, "keywords_ru", "site_keywords_ru");
      break;
    case "wallet-profiles":
      if (typeof data.wallet_address === "string") {
        data.wallet_address = data.wallet_address.toLowerCase();
      }
      ["referral_code", "referred_by", "invite_code_used"].forEach((field) => {
        if (typeof data[field] === "string") {
          data[field] = data[field].trim().toUpperCase();
        }
      });
      if (typeof data.twitter_username === "string") {
        data.twitter_username = data.twitter_username.trim().replace(/^@/, "");
      }
      break;
    case "invite-codes":
      if (typeof data.code === "string") {
        data.code = data.code.trim().toUpperCase();
      }
      if (data.active === undefined) data.active = true;
      if (data.used_count === undefined) data.used_count = 0;
      if (typeof data.expires_at === "string") {
        const expiresAt = new Date(data.expires_at);
        if (Number.isFinite(expiresAt.getTime())) data.expires_at = expiresAt;
      }
      break;
    default:
      break;
  }

  delete data._id;
  delete data.__v;

  return data;
}

export function serializeInfoDocument<T = Record<string, any>>(
  document: any,
  preserveKey = false
): T {
  if (!document) return document;

  const plain =
    typeof document.toObject === "function" ? document.toObject() : document;
  const source = Object.fromEntries(
    Object.entries(plain).filter(
      ([key]) => !["_id", "__v"].includes(key) && (preserveKey || key !== "key")
    )
  );
  const serialized = sanitizeInfoValue(source);
  delete serialized._id;
  delete serialized.__v;
  if (!preserveKey) delete serialized.key;

  return serialized as T;
}

export function cloneInfoDefault<T>(value: T): T {
  return sanitizeInfoValue(value) as T;
}

export function parseInfoBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return undefined;
}
