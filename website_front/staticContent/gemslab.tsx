import moment from "moment";
import Leaderboard from "../components/global/Icons/nav/leaderboard";
import React from "react";
import portfolio from "../components/global/Icons/nav/portfolio";
import Portfolio from "../components/global/Icons/nav/portfolio";
import Spaceport from "../components/global/Icons/nav/spaceport";
import Profile from "../components/global/Icons/nav/profile";
import Vote from "../components/global/Icons/nav/vote";
import { Calendar, LucideWatch } from "lucide-react";
import Buzz from "../components/global/Icons/nav/buzz";
import FomoChat from "../components/global/Icons/nav/fomo-chat";

export const GemsLabPages = [
  {
    title: "Launch",
    link: "",
    tabs: [
      {
        title: "Early rounds",
        link: "earlyrounds",
        icon: "earlyrounds",
        desc: "Promising projects to invest in on early stages",
      },
      {
        title: "Public rounds",
        link: "publicrounds",
        icon: "publicrounds",
        desc: "The best crypto projects to invest in from the whole market.",
      },
      {
        title: "NFT Launch",
        link: "launch",
        icon: "launch",
        desc: "Universal NFT launchpad which enables projects to launch their IDO and INO",
      },
    ],
  },
  { title: "Leaderboard ", link: "leaderboard", icon: <Leaderboard /> },
  { title: "Portfolio", link: "/core/portfolio", icon: <Portfolio /> },
  { title: "Spaceport", link: "spaceport", icon: <Spaceport /> },
  { title: "Chat", link: "/core/fomo-chat", icon: <FomoChat /> },
  { title: "My profile", link: "profile", icon: <Profile /> },
  { title: "Vote", link: "vote", icon: <Vote /> },
  {
    title: "Resources",
    link: "resources",
    tabs: [
      { title: "Calendar", link: "calendar", icon: "calendar" },
      { title: "Watchlist", link: "watchlist", icon: "watchlist" },
    ],
  },
];

export const GemsLabPortfolioTabs = ["My invests", "General", "Analytics"];

export const GemsLabProjects = [
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "warn",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 24,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
];

export const GemsLabProjectsShort = [
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "warn",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 24,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "warn",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 24,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "warn",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 24,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
  {
    variant: "default",
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    status: "upcoming",
    title: "SharkRace Club",
    percentage: 75,
    description: "NFT & Collectibles",
    investors: [
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
      {
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
        name: "name",
      },
    ],
    redFlagsCount: 0,
    totalAmount: 12432524,
    lastFundingDate: String(moment()),
    type: "Seed",
    price: 1054,
    priceCurrency: 1000.05,
  },
];

const items = [
  {
    img: "/63a82f8970e50c65e9254417488f23c07bf9a9e7.png",
    name: "HYPE",
    niche: "Hyperliquid",
    amountUsd: "$9,741.00",
    amountTkn: "300.00 HYPE",
    invested: "$900",
    avgBuyPrice: "$3.00",
    profitUsd: 8835.0,
    profitPercent: 981.67,
  },
  {
    img: "/63a82f8970e50c65e9254417488f23c07bf9a9e7.png",
    name: "BTC",
    niche: "Bitcoin",
    amountUsd: "$5,107.96",
    amountTkn: "0.0046 BTC",
    invested: "$1,380.00",
    avgBuyPrice: "$30,000.00",
    profitUsd: 3725.46,
    profitPercent: 269.96,
  },
  {
    img: "/63a82f8970e50c65e9254417488f23c07bf9a9e7.png",
    name: "HYPE",
    niche: "Hyperliquid",
    amountUsd: "$9,741.00",
    amountTkn: "300.00 HYPE",
    invested: "$900",
    avgBuyPrice: "$3.00",
    profitUsd: 8835.0,
    profitPercent: 981.67,
  },
  {
    img: "/63a82f8970e50c65e9254417488f23c07bf9a9e7.png",
    name: "BTC",
    niche: "Bitcoin",
    amountUsd: "$5,107.96",
    amountTkn: "0.0046 BTC",
    invested: "$1,380.00",
    avgBuyPrice: "$30,000.00",
    profitUsd: 3725.46,
    profitPercent: 269.96,
  },
  {
    img: "/63a82f8970e50c65e9254417488f23c07bf9a9e7.png",
    name: "HYPE",
    niche: "Hyperliquid",
    amountUsd: "$9,741.00",
    amountTkn: "300.00 HYPE",
    invested: "$900",
    avgBuyPrice: "$3.00",
    profitUsd: -8835.0,
    profitPercent: -981.67,
  },
  {
    img: "/63a82f8970e50c65e9254417488f23c07bf9a9e7.png",
    name: "BTC",
    niche: "Bitcoin",
    amountUsd: "$5,107.96",
    amountTkn: "0.0046 BTC",
    invested: "$1,380.00",
    avgBuyPrice: "$30,000.00",
    profitUsd: -3725.46,
    profitPercent: -269.96,
  },
];

const icoItems = [
  {
    name: "JUP",
    invested: 1000,
    allocation: 2000,
    avgPrice: 0.5,
    tgeDate: "01 Feb 2024",
    claimed: "400 JUP",
    status: "Vesting",
  },
  {
    name: "XAI",
    invested: 750,
    allocation: 1250,
    avgPrice: 0.6,
    tgeDate: "15 Jan 2024",
    claimed: "750 XAI",
    status: "Partially Claimed",
  },
  {
    name: "ZKSync",
    invested: 1200,
    allocation: 3000,
    avgPrice: 0.4,
    tgeDate: "Q3 2025",
    claimed: "0 ZK",
    status: "Allocated",
    ticker: "ZK",
  },
  {
    name: "UNKNOWN",
    invested: 500,
    allocation: "",
    avgPrice: "",
    tgeDate: "",
    claimed: "",
    status: "Cancelled",
  },
];

const categoryItems = [
  {
    name: "Ethereum Ecosystem",
    tokens: "ETH, ARB, LDO",
    totalValue: 11341.41,
    percentOfPortfolio: 37.7,
    currentProfitValue: 8835,
    currentProfitPercent: 981.67,
  },
  {
    name: "DEX",
    tokens: "UNI, GMX, DYDX",
    totalValue: 10846,
    percentOfPortfolio: 36,
    currentProfitValue: 3725,
    currentProfitPercent: 269.67,
  },
  {
    name: "Wallet",
    tokens: "TWT",
    totalValue: 1741.41,
    percentOfPortfolio: 5.7,
    currentProfitValue: -177,
    currentProfitPercent: -17,
  },
  {
    name: "Ethereum Ecosystem",
    tokens: "ETH, ARB, LDO",
    totalValue: 11341.41,
    percentOfPortfolio: 37.7,
    currentProfitValue: 8835,
    currentProfitPercent: 981.67,
  },
  {
    name: "DEX",
    tokens: "UNI, GMX, DYDX",
    totalValue: 10846,
    percentOfPortfolio: 36,
    currentProfitValue: 3725,
    currentProfitPercent: 269.67,
  },
];
