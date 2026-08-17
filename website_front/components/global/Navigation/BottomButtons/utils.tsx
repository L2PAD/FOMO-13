import { CalendarDays, LucideMic } from "lucide-react";
import React from "react";
import Backers from "../../Icons/nav/backers";
import Board from "../../Icons/nav/board";
import Buzz from "../../Icons/nav/buzz";
import Compendium from "../../Icons/nav/compendium";
import DashMarket from "../../Icons/nav/dash-market";
import Echo from "../../Icons/nav/echo";
import Eralash from "../../Icons/nav/eralash";
import Events from "../../Icons/nav/events";
import Feed from "../../Icons/nav/feed";
import Leaderboard from "../../Icons/nav/leaderboard";
import Market from "../../Icons/nav/market";
import Nft from "../../Icons/nav/nft";
import Parsing from "../../Icons/nav/parsing";
import Platforms from "../../Icons/nav/platforms";
import Portfolio from "../../Icons/nav/portfolio";
import Profile from "../../Icons/nav/profile";
import Scout from "../../Icons/nav/scout";
import Spaceport from "../../Icons/nav/spaceport";
import Tasks from "../../Icons/nav/tasks";
import Unlocking from "../../Icons/nav/unlocking";
import Vote from "../../Icons/nav/vote";
import Watchlist from "../../Icons/nav/watchlist";
import Early from "../../Icons/nav/early";
import Public from "../../Icons/nav/public";
import ClassicOtc from "../../Icons/nav/classic-otc";
import Alloc from "../../Icons/nav/alloc";
import L1 from "../../Icons/nav/l1";
import L2 from "../../Icons/nav/l2";
import L0 from "../../Icons/nav/l0";
import NftExchange from "../../Icons/nav/nft-exchange";
import Charts from "../../Icons/nav/charts";
import Diagrams from "../../Icons/nav/diagrams";

export interface NavigationLinkTab {
  title: string;
  link: string;
  icon: React.ReactNode;
  desc?: string;
  disabled?: boolean;
}

export interface NavigationLinkItem {
  title: string;
  link: string;
  icon?: React.ReactNode;
  tabs?: NavigationLinkTab[];
  disabled?: boolean;
}

export const cryptoLinks: NavigationLinkItem[] = [
  { title: "Market", link: "", icon: <Market /> },
  { title: "F-Feed", link: "funding-feed", icon: <Feed /> },
  { title: "Echo", link: "projects", icon: <Echo /> },
  { title: "Backer", link: "backers", icon: <Backers /> },
  { title: "Eralash", link: "eralash", icon: <Eralash /> },
  { title: "Unlocking", link: "unlocking", icon: <Unlocking /> },
];

export const earlylandLinks: NavigationLinkItem[] = [
  { title: "Scout", link: "", icon: <Scout /> },
  { title: "Feed", link: "feed", icon: <Feed /> },
  { title: "Tasks", link: "tasks", icon: <Tasks /> },
  { title: "Board", link: "board", icon: <Board /> },
  { title: "Compendium", link: "compendium", icon: <Compendium /> },
];

export const gemslabLinks: NavigationLinkItem[] = [
  {
    title: "Launch",
    link: "",
    tabs: [
      {
        title: "Early rounds",
        link: "earlyrounds",
        icon: <Early />,
        desc: "Promising projects to invest in on early stages",
      },
      {
        title: "Public rounds",
        link: "publicrounds",
        icon: <Public />,
        desc: "The best crypto projects to invest in from the whole market.",
      },
      {
        title: "NFT Launch",
        link: "launch",
        icon: <Nft />,
        desc: "Universal NFT launchpad which enables projects to launch their IDO and INO",
      },
    ],
  },
  { title: "Leaderboard ", link: "leaderboard", icon: <Leaderboard /> },
  { title: "Portfolio", link: "/core/portfolio", icon: <Portfolio /> },
  { title: "Spaceport", link: "spaceport", icon: <Spaceport /> },
  { title: "My profile", link: "profile", icon: <Profile /> },
  {
    title: "Resources",
    link: "resources",
    tabs: [
      { title: "Calendar", link: "calendar", icon: <CalendarDays /> },
      { title: "Watchlist", link: "watchlist", icon: <Watchlist /> },
    ],
  },
  { title: "Vote", link: "vote", icon: <Vote /> },
];

export const utilityLinks: NavigationLinkItem[] = [
  {
    title: "Dual-Layer OTC",
    link: "",
    tabs: [
      {
        title: "Classic OTC Market",
        link: "otc",
        icon: <ClassicOtc />,
        desc: "Trading your assets with the cutting edge OTC Market with a system of checks and balances which ensures  safety and stability of trading.",
      },
      {
        title: "Alloc Market",
        link: "market",
        icon: <Alloc />,
        desc: "Buy and Sell operations of allocations in projects (originated on Fomoland)",
      },
    ],
  },
  {
    title: "Multi-Layer Connection",
    link: "",
    tabs: [
      {
        title: "L0 On-chain",
        link: "onchain",
        icon: <L0 />,
        desc: "On-chain data analysis of crypto -related market participants",
      },
      {
        title: "L1 Public network ",
        link: "public",
        icon: <L1 />,
        desc: "Social links and connections between market participants in projects etc",
      },
      {
        title: "L2 Social network",
        link: "social",
        icon: <L2 />,
        desc: "Analysis of social networks (connections, intersection) of market participants",
      },
    ],
  },
  { title: "NFT Exchange", link: "nft-exchange", icon: <NftExchange /> },
  { title: "Parsing", link: "parcing", icon: <Parsing />, disabled: true },
  {
    title: "Podcast",
    link: "podcasts",
    icon: <LucideMic width={20} height={20} />,
  },
  {
    title: "Buzz",
    link: "news",
    icon: <Buzz />,
  },
];

export const dashboardLinks: NavigationLinkItem[] = [
  { title: "Charts", link: "charts", icon: <Charts /> },
  { title: "Diagrams", link: "diagrams", icon: <Diagrams /> },
  { title: "Watchlist", link: "watchlist", icon: <Watchlist /> },
];
