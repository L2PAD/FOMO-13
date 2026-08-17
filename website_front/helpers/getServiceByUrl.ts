import xIcon from "../assets/icons/project-page-icons/x.png";
import dsIcon from "../assets/icons/project-page-icons/discord.png";
import mediumIcon from "../assets/icons/project-page-icons/medium.png";
import youTubeIcon from "../assets/icons/project-page-icons/youtube.png";
import telegramIcon from "../assets/icons/project-page-icons/telegram.png";
import gitHubIcon from "../assets/icons/project-page-icons/github.png";
import linkedinIcon from "../assets/icons/project-page-icons/linkedin.png";
import redditIcon from "../assets/icons/project-page-icons/reddit.png";
import websiteIcon from "../assets/icons/project-page-icons/website.png";
import instagramIcon from "../assets/icons/project-page-icons/Instagram_logo_2016.svg.png";
import facebookIcon from "../assets/icons/project-page-icons/facebook-icon.jpg";

export type ServiceLink = {
  name: string;
  icon: any;
  url: string;
  domain: string;
};

const links: ServiceLink[] = [
  {
    name: "X",
    icon: xIcon,
    url: "https://x.com",
    domain: "x.com",
  },
  {
    name: "X",
    icon: xIcon,
    url: "https://twitter.com",
    domain: "twitter.com",
  },
  {
    name: "Discord",
    icon: dsIcon,
    url: "https://discord.com",
    domain: "discord.com",
  },
  {
    name: "Medium",
    icon: mediumIcon,
    url: "https://medium.com",
    domain: "medium.com",
  },
  {
    name: "YouTube",
    icon: youTubeIcon,
    url: "https://www.youtube.com",
    domain: "youtube.com",
  },
  {
    name: "Telegram",
    icon: telegramIcon,
    url: "https://t.me",
    domain: "t.me",
  },
  {
    name: "Github",
    icon: gitHubIcon,
    url: "https://github.com",
    domain: "github.com",
  },
  {
    name: "LinkedIn",
    icon: linkedinIcon,
    url: "https://www.linkedin.com",
    domain: "linkedin.com",
  },
  {
    name: "Reddit",
    icon: redditIcon,
    url: "https://www.reddit.com",
    domain: "reddit.com",
  },
  {
    name: "Telegram",
    icon: telegramIcon,
    url: "https://web.telegram.org",
    domain: "web.telegram.org",
  },
  {
    name: "Instagram",
    icon: instagramIcon,
    url: "https://www.instagram.com",
    domain: "instagram.com",
  },
  {
    name: "Facebook",
    icon: facebookIcon,
    url: "https://www.facebook.com",
    domain: "facebook.com",
  },
];

export const getServiceByUrl = (url: string): ServiceLink => {
  try {
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const webSiteLink = {
      name: "website",
      icon: websiteIcon,
      url,
      domain: "",
    };

    return links.find((link) => hostname.includes(link.domain)) || webSiteLink;
  } catch (error) {
    return {
      name: "website",
      icon: websiteIcon,
      url,
      domain: "",
    };
  }
};
