/**
 * Canonical, EDITABLE default sub-formulas (Phase 1).
 * Each component carries metadata (label/tooltip/formula/source) + the editable
 * sub-weights / caps / thresholds / penalties / normalization rules.
 */
import {
  ComponentFormula,
  NormRule,
  SubFormulasConfig,
  SubMetricDef,
} from "./unified-rating.types";

const w = (
  key: string,
  label: string,
  weight: number,
  source: string,
  norm: NormRule,
  penalty = false
): SubMetricDef => ({ key, label, weight, source, norm, penalty });

const pct: NormRule = { type: "pct" };
const ratio: NormRule = { type: "ratio" };
const bool: NormRule = { type: "bool" };
const lin = (cap: number): NormRule => ({ type: "linear", cap });
const log = (cap: number): NormRule => ({ type: "log", cap });
const rec = (halfLifeDays: number): NormRule => ({ type: "recency", halfLifeDays });

export function buildDefaultSubFormulas(): SubFormulasConfig {
  const funds: Record<string, ComponentFormula> = {
    longevity: {
      kind: "scalar",
      label: "Срок работы",
      tooltip:
        "Возраст фонда от даты основания по КАНОНИЧЕСКОЙ ступенчатой шкале: <1г=2, 1–2г=6, 2–4г=12, 4–6л=18, 6–10л=22, 10+л=25 баллов. Считается автоматически ежедневно. Внимание: таблица ниже задаёт нормализацию 0–100, итоговый вклад = norm/100 × максимум 25.",
      formula: "raw месяцы → нормализация 0–100 (ступени) → × максимум 25",
      source: "Дата основания фонда (обновляется ежедневно)",
      field: "monthsActive",
      cap: 25,
      norm: {
        type: "tiered",
        table: [
          { at: 0, points: 8 },
          { at: 12, points: 24 },
          { at: 24, points: 48 },
          { at: 48, points: 72 },
          { at: 72, points: 88 },
          { at: 120, points: 100 },
        ],
      },
    },
    majorDeals: {
      kind: "dealQuality",
      label: "Крупные сделки",
      tooltip:
        "Значимость сделок, а не их количество. Балл зависит от роли фонда (lead/участник), стадии, доли и результата проекта.",
      formula: "Σ баллов по ролям сделок (cap 20)",
      source: "Инвестиционная история фонда, раунды, роль lead-инвестора",
      cap: 20,
      rolePoints: {
        leadLargeRound: 4,
        earlySuccessful: 4,
        majorLead: 4,
        major: 3,
        significant: 2,
        topProjectParticipant: 2,
        confirmed: 1,
        unconfirmed: 0,
      },
    },
    exits: {
      kind: "weighted",
      cap: 12.5,
      label: "Успешные выходы",
      tooltip:
        "Только подтверждённые выходы с прибылью: продажа доли/токенов после unlock, acquisition, secondary. Листинг и бумажная прибыль не считаются.",
      formula: "12.5 × (0.45·кол-во + 0.35·доля успешных + 0.20·median realised ROI)",
      source: "Инвест-история, продажи токенов/долей, realised ROI, acquisition",
      subs: [
        w("successfulCount", "Кол-во успешных выходов", 45, "Подтверждённые выходы", lin(10)),
        w("successRatio", "Доля успешных выходов", 35, "Успешные / все выходы", ratio),
        w("medianRealisedRoi", "Медианный realised ROI", 20, "Реализованный ROI по выходам", lin(4)),
      ],
    },
    roi: {
      kind: "weighted",
      cap: 12.5,
      label: "Средний ROI",
      tooltip:
        "Устойчивый ROI: используется медиана (не среднее), доля прибыльных инвестиций и доля позиций с известными данными.",
      formula: "12.5 × (0.5·median ROI + 0.3·profitable ratio + 0.2·realised data share)",
      source: "Портфельные инвестиции, входные/выходные цены, realised/unrealised ROI",
      subs: [
        w("medianRoi", "Медианный ROI", 50, "Медиана ROI по инвестициям", lin(4)),
        w("profitableRatio", "Доля прибыльных", 30, "Прибыльные / все инвестиции", ratio),
        w("realisedShare", "Доля реализованных данных", 20, "Позиции с известным ROI", ratio),
      ],
    },
    resilience: {
      kind: "resilience",
      cap: 15,
      label: "Устойчивость к кризисам",
      tooltip:
        "Оценивается поведение фонда в каждом системном кризисе, который он реально застал. Кризисы до основания фонда не учитываются (и не дают ноль).",
      formula: "15 × средний Crisis Survival по пережитым кризисам",
      source: "Справочник кризисов + активность/дефолты/репутация фонда в период",
      fullConfidenceCrises: 3,
      crisisSubs: [
        w("operationalContinuity", "Непрерывность работы", 30, "Активность фонда в кризис", pct),
        w("portfolioSurvival", "Выживание портфеля", 25, "Доля выживших проектов", pct),
        w("noCriticalDefaults", "Нет критических дефолтов", 20, "Дефолты/судебные проблемы", pct),
        w("continuedActivity", "Продолжение инвестиций", 15, "Новые сделки в период", pct),
        w("reputationStability", "Стабильность репутации", 10, "Репутационный ущерб", pct),
      ],
    },
    compliance: {
      kind: "compliance",
      cap: 15,
      label: "Юрисдикция и регулирование",
      tooltip:
        "Базовый балл по категории юрисдикции + модификаторы за лицензию, раскрытие юрлица, прозрачность бенефициаров и отсутствие инцидентов.",
      formula: "баллы юрисдикции + флаги (cap 15)",
      source: "Справочник юрисдикций, лицензии, юрлицо, бенефициары",
      jurisdictionField: "jurisdictionPoints",
      flags: [
        { key: "hasLicense", label: "Наличие лицензии", delta: 2 },
        { key: "legalEntityDisclosed", label: "Раскрытие юрлица", delta: 1 },
        { key: "beneficiaryTransparency", label: "Прозрачность бенефициаров", delta: 1 },
        { key: "noLegalIncidents", label: "Нет судебных инцидентов", delta: 2 },
      ],
    },
  };

  const persons: Record<string, ComponentFormula> = {
    investingSuccess: {
      kind: "weighted",
      label: "Успешность инвестирования",
      tooltip: "Считается из результатов связанных инвестиций персоны, а не выставляется вручную.",
      formula: "0.35·median ROI + 0.25·profitable + 0.20·realised + 0.10·consistency + 0.10·confidence",
      source: "Связанные инвестиции, входная цена, realised/unrealised ROI",
      subs: [
        w("medianRoi", "Медианный ROI", 35, "Медиана ROI инвестиций", lin(4)),
        w("profitableRatio", "Доля прибыльных", 25, "Прибыльные / все", ratio),
        w("realisedShare", "Доля реализованного ROI", 20, "Realised / total", ratio),
        w("consistency", "Стабильность результатов", 10, "Разброс результатов", pct),
        w("dataConfidence", "Достоверность данных", 10, "Полнота данных", pct),
      ],
    },
    advisorSuccess: {
      kind: "weighted",
      label: "Успех как советника",
      tooltip: "Учитываются только подтверждённые роли advisor. Присутствие в списке advisors успехом не считается.",
      formula: "0.40·success ratio + 0.25·median result + 0.20·survival + 0.10·role + 0.05·confidence",
      source: "Проекты с подтверждённой ролью advisor, их survival и ROI",
      subs: [
        w("successfulProjectsRatio", "Доля успешных проектов", 40, "Успешные / все проекты", ratio),
        w("medianProjectRoi", "Медианный ROI проектов", 25, "Медиана ROI проектов", lin(4)),
        w("projectSurvivalRate", "Выживаемость проектов", 20, "Доля живых проектов", ratio),
        w("roleSignificance", "Значимость роли", 10, "Вес роли advisor", pct),
        w("dataConfidence", "Достоверность данных", 5, "Полнота данных", pct),
      ],
    },
    marketExperience: {
      kind: "weighted",
      label: "Опыт на рынке",
      tooltip: "Не просто число лет: учитывается непрерывность активности и число пройденных рыночных циклов.",
      formula: "0.5·years + 0.2·continuity + 0.2·cycles + 0.1·verification",
      source: "Дата первой активности, проекты, инвестиции, публикации по годам",
      subs: [
        w("yearsActive", "Лет на рынке", 50, "Годы подтверждённой активности", {
          type: "tiered",
          table: [
            { at: 0, points: 10 },
            { at: 1, points: 30 },
            { at: 3, points: 50 },
            { at: 5, points: 75 },
            { at: 8, points: 100 },
          ],
        }),
        w("continuity", "Непрерывность активности", 20, "Активные годы / всего", pct),
        w("marketCycles", "Пройдено рыночных циклов", 20, "Bull/bear циклы", lin(4)),
        w("verifiedHistory", "Подтверждённая история", 10, "Верификация фактов", pct),
      ],
    },
    projectActivity: {
      kind: "weighted",
      label: "Активность в проектах",
      tooltip: "Учитываются роли (founder/core/advisor…), текущая активность и качество проектов.",
      formula: "0.35·active + 0.25·role + 0.20·recency + 0.20·quality",
      source: "Связанные проекты, роли, даты активности",
      subs: [
        w("activeProjects", "Активные проекты", 35, "Число активных проектов", lin(10)),
        w("roleSignificance", "Значимость роли", 25, "Вес роли (founder=1…mention=0.1)", pct),
        w("recencyDays", "Недавняя активность", 20, "Дней с последней активности", rec(90)),
        w("projectQuality", "Качество проектов", 20, "Средний рейтинг проектов", pct),
      ],
    },
    mediaActivity: {
      kind: "weighted",
      label: "Медиаактивность",
      tooltip: "Разные источники имеют разный вес: Tier-1 СМИ важнее неизвестного блога.",
      formula: "0.35·tier1 + 0.25·industry + 0.20·interviews + 0.10·conf + 0.10·recency",
      source: "Статьи, интервью, подкасты, конференции, упоминания",
      subs: [
        w("tier1Mentions", "Упоминания в Tier-1 СМИ", 35, "Крупные деловые/крипто СМИ", log(50)),
        w("industryMentions", "Упоминания в отраслевых СМИ", 25, "Отраслевые издания", log(200)),
        w("interviews", "Интервью / подкасты", 20, "Подтверждённые интервью", lin(20)),
        w("conferences", "Выступления", 10, "Конференции", lin(10)),
        w("recencyDays", "Свежесть", 10, "Дней с последнего упоминания", rec(30)),
      ],
    },
    marketInfluence: {
      kind: "weighted",
      label: "Рыночное влияние",
      tooltip: "Не то же, что Twitter Score: показывает, как действия персоны расходятся по рынку.",
      formula: "0.30·top mentions + 0.25·network + 0.20·reaction + 0.15·cross + 0.10·centrality",
      source: "Упоминания топ-сущностями, качество сети, реакция рынка",
      subs: [
        w("mentionsByTopEntities", "Упоминания топ-сущностями", 30, "Рейтинговые фонды/персоны", log(100)),
        w("followerNetworkQuality", "Качество сети", 25, "Качество подписчиков", pct),
        w("marketReaction", "Реакция рынка", 20, "Реакция после публикаций", pct),
        w("crossPlatform", "Кроссплатформенность", 15, "Число платформ", lin(4)),
        w("networkCentrality", "Центральность в сети", 10, "Граф связей", pct),
      ],
    },
    partnerships: {
      kind: "partnerships",
      label: "Партнёрства",
      tooltip: "Только подтверждённые связи. Взаимная подписка или одно фото партнёрством не считаются.",
      formula: "Σ(rating × strength × recency × verification) / divisor",
      source: "Официальные партнёрства, advisory-соглашения, совместные продукты",
      kindRatings: {
        officialPartner: 1,
        fund: 0.9,
        advisor: 0.8,
        investor: 0.8,
        jointProduct: 0.6,
        jointRound: 0.6,
        event: 0.3,
        mutualFollow: 0,
      },
      divisor: 5,
      recencyHalfLifeDays: 365,
    },
  };

  const twitter: Record<string, ComponentFormula> = {
    followers: {
      kind: "scalar",
      label: "Подписчики",
      tooltip: "Логарифмическая шкала, чтобы крупные аккаунты не получали непропорциональное преимущество.",
      formula: "100 × log10(1+followers) / log10(1+cap)",
      source: "Профиль X (Twitter)",
      field: "followers",
      norm: log(1000000),
    },
    quality: {
      kind: "weighted",
      label: "Качество аудитории",
      tooltip: "Доля реальных/активных аккаунтов, известные подписчики; штраф за подозрительных.",
      formula: "0.35·real + 0.20·active + 0.20·top + 0.15·relevance − 0.10·suspicious",
      source: "Парсер подписчиков: возраст, аватар, активность, followers/following",
      subs: [
        w("realAccountRatio", "Доля реальных аккаунтов", 40, "Не-боты / все", ratio),
        w("activeFollowerRatio", "Доля активных подписчиков", 20, "Активные / все", ratio),
        w("topFollowerScore", "Качество топ-подписчиков", 20, "Известные из базы", pct),
        w("audienceRelevance", "Релевантность аудитории", 20, "Крипто-релевантность", pct),
        w("suspiciousFollowerRatio", "Подозрительные аккаунты", 10, "Боты/паттерны (штраф)", ratio, true),
      ],
    },
    engagement: {
      kind: "weighted",
      label: "Вовлечённость",
      tooltip: "Не один ER: используется медиана по последним 30–100 постам + качество и стабильность.",
      formula: "0.40·median ER + 0.20·unique + 0.15·reply quality + 0.15·repost + 0.10·stability",
      source: "Последние публикации: лайки/репосты/ответы/уникальные вовлечённые",
      subs: [
        w("medianEngagementRate", "Медианный ER", 40, "Медиана ER по постам", lin(10)),
        w("uniqueEngagersRatio", "Уникальные вовлечённые", 20, "Уникальные / показы", ratio),
        w("replyQuality", "Качество ответов", 15, "Осмысленность комментариев", pct),
        w("shareRate", "Частота репостов", 15, "Репосты на пост", lin(5)),
        w("engagementStability", "Стабильность", 10, "Разброс ER", pct),
      ],
    },
    frequency: {
      kind: "weighted",
      label: "Частота публикаций",
      tooltip: "Оптимальный диапазон постов; сильный штраф за молчание 30+ дней и за спам.",
      formula: "0.45·posts/30d + 0.25·active days + 0.20·recency + 0.10·consistency − spam",
      source: "Лента публикаций аккаунта",
      subs: [
        w("postsPer30Days", "Постов за 30 дней", 45, "Число постов/30д", {
          type: "tiered",
          table: [
            { at: 0, points: 0 },
            { at: 1, points: 25 },
            { at: 4, points: 55 },
            { at: 8, points: 85 },
            { at: 30, points: 100 },
          ],
        }),
        w("activeDaysRatio", "Доля активных дней", 25, "Активные дни / 30", ratio),
        w("lastPostDays", "Свежесть последнего поста", 20, "Дней с последнего поста", rec(15)),
        w("consistency", "Регулярность", 10, "Равномерность постинга", pct),
        w("spamRatio", "Спам-паттерны", 20, "Авто/спам посты (штраф)", ratio, true),
      ],
    },
    reputation: {
      kind: "weighted",
      label: "Репутация",
      tooltip: "Синяя галочка сама по себе не даёт высокий балл (особенно платная).",
      formula: "0.20·age + 0.15·verified + 0.20·no suspensions + 0.15·no spam + 0.15·identity + 0.15·no scam",
      source: "История аккаунта, блокировки, паттерны спама, связи со скамом",
      subs: [
        w("accountAgeMonths", "Возраст аккаунта", 20, "Месяцев с регистрации", log(120)),
        w("verified", "Верификация", 15, "Статус верификации", bool),
        w("noSuspensions", "Нет блокировок", 20, "История блокировок", bool),
        w("noSpamPatterns", "Нет спам-паттернов", 15, "Спам-сигналы", bool),
        w("stableIdentity", "Стабильная личность", 15, "Смены имени/handle", bool),
        w("noScamAssociations", "Нет связей со скамом", 15, "Связи со скам-проектами", bool),
      ],
    },
    cryptoInfluence: {
      kind: "weighted",
      label: "Влияние в криптосреде",
      tooltip: "Использует связи внутри вашей базы Fund–Person–Project–Twitter.",
      formula: "0.25·persons + 0.25·funds + 0.20·projects + 0.15·centrality + 0.15·collab",
      source: "Упоминания рейтинговыми сущностями, граф связей",
      subs: [
        w("mentionsByRatedPersons", "Упоминания рейт. персонами", 25, "Из базы персон", log(100)),
        w("mentionsByRatedFunds", "Упоминания рейт. фондами", 25, "Из базы фондов", log(50)),
        w("mentionsByRatedProjects", "Упоминания рейт. проектами", 20, "Из базы проектов", log(100)),
        w("crossNetworkCentrality", "Межсетевая центральность", 15, "Граф связей", pct),
        w("collaborationScore", "Коллаборации", 15, "Совместные активности", pct),
      ],
    },
    tier1Audience: {
      kind: "weighted",
      label: "Tier-1 аудитория",
      tooltip: "Не только гео: сильные фонды, рейтинговые персоны/проекты, проф-инвесторы.",
      formula: "0.40·rated followers + 0.25·geo + 0.20·professional + 0.15·investment power",
      source: "Справочник Tier-1, база рейтинговых сущностей, гео",
      subs: [
        w("ratedEntityFollowers", "Подписчики из рейт. базы", 40, "Follower'ы-рейтинговые", log(1000)),
        w("geoQuality", "Качество гео", 25, "Приоритетные рынки", pct),
        w("professionalAudience", "Проф. аудитория", 20, "Инвесторы/профи", pct),
        w("purchasingPower", "Инвестиционная сила", 15, "Покупательная способность", pct),
      ],
    },
  };

  const projects: Record<string, ComponentFormula> = {
    fundsQuality: {
      kind: "weightedList",
      label: "Качество фондов",
      tooltip: "Взвешенный средний рейтинг фондов проекта. Вес зависит от стадии входа, роли lead и размера участия.",
      formula: "Σ(FundScore × weight) / Σweight",
      source: "Связанные фонды и их Fund Score",
    },
    personsQuality: {
      kind: "weightedList",
      label: "Качество персон",
      tooltip: "Взвешенный средний рейтинг персон. Founder и core team весят больше, чем advisor/ambassador.",
      formula: "Σ(PersonScore × weight) / Σweight",
      source: "Связанные персоны и их Person Score",
    },
    developmentTeam: {
      kind: "weighted",
      label: "Команда",
      tooltip: "Подтверждённость участников, релевантный опыт, прошлые продукты, история успехов и инцидентов.",
      formula: "0.15·verified + 0.20·experience + 0.20·products + 0.20·past success + 0.15·tech + 0.10·incidents",
      source: "Профили команды, прошлые продукты, инциденты",
      subs: [
        w("verifiedIdentities", "Верифицированные личности", 15, "Доля подтверждённых", ratio),
        w("relevantExperience", "Релевантный опыт", 20, "Профильный опыт", pct),
        w("previousProducts", "Прошлые продукты", 20, "Число прошлых продуктов", lin(3)),
        w("pastProjectSuccess", "Успех прошлых проектов", 20, "История успехов", pct),
        w("technicalCompetence", "Техническая компетентность", 15, "Оценка техчасти", pct),
        w("reputationIncidents", "Репутация / инциденты", 10, "Отсутствие инцидентов", pct),
      ],
    },
    tokenomics: {
      kind: "weighted",
      label: "Токеномика",
      tooltip: "Распределение, initial circulation, cliff/vesting, unlock pressure, FDV, utility.",
      formula: "0.20·allocation + 0.15·circulation + 0.20·vesting + 0.20·unlock + 0.15·fdv + 0.10·utility",
      source: "Токеномика проекта, графики разлоков, FDV",
      subs: [
        w("teamInvestorAllocationScore", "Аллокация команды/инвесторов", 20, "Доли team/investor", pct),
        w("initialCirculationScore", "Начальная циркуляция", 15, "Initial circulating", pct),
        w("vestingScore", "Вестинг и клифф", 20, "Cliff/vesting", pct),
        w("unlockPressureScore", "Давление разлоков", 20, "Unlock pressure", pct),
        w("fdvAdequacyScore", "Адекватность FDV", 15, "FDV vs метрики", pct),
        w("utilityDemandScore", "Полезность и спрос", 10, "Utility/demand", pct),
      ],
    },
    niche: {
      kind: "weighted",
      label: "Ниша",
      tooltip: "Динамическая оценка ниши: рост рынка, спрос, насыщенность, интерес инвесторов, регуляторный риск.",
      formula: "0.30·growth + 0.20·investor + 0.20·demand + 0.15·saturation + 0.15·reg risk",
      source: "Рыночные данные по нише, интерес инвесторов",
      subs: [
        w("marketGrowth", "Рост рынка", 30, "Темп роста ниши", pct),
        w("investorInterest", "Интерес инвесторов", 20, "Инвестиции в нишу", pct),
        w("userDemand", "Спрос пользователей", 20, "Пользовательский спрос", pct),
        w("competitionSaturation", "Насыщенность конкуренцией", 15, "Конкуренция (инверт.)", pct),
        w("regulatoryRisk", "Регуляторный риск", 15, "Риск регулирования (инверт.)", pct),
      ],
    },
    geography: {
      kind: "weighted",
      label: "География",
      tooltip: "Юрисдикция, рынок присутствия, прозрачность структуры и регуляторные/санкционные риски.",
      formula: "0.40·jurisdiction + 0.20·legal + 0.15·team loc + 0.15·market + 0.10·sanctions",
      source: "Справочник юрисдикций, структура, рынки",
      subs: [
        w("jurisdictionScore", "Юрисдикция", 40, "Категория юрисдикции", pct),
        w("legalTransparency", "Правовая прозрачность", 20, "Раскрытие структуры", pct),
        w("teamLocationScore", "Локация команды", 15, "Гео команды", pct),
        w("mainMarketScore", "Основной рынок", 15, "Целевой рынок", pct),
        w("sanctionsRisk", "Санкционный риск", 10, "Санкции (инверт.)", pct),
      ],
    },
    competitors: {
      kind: "weighted",
      label: "Конкуренты",
      tooltip: "Сравнение с ближайшими аналогами: valuation, продукт, traction, команда, финансирование.",
      formula: "0.35·valuation + 0.25·differentiation + 0.20·traction + 0.10·team + 0.10·funding",
      source: "Сравнимые проекты-аналоги",
      subs: [
        w("relativeValuation", "Относительная оценка", 35, "Valuation vs аналоги", pct),
        w("productDifferentiation", "Дифференциация продукта", 25, "Уникальность продукта", pct),
        w("tractionComparison", "Сравнение трекшена", 20, "Traction vs аналоги", pct),
        w("teamComparison", "Сравнение команды", 10, "Команда vs аналоги", pct),
        w("fundingComparison", "Сравнение фандинга", 10, "Финансирование vs аналоги", pct),
      ],
    },
  };

  const users: Record<string, ComponentFormula> = {
    platformEngagement: {
      kind: "weighted",
      label: "Активность на платформе",
      tooltip:
        "Реальная вовлечённость: активные дни, осмысленные сессии, потребление контента, возвраты и сохранения. За «время на сайте» много баллов не даётся.",
      formula: "0.35·active days + 0.25·sessions + 0.15·consumption + 0.15·returns + 0.10·saved",
      source: "Аналитика сессий: активные дни, глубина, возвраты, сохранения/подписки",
      subs: [
        w("activeDays", "Активные дни", 35, "Дней с осмысленной активностью", lin(30)),
        w("meaningfulSessions", "Осмысленные сессии", 25, "Сессии с действиями", lin(60)),
        w("entityConsumption", "Потребление контента", 15, "Просмотрено сущностей", lin(100)),
        w("returnFrequency", "Частота возвратов", 15, "Доля возвращений", ratio),
        w("savedFollowed", "Сохранения/подписки", 10, "Saved/followed", lin(50)),
      ],
    },
    contentInteraction: {
      kind: "weighted",
      label: "Взаимодействие с контентом",
      tooltip:
        "Комментарии, реакции, шеры, сохранения и участие в обсуждениях. Анти-фарминг: свои/удалённые/спам-действия не учитываются и штрафуют.",
      formula: "0.25·comments + 0.20·reactions + 0.20·shares + 0.15·saves + 0.20·discussions − фарминг",
      source: "События взаимодействия (комментарии/реакции/шеры) с фильтром анти-фарминга",
      subs: [
        w("validComments", "Валидные комментарии", 25, "Не свои, не удалённые", lin(40)),
        w("reactions", "Реакции", 20, "Лайки/реакции", lin(100)),
        w("shares", "Шеры", 20, "Подтверждённые шеры", lin(30)),
        w("saves", "Сохранения", 15, "Сохранённые материалы", lin(50)),
        w("discussions", "Обсуждения", 20, "Участие в тредах", lin(20)),
        w("farmingRatio", "Штраф за фарминг", 25, "Доля спам/накрутки (штраф)", ratio, true),
      ],
    },
    meaningfulContribution: {
      kind: "weighted",
      label: "Полезный вклад",
      tooltip:
        "Реальная польза сообществу: подтверждённые репорты, исправления данных, добавленные источники, модерация и принятый фидбек. Создание проектов/фондов больше не учитывается.",
      formula: "0.30·reports + 0.25·fixes + 0.20·sources + 0.15·moderation + 0.10·feedback",
      source: "Модерация, подтверждённые репорты, правки данных, принятые источники",
      subs: [
        w("usefulReports", "Полезные репорты", 30, "Подтверждённые репорты", lin(15)),
        w("dataCorrections", "Исправления данных", 25, "Принятые правки", lin(15)),
        w("verifiedSources", "Проверенные источники", 20, "Добавленные источники", lin(10)),
        w("moderatedContributions", "Модерация", 15, "Успешная модерация", lin(10)),
        w("acceptedFeedback", "Принятый фидбек", 10, "Учтённые предложения", lin(10)),
      ],
    },
    earlyland: {
      kind: "scalar",
      label: "EarlyLand / кампании",
      tooltip:
        "Один из главных блоков. Балл задачи = базовые баллы × сложность × подтверждение × качество × важность кампании (не фиксированные +3). Учитывается анти-фрод.",
      formula: "Σ(base × difficulty × verification × quality × importance) → 0–100",
      source: "Задания EarlyLand/Prime/кампаний: сложность, тип, подтверждение, лимиты",
      field: "taskPoints",
      cap: 100,
      norm: lin(100),
    },
    nft: {
      kind: "weighted",
      label: "NFT / подписка",
      tooltip:
        "NFT как маркер подписки/лояльности/доступа, а не pay-to-win по количеству. Важны факт владения, срок удержания, tier и активное использование.",
      formula: "0.30·ownership + 0.30·holding + 0.25·tier + 0.15·active use",
      source: "Владение NFT, срок удержания, tier коллекции, активное использование утилиты",
      subs: [
        w("owns", "Владение", 30, "Есть ли активная NFT/подписка", bool),
        w("holdingMonths", "Срок удержания", 30, "Месяцев удержания", lin(24)),
        w("tier", "Tier NFT", 25, "Уровень коллекции (1–4)", lin(4)),
        w("activeUse", "Активное использование", 15, "Использование утилиты", pct),
      ],
    },
    referrals: {
      kind: "weighted",
      label: "Рефералы",
      tooltip:
        "Максимум два уровня (не MLM). Основной вес — активные L1, L2 слабее. Считаются только активные рефералы (onboarding + осмысленное действие + возврат), с лимитом и retention.",
      formula: "0.70·active L1 + 0.15·active L2 + 0.15·retention",
      source: "Реферальная программа: активные L1/L2, удержание, анти-дубль/фрод",
      subs: [
        w("activeL1", "Активные L1", 70, "Активные рефералы 1 уровня", lin(20)),
        w("activeL2", "Активные L2", 15, "Активные рефералы 2 уровня", lin(40)),
        w("retention", "Удержание", 15, "Доля оставшихся активными", ratio),
      ],
    },
  };

  return { funds, persons, twitter, projects, users };
}
