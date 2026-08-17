export type InfoResourceKind = "entity" | "singleton";

export type InfoResourceDefinition = {
  collection: string;
  kind: InfoResourceKind;
  public: boolean;
  sort?: Record<string, 1 | -1>;
  filterFields?: string[];
};

export const INFO_VERSION = "3.0.0";

export const INFO_RESOURCE_DEFINITIONS: Record<string, InfoResourceDefinition> =
  {
    "navigation-items": {
      collection: "info_navigation_items",
      kind: "entity",
      public: true,
      sort: { order: 1, created_at: 1 },
    },
    "hero-settings": {
      collection: "info_hero_settings",
      kind: "singleton",
      public: true,
    },
    "hero-buttons": {
      collection: "info_hero_buttons",
      kind: "entity",
      public: true,
      sort: { order: 1, created_at: 1 },
    },
    "about-settings": {
      collection: "info_about_settings",
      kind: "singleton",
      public: true,
    },
    utilities: {
      collection: "info_utilities",
      kind: "entity",
      public: true,
      sort: { order: 1, created_at: 1 },
      filterFields: ["is_active"],
    },
    "utilities-settings": {
      collection: "info_utilities_settings",
      kind: "singleton",
      public: true,
    },
    "utility-nav-buttons": {
      collection: "info_utility_nav_buttons",
      kind: "entity",
      public: true,
      sort: { order: 1, created_at: 1 },
    },
    "platform-settings": {
      collection: "info_platform_settings",
      kind: "singleton",
      public: true,
    },
    "nft-mechanics-settings": {
      collection: "info_nft_mechanics_settings",
      kind: "singleton",
      public: true,
    },
    "drawer-cards": {
      collection: "info_drawer_cards",
      kind: "entity",
      public: true,
      sort: { order: 1, created_at: 1 },
    },
    roadmap: {
      collection: "info_roadmap_settings",
      kind: "singleton",
      public: true,
    },
    "evolution-levels": {
      collection: "info_evolution_levels",
      kind: "entity",
      public: true,
      sort: { order: 1, fomo_score_min: 1 },
    },
    "evolution-badges": {
      collection: "info_evolution_badges",
      kind: "entity",
      public: true,
      sort: { order: 1, xp_requirement: 1 },
    },
    "team-members": {
      collection: "info_team_members",
      kind: "entity",
      public: true,
      sort: { order: 1, created_at: 1 },
      filterFields: ["member_type"],
    },
    partners: {
      collection: "info_partners",
      kind: "entity",
      public: true,
      sort: { order: 1, created_at: 1 },
      filterFields: ["category"],
    },
    faq: {
      collection: "info_faq_items",
      kind: "entity",
      public: true,
      sort: { order: 1, created_at: 1 },
    },
    "community-settings": {
      collection: "info_community_settings",
      kind: "singleton",
      public: true,
    },
    "footer-settings": {
      collection: "info_footer_settings",
      kind: "singleton",
      public: true,
    },
    "cookie-consent-settings": {
      collection: "info_cookie_consent_settings",
      kind: "singleton",
      public: true,
    },
    "seo-settings": {
      collection: "info_seo_settings",
      kind: "singleton",
      public: true,
    },
    "arena-predictions": {
      collection: "info_arena_predictions",
      kind: "entity",
      public: true,
      sort: { created_at: -1 },
      filterFields: ["status", "asset"],
    },
    "influence-entities": {
      collection: "info_influence_entities",
      kind: "entity",
      public: true,
      sort: { influence_score: -1, created_at: -1 },
      filterFields: ["category", "platform", "verified"],
    },
    "earlyland-opportunities": {
      collection: "info_earlyland_opportunities",
      kind: "entity",
      public: true,
      sort: { order: 1, created_at: -1 },
      filterFields: ["category", "status", "featured"],
    },
    "p2p-deals": {
      collection: "info_p2p_deals",
      kind: "entity",
      public: true,
      sort: { created_at: -1 },
      filterFields: ["status", "asset_type", "seller_address"],
    },
    "invite-codes": {
      collection: "info_invite_codes",
      kind: "entity",
      public: false,
      sort: { created_at: -1 },
      filterFields: ["active"],
    },
    "wallet-profiles": {
      collection: "info_wallet_profiles",
      kind: "entity",
      public: false,
      sort: { created_at: -1 },
    },
  };

export const INFO_SINGLETON_DEFAULTS: Record<
  string,
  Record<string, unknown>
> = {
  "hero-settings": {
    badge: "Welcome to FOMO",
    title_line1: "The Future of",
    title_line2: "Crypto Analytics",
    subtitle: "Your gateway to comprehensive crypto insights and analytics",
    background_image: null,
    invite_redirect_url: "/platform",
    action_buttons: [
      {
        text: "Launch App",
        link: "/platform",
        primary: true,
        use_invite_modal: false,
      },
      {
        text: "Learn More",
        link: "#about",
        primary: false,
        use_invite_modal: false,
      },
    ],
    stats: [],
  },
  "about-settings": {
    badge: "About Us",
    title: "What is",
    title_highlight: "FOMO",
    subtitle:
      "A cutting-edge platform reshaping how users interact with the crypto world",
    description:
      "FOMO is a cutting-edge platform built to reshape the way users interact with the crypto world.",
    social_engagement: "social engagement",
    data_analytics: "data analytics",
    seamless_access: "seamless access",
    description_end: "to crypto projects, NFTs, funds, and more.",
    whitepaper_button_text: "Whitepaper",
    whitepaper_button_link: "#",
    features: [],
  },
  "utilities-settings": {
    badge_text_en: "OUR UTILITIES",
    badge_text_ru: "НАШИ УТИЛИТЫ",
    title_en: "Tools for Crypto Analytics",
    title_ru: "Инструменты для крипто-аналитики",
    title_highlight_en: "",
    title_highlight_ru: "",
    subtitle_en: "Complete toolkit for market analysis",
    subtitle_ru: "Полный набор инструментов для анализа рынка",
    click_hint: "Click for details",
    click_back_hint: "Click to go back",
    features_title: "Features:",
    details_label: "Details",
  },
  "platform-settings": {
    community: {
      value: "",
      label_ru: "Сообщество",
      label_en: "Community",
      change: "",
      trend: [],
    },
    visits: {
      value: "",
      label_ru: "Посещения",
      label_en: "Visits",
      change: "",
      trend: [],
    },
    projects: {
      value: "",
      label_ru: "Проекты",
      label_en: "Projects",
      change: "",
      trend: [],
    },
    alerts: {
      value: "",
      label_ru: "Сигналы",
      label_en: "Alerts",
      change: "",
      trend: [],
    },
    service_modules: [],
    services_list: [],
    bottom_stats: [],
    section_badge_ru: "ВНУТРИ ПЛАТФОРМЫ",
    section_badge_en: "INSIDE THE PLATFORM",
    section_title_ru: "Центр управления вашим крипто-путешествием",
    section_title_en: "A command center for your crypto journey",
    section_intro_ru: "",
    section_intro_en: "",
    cta_left_text: "Ready to explore?",
    cta_button_text: "Launch App",
    cta_button_url: "/platform",
  },
  "nft-mechanics-settings": {
    enabled: true,
    section_badge_en: "FOMO UNIVERSE",
    section_badge_ru: "ВСЕЛЕННАЯ FOMO",
    section_title_en: "NFT mechanics and ecosystem",
    section_title_ru: "NFT-механики и экосистема",
    section_description_en:
      "Explore NFTs, fusion mechanics and rare collectibles.",
    section_description_ru:
      "Исследуйте NFT, механику слияния и редкие коллекционные предметы.",
    drawer_title_en: "Explore the ecosystem",
    drawer_title_ru: "Исследуйте экосистему",
    drawer_description_en: "",
    drawer_description_ru: "",
    universe_url: "#ecosystem",
    button_text_en: "Explore",
    button_text_ru: "Исследовать",
    price_per_box: 150,
    discount_threshold: 3,
    discount_percent: 10,
    total_supply: 666,
    max_per_wallet: 100,
    currency: "USDT",
    contract_address: "",
    network: "",
  },
  roadmap: {
    section_badge: "Our Progress",
    section_title: "Project Roadmap",
    section_subtitle: "Track our development progress in real-time",
    section_badge_ru: "Наш прогресс",
    section_title_ru: "Дорожная карта проекта",
    section_subtitle_ru: "Отслеживайте прогресс разработки в реальном времени",
    tasks: [],
  },
  "community-settings": {
    title_en: "Ready to Get Started?",
    title_ru: "Готовы начать?",
    description_en:
      "Join the FOMO ecosystem and benefit from real-time analytics, community insights, and exclusive tools",
    description_ru: "Присоединяйтесь к экосистеме FOMO",
    features: [],
    socials: [],
    subscribe_enabled: true,
    subscribe_title_en: "Stay up to date",
    subscribe_title_ru: "Будьте в курсе",
  },
  "footer-settings": {
    company_name: "FOMO",
    company_description: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    social_media: [],
    navigation_sections: [],
    cta_button_text: "Launch App",
    cta_button_url: "/platform",
    legal_pages: [],
    copyright_text: "© 2025 FOMO. All rights reserved.",
    legal_disclaimer: "",
    made_by_text: "",
    made_by_url: "",
  },
  "cookie-consent-settings": {
    enabled: true,
    title: "Cookie Consent",
    description: "We use cookies to enhance your experience.",
    accept_button_text: "Accept",
    decline_button_text: "Decline",
    cookie_policy_url: "/cookie-policy",
    show_decline_button: true,
  },
  "seo-settings": {
    title: "FOMO — Crypto Analytics Platform",
    description:
      "FOMO combines crypto analytics, community insights and exclusive tools.",
    keywords: ["crypto", "analytics", "FOMO"],
    canonical_url: "",
    og_title: "",
    og_description: "",
    og_image: "",
    twitter_card: "summary_large_image",
    robots: "index,follow",
  },
};

export const INFO_ENTITY_DEFAULTS: Record<
  string,
  Array<Record<string, unknown>>
> = {
  "navigation-items": [
    {
      id: "info-nav-home",
      key: "home",
      label_en: "Home",
      label_ru: "Главная",
      href: "#hero",
      order: 0,
      is_active: true,
    },
    {
      id: "info-nav-about",
      key: "about",
      label_en: "About",
      label_ru: "О нас",
      href: "#about",
      order: 1,
      is_active: true,
    },
    {
      id: "info-nav-utilities",
      key: "utilities",
      label_en: "Utilities",
      label_ru: "Утилиты",
      href: "#utilities",
      order: 2,
      is_active: true,
    },
    {
      id: "info-nav-roadmap",
      key: "roadmap",
      label_en: "Roadmap",
      label_ru: "Дорожная карта",
      href: "#roadmap",
      order: 3,
      is_active: true,
    },
    {
      id: "info-nav-team",
      key: "team",
      label_en: "Team",
      label_ru: "Команда",
      href: "#team",
      order: 4,
      is_active: true,
    },
    {
      id: "info-nav-partners",
      key: "partners",
      label_en: "Partners",
      label_ru: "Партнёры",
      href: "#partners",
      order: 5,
      is_active: true,
    },
    {
      id: "info-nav-faq",
      key: "faq",
      label_en: "FAQ",
      label_ru: "FAQ",
      href: "#faq",
      order: 6,
      is_active: true,
    },
  ],
  "hero-buttons": [
    {
      id: "info-hero-launch",
      text_en: "Launch App",
      text_ru: "Запустить приложение",
      link: "/platform",
      primary: true,
      use_invite_modal: false,
      order: 0,
      is_active: true,
    },
    {
      id: "info-hero-learn",
      text_en: "Learn More",
      text_ru: "Узнать больше",
      link: "#about",
      primary: false,
      use_invite_modal: false,
      order: 1,
      is_active: true,
    },
  ],
  "drawer-cards": [
    {
      id: "info-drawer-analytics",
      title_en: "Analytics Dashboard",
      title_ru: "Аналитика",
      link: "/analytics",
      image_url: "/images/analytics.png",
      order: 0,
    },
    {
      id: "info-drawer-nft",
      title_en: "NFT Collection",
      title_ru: "NFT Коллекция",
      link: "/nft",
      image_url: "/images/nft.png",
      order: 1,
    },
    {
      id: "info-drawer-staking",
      title_en: "Staking Platform",
      title_ru: "Стейкинг",
      link: "/staking",
      image_url: "/images/staking.png",
      order: 2,
    },
    {
      id: "info-drawer-swap",
      title_en: "Token Swap",
      title_ru: "Обмен токенов",
      link: "/swap",
      image_url: "/images/swap.png",
      order: 3,
    },
  ],
  partners: [
    {
      id: "info-partner-fomo",
      name_en: "FOMO",
      name_ru: "FOMO",
      description_en: "FOMO ecosystem",
      description_ru: "Экосистема FOMO",
      image_url: "",
      image_url_hover: null,
      link: "/",
      category: "partners",
      order: 0,
    },
  ],
};

export const INFO_AUTOMATIC_ENTITY_DEFAULT_RESOURCES = new Set([
  "navigation-items",
  "hero-buttons",
]);

export const INFO_COLLECTIONS = Array.from(
  new Set(
    Object.values(INFO_RESOURCE_DEFINITIONS).map(
      (definition) => definition.collection
    )
  )
);

export const INFO_ANALYTICS_COLLECTION = "info_analytics_events";
export const INFO_MARKET_CACHE_COLLECTION = "info_market_cache";
export const INFO_MEDIA_MIGRATIONS_COLLECTION = "info_media_migrations";

export const INFO_ALLOWED_RASTER_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
