import { InfoRecord, InfoValue } from '../../services/infoLanding'

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'url'
  | 'number'
  | 'boolean'
  | 'select'
  | 'image'
  | 'color'
  | 'datetime'
  | 'tags'
  | 'keyValue'
  | 'object'
  | 'list'

export interface FieldOption {
  label: string
  value: string
}

export interface FieldSchema {
  key: string
  label: string
  kind: FieldKind
  help?: string
  placeholder?: string
  required?: boolean
  min?: number
  max?: number
  step?: number
  rows?: number
  options?: FieldOption[]
  itemLabel?: string
  itemFields?: FieldSchema[]
  defaultValue?: InfoValue
  fullWidth?: boolean
}

export interface ResourceEditorDefinition {
  id: string
  title: string
  description: string
  resource: string
  mode: 'singleton' | 'collection'
  fields: FieldSchema[]
  defaultValue: InfoRecord
  titleKeys?: string[]
  reorder?: boolean
  bootstrapKey?: string
}

export interface InfoSectionDefinition {
  id: string
  title: string
  shortTitle: string
  description: string
  group: 'Overview' | 'Landing content' | 'Engagement' | 'System' | 'Advanced'
  editors?: ResourceEditorDefinition[]
  special?: 'overview' | 'analytics'
}

const text = (
  key: string,
  label: string,
  options: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  kind: 'text',
  defaultValue: '',
  ...options,
})

const textarea = (
  key: string,
  label: string,
  options: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  kind: 'textarea',
  rows: 4,
  fullWidth: true,
  defaultValue: '',
  ...options,
})

const url = (
  key: string,
  label: string,
  options: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  kind: 'url',
  placeholder: 'https://',
  defaultValue: '',
  ...options,
})

const image = (
  key: string,
  label: string,
  options: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  kind: 'image',
  fullWidth: true,
  defaultValue: '',
  ...options,
})

const number = (
  key: string,
  label: string,
  options: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  kind: 'number',
  defaultValue: 0,
  ...options,
})

const toggle = (
  key: string,
  label: string,
  options: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  kind: 'boolean',
  defaultValue: false,
  ...options,
})

const select = (
  key: string,
  label: string,
  values: string[],
  options: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  kind: 'select',
  options: values.map((value) => ({
    label: value
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    value,
  })),
  defaultValue: values[0] || '',
  ...options,
})

const list = (
  key: string,
  label: string,
  itemFields: FieldSchema[],
  options: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  kind: 'list',
  itemFields,
  itemLabel: 'Item',
  defaultValue: [],
  fullWidth: true,
  ...options,
})

const object = (
  key: string,
  label: string,
  itemFields: FieldSchema[],
  options: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  kind: 'object',
  itemFields,
  defaultValue: {},
  fullWidth: true,
  ...options,
})

const pair = (
  base: string,
  label: string,
  kind: 'text' | 'textarea' = 'text',
  options: Partial<FieldSchema> = {},
): FieldSchema[] => {
  const factory = kind === 'textarea' ? textarea : text
  return [
    factory(`${base}_en`, `${label} · EN`, options),
    factory(`${base}_ru`, `${label} · RU`, options),
  ]
}

const orderAndActive: FieldSchema[] = [
  number('order', 'Display order', { min: 0, step: 1 }),
  toggle('is_active', 'Visible on landing', { defaultValue: true }),
]

const socialFields: FieldSchema[] = [
  select('platform', 'Platform', [
    'twitter',
    'telegram',
    'discord',
    'github',
    'linkedin',
    'youtube',
    'instagram',
    'medium',
    'reddit',
    'facebook',
  ]),
  url('url', 'Profile URL', { required: true }),
  toggle('enabled', 'Enabled', { defaultValue: true }),
  number('order', 'Order', { min: 0, step: 1 }),
]

const localizedStatFields: FieldSchema[] = [
  text('value', 'Value', { required: true }),
  ...pair('label', 'Label'),
  text('change', 'Change / trend'),
]

const settings = (
  id: string,
  title: string,
  description: string,
  resource: string,
  fields: FieldSchema[],
  bootstrapKey?: string,
): ResourceEditorDefinition => ({
  id,
  title,
  description,
  resource,
  mode: 'singleton',
  fields,
  defaultValue: {},
  bootstrapKey,
})

const collection = (
  id: string,
  title: string,
  description: string,
  resource: string,
  fields: FieldSchema[],
  titleKeys: string[],
  reorder = true,
  bootstrapKey?: string,
): ResourceEditorDefinition => ({
  id,
  title,
  description,
  resource,
  mode: 'collection',
  fields,
  defaultValue: {},
  titleKeys,
  reorder,
  bootstrapKey,
})

const heroSettingsFields: FieldSchema[] = [
  ...pair('badge', 'Badge'),
  ...pair('title_line1', 'Title line 1', 'text', { required: true }),
  ...pair('title_line2', 'Title line 2', 'text', { required: true }),
  ...pair('subtitle', 'Subtitle', 'textarea'),
  url('invite_redirect_url', 'Invite redirect URL', {
    help: 'Destination used after a successful invite flow.',
  }),
  image('background_image', 'Background image'),
  list('stats', 'Hero stats', localizedStatFields, {
    itemLabel: 'Stat',
    help: 'Compact proof points displayed below the hero actions.',
  }),
]

const heroButtonFields: FieldSchema[] = [
  ...pair('text', 'Button text', 'text', { required: true }),
  text('link', 'Link', { required: true, placeholder: '#about or https://' }),
  toggle('primary', 'Primary button', { defaultValue: false }),
  toggle('use_invite_modal', 'Open invite modal', { defaultValue: false }),
  ...orderAndActive,
]

const aboutFields: FieldSchema[] = [
  ...pair('badge', 'Badge'),
  ...pair('title', 'Title', 'text', { required: true }),
  ...pair('title_highlight', 'Highlighted title'),
  ...pair('subtitle', 'Subtitle', 'textarea'),
  ...pair('description', 'Description', 'textarea', { required: true, rows: 6 }),
  ...pair('social_engagement', 'Social engagement', 'textarea'),
  ...pair('data_analytics', 'Data analytics', 'textarea'),
  ...pair('seamless_access', 'Seamless access', 'textarea'),
  ...pair('description_end', 'Closing paragraph', 'textarea'),
  ...pair('whitepaper_button_text', 'Whitepaper button'),
  url('whitepaper_url', 'Whitepaper URL'),
  list(
    'features',
    'Feature cards',
    [
      text('icon', 'Icon key / emoji'),
      ...pair('title', 'Title', 'text', { required: true }),
      ...pair('description', 'Description', 'textarea'),
      text('color', 'Color token / gradient'),
    ],
    { itemLabel: 'Feature' },
  ),
]

const utilityFields: FieldSchema[] = [
  ...pair('title', 'Title', 'text', { required: true }),
  ...pair('subtitle', 'Subtitle'),
  select('icon_type', 'Icon type', [
    'chart',
    'arena',
    'exchange',
    'lightning',
    'users',
    'rocket',
    'shield',
    'globe',
    'star',
    'custom',
  ]),
  image('custom_icon_url', 'Custom icon'),
  image('image_url', 'Cover image'),
  ...pair('short_description', 'Short description', 'textarea'),
  ...pair('full_description', 'Full description', 'textarea', { rows: 7 }),
  list(
    'features',
    'Features',
    [
      ...pair('title', 'Title', 'text', { required: true }),
      ...pair('description', 'Description', 'textarea'),
    ],
    { itemLabel: 'Feature' },
  ),
  list('stats', 'Stats', localizedStatFields, { itemLabel: 'Stat' }),
  text('gradient', 'Text gradient'),
  text('bg_gradient', 'Background gradient'),
  text('button_gradient', 'Button gradient'),
  ...pair('button_text', 'Button text'),
  url('button_link', 'Button link'),
  ...orderAndActive,
]

const platformModuleFields: FieldSchema[] = [
  text('icon', 'Icon'),
  ...pair('name', 'Name', 'text', { required: true }),
  text('count', 'Count'),
  ...pair('label', 'Label'),
  text('color', 'Color / gradient'),
  number('order', 'Order', { min: 0, step: 1 }),
  toggle('is_active', 'Visible', { defaultValue: true }),
]

const platformFields: FieldSchema[] = [
  object('community', 'Community stat', localizedStatFields),
  object('visits', 'Visits stat', localizedStatFields),
  object('projects', 'Projects stat', localizedStatFields),
  object('alerts', 'Alerts stat', localizedStatFields),
  ...pair('section_badge', 'Section badge'),
  ...pair('section_title', 'Section title', 'text', { required: true }),
  ...pair('section_intro', 'Section introduction', 'textarea'),
  list('service_modules', 'Service modules', platformModuleFields, {
    itemLabel: 'Module',
  }),
  list(
    'services_list',
    'Services list',
    [
      text('num', 'Number / key'),
      ...pair('title', 'Title', 'text', { required: true }),
      ...pair('description', 'Description', 'textarea'),
      number('order', 'Order', { min: 0 }),
      toggle('is_active', 'Visible', { defaultValue: true }),
    ],
    { itemLabel: 'Service' },
  ),
  list('bottom_stats', 'Bottom stats', [
    text('value', 'Value', { required: true }),
    ...pair('label', 'Label'),
    ...pair('description', 'Description', 'textarea'),
  ], {
    itemLabel: 'Stat',
  }),
  ...pair('cta_button_text', 'CTA button text'),
  url('cta_button_url', 'CTA URL'),
  ...pair('cta_left_text', 'CTA supporting text', 'textarea'),
]

const nftFields: FieldSchema[] = [
  toggle('enabled', 'Enable NFT mechanics', { defaultValue: true }),
  ...pair('section_badge', 'Section badge'),
  ...pair('section_title', 'Section title', 'text', { required: true }),
  ...pair('section_description', 'Section description', 'textarea'),
  ...pair('drawer_title', 'Drawer title'),
  ...pair('drawer_description', 'Drawer description', 'textarea'),
  url('universe_url', 'Fomo Universe URL'),
  ...pair('button_text', 'Button text'),
  number('price_per_box', 'Price per box', { min: 0, step: 0.01 }),
  number('discount_threshold', 'Discount quantity threshold', { min: 0, step: 1 }),
  number('discount_percent', 'Discount percent', { min: 0, max: 100, step: 0.1 }),
  number('total_supply', 'Total supply', { min: 0, step: 1 }),
  number('max_per_wallet', 'Maximum per wallet', { min: 0, step: 1 }),
  text('currency', 'Currency', { defaultValue: 'USDT' }),
  text('contract_address', 'Contract address'),
  text('network', 'Network'),
]

const drawerFields: FieldSchema[] = [
  ...pair('title', 'Title', 'text', { required: true }),
  ...pair('description', 'Description', 'textarea'),
  url('link', 'Destination URL'),
  image('image_url', 'Card image'),
  ...orderAndActive,
]

const roadmapTaskFields: FieldSchema[] = [
  ...pair('title', 'Task title', 'text', { required: true }),
  ...pair('description', 'Description', 'textarea'),
  select('status', 'Status', ['upcoming', 'progress', 'done'], {
    defaultValue: 'upcoming',
  }),
  text('category', 'Category'),
  ...orderAndActive,
]

const evolutionLevelFields: FieldSchema[] = [
  ...pair('rank', 'Rank', 'text', { required: true }),
  ...pair('next_level', 'Next level'),
  number('fomo_score_min', 'Minimum FOMO score', { min: 0 }),
  number('fomo_score_max', 'Maximum FOMO score', { min: 0 }),
  ...pair('description', 'Description', 'textarea'),
  ...pair('back_title', 'Back title'),
  ...pair('back_description', 'Back description', 'textarea'),
  select('animation_type', 'Animation', [
    'stellar',
    'cosmic',
    'galactic',
    'celestial',
    'astral',
    'universal',
    'pulse',
    'nebula',
    'supernova',
    'blackhole',
    'aurora',
    'meteor',
    'constellation',
    'vortex',
    'crystal',
  ]),
  { ...text('gradient_from', 'Gradient start'), kind: 'color' },
  { ...text('gradient_to', 'Gradient end'), kind: 'color' },
  ...orderAndActive,
]

const evolutionBadgeFields: FieldSchema[] = [
  ...pair('name', 'Badge name', 'text', { required: true }),
  text('icon', 'Icon', { required: true }),
  number('xp_requirement', 'XP requirement', { min: 0 }),
  ...pair('condition', 'Unlock condition', 'textarea'),
  ...pair('description', 'Description', 'textarea'),
  ...pair('back_title', 'Back title'),
  ...pair('back_description', 'Back description', 'textarea'),
  select('animation_type', 'Animation', [
    'pioneer',
    'onboarding',
    'reviewer',
    'predictor',
    'streak',
    'maker',
    'p2p',
    'community',
    'singularity',
    'trophy',
    'medal',
    'crown',
    'diamond',
    'lightning',
    'rocket',
    'heart',
    'gem',
  ]),
  { ...text('gradient_from', 'Gradient start'), kind: 'color' },
  { ...text('gradient_to', 'Gradient end'), kind: 'color' },
  ...orderAndActive,
]

const teamFields: FieldSchema[] = [
  ...pair('name', 'Name', 'text', { required: true }),
  ...pair('position', 'Position', 'text', { required: true }),
  ...pair('bio', 'Biography', 'textarea'),
  image('image_url', 'Portrait'),
  select('member_type', 'Member type', ['main', 'team_member']),
  {
    key: 'social_links',
    label: 'Social links',
    kind: 'keyValue',
    help: 'Platform key mapped to a public profile URL.',
    defaultValue: {},
    fullWidth: true,
  },
  {
    key: 'displayed_socials',
    label: 'Displayed social keys',
    kind: 'tags',
    help: 'Comma-separated platform keys.',
    defaultValue: [],
  },
  ...orderAndActive,
]

const partnerFields: FieldSchema[] = [
  ...pair('name', 'Name', 'text', { required: true }),
  ...pair('description', 'Description', 'textarea'),
  image('image_url', 'Logo'),
  image('image_url_hover', 'Hover logo'),
  url('link', 'Partner URL'),
  select('category', 'Category', ['partners', 'media', 'portfolio']),
  ...orderAndActive,
]

const communityFields: FieldSchema[] = [
  ...pair('section_badge', 'Section badge'),
  ...pair('title', 'Title', 'text', { required: true }),
  ...pair('description', 'Description', 'textarea'),
  list(
    'features',
    'Community features',
    [
      text('icon', 'Icon'),
      ...pair('title', 'Title', 'text', { required: true }),
      ...pair('description', 'Description', 'textarea'),
      number('order', 'Order', { min: 0 }),
      toggle('is_active', 'Visible', { defaultValue: true }),
    ],
    { itemLabel: 'Feature' },
  ),
  list('socials', 'Social channels', socialFields, { itemLabel: 'Channel' }),
  toggle('subscribe_enabled', 'Show subscription CTA'),
  ...pair('subscribe_title', 'Subscription title'),
]

const footerFields: FieldSchema[] = [
  text('company_name', 'Company name'),
  ...pair('company_description', 'Company description', 'textarea'),
  text('company_address', 'Address'),
  text('company_phone', 'Phone'),
  text('company_email', 'Email'),
  list('social_media', 'Social media', socialFields, { itemLabel: 'Social link' }),
  list(
    'navigation_sections',
    'Navigation sections',
    [
      ...pair('title', 'Section title', 'text', { required: true }),
      number('order', 'Order', { min: 0 }),
      list(
        'links',
        'Links',
        [
          ...pair('name', 'Link name', 'text', { required: true }),
          url('url', 'URL', { required: true }),
          number('order', 'Order', { min: 0 }),
          toggle('is_active', 'Visible', { defaultValue: true }),
        ],
        { itemLabel: 'Link' },
      ),
    ],
    { itemLabel: 'Navigation section' },
  ),
  ...pair('cta_button_text', 'CTA button'),
  url('cta_button_url', 'CTA URL'),
  list(
    'legal_pages',
    'Legal pages',
    [
      text('key', 'Page key', { required: true }),
      ...pair('title', 'Page title', 'text', { required: true }),
      ...pair('content', 'Page content', 'textarea', { rows: 12 }),
      number('order', 'Order', { min: 0 }),
      toggle('is_active', 'Published', { defaultValue: true }),
    ],
    { itemLabel: 'Legal page' },
  ),
  ...pair('copyright_text', 'Copyright text'),
  ...pair('legal_disclaimer', 'Legal disclaimer', 'textarea'),
  ...pair('made_by_text', 'Made by text'),
  url('made_by_url', 'Made by URL'),
]

const arenaFields: FieldSchema[] = [
  ...pair('title', 'Title', 'text', { required: true }),
  ...pair('description', 'Description', 'textarea'),
  text('asset', 'Asset symbol', { required: true, placeholder: 'BTC' }),
  select('prediction_type', 'Prediction type', ['price', 'direction', 'range']),
  number('target_value', 'Target value', { step: 0.01 }),
  select('target_direction', 'Direction', ['up', 'down']),
  { ...text('end_date', 'End date'), kind: 'datetime' },
  number('prize_pool', 'Prize pool', { min: 0, step: 0.01 }),
  select('status', 'Status', ['active', 'closed', 'resolved']),
  text('result', 'Result'),
]

const influenceFields: FieldSchema[] = [
  text('name', 'Name', { required: true }),
  text('handle', 'Handle', { required: true, placeholder: '@handle' }),
  select('platform', 'Platform', ['twitter', 'youtube', 'telegram']),
  select('category', 'Category', ['crypto', 'nft', 'defi', 'gaming']),
  number('followers_count', 'Followers', { min: 0 }),
  number('engagement_rate', 'Engagement rate', { min: 0, step: 0.01 }),
  number('influence_score', 'Influence score', { min: 0, step: 0.01 }),
  image('profile_image', 'Profile image'),
  toggle('verified', 'Verified'),
  ...pair('description', 'Description', 'textarea'),
  {
    key: 'tags',
    label: 'Tags',
    kind: 'tags',
    defaultValue: [],
  },
]

const earlylandFields: FieldSchema[] = [
  ...pair('name', 'Name', 'text', { required: true }),
  ...pair('description', 'Description', 'textarea'),
  select('category', 'Category', ['token', 'nft', 'defi', 'gaming']),
  select('status', 'Status', ['upcoming', 'active', 'ended']),
  { ...text('launch_date', 'Launch date'), kind: 'datetime' },
  { ...text('end_date', 'End date'), kind: 'datetime' },
  number('min_investment', 'Minimum investment', { min: 0, step: 0.01 }),
  number('max_investment', 'Maximum investment', { min: 0, step: 0.01 }),
  text('expected_roi', 'Expected ROI'),
  select('risk_level', 'Risk level', ['low', 'medium', 'high']),
  url('project_url', 'Project URL'),
  url('whitepaper_url', 'Whitepaper URL'),
  image('image_url', 'Project image'),
  {
    key: 'tags',
    label: 'Tags',
    kind: 'tags',
    defaultValue: [],
  },
  toggle('featured', 'Featured'),
  number('order', 'Order', { min: 0 }),
]

const p2pFields: FieldSchema[] = [
  ...pair('title', 'Title', 'text', { required: true }),
  ...pair('description', 'Description', 'textarea'),
  text('seller_address', 'Seller wallet', { required: true }),
  text('buyer_address', 'Buyer wallet'),
  select('asset_type', 'Asset type', ['token', 'nft']),
  text('asset_name', 'Asset name', { required: true }),
  number('asset_amount', 'Asset amount', { min: 0, step: 0.000001 }),
  number('price', 'Price', { min: 0, step: 0.000001 }),
  text('currency', 'Currency', { defaultValue: 'USDT' }),
  select('status', 'Status', ['open', 'pending', 'completed', 'cancelled']),
  text('escrow_address', 'Escrow address'),
]

export const infoSections: InfoSectionDefinition[] = [
  {
    id: 'overview',
    title: 'Landing overview',
    shortTitle: 'Overview',
    description: 'Publishing health, resource coverage, and a live preview shortcut.',
    group: 'Overview',
    special: 'overview',
  },
  {
    id: 'navigation',
    title: 'Navigation',
    shortTitle: 'Navigation',
    description: 'Header links, anchors, ordering, icons, and visibility.',
    group: 'Landing content',
    editors: [
      collection(
        'navigation-items',
        'Navigation items',
        'Links rendered in the landing header.',
        'navigation-items',
        [
          text('key', 'Stable key', { required: true, placeholder: 'utilities' }),
          ...pair('label', 'Label', 'text', { required: true }),
          text('href', 'Anchor or URL', { required: true, placeholder: '#utilities' }),
          text('icon', 'Icon key'),
          ...orderAndActive,
        ],
        ['label_en', 'label_ru', 'key'],
        true,
        'navigation_items',
      ),
    ],
  },
  {
    id: 'hero',
    title: 'Hero',
    shortTitle: 'Hero',
    description: 'The first-screen message, calls to action, invite flow, and proof points.',
    group: 'Landing content',
    editors: [
      settings(
        'hero-settings',
        'Hero settings',
        'Primary heading, media, invite redirect, and stats.',
        'hero-settings',
        heroSettingsFields,
        'hero_settings',
      ),
      collection(
        'hero-buttons',
        'Hero actions',
        'Buttons are managed independently for reliable ordering.',
        'hero-buttons',
        heroButtonFields,
        ['text_en', 'text_ru'],
        true,
        'hero_buttons',
      ),
    ],
  },
  {
    id: 'about',
    title: 'About FOMO',
    shortTitle: 'About',
    description: 'Positioning copy, whitepaper link, and feature cards.',
    group: 'Landing content',
    editors: [
      settings(
        'about-settings',
        'About section',
        'All content used by the About block.',
        'about-settings',
        aboutFields,
        'about_settings',
      ),
    ],
  },
  {
    id: 'utilities',
    title: 'Utilities',
    shortTitle: 'Utilities',
    description: 'Section copy, product cards, features, stats, images, and quick links.',
    group: 'Landing content',
    editors: [
      settings(
        'utilities-settings',
        'Section heading',
        'Titles and supporting text around the utility cards.',
        'utilities-settings',
        [
          ...pair('section_badge', 'Section badge'),
          ...pair('section_title', 'Section title', 'text', { required: true }),
          ...pair('section_description', 'Section description', 'textarea'),
          ...pair('bottom_hint', 'Bottom hint'),
          ...pair('features_title', 'Features label'),
          ...pair('details_label', 'Details label'),
        ],
        'utilities_settings',
      ),
      collection(
        'utilities-items',
        'Utility cards',
        'Complete product cards displayed in the Utilities carousel.',
        'utilities',
        utilityFields,
        ['title_en', 'title_ru'],
        true,
        'utilities',
      ),
      collection(
        'utility-nav-buttons',
        'Utility navigation buttons',
        'Quick navigation shown near the main header.',
        'utility-nav-buttons',
        [
          ...pair('label', 'Label', 'text', { required: true }),
          text('key', 'Stable key', {
            required: true,
            placeholder: 'crypto, core, or utility',
            help: 'Stable key used by the landing navigation.',
          }),
          text('url', 'Anchor or URL', { required: true, placeholder: '#utilities' }),
          ...orderAndActive,
        ],
        ['label_en', 'label_ru', 'key'],
        true,
        'utility_nav_buttons',
      ),
    ],
  },
  {
    id: 'platform',
    title: 'Platform',
    shortTitle: 'Platform',
    description: 'Platform metrics, service modules, supporting lists, and CTA.',
    group: 'Landing content',
    editors: [
      settings(
        'platform-settings',
        'Platform overview',
        'All arrays are reorderable directly inside the settings form.',
        'platform-settings',
        platformFields,
        'platform_settings',
      ),
    ],
  },
  {
    id: 'universe',
    title: 'NFT / Fomo Universe',
    shortTitle: 'Fomo Universe',
    description: 'Fomo Universe section copy, drawer labels, and destination.',
    group: 'Landing content',
    editors: [
      settings(
        'nft-mechanics-settings',
        'Universe settings',
        'Content for the NFT mechanics and Fomo Universe block.',
        'nft-mechanics-settings',
        nftFields,
        'nft_mechanics_settings',
      ),
    ],
  },
  {
    id: 'ecosystem',
    title: 'Ecosystem',
    shortTitle: 'Ecosystem',
    description: 'Drawer cards that introduce products across the ecosystem.',
    group: 'Landing content',
    editors: [
      collection(
        'drawer-cards',
        'Ecosystem cards',
        'Images should use a consistent 4:3 crop.',
        'drawer-cards',
        drawerFields,
        ['title_en', 'title_ru'],
        true,
        'drawer_cards',
      ),
    ],
  },
  {
    id: 'roadmap',
    title: 'Roadmap',
    shortTitle: 'Roadmap',
    description: 'Section settings and ordered delivery milestones.',
    group: 'Landing content',
    editors: [
      settings(
        'roadmap-settings',
        'Roadmap heading',
        'Title and supporting introduction.',
        'roadmap',
        [
          ...pair('badge', 'Section badge'),
          ...pair('title', 'Section title', 'text', { required: true }),
          ...pair('subtitle', 'Section subtitle', 'textarea'),
        ],
        'roadmap',
      ),
      collection(
        'roadmap-tasks',
        'Roadmap tasks',
        'Milestones, completion state, and public order.',
        'roadmap/tasks',
        roadmapTaskFields,
        ['title_en', 'title_ru'],
        true,
      ),
    ],
  },
  {
    id: 'evolution',
    title: 'Evolution',
    shortTitle: 'Evolution',
    description: 'FOMO score levels and collectible achievement badges.',
    group: 'Engagement',
    editors: [
      collection(
        'evolution-levels',
        'Evolution levels',
        'Score ranges, card copy, animation, and visual identity.',
        'evolution-levels',
        evolutionLevelFields,
        ['rank_en', 'rank_ru'],
        true,
        'evolution_levels',
      ),
      collection(
        'evolution-badges',
        'Evolution badges',
        'Unlock requirements, icon, back copy, animation, and gradient.',
        'evolution-badges',
        evolutionBadgeFields,
        ['name_en', 'name_ru'],
        true,
        'evolution_badges',
      ),
    ],
  },
  {
    id: 'team',
    title: 'Team',
    shortTitle: 'Team',
    description: 'Core members, contributors, biographies, portraits, and social profiles.',
    group: 'Engagement',
    editors: [
      collection(
        'team-members',
        'Team members',
        'Use square portraits for predictable landing crops.',
        'team-members',
        teamFields,
        ['name_en', 'name_ru', 'position_en'],
        true,
        'team_members',
      ),
    ],
  },
  {
    id: 'partners',
    title: 'Partners & media',
    shortTitle: 'Partners',
    description: 'Partner, media, and portfolio logos with destinations.',
    group: 'Engagement',
    editors: [
      collection(
        'partners',
        'Partner entries',
        'Use PNG, JPEG, WebP, or GIF assets up to 5 MB.',
        'partners',
        partnerFields,
        ['name_en', 'name_ru'],
        true,
        'partners',
      ),
    ],
  },
  {
    id: 'community',
    title: 'Community',
    shortTitle: 'Community',
    description: 'Community proposition, feature cards, social channels, and subscription CTA.',
    group: 'Engagement',
    editors: [
      settings(
        'community-settings',
        'Community settings',
        'Public community content and outbound links.',
        'community-settings',
        communityFields,
        'community_settings',
      ),
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    shortTitle: 'FAQ',
    description: 'Localized questions and answers with public ordering.',
    group: 'Engagement',
    editors: [
      collection(
        'faq',
        'FAQ items',
        'Answers support plain text and safe line breaks.',
        'faq',
        [
          ...pair('question', 'Question', 'text', { required: true }),
          ...pair('answer', 'Answer', 'textarea', { required: true, rows: 7 }),
          ...orderAndActive,
        ],
        ['question_en', 'question_ru'],
        true,
        'faq',
      ),
    ],
  },
  {
    id: 'footer',
    title: 'Footer & legal',
    shortTitle: 'Footer',
    description: 'Company contacts, navigation, social channels, CTA, and legal pages.',
    group: 'System',
    editors: [
      settings(
        'footer-settings',
        'Footer settings',
        'Nested sections and legal pages can be reordered in place.',
        'footer-settings',
        footerFields,
        'footer_settings',
      ),
    ],
  },
  {
    id: 'cookies',
    title: 'Cookie consent',
    shortTitle: 'Cookies',
    description: 'Consent banner copy, controls, and privacy destination.',
    group: 'System',
    editors: [
      settings(
        'cookie-consent-settings',
        'Cookie consent',
        'Tracking behavior must still be enforced by the landing runtime.',
        'cookie-consent-settings',
        [
          toggle('enabled', 'Enable consent banner', { defaultValue: true }),
          ...pair('title', 'Title', 'text', { required: true }),
          ...pair('description', 'Description', 'textarea', { required: true }),
          ...pair('accept_button_text', 'Accept button'),
          ...pair('decline_button_text', 'Decline button'),
          url('cookie_policy_url', 'Cookie policy URL'),
          toggle('show_decline_button', 'Show decline button', { defaultValue: true }),
        ],
        'cookie_consent_settings',
      ),
    ],
  },
  {
    id: 'seo',
    title: 'SEO & sharing',
    shortTitle: 'SEO',
    description: 'Search metadata, canonical URL, social preview, and robots directives.',
    group: 'System',
    editors: [
      settings(
        'seo-settings',
        'SEO settings',
        'These values populate landing metadata and structured discovery surfaces.',
        'seo-settings',
        [
          text('site_title', 'Site title · EN', { required: true }),
          text('site_title_ru', 'Site title · RU'),
          textarea('site_description', 'Site description · EN', { required: true }),
          textarea('site_description_ru', 'Site description · RU'),
          {
            key: 'site_keywords',
            label: 'Keywords',
            kind: 'tags',
            help: 'Comma-separated keywords; avoid keyword stuffing.',
            defaultValue: [],
          },
          {
            key: 'site_keywords_ru',
            label: 'Keywords · RU',
            kind: 'tags',
            defaultValue: [],
          },
          text('og_title', 'Open Graph title'),
          textarea('og_description', 'Open Graph description'),
          image('og_image', 'Open Graph image'),
          select('twitter_card', 'Twitter card', ['summary_large_image', 'summary']),
          url('canonical_url', 'Canonical URL'),
          text('robots', 'Robots directive', {
            defaultValue: 'index,follow',
            placeholder: 'index,follow',
          }),
        ],
        'seo_settings',
      ),
    ],
  },
  {
    id: 'analytics',
    title: 'Landing analytics',
    shortTitle: 'Analytics',
    description: 'Traffic, audience mix, conversions, geography, and acquisition sources.',
    group: 'System',
    special: 'analytics',
  },
  {
    id: 'arena',
    title: 'Arena predictions',
    shortTitle: 'Arena',
    description: 'Prediction campaigns migrated from the FOMO-INFO service.',
    group: 'Advanced',
    editors: [
      collection(
        'arena-predictions',
        'Predictions',
        'Resolve a prediction only after its result is final.',
        'arena-predictions',
        arenaFields,
        ['title_en', 'asset'],
        false,
      ),
    ],
  },
  {
    id: 'influence',
    title: 'Influence entities',
    shortTitle: 'Influence',
    description: 'Influencer profiles, reach, engagement, and verification.',
    group: 'Advanced',
    editors: [
      collection(
        'influence-entities',
        'Influence directory',
        'Scores can be imported or curated by an administrator.',
        'influence-entities',
        influenceFields,
        ['name', 'handle'],
        false,
      ),
    ],
  },
  {
    id: 'earlyland',
    title: 'Earlyland opportunities',
    shortTitle: 'Earlyland',
    description: 'Early opportunities, risk information, dates, and destinations.',
    group: 'Advanced',
    editors: [
      collection(
        'earlyland-opportunities',
        'Opportunities',
        'Keep investment claims factual and current.',
        'earlyland-opportunities',
        earlylandFields,
        ['name_en', 'name_ru'],
        true,
      ),
    ],
  },
  {
    id: 'p2p',
    title: 'P2P deals',
    shortTitle: 'P2P',
    description: 'Migrated P2P offers and their operational status.',
    group: 'Advanced',
    editors: [
      collection(
        'p2p-deals',
        'P2P deals',
        'Editing does not replace escrow or ownership validation in the backend.',
        'p2p-deals',
        p2pFields,
        ['title_en', 'asset_name'],
        false,
      ),
    ],
  },
]

export const getInfoSection = (id: string): InfoSectionDefinition =>
  infoSections.find((section) => section.id === id) || infoSections[0]

export const buildDefaultRecord = (fields: FieldSchema[]): InfoRecord =>
  fields.reduce<InfoRecord>((record, field) => {
    if (field.defaultValue !== undefined) {
      record[field.key] = field.defaultValue
    } else if (field.kind === 'list' || field.kind === 'tags') {
      record[field.key] = []
    } else if (field.kind === 'object' || field.kind === 'keyValue') {
      record[field.key] = buildDefaultRecord(field.itemFields || [])
    } else if (field.kind === 'boolean') {
      record[field.key] = false
    } else if (field.kind === 'number') {
      record[field.key] = 0
    } else {
      record[field.key] = ''
    }
    return record
  }, {})

export const sanitizeRecord = (
  source: InfoRecord,
  fields: FieldSchema[],
): InfoRecord =>
  fields.reduce<InfoRecord>((record, field) => {
    const value = source[field.key]

    if (field.kind === 'list' && Array.isArray(value)) {
      record[field.key] = value.map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return item
        const sanitized = sanitizeRecord(item as InfoRecord, field.itemFields || [])
        if ('order' in sanitized) sanitized.order = index
        return sanitized
      })
      return record
    }

    if (field.kind === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
      record[field.key] = sanitizeRecord(value as InfoRecord, field.itemFields || [])
      return record
    }

    if (value !== undefined) record[field.key] = value
    return record
  }, {})
