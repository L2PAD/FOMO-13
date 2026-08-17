import { INews } from "../types/global_types";

// Temporary MOCK news feed for the Buzz → News tab.
// Purpose: showcase the intended layout (image card grid for the latest day,
// compact list for older days) while the real news-parsing pipeline is not yet
// wired. Replace automatically once the parser feeds live data (Market falls
// back to these items ONLY when the API returns an empty list).
const hoursAgo = (h: number): Date => new Date(Date.now() - h * 60 * 60 * 1000);

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=60`;

export const MOCK_NEWS: INews[] = [
  {
    _id: "mock-1",
    title: "Ethereum Spot ETFs Post Record Weekly Inflows as Demand Accelerates",
    text: "Institutional appetite for ETH exposure hit a new high this week, with analysts pointing to shrinking exchange balances and rising staking participation.",
    type: "Markets",
    image: IMG("photo-1621761191319-c6fb62004040"),
    date: hoursAgo(2),
    isAdminCreate: true,
  },
  {
    _id: "mock-2",
    title: "Base Launches MCP Agent Gateway for Onchain Portfolio Management",
    text: "The new gateway lets AI agents interact directly with onchain portfolios, opening the door to automated, permissioned strategies.",
    type: "Crypto",
    image: IMG("photo-1518546305927-5a555bb7020d"),
    date: hoursAgo(4),
    isAdminCreate: true,
  },
  {
    _id: "mock-3",
    title: "Layer-2 Activity Hits New Highs as Median Fees Fall Below a Cent",
    text: "Aggregate L2 transactions reached an all-time high this week, driven by blob adoption and a fresh wave of consumer apps.",
    type: "Technology",
    image: IMG("photo-1639762681485-074b7f938ba0"),
    date: hoursAgo(7),
    isAdminCreate: true,
  },
  {
    _id: "mock-4",
    title: "Stablecoin Supply Expands Over 2% W/W, Signaling Returning Liquidity",
    text: "A historically bullish signal for onchain liquidity and DEX volumes as USDT and USDC supply climbs.",
    type: "Markets",
    image: IMG("photo-1640340434855-6084b1f4901c"),
    date: hoursAgo(10),
    isAdminCreate: true,
  },
  {
    _id: "mock-5",
    title: "AI Data-Center Demand Reshapes Bitcoin Miner Economics",
    text: "Miners are increasingly pivoting spare capacity toward AI compute, blurring the line between hashing and high-performance workloads.",
    type: "Artificial Intelligence",
    image: IMG("photo-1620712943543-bcc4688e7485"),
    date: hoursAgo(20),
    isAdminCreate: true,
  },
  {
    _id: "mock-6",
    title: "Restaking TVL Cools as Rewards Normalize Across Protocols",
    text: "After months of vertical growth, restaking deposits plateaued as yields compressed toward sustainable levels.",
    type: "DeFi",
    image: IMG("photo-1526304640581-d334cdbbf45e"),
    date: hoursAgo(30),
    isAdminCreate: true,
  },
  {
    _id: "mock-7",
    title: "Solana DePIN Projects Lead Weekly Onchain Revenue Rankings",
    text: "Decentralized physical infrastructure networks continue to convert real-world usage into on-chain fees.",
    type: "Crypto",
    image: IMG("photo-1516245834210-c4c142787335"),
    date: hoursAgo(34),
    isAdminCreate: true,
  },
  {
    _id: "mock-8",
    title: "Regulators Signal Clearer Framework for Tokenized Treasuries",
    text: "Fresh guidance could unlock a wave of institutional issuance for tokenized real-world assets.",
    type: "Law and Order",
    image: IMG("photo-1450101499163-c8848c66ca85"),
    date: hoursAgo(50),
    isAdminCreate: true,
  },
  {
    _id: "mock-9",
    title: "NFT Market Rotates Toward Utility-Backed Collections",
    text: "Collectors increasingly favor memberships and access-bearing tokens over purely speculative art.",
    type: "NFT",
    image: IMG("photo-1634017839464-5c339ebe3cb4"),
    date: hoursAgo(56),
    isAdminCreate: true,
  },
];

export default MOCK_NEWS;
