import {
  FOMO_V2_BACKER_TYPES,
  FomoV2BackerType,
} from "../types/backer.types";

export interface BackerTypeInference {
  backerType: FomoV2BackerType;
  confident: boolean;
  reason: string;
  signal?: string;
}

export function normalizeBackerType(value: any): FomoV2BackerType {
  const normalized = normalizeTypeText(value);
  if ((FOMO_V2_BACKER_TYPES as readonly string[]).includes(normalized)) {
    return normalized as FomoV2BackerType;
  }

  return classifyBackerTypeSignal(normalized) || "fund";
}

export function normalizeBackerTypeText(value: any): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeTypeText(value: any): string {
  return normalizeBackerTypeText(value);
}

export function inferBackerType(input: Record<string, any>): FomoV2BackerType {
  return inferBackerTypeWithReason(input).backerType;
}

export function inferBackerTypeWithReason(
  input: Record<string, any>
): BackerTypeInference {
  if (isPersonBackerOverride(input)) {
    return {
      backerType: "person",
      confident: true,
      reason: "person_override",
      signal: personOverrideSignal(input),
    };
  }

  const explicitSignals = [
    input.backerType,
    input.investorType,
    input.sourceEntityType,
    input.entityType,
    input.sourceEntity?.type,
    input.sourceEntity?.entityType,
    input.raw?.sourceEntityType,
    input.raw?.entityType,
    input.kind,
    input.entityKind,
    input.profileType,
    input.personType,
    input.type,
    input.ventureType,
    input.category,
    input.category?.name,
    input.category?.title,
  ];

  for (const signal of explicitSignals) {
    const normalizedSignal = normalizeTypeText(signal);
    const backerType = classifyBackerTypeSignal(normalizedSignal);
    if (backerType) {
      return {
        backerType,
        confident: true,
        reason: "explicit_type_signal",
        signal: normalizedSignal,
      };
    }
  }

  const descriptiveSignal = normalizeTypeText(
    [
      input.name,
      input.slug,
      input.type ||
        input.ventureType ||
        input.category?.name ||
        input.category?.title ||
        input.category,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const descriptiveType = classifyBackerTypeSignal(descriptiveSignal);
  if (descriptiveType) {
    return {
      backerType: descriptiveType,
      confident: true,
      reason: "descriptive_type_signal",
      signal: descriptiveSignal,
    };
  }

  return {
    backerType: "fund",
    confident: false,
    reason: "default_fund_uncertain",
  };
}

export function isPersonBackerOverride(input: Record<string, any>): boolean {
  const sourceEntityType = normalizeTypeText(
    input.sourceEntityType ||
      input.entityType ||
      input.sourceTypeName ||
      input.sourceEntity?.type ||
      input.sourceEntity?.entityType ||
      input.raw?.sourceEntityType ||
      input.raw?.entityType
  );
  if (sourceEntityType === "person" || sourceEntityType === "individual") {
    return true;
  }

  const explicitTypeText = normalizeTypeText(
    input.backerType ||
      input.investorType ||
      input.personType ||
      input.profileType ||
      input.entityKind ||
      input.kind
  );
  if (
    explicitTypeText === "person" ||
    explicitTypeText === "individual" ||
    explicitTypeText === "human"
  ) {
    return true;
  }

  const name = normalizeTypeText(input.name || input.title || input.slug);
  return Boolean(name && PERSON_BACKER_NAME_OVERRIDES.has(name));
}

export function classifyBackerTypeSignal(
  value: any
): FomoV2BackerType | undefined {
  const normalized = normalizeTypeText(value);
  if (!normalized) return undefined;

  if (
    normalized === "person" ||
    normalized === "people" ||
    normalized === "individual" ||
    normalized === "human" ||
    normalized.includes("angel") ||
    normalized.includes("founder") ||
    normalized.includes("operator") ||
    normalized.includes("advisor")
  ) {
    return "person";
  }

  if (
    normalized === "vc" ||
    normalized.includes("fund") ||
    normalized.includes("venture") ||
    normalized.includes("company") ||
    normalized.includes("corporate") ||
    normalized.includes("corp") ||
    normalized.includes("dao") ||
    normalized.includes("ecosystem") ||
    normalized.includes("lab") ||
    normalized.includes("foundation") ||
    normalized.includes("capital") ||
    normalized.includes("exchange")
  ) {
    return "fund";
  }

  return undefined;
}

function personOverrideSignal(input: Record<string, any>): string | undefined {
  const sourceEntityType = normalizeTypeText(
    input.sourceEntityType ||
      input.entityType ||
      input.sourceTypeName ||
      input.sourceEntity?.type ||
      input.sourceEntity?.entityType ||
      input.raw?.sourceEntityType ||
      input.raw?.entityType
  );
  if (sourceEntityType === "person" || sourceEntityType === "individual") {
    return sourceEntityType;
  }

  const explicitTypeText = normalizeTypeText(
    input.backerType ||
      input.investorType ||
      input.personType ||
      input.profileType ||
      input.entityKind ||
      input.kind
  );
  if (
    explicitTypeText === "person" ||
    explicitTypeText === "individual" ||
    explicitTypeText === "human"
  ) {
    return explicitTypeText;
  }

  const name = normalizeTypeText(input.name || input.title || input.slug);
  return PERSON_BACKER_NAME_OVERRIDES.has(name) ? name : undefined;
}

export const PERSON_BACKER_NAME_OVERRIDES = new Set([
  "vitalik_buterin",
  "balaji_srinivasan",
  "balaji_s_srinivasan",
  "cobie",
  "jordan_fish",
  "mark_cuban",
]);
