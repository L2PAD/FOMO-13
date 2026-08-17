import xIcon from "../assets/icons/project-page-icons/x.png";
import dsIcon from "../assets/icons/project-page-icons/discord.png";
import mediumIcon from "../assets/icons/project-page-icons/medium.png";
import youTubeIcon from "../assets/icons/project-page-icons/youtube.png";
import telegramIcon from "../assets/icons/project-page-icons/telegram.png";
import gitHubIcon from "../assets/icons/project-page-icons/github.png";
import linkedinIcon from "../assets/icons/project-page-icons/linkedin.png";
import redditIcon from "../assets/icons/project-page-icons/reddit.png";
import { InstagramIcon } from "../components/global/Icons";

export type ServiceLink = {
  name: string;
  icon: any;
  url: string;
  domain: string;
  key: string;
};

const links: ServiceLink[] = [
  {
    name: "X",
    key: "x",
    icon: xIcon,
    url: "https://x.com",
    domain: "x.com",
  },
  {
    name: "X",
    key: "x",
    icon: xIcon,
    url: "https://twitter.com",
    domain: "twitter.com",
  },
  {
    name: "Discord",
    icon: dsIcon,
    url: "https://discord.com",
    domain: "discord.com",
    key: "ds",
  },
  {
    name: "Telegram",
    icon: telegramIcon,
    url: "https://t.me",
    domain: "t.me",
    key: "tg",
  },
  {
    name: "Telegram",
    icon: telegramIcon,
    url: "https://web.telegram.org",
    domain: "web.telegram.org",
    key: "tg",
  },
  {
    name: "LinkedIn",
    icon: linkedinIcon,
    url: "https://www.linkedin.com",
    domain: "linkedin.com",
    key: "link",
  },
  {
    name: "Redit",
    icon: redditIcon,
    url: "https://www.reddit.com",
    domain: "reddit.com",
    key: "reddit",
  },
  {
    name: "Facebook",
    icon: redditIcon,
    url: "https://www.facebook.com",
    domain: "facebook.com",
    key: "fs",
  },
  {
    name: "YouTube",
    icon: redditIcon,
    url: "https://www.youtube.com",
    domain: "youtube.com",
    key: "youTube",
  },
  {
    name: "Instagram",
    icon: InstagramIcon,
    url: "https://www.instagram.com",
    domain: "instagram.com",
    key: "inst",
  },
];

export const getServiceByUrl = (url: string): string => {
  try {
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    return links.find((link) => hostname.includes(link.domain))?.key || "web";
  } catch (error) {
    return "web";
  }
};
