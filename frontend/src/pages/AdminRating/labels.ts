// Russian labels + hints/units for every rating parameter shown in the admin.
export interface LabelInfo {
  ru: string;
  hint?: string;
}

export const LABELS: Record<string, LabelInfo> = {
  // --- Fund limits (max points) ---
  longevity: { ru: "Срок работы фонда", hint: "макс. баллов" },
  majorDeals: { ru: "Крупные инвестиции и партнёрства", hint: "макс. баллов" },
  exits: { ru: "Успешные выходы", hint: "макс. баллов" },
  roi: { ru: "Средний ROI", hint: "макс. баллов" },
  resilience: { ru: "Устойчивость в кризисах", hint: "макс. баллов" },
  compliance: { ru: "Юрисдикция и регулирование", hint: "макс. баллов" },
  // --- Fund rates ---
  longevityPerHalfYear: { ru: "Баллов за каждые 6 месяцев" },
  majorDealPoints: { ru: "Баллов за крупную сделку" },
  exitPoints: { ru: "Баллов за успешный выход" },
  resiliencePerCrisis: { ru: "Баллов за пройденный кризис" },
  roiThreshold: { ru: "ROI для максимума (кратность, x)" },
  // --- Fund input ---
  monthsActive: { ru: "Срок работы", hint: "месяцев (ступени: <12=2, 12–24=6, 24–48=12, 48–72=18, 72–120=22, 120+=25 б.)" },
  successfulExits: { ru: "Успешные выходы", hint: "количество" },
  avgRoiMultiple: { ru: "Средний ROI", hint: "кратность, x (≥4x = максимум)" },
  crisesSurvived: { ru: "Пройденные кризисы", hint: "подтверждённые рыночные кризисы, пережитые без ликвидации фонда" },
  complianceScore: { ru: "Юрисдикция", hint: "0 — офшор, 10 — среднее регулирование, 15 — высокорегулируемая (US/UK/EU)" },

  // --- Person ---
  investingSuccess: { ru: "Успешность инвестирования", hint: "0–100" },
  advisorSuccess: { ru: "Успех как советника", hint: "0–100" },
  twitter: { ru: "Twitter Score", hint: "0–100 (субкомпонент)" },
  marketExperience: { ru: "Опыт на рынке", hint: "0–100" },
  projectActivity: { ru: "Активность в проектах", hint: "0–100" },
  mediaActivity: { ru: "Медиа-активность", hint: "0–100" },
  marketInfluence: { ru: "Рыночное влияние", hint: "0–100" },
  partnerships: { ru: "Партнёрства", hint: "0–100" },

  // --- Project ---
  fundsQuality: { ru: "Качество фондов", hint: "0–100" },
  personsQuality: { ru: "Качество персон", hint: "0–100" },
  developmentTeam: { ru: "Команда разработки", hint: "0–100" },
  tokenomics: { ru: "Токеномика", hint: "0–100" },
  niche: { ru: "Ниша", hint: "0–100" },
  geography: { ru: "География", hint: "0–100" },
  competitors: { ru: "Конкуренты", hint: "0–100" },
  redFlags: { ru: "Red flags", hint: "список подтверждённых признаков или число" },
  first: { ru: "Штраф за 1-й флаг" },
  second: { ru: "Штраф за 2-й флаг" },
  subsequent: { ru: "Штраф за каждый следующий" },
  max: { ru: "Максимальный штраф" },

  // --- Twitter ---
  followers: { ru: "Подписчики", hint: "количество" },
  quality: { ru: "Качество аудитории", hint: "вес, %" },
  engagement: { ru: "Вовлечённость (ER)", hint: "вес, %" },
  frequency: { ru: "Частота публикаций", hint: "вес, %" },
  reputation: { ru: "Репутация", hint: "вес, %" },
  cryptoInfluence: { ru: "Влияние в криптосреде", hint: "вес, %" },
  tier1Audience: { ru: "Аудитория Tier-1", hint: "вес, %" },
  followerQuality: { ru: "Качество аудитории", hint: "0–100" },
  engagementRate: { ru: "Engagement Rate", hint: "%" },
  postingFrequency: { ru: "Частота публикаций", hint: "0–100" },
  followersMax: { ru: "Подписчиков для 100 баллов", hint: "верхняя граница шкалы" },
  engagementRateMax: { ru: "ER для 100 баллов", hint: "%" },

  // --- User FOMO Score (v2 components) ---
  xpReputation: { ru: "XP-репутация", hint: "вес, %" },
  launchpad: { ru: "Репутация Launchpad", hint: "вес, %" },
  nftSubscription: { ru: "NFT и подписка", hint: "вес, %" },
  activityXpMax: { ru: "Максимум XP", hint: "при этом XP репутация равна 100" },
  hasNftPoints: { ru: "Баллы за наличие NFT", hint: "баллы" },
  membershipPoints: { ru: "Баллы за срок членства", hint: "максимум баллов" },
  subscriptionContinuityPoints: { ru: "Баллы за непрерывную подписку", hint: "максимум баллов" },
  membershipDaysMax: { ru: "Срок членства для максимума", hint: "дней" },
  redFlagPoint: { ru: "Штраф за один красный флаг", hint: "баллы" },
  maxPenalty: { ru: "Максимальный штраф", hint: "баллы" },
  activityXP: { ru: "XP пользователя", hint: "0…максимум" },
  redFlags: { ru: "Красные флаги", hint: "количество" },
  nftCount: { ru: "Количество NFT", hint: "штук" },
  membershipDays: { ru: "Дней членства", hint: "дней" },
  subscriptionMonths: { ru: "Месяцев подписки", hint: "месяцев" },

  // --- User (legacy Platform Score v3 components) ---
  platformActivity: { ru: "Активность на платформе", hint: "вес, %" },
  tradeReputation: { ru: "Торговая репутация", hint: "вес, %" },
  platformEngagement: { ru: "Активность на платформе", hint: "вес, %" },
  contentInteraction: { ru: "Взаимодействие с контентом", hint: "вес, %" },
  meaningfulContribution: { ru: "Полезный вклад", hint: "вес, %" },
  earlyland: { ru: "EarlyLand / кампании", hint: "вес, %" },
  nft: { ru: "NFT / подписка", hint: "вес, %" },
  referrals: { ru: "Рефералы", hint: "вес, %" },
  // legacy per-action points (hidden from UI, kept for back-compat)
  createProject: { ru: "Создание проекта", hint: "баллов" },
  editProject: { ru: "Редактирование проекта", hint: "баллов" },
  earlylandTask: { ru: "Задание EarlyLand", hint: "баллов" },
  socialAction: { ru: "Социальное действие", hint: "баллов" },
  createTab: { ru: "Создание таба", hint: "баллов" },
  referralL1: { ru: "Реферал L1", hint: "баллов" },
  referralL2: { ru: "Реферал L2", hint: "баллов" },
  createEntity: { ru: "Создание фонда/персоны", hint: "баллов" },
  maxPoints: { ru: "Баллов для 100% активности" },
  projectsCreated: { ru: "Создано проектов", hint: "количество" },
  projectsEdited: { ru: "Отредактировано проектов", hint: "количество" },
  earlylandTasks: { ru: "Заданий EarlyLand", hint: "количество" },
  socialActions: { ru: "Социальных действий", hint: "количество" },
  tabsCreated: { ru: "Создано табов", hint: "количество" },
  referralsL1: { ru: "Рефералов L1", hint: "количество" },
  referralsL2: { ru: "Рефералов L2", hint: "количество" },
  entitiesCreated: { ru: "Создано фондов/персон", hint: "количество" },

  // --- Trade ---
  volume: { ru: "Торговый объём", hint: "макс. баллов" },
  trades: { ru: "Завершённые сделки", hint: "макс. баллов" },
  reviews: { ru: "Отзывы", hint: "макс. баллов" },
  counterparties: { ru: "Уникальные контрагенты", hint: "макс. баллов" },
  lostDispute: { ru: "Штраф за проигранный спор" },
  repeatViolation: { ru: "Штраф за повторное нарушение" },
  completedTrades: { ru: "Завершённые сделки", hint: "количество" },
  avgReview: { ru: "Средняя оценка", hint: "0–5" },
  reviewCount: { ru: "Количество отзывов", hint: "штук" },
  uniqueCounterparties: { ru: "Уникальные контрагенты", hint: "количество" },
  otc: { ru: "OTC — аккаунты и внебиржевые активы" },
  p2p: { ru: "P2P — фиат/крипто и платёжные методы" },
};

export const labelFor = (key: string): string =>
  LABELS[key]?.ru || SUB_LABELS[key] || key;

// --- Layer-2 sub-metric labels (raw signal -> 0..100) ---
const SUB_LABELS: Record<string, string> = {
  longevityTier: "Срок работы (шкала)",
  successfulExits: "Успешные выходы (кол-во)",
  exitSuccessRatio: "Доля успешных выходов",
  medianRoi: "Медианный ROI",
  profitableRatio: "Доля прибыльных",
  realisedShare: "Доля реализованного",
  jurisdiction: "Юрисдикция",
  hasLicense: "Наличие лицензии",
  legalEntityDisclosed: "Раскрытие юрлица",
  beneficiaryTransparency: "Прозрачность бенефициаров",
  noLegalIncidents: "Нет судебных инцидентов",
  operationalContinuity: "Непрерывность работы",
  portfolioSurvival: "Выживание портфеля",
  noCriticalDefaults: "Нет критических дефолтов",
  continuedInvestment: "Продолжение инвестиций",
  reputationStability: "Стабильность репутации",
  realisedResults: "Реализованные результаты",
  consistency: "Стабильность результатов",
  dataConfidence: "Достоверность данных",
  successfulProjectsRatio: "Доля успешных проектов",
  medianProjectRoi: "Медианный ROI проектов",
  projectSurvivalRate: "Выживаемость проектов",
  roleSignificance: "Значимость роли",
  yearsActive: "Лет на рынке",
  continuity: "Непрерывность активности",
  marketCycles: "Пройдено рыночных циклов",
  verifiedHistory: "Подтверждённая история",
  activeProjects: "Активные проекты",
  recentActivity: "Недавняя активность",
  projectQuality: "Качество проектов",
  tier1Mentions: "Упоминания в Tier-1 СМИ",
  industryMentions: "Упоминания в отраслевых СМИ",
  interviews: "Интервью / подкасты",
  conferences: "Выступления",
  recency: "Свежесть",
  mentionsByTopEntities: "Упоминания топ-сущностями",
  followerNetworkQuality: "Качество сети подписчиков",
  marketReaction: "Реакция рынка",
  crossPlatform: "Кроссплатформенность",
  networkCentrality: "Центральность в сети",
  followers: "Подписчики (лог-шкала)",
  realAccountRatio: "Доля реальных аккаунтов",
  activeFollowerRatio: "Доля активных подписчиков",
  topFollowerScore: "Качество топ-подписчиков",
  audienceRelevance: "Релевантность аудитории",
  suspiciousFollowerRatio: "Подозрительные подписчики (штраф)",
  medianEngagementRate: "Медианный ER",
  engagementRate: "Уровень вовлечённости",
  commentQuality: "Качество комментариев",
  uniqueEngagers: "Уникальные вовлечённые",
  shareRate: "Частота репостов",
  engagementStability: "Стабильность вовлечённости",
  postsPer30Days: "Постов за 30 дней",
  activeDaysRatio: "Доля активных дней",
  lastPostRecency: "Свежесть последнего поста",
  accountAge: "Возраст аккаунта",
  verification: "Верификация",
  noSuspensions: "Нет блокировок",
  noSpamPatterns: "Нет спам-паттернов",
  stableIdentity: "Стабильная личность",
  noScamAssociations: "Нет связей со скамом",
  mentionsByRatedPersons: "Упоминания рейт. персонами",
  mentionsByRatedFunds: "Упоминания рейт. фондами",
  mentionsByRatedProjects: "Упоминания рейт. проектами",
  crossNetworkCentrality: "Межсетевая центральность",
  collaborationScore: "Коллаборации",
  ratedEntityFollowers: "Подписчики из рейт. базы",
  geoQuality: "Качество гео",
  professionalAudience: "Проф. аудитория",
  purchasingPower: "Покупательная способность",
  verifiedIdentities: "Верифицированные личности",
  relevantExperience: "Релевантный опыт",
  previousProducts: "Прошлые продукты",
  pastProjectSuccess: "Успех прошлых проектов",
  technicalCompetence: "Техническая компетентность",
  reputationIncidents: "Репутация / инциденты",
  teamInvestorAllocation: "Аллокация команды/инвесторов",
  initialCirculation: "Начальная циркуляция",
  vestingCliff: "Вестинг и клифф",
  unlockPressure: "Давление разлоков",
  fdvAdequacy: "Адекватность FDV",
  utilityDemand: "Полезность и спрос",
  marketGrowth: "Рост рынка",
  investorInterest: "Интерес инвесторов",
  userDemand: "Спрос пользователей",
  competitionSaturation: "Насыщенность конкуренцией",
  regulatoryRisk: "Регуляторный риск",
  legalTransparency: "Правовая прозрачность",
  teamLocation: "Локация команды",
  mainMarket: "Основной рынок",
  sanctionsRisk: "Санкционный риск",
  relativeValuation: "Относительная оценка",
  productDifferentiation: "Дифференциация продукта",
  tractionComparison: "Сравнение трекшена",
  teamComparison: "Сравнение команды",
  fundingComparison: "Сравнение фандинга",
  activeDays: "Активные дни",
  meaningfulSessions: "Значимые сессии",
  entityConsumption: "Потребление контента",
  returnFrequency: "Частота возвратов",
  savedFollowed: "Сохранения/подписки",
  contentConsumption: "Потребление контента",
  comments: "Комментарии",
  validComments: "Валидные комментарии",
  reactions: "Реакции",
  shares: "Репосты/шеры",
  saves: "Сохранения",
  discussions: "Обсуждения",
  farmingRatio: "Штраф за фарминг",
  usefulReports: "Полезные репорты",
  dataCorrections: "Исправления данных",
  verifiedSources: "Проверенные источники",
  moderatedContributions: "Модерация",
  acceptedFeedback: "Принятый фидбек",
  savedEntities: "Сохранённые сущности",
  acceptedContributions: "Принятые правки",
  qualityCoefficient: "Коэффициент качества",
  communityFeedback: "Отклик сообщества",
  taskPoints: "Баллы заданий",
  owns: "Владение NFT",
  holdingMonths: "Срок владения (мес.)",
  ownership: "Владение NFT",
  holdingDuration: "Срок владения",
  tier: "Тир NFT",
  activeUse: "Активное использование",
  activeL1: "Активные рефералы L1",
  activeL2: "Активные рефералы L2",
  retention: "Удержание рефералов",
};

export const subLabelFor = (key: string): string => {
  if (SUB_LABELS[key]) return SUB_LABELS[key];
  const [prefix, rest] = key.split(":");
  const p: Record<string, string> = {
    deal: "Сделка",
    crisis: "Кризис",
    partner: "Партнёр",
    fundsQuality: "Фонд",
    personsQuality: "Персона",
    task: "Задание",
  };
  if (rest && p[prefix]) return `${p[prefix]}: ${rest}`;
  return LABELS[key]?.ru || key;
};

export const sourceLabel = (source?: string): string => {
  if (source === "derived") return "рассчитано";
  if (source === "manual") return "вручную";
  if (source === "missing") return "нет данных";
  return "";
};
export const hintFor = (key: string): string | undefined => LABELS[key]?.hint;

/* -------- human-readable RU labels for ingestion metadata -------- */
export const validationLabel = (v?: string): string =>
  v === "valid" ? "Данные корректны" : v === "invalid" ? "Ошибка данных" : "—";

const SOURCE_HUMAN: Record<string, string> = {
  "crm-db": "База CRM",
  "portfolio-db": "База портфелей",
  "project-db": "База проектов",
  "funds-db": "База фондов",
  "manual-curation": "Ручной ввод",
  "mock-parser": "Тестовый источник",
  "admin-test": "Тестовый источник",
  "x": "X / Twitter",
  "twitter": "X / Twitter",
  "derived": "Рассчитано автоматически",
  "coingecko": "CoinGecko",
};
export const sourceHuman = (s?: string): string =>
  !s ? "—" : SOURCE_HUMAN[s] || s;

/** Freshness bucket from an ISO date: свежо / актуально / устарело. */
export const freshnessLabel = (iso?: string): { label: string; stale: boolean } => {
  if (!iso) return { label: "нет данных", stale: true };
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (days <= 7) return { label: "актуально", stale: false };
  if (days <= 30) return { label: `${Math.round(days)} дн. назад`, stale: false };
  return { label: "устарело", stale: true };
};
