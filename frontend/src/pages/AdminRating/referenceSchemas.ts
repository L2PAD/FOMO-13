export type RefFieldType =
  | "text"
  | "number"
  | "textarea"
  | "boolean"
  | "select"
  | "multiselect"
  | "date";

export interface RefFieldSpec {
  key: string;
  label: string;
  type: RefFieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
  placeholder?: string;
}

const APPLICABLE = [
  { value: "projects", label: "Проекты" },
  { value: "persons", label: "Персоны" },
  { value: "funds", label: "Фонды" },
];

/** Typed field schemas for each of the 7 rating reference catalogs. */
export const REFERENCE_SCHEMAS: Record<string, RefFieldSpec[]> = {
  rating_crises: [
    { key: "code", label: "Код (идентификатор)", type: "text", required: true, placeholder: "ftx_collapse_2022" },
    { key: "name", label: "Название", type: "text", required: true },
    {
      key: "type",
      label: "Тип",
      type: "select",
      options: [
        { value: "market", label: "Рыночный" },
        { value: "macro", label: "Макро" },
        { value: "protocol", label: "Протокол" },
        { value: "exchange", label: "Биржа" },
      ],
    },
    { key: "startDate", label: "Дата начала", type: "date" },
    { key: "endDate", label: "Дата окончания", type: "date" },
    { key: "description", label: "Описание", type: "textarea" },
    { key: "scoringCriteria", label: "Критерии оценки", type: "textarea", help: "Через запятую: operationalContinuity, portfolioSurvival, …" },
  ],
  rating_jurisdictions: [
    { key: "code", label: "Код", type: "text", required: true, placeholder: "us" },
    { key: "countryName", label: "Страна / регион", type: "text", required: true },
    {
      key: "regulationTier",
      label: "Уровень регулирования",
      type: "select",
      options: [
        { value: "high", label: "Высокий" },
        { value: "mid", label: "Средний" },
        { value: "offshore_transparent", label: "Оффшор (прозрачный)" },
        { value: "offshore", label: "Оффшор" },
      ],
    },
    { key: "baseScore", label: "Базовый балл", type: "number", min: 0, max: 15, step: 1 },
    { key: "licenseRequired", label: "Требуется лицензия", type: "boolean" },
    {
      key: "sanctionsRisk",
      label: "Санкционный риск",
      type: "select",
      options: [
        { value: "low", label: "Низкий" },
        { value: "medium", label: "Средний" },
        { value: "high", label: "Высокий" },
      ],
    },
    { key: "transparencyModifier", label: "Модификатор прозрачности", type: "number", step: 1 },
  ],
  rating_tier_registry: [
    { key: "code", label: "Код", type: "text", required: true, placeholder: "tier1:my-fund" },
    {
      key: "entityType",
      label: "Тип сущности",
      type: "select",
      options: [
        { value: "fund", label: "Фонд" },
        { value: "person", label: "Персона" },
        { value: "project", label: "Проект" },
      ],
    },
    { key: "entityId", label: "ID сущности", type: "text", required: true },
    { key: "tier", label: "Tier", type: "number", min: 1, max: 5, step: 1 },
    { key: "reason", label: "Обоснование", type: "textarea" },
    {
      key: "status",
      label: "Статус",
      type: "select",
      options: [
        { value: "active", label: "Активен" },
        { value: "inactive", label: "Неактивен" },
      ],
    },
    { key: "validFrom", label: "Действует с", type: "date" },
    { key: "validUntil", label: "Действует до", type: "date" },
  ],
  rating_red_flag_catalog: [
    { key: "code", label: "Код", type: "text", required: true, placeholder: "anonymous_founders" },
    { key: "title", label: "Название", type: "text", required: true },
    {
      key: "severity",
      label: "Критичность",
      type: "select",
      options: [
        { value: "low", label: "Низкая" },
        { value: "medium", label: "Средняя" },
        { value: "high", label: "Высокая" },
        { value: "critical", label: "Критическая" },
      ],
    },
    { key: "defaultPenalty", label: "Штраф по умолчанию", type: "number", min: 0, max: 100, step: 1 },
    { key: "requiredEvidence", label: "Нужны доказательства", type: "boolean" },
    { key: "applicableTo", label: "Применимо к", type: "multiselect", options: APPLICABLE },
    { key: "description", label: "Описание", type: "textarea" },
  ],
  rating_role_catalog: [
    { key: "code", label: "Код", type: "text", required: true, placeholder: "founder" },
    { key: "title", label: "Название роли", type: "text", required: true },
    { key: "weight", label: "Вес (0–1)", type: "number", min: 0, max: 1, step: 0.1 },
    { key: "applicableTo", label: "Применимо к", type: "multiselect", options: APPLICABLE },
  ],
  rating_partnership_types: [
    { key: "code", label: "Код", type: "text", required: true, placeholder: "official_partnership" },
    { key: "title", label: "Название", type: "text", required: true },
    { key: "rating", label: "Рейтинг (0–1)", type: "number", min: 0, max: 1, step: 0.1 },
  ],
  rating_media_source_tiers: [
    { key: "code", label: "Код", type: "text", required: true, placeholder: "tier1" },
    { key: "title", label: "Название тира", type: "text", required: true },
    { key: "weight", label: "Вес (0–1)", type: "number", min: 0, max: 1, step: 0.1 },
    { key: "examples", label: "Примеры источников", type: "textarea" },
  ],
};

export const REFERENCE_TITLES: Record<string, string> = {
  rating_crises: "Системные кризисы",
  rating_jurisdictions: "Юрисдикции",
  rating_tier_registry: "Реестр Tier-1",
  rating_red_flag_catalog: "Каталог Red Flags",
  rating_role_catalog: "Роли персон",
  rating_partnership_types: "Типы партнёрств",
  rating_media_source_tiers: "Тиры медиаисточников",
};

export interface CrisisCriterion {
  key: string;
  label: string;
  enabled: boolean;
  weight: number;
  description?: string;
  evidenceType?: string;
}

export const CRISIS_CRITERIA_TEMPLATE: CrisisCriterion[] = [
  { key: "operationalContinuity", label: "Непрерывность работы", enabled: true, weight: 30, description: "Фонд продолжал операционную деятельность", evidenceType: "operational" },
  { key: "portfolioSurvival", label: "Сохранность портфеля", enabled: true, weight: 25, description: "Доля проектов, переживших период", evidenceType: "portfolio" },
  { key: "noDefaults", label: "Отсутствие дефолтов", enabled: true, weight: 20, description: "Нет критических обязательств и невыплат", evidenceType: "financial" },
  { key: "continuedInvesting", label: "Продолжение инвестиций", enabled: true, weight: 15, description: "Фонд сохранял инвестиционную активность", evidenceType: "activity" },
  { key: "reputationResilience", label: "Репутационная устойчивость", enabled: true, weight: 10, description: "Нет подтверждённых критических инцидентов", evidenceType: "reputation" },
];

export const EVIDENCE_TYPES = [
  { value: "operational", label: "Операционные данные" },
  { value: "portfolio", label: "Портфель" },
  { value: "financial", label: "Финансы" },
  { value: "activity", label: "Инвестиционная активность" },
  { value: "reputation", label: "Репутация" },
  { value: "other", label: "Другое" },
];

