export interface INavItem {
  name: string;
  link: string;
  status: boolean;
  isUpdate: boolean;
  external?: boolean;
  links?: INavItem[];
}

export const CryptoNavList: INavItem[] = [
  {
    name: "Market",
    link: '/',
    status: true,
    isUpdate: false
  },
  {
    name: "Funding Feed",
    link: '/crypto/funding-feed',
    status: true,
    isUpdate: false
  },
  {
    name: "Echo",
    link: '/crypto/projects',
    status: true,
    isUpdate: false
  },
  {
    name: "Eralash",
    link: '/crypto/eralash',
    status: true,
    isUpdate: false
  },
  {
    name: "Backer",
    link: '/crypto/backers',
    status: true,
    isUpdate: false
  },
  {
    name: "Unlocking",
    link: '/crypto/unlocking',
    status: true,
    isUpdate: false
  },
]

export const UtilityNavList: INavItem[] = [
  {
    name: 'Bazaar',
    link: '',
    status: true,
    isUpdate: false,
    links: [
      {
        name: 'OTC/P2P Market',
        link: '/utility',
        status: true,
        isUpdate: false,
      },
      {
        name: 'NFT Market',
        link: '/utility/market',
        status: true,
        isUpdate: false,
      },
      {
        name: 'My Deals',
        link: '/utility/my-deals',
        status: true,
        isUpdate: false,
      },
      {
        name: 'Top Members',
        link: '/utility/top-members',
        status: true,
        isUpdate: false,
      },
    ],
  },

  {
    name: "EarlyLand",
    link: '/crypto/earlyland',
    status: true,
    isUpdate: false,
  },

  {
    name: 'Launchpad',
    link: '/utility/launchpad',
    status: true,
    isUpdate: false,
  },
  {
    name: 'Chat AI',
    link: '/utility/ai',
    status: true,
    isUpdate: false,
  },
  {
    name: 'Parsing',
    link: '/utility/parsing',
    status: false,
    isUpdate: false,
  },
  {
    name: 'X Rank',
    link: '/utility/influence',
    status: false,
    isUpdate: false,
  },
  // {
  //   name: 'Arena',
  //   link: '/utility/arena',
  //   status: true,
  //   isUpdate: false,
  // },

  // {
  //   name: 'Prime',
  //   link: '/utility/prime',
  //   status: false,
  //   isUpdate: false,
  // },
  {
    name: 'Buzz',
    link: '/utility/news',
    status: true,
    isUpdate: false,
  },
];

export const CoreNavList: INavItem[] = [
  {
    name: 'My Profile',
    link: '/core/profile',
    status: true,
    isUpdate: false,
  },
  {
    name: "Fomies",
    link: '/crypto/fomies',
    status: true,
    isUpdate: false,
  },
  {
    name: 'Spaceport',
    link: '/core/spaceport',
    status: true,
    isUpdate: false,
  },
  {
    name: 'Portfolio',
    link: '/core/portfolio',
    status: true,
    isUpdate: false,
  },
  // {
  //   name: 'Board',
  //   link: '/core/board',
  //   status: true,
  //   isUpdate: false,
  // },
  // {
  //   name: 'Tasks',
  //   link: '/core/tasks',
  //   status: true,
  //   isUpdate: false,
  // },
  // {
  //   name: 'Vote',
  //   link: '/core/vote',
  //   status: false,
  //   isUpdate: false,
  // },
  // {
  //   name: 'Calendar',
  //   link: '/core/calendar',
  //   status: true,
  //   isUpdate: false,
  // },
  // {
  //   name: 'Watchlist',
  //   link: '/core/watchlist',
  //   status: true,
  //   isUpdate: false,
  // },
]

export const ExploreNavList: INavItem[] = [
  // Intel is now a direct link. Its destination URL is configured from the
  // CRM admin panel (Content) and served via the layout config (layout.intelUrl).
  {
    name: 'Intel',
    link: '/',
    status: true,
    isUpdate: false,
    external: true,
  },
]
