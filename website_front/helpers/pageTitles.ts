import { cleanText, SITE_NAME } from "./seo";

const withBrand = (title: string): string => `${title} | ${SITE_NAME}`;

const PAGE_TITLES: Record<string, string> = {
  "/": withBrand("Crypto Market Intelligence, Funding Rounds & Investor Analytics"),
  "/faq": withBrand("FAQ, Risks & Crypto Platform Help"),
  "/legal": withBrand("Legal Information, Risk Disclosure & Platform Terms"),
  "/updates": withBrand("Product Updates, Release Notes & Platform News"),
  "/portfolio/[id]": withBrand("Public Crypto Portfolio Performance & Asset Breakdown"),
  "/ref/[...slug]": withBrand("Join the FOMO Crypto Intelligence Platform"),

  "/crypto/[tab]": withBrand("Crypto Market Data, Projects & Investor Analytics"),
  "/crypto/projects": withBrand("Crypto Projects, Funding Rounds & Token Research"),
  "/crypto/projects/[id]": withBrand("Crypto Project Profile, Funding, Team & Tokenomics"),
  "/crypto/project/[id]": withBrand("Crypto Project Token Sale, Vesting & Funding Profile"),
  "/crypto/funds": withBrand("Crypto Funds, VC Portfolios, ROI & Investments"),
  "/crypto/persons": withBrand("Crypto Investors, Founders & Web3 People Profiles"),
  "/crypto/funding-feed": withBrand("Crypto Funding Rounds, Venture Deals & Investor Feed"),
  "/crypto/calendar": withBrand("Crypto Events Calendar, Unlocks & Funding Dates"),
  "/crypto/unlocking": withBrand("Token Unlocks Calendar, Vesting & Supply Events"),
  "/crypto/trending": withBrand("Trending Crypto Coins, Market Movers & FOMO Signals"),
  "/crypto/gainers": withBrand("Top Crypto Gainers Today, Prices & Market Signals"),
  "/crypto/recently": withBrand("Recently Added Crypto Coins, Listings & Market Data"),
  "/crypto/accumulation": withBrand("Crypto Accumulation Signals, Whale Activity & Market Data"),
  "/crypto/backers": withBrand("Crypto Backers, Funds & Investor Rankings"),
  "/crypto/watchlist": withBrand("Crypto Watchlist, Price Alerts & Market Tracking"),
  "/crypto/fomies": withBrand("Fomies Crypto Community, Rankings & Profiles"),
  "/crypto/fomies/[id]": withBrand("Fomies Profile, Activity, Portfolio & Network"),
  "/crypto/earlyland": withBrand("EarlyLand Crypto Research, Tasks & Project Boards"),
  "/crypto/earlyland/[id]": withBrand("Crypto Project EarlyLand Tasks, Feed & Research Board"),
  "/crypto/earlyland/calendar": withBrand("EarlyLand Crypto Calendar, Tasks & Project Events"),
  "/crypto/cave": withBrand("Crypto Cave, Hidden Drops & Community Access"),
  "/crypto/eralash": withBrand("Crypto Eralash, Market Stories & Web3 Updates"),
  "/crypto/card/[id]": withBrand("Crypto Project Card, Snapshot & Market Data"),

  "/market/[coingeckoId]": withBrand("Crypto Asset Price, Live Chart, Market Cap & FOMO Score"),
  "/echo/[slug]": withBrand("Crypto Project Echo, Token Sale, Funding & Vesting"),

  "/utility": withBrand("Crypto Utility Hub, Tools & Web3 Services"),
  "/utility/ai": withBrand("AI Crypto Research Tools & Market Intelligence"),
  "/utility/alpha-ai": withBrand("Alpha AI Crypto Signals & Research Assistant"),
  "/utility/arena": withBrand("Crypto Prediction Arena, Market Forecasts & Duels"),
  "/utility/arena/[id]": withBrand("Crypto Prediction Details, Odds & Market Forecast"),
  "/utility/dash": withBrand("Utility Dashboard, Crypto Tools & Workspace"),
  "/utility/ecosystem-graph": withBrand("Crypto Ecosystem Graph, Wallets & Project Connections"),
  "/utility/fomo-chat": withBrand("FOMO Chat, Crypto Discussions & Community Signals"),
  "/utility/influence": withBrand("Crypto Influence Network, Social Signals & Connections"),
  "/utility/influence/[network]/[id]": withBrand("Crypto Influence Profile, Audience & Network Analytics"),
  "/utility/market": withBrand("Web3 Marketplace, Collections, Orders & OTC Deals"),
  "/utility/market/[id]": withBrand("Marketplace Project Profile, Collection Stats & Deals"),
  "/utility/market/order/[id]": withBrand("Marketplace Order, NFT Listing & Deal Details"),
  "/utility/market/collection/[id]": withBrand("NFT Collection Market, Floor Price & Trading Activity"),
  "/utility/market/collection/nft/[id]": withBrand("NFT Item Price, Offers & Collection Activity"),
  "/utility/my-deals": withBrand("My Crypto Deals, OTC Orders & Marketplace Activity"),
  "/utility/news": withBrand("Crypto News, Market Updates & Web3 Research"),
  "/utility/news/[id]": withBrand("Crypto News Story, Market Update & Analysis"),
  "/utility/on-chain": withBrand("On-Chain Crypto Analytics & Wallet Intelligence"),
  "/utility/onchain": withBrand("On-Chain Analytics, Wallet Flows & Crypto Intelligence"),
  "/utility/onchain/[id]": withBrand("On-Chain Entity Profile, Wallet Activity & Flows"),
  "/utility/onchain/visualize": withBrand("On-Chain Visualization, Wallet Graphs & Flow Maps"),
  "/utility/otc": withBrand("Crypto OTC Market, P2P Deals & Web3 Services"),
  "/utility/otc/share_otc_market/[id]": withBrand("Shared OTC Market Deal, Terms & Crypto Asset Details"),
  "/utility/parcing": withBrand("Crypto Parsing, Sentiment Monitoring & Data Streams"),
  "/utility/parsing": withBrand("Crypto Parsing, Sentiment Monitoring & Data Streams"),
  "/utility/podcasts": withBrand("Crypto Podcasts, Web3 Interviews & Founder Stories"),
  "/utility/podcasts/[id]": withBrand("Crypto Podcast Episode, Web3 Interview & Insights"),
  "/utility/public": withBrand("Public Network, Crypto Connections & Social Graph"),
  "/utility/social": withBrand("Crypto Social Network, Accounts & Community Signals"),
  "/utility/social/[id]": withBrand("Social Network Profile, Crypto Connections & Signals"),
  "/utility/top-members": withBrand("Top FOMO Members, Rankings & Web3 Reputation"),

  "/nfts": withBrand("NFT Market, Collections, Minting & Web3 Assets"),
  "/nfts/project/[id]": withBrand("NFT Project Profile, Collection Data & Minting Info"),
  "/nfts/persons": withBrand("NFT People, Creators & Collector Profiles"),
  "/nfts/persons/[id]": withBrand("NFT Person Profile, Collection Network & Activity"),
  "/nfts/news": withBrand("NFT News, Market Updates & Collection Research"),
  "/nfts/news/[id]": withBrand("NFT News Story, Collection Update & Market Insight"),
  "/nfts/minting": withBrand("NFT Minting Calendar, Upcoming Drops & Launches"),
  "/nfts/minting/[id]": withBrand("NFT Minting Details, Drop Info & Launch Data"),
  "/nfts/calendar": withBrand("NFT Calendar, Drops, Minting & Collection Events"),
  "/nfts/watchlist": withBrand("NFT Watchlist, Collections & Market Tracking"),
  "/nfts/tasks": withBrand("NFT Tasks, Rewards & Community Activity"),
  "/nfts/cave": withBrand("NFT Cave, Hidden Drops & Community Access"),
  "/nfts/card/[id]": withBrand("NFT Card, Collection Snapshot & Market Data"),

  "/gemslab": withBrand("GemsLab Web3 Launchpad, NFT Access & Crypto Deals"),
  "/gemslab/project/[id]": withBrand("GemsLab Project Profile, Rounds & Allocation Details"),
  "/gemslab/publicrounds": withBrand("Public Crypto Rounds, Token Sales & Allocations"),
  "/gemslab/publicrounds/[id]": withBrand("Public Round Details, Token Sale & Allocation"),
  "/gemslab/publicrounds/sale/[id]": withBrand("Public Round Sale, Token Allocation & Checkout"),
  "/gemslab/earlyrounds": withBrand("Early Crypto Rounds, Private Deals & Allocations"),
  "/gemslab/earlyrounds/[id]": withBrand("Early Round Details, Private Deal & Allocation"),
  "/gemslab/earlyrounds/sale/[id]": withBrand("Early Round Sale, Allocation & Checkout"),
  "/gemslab/launch": withBrand("NFT Launchpad, Web3 Drops & Minting Events"),
  "/gemslab/launch/[id]": withBrand("NFT Launch Details, Minting Info & Project Access"),
  "/gemslab/launch/sale/[id]": withBrand("NFT Launch Sale, Minting & Checkout"),
  "/gemslab/accelerator/[id]": withBrand("GemsLab Accelerator Project, IDO & Launch Details"),
  "/gemslab/news": withBrand("GemsLab News, Launchpad Updates & Web3 Stories"),
  "/gemslab/news/[id]": withBrand("GemsLab News Story, Launchpad Update & Web3 Insight"),
  "/gemslab/market": withBrand("GemsLab Market, NFT Collections & Web3 Orders"),
  "/gemslab/leaderboard": withBrand("GemsLab Leaderboard, Rewards & Community Rankings"),
  "/gemslab/spaceport": withBrand("FOMO Spaceport, NFT Boxes, Fusion & Rewards"),
  "/gemslab/tasks": withBrand("GemsLab Tasks, Rewards & Community Missions"),

  "/earlyland": withBrand("EarlyLand Crypto Tasks, Boards & Project Research"),
  "/earlyland/project/[id]": withBrand("EarlyLand Project, Tasks, Feed & Research Board"),
  "/earlyland/compendium": withBrand("EarlyLand Compendium, Crypto Research & Project Notes"),
  "/earlyland/compendium/[id]": withBrand("EarlyLand Compendium Project, Notes & Research"),
  "/earlyland/feed": withBrand("EarlyLand Feed, Crypto Tasks & Project Updates"),
  "/earlyland/calendar": withBrand("EarlyLand Calendar, Tasks & Project Events"),
  "/earlyland/board": withBrand("EarlyLand Board, Tasks & Crypto Research Workflow"),
  "/earlyland/tasks": withBrand("EarlyLand Tasks, Rewards & Project Missions"),
  "/earlyland/cave": withBrand("EarlyLand Cave, Hidden Research & Community Access"),

  "/core/portfolio": withBrand("Crypto Portfolio, Asset Tracking & Performance Dashboard"),
  "/core/profile": withBrand("FOMO Profile, Wallet, Reputation & Settings"),
  "/core/watchlist": withBrand("FOMO Watchlist, Crypto Alerts & Tracking"),
  "/core/calendar": withBrand("FOMO Calendar, Crypto Events & Tasks"),
  "/core/board": withBrand("FOMO Board, Tasks & Research Workflow"),
  "/core/spaceport": withBrand("FOMO Spaceport, NFT Rewards & Progress"),
  "/core/vote": withBrand("FOMO Vote, Community Governance & Decisions"),
  "/core/fomo-chat": withBrand("FOMO Chat, Crypto Community & Discussions"),

  "/dashboard": withBrand("FOMO Dashboard, Crypto Market Overview & Analytics"),
  "/dashboard/markets": withBrand("Dashboard Markets, Crypto Data & Watchlists"),
  "/dashboard/backers": withBrand("Dashboard Backers, Funds & Investor Data"),
  "/dashboard/platforms": withBrand("Dashboard Platforms, Launchpads & Ecosystems"),
  "/dashboard/events": withBrand("Dashboard Events, Crypto Dates & Milestones"),
  "/dashboard/nfts": withBrand("Dashboard NFTs, Collections & Market Data"),
  "/dashboard/watchlist": withBrand("Dashboard Watchlist, Alerts & Tracked Assets"),
};

const normalizeLegacyTitle = (title: string): string => {
  const normalized = cleanText(title)
    .replace(/FomoLand|Fomoland/g, SITE_NAME)
    .replace(/^FOMO:\s*/i, "")
    .replace(/\s*\/\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized || normalized === SITE_NAME) {
    return withBrand("Crypto Intelligence Platform");
  }

  if (normalized.includes(`| ${SITE_NAME}`)) {
    return normalized;
  }

  return withBrand(normalized);
};

export const resolvePageTitle = (pathname: string, fallbackTitle: string): string => {
  const title = cleanText(fallbackTitle);

  if (title.includes(`| ${SITE_NAME}`)) {
    return title;
  }

  return PAGE_TITLES[pathname] || normalizeLegacyTitle(title);
};
