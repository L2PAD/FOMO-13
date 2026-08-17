export type InfoValue =
  | string
  | number
  | boolean
  | null
  | InfoRecord
  | InfoValue[]

export interface InfoRecord {
  [key: string]: InfoValue | undefined
}

export interface OrderedEntity extends InfoRecord {
  id?: string
  _id?: string
  order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface NavigationItem extends OrderedEntity {
  key?: string
  label_en: string
  label_ru?: string
  href: string
  icon?: string
}

export interface HeroAction extends OrderedEntity {
  text_en: string
  text_ru?: string
  link: string
  primary: boolean
  use_invite_modal?: boolean
}

export interface HeroStat extends InfoRecord {
  value: string
  label_en: string
  label_ru?: string
}

export interface HeroSettings extends InfoRecord {
  badge_en: string
  badge_ru?: string
  title_line1_en: string
  title_line1_ru?: string
  title_line2_en: string
  title_line2_ru?: string
  subtitle_en: string
  subtitle_ru?: string
  invite_redirect_url?: string
  background_image?: string
  stats: HeroStat[]
}

export interface AboutFeature extends InfoRecord {
  icon: string
  title_en: string
  title_ru?: string
  description_en: string
  description_ru?: string
  color?: string
}

export interface AboutSettings extends InfoRecord {
  badge_en: string
  badge_ru?: string
  title_en: string
  title_ru?: string
  title_highlight_en?: string
  title_highlight_ru?: string
  subtitle_en?: string
  subtitle_ru?: string
  description_en: string
  description_ru?: string
  description_end_en?: string
  description_end_ru?: string
  social_engagement_en?: string
  social_engagement_ru?: string
  data_analytics_en?: string
  data_analytics_ru?: string
  seamless_access_en?: string
  seamless_access_ru?: string
  whitepaper_button_text_en?: string
  whitepaper_button_text_ru?: string
  whitepaper_url?: string
  features: AboutFeature[]
}

export interface UtilitiesSettings extends InfoRecord {
  section_badge_en: string
  section_badge_ru?: string
  section_title_en: string
  section_title_ru?: string
  section_description_en?: string
  section_description_ru?: string
  bottom_hint_en?: string
  bottom_hint_ru?: string
  features_title_en?: string
  features_title_ru?: string
  details_label_en?: string
  details_label_ru?: string
}

export interface UtilityFeature extends InfoRecord {
  title_en: string
  title_ru?: string
  description_en?: string
  description_ru?: string
}

export interface UtilityStat extends InfoRecord {
  value: string
  label_en: string
  label_ru?: string
}

export interface Utility extends OrderedEntity {
  title_en: string
  title_ru?: string
  subtitle_en?: string
  subtitle_ru?: string
  icon_type?: string
  custom_icon_url?: string
  image_url?: string
  short_description_en?: string
  short_description_ru?: string
  full_description_en?: string
  full_description_ru?: string
  features: UtilityFeature[]
  stats: UtilityStat[]
  gradient?: string
  bg_gradient?: string
  button_gradient?: string
  button_text_en?: string
  button_text_ru?: string
  button_link?: string
}

export interface UtilityNavButton extends OrderedEntity {
  label_en: string
  label_ru?: string
  key?: string
  url: string
  icon?: string
}

export interface PlatformStat extends InfoRecord {
  key?: string
  value: string
  label_en: string
  label_ru?: string
  change?: string
}

export interface PlatformService extends OrderedEntity {
  icon?: string
  name_en: string
  name_ru?: string
  count?: string
  label_en?: string
  label_ru?: string
  color?: string
  description_en?: string
  description_ru?: string
}

export interface PlatformSettings extends InfoRecord {
  community?: PlatformStat
  visits?: PlatformStat
  projects?: PlatformStat
  alerts?: PlatformStat
  section_badge_en?: string
  section_badge_ru?: string
  section_title_en?: string
  section_title_ru?: string
  section_intro_en?: string
  section_intro_ru?: string
  stats: PlatformStat[]
  service_modules: PlatformService[]
  services_list: PlatformService[]
  bottom_stats: PlatformStat[]
  cta_button_text_en?: string
  cta_button_text_ru?: string
  cta_button_url?: string
  cta_left_text_en?: string
  cta_left_text_ru?: string
}

export interface NftMechanicsSettings extends InfoRecord {
  enabled?: boolean
  section_badge_en?: string
  section_badge_ru?: string
  section_title_en: string
  section_title_ru?: string
  section_description_en?: string
  section_description_ru?: string
  drawer_title_en?: string
  drawer_title_ru?: string
  drawer_description_en?: string
  drawer_description_ru?: string
  universe_url?: string
  button_text_en?: string
  button_text_ru?: string
  price_per_box?: number
  discount_threshold?: number
  discount_percent?: number
  total_supply?: number
  max_per_wallet?: number
  currency?: string
  contract_address?: string
  network?: string
}

export interface DrawerCard extends OrderedEntity {
  title_en: string
  title_ru?: string
  description_en?: string
  description_ru?: string
  link?: string
  image_url?: string
}

export interface RoadmapTask extends OrderedEntity {
  title_en: string
  title_ru?: string
  description_en?: string
  description_ru?: string
  status: 'progress' | 'done' | 'upcoming' | string
  category?: string
}

export interface RoadmapSettings extends InfoRecord {
  badge_en?: string
  badge_ru?: string
  title_en: string
  title_ru?: string
  subtitle_en?: string
  subtitle_ru?: string
  tasks?: RoadmapTask[]
}

export interface EvolutionLevel extends OrderedEntity {
  rank_en: string
  rank_ru?: string
  next_level_en?: string
  next_level_ru?: string
  fomo_score_min: number
  fomo_score_max: number
  description_en?: string
  description_ru?: string
  back_title_en?: string
  back_title_ru?: string
  back_description_en?: string
  back_description_ru?: string
  animation_type?: string
  gradient_from?: string
  gradient_to?: string
}

export interface EvolutionBadge extends OrderedEntity {
  name_en: string
  name_ru?: string
  icon: string
  xp_requirement: number
  condition_en?: string
  condition_ru?: string
  description_en?: string
  description_ru?: string
  back_title_en?: string
  back_title_ru?: string
  back_description_en?: string
  back_description_ru?: string
  animation_type?: string
  gradient_from?: string
  gradient_to?: string
}

export interface SocialLink extends OrderedEntity {
  platform: string
  url: string
  enabled?: boolean
}

export interface TeamMember extends OrderedEntity {
  name_en: string
  name_ru?: string
  position_en: string
  position_ru?: string
  bio_en?: string
  bio_ru?: string
  image_url?: string
  member_type?: 'main' | 'team_member' | string
  social_links?: SocialLink[]
  displayed_socials?: string[]
}

export interface Partner extends OrderedEntity {
  name_en: string
  name_ru?: string
  description_en?: string
  description_ru?: string
  image_url?: string
  image_url_hover?: string
  link?: string
  category?: 'partners' | 'media' | 'portfolio' | string
}

export interface CommunityFeature extends OrderedEntity {
  icon?: string
  title_en: string
  title_ru?: string
  description_en?: string
  description_ru?: string
}

export interface CommunitySettings extends InfoRecord {
  section_badge_en?: string
  section_badge_ru?: string
  title_en: string
  title_ru?: string
  description_en?: string
  description_ru?: string
  features: CommunityFeature[]
  socials: SocialLink[]
  subscribe_enabled?: boolean
  subscribe_title_en?: string
  subscribe_title_ru?: string
}

export interface FaqItem extends OrderedEntity {
  question_en: string
  question_ru?: string
  answer_en: string
  answer_ru?: string
}

export interface FooterLink extends OrderedEntity {
  name_en: string
  name_ru?: string
  url: string
}

export interface FooterSection extends OrderedEntity {
  title_en: string
  title_ru?: string
  links: FooterLink[]
}

export interface LegalPage extends OrderedEntity {
  key: string
  title_en: string
  title_ru?: string
  content_en: string
  content_ru?: string
}

export interface FooterSettings extends InfoRecord {
  company_name?: string
  company_description_en?: string
  company_description_ru?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  social_media: SocialLink[]
  navigation_sections: FooterSection[]
  cta_button_text_en?: string
  cta_button_text_ru?: string
  cta_button_url?: string
  legal_pages: LegalPage[]
  copyright_text_en?: string
  copyright_text_ru?: string
  legal_disclaimer_en?: string
  legal_disclaimer_ru?: string
  made_by_text_en?: string
  made_by_text_ru?: string
  made_by_url?: string
}

export interface CookieConsentSettings extends InfoRecord {
  enabled: boolean
  title_en: string
  title_ru?: string
  description_en: string
  description_ru?: string
  accept_button_text_en?: string
  accept_button_text_ru?: string
  decline_button_text_en?: string
  decline_button_text_ru?: string
  cookie_policy_url?: string
  show_decline_button?: boolean
}

export interface SeoSettings extends InfoRecord {
  site_title: string
  site_title_ru?: string
  site_description: string
  site_description_ru?: string
  site_keywords?: string[]
  site_keywords_ru?: string[]
  canonical_url?: string
  og_title?: string
  og_description?: string
  og_image?: string
  twitter_card?: string
  robots?: string
}

export interface AnalyticsStats extends InfoRecord {
  period?: number
  page_views?: number
  unique_sessions?: number
  button_clicks?: number
  conversion_rate?: number
  conversions?: number
  avg_session_duration?: number
  new_visitors?: number
  returning_visitors?: number
  desktop_visitors?: number
  desktop_percent?: number
  mobile_visitors?: number
  mobile_percent?: number
  top_countries?: InfoRecord[]
  top_cities?: InfoRecord[]
  detailed_sources?: InfoRecord[]
  updated_at?: string
}

export interface InfoBootstrap extends InfoRecord {
  version: string
  updatedAt: string
  preview_url?: string
  status?: string
  navigation: NavigationItem[]
  hero: HeroSettings & {
    buttons?: HeroAction[]
    action_buttons?: HeroAction[]
  }
  about: AboutSettings
  utilities: {
    settings: UtilitiesSettings
    items: Utility[]
    navButtons: UtilityNavButton[]
  } & InfoRecord
  platform: PlatformSettings
  nftMechanics: NftMechanicsSettings & {
    items?: DrawerCard[]
  }
  ecosystem: DrawerCard[]
  roadmap: RoadmapSettings
  evolution: {
    levels: EvolutionLevel[]
    badges: EvolutionBadge[]
  } & InfoRecord
  team: TeamMember[]
  partners?: Partner[]
  faq?: FaqItem[]
  community: CommunitySettings
  footer: FooterSettings
  cookieConsent: CookieConsentSettings
  seo: SeoSettings
}

export interface CollectionResponse<T extends OrderedEntity = OrderedEntity> {
  items: T[]
  total?: number
}

export interface ReorderItem extends InfoRecord {
  id: string
  order: number
}

export interface AssetUploadResponse extends InfoRecord {
  url: string
  full_url?: string
  asset_id?: string
}
