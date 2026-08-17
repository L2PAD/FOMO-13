import React, { FC, useContext } from "react";
import Image from "next/image";
import xIcon from "../../../../../../assets/icons/project-page-icons/x.png";
import dsIcon from "../../../../../../assets/icons/project-page-icons/discord.png";
import mediumIcon from "../../../../../../assets/icons/project-page-icons/medium.png";
import youTubeIcon from "../../../../../../assets/icons/project-page-icons/youtube.png";
import telegramIcon from "../../../../../../assets/icons/project-page-icons/telegram.png";
import gitHubIcon from "../../../../../../assets/icons/project-page-icons/github.png";
import linkedinIcon from "../../../../../../assets/icons/project-page-icons/linkedin.png";
import redditIcon from "../../../../../../assets/icons/project-page-icons/reddit.png";
import { CardKey } from "../ProjectPriceStatistics/styles";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../../../helpers/imageFallbacks";
import { IFund, IProject } from "../../../../../../types/global_types";
import { getServiceByUrl } from "../../../../../../helpers/getServiceByUrl";
import {
  AboutPageLinks,
  Categories,
  LinksWrapper,
  SearchItems,
  SearchWrapper,
  Wrapper,
} from "./styles";
import EmptySection from "../../../../../global/EmptySection";
import { useTranslation } from "i18n";
import { sanitizedHtml } from "../../../../../../helpers/sanitizeHtml";

const links = [
  {
    name: "X",
    icon: xIcon,
  },
  {
    name: "Discord",
    icon: dsIcon,
  },
  {
    name: "Medium",
    icon: mediumIcon,
  },
  {
    name: "YouTube",
    icon: youTubeIcon,
  },
  {
    name: "Telegram",
    icon: telegramIcon,
  },
  {
    name: "Github",
    icon: gitHubIcon,
  },
  {
    name: "LinkedIn",
    icon: linkedinIcon,
  },
  {
    name: "Reddit",
    icon: redditIcon,
  },
];

// const defaultText = `<h2>
//       About SOL
//       </h2>
//       <p>
//       Solana is a blockchain platform created by Solana Labs in 2017. It is designed for running decentralized applications (dApps) and is known for its fast transaction processing speed and lower transaction fees compared to other blockchains like Ethereum. If you want to learn more about Solana, you can check out their Github page and find ways to connect with their community.
//       </p>
//       <h2>
//       What makes Solana unique?
//       </h2>
//       <p>
//       Solana offers several unique features compared to other cryptocurrencies. Firstly, it has a high transaction speed, allowing for faster and more efficient transactions compared to popular cryptocurrencies like Bitcoin and Ethereum. Additionally, Solana has lower transaction fees, making it a cost-effective option for users.
//       <br/>Another key aspect that sets Solana apart is its security. While Bitcoin and Ethereum are theoretically more decentralized, Solana has a higher Nakamoto coefficient, indicating a higher level of decentralization. This is due to the advanced hardware requirements for Solana validators, ensuring the network's capabilities are maximized.
//       <br/>Furthermore, Solana's ecosystem provides competitive advantages in terms of donation services. More brands are seeking donation platforms that accept cryptocurrencies, and Solana's lower carbon footprint attracts nonprofits to the platform. The cost-effectiveness of Solana's transactions also means that more of the donated funds end up in the hands of the non-profit organizations.
//       <br/>Considering these factors, Solana presents itself as a compelling option for investors looking for a cryptocurrency that offers faster transactions, lower fees, enhanced security, and environmental sustainability.
//       </p>
//       <h2>
//       Live Solana Price Data
//       </h2>
//       <p>
//       The current price of Solana (SOL) is approximately $253.33, reflecting a increase of 15.34% in the last 24 hours.The SOL trading volume in the last 24 hours stands at $24.40 billion. Solana's market cap is currently $123.11 billion, accounting for about 3.37% of the total crypto market cap. The circulating supply of SOL is 486.57 million.
//       <br/>If you're wondering how to buy Solana, top cryptocurrency exchanges such as Binance, Coinbase, Bybit, Binanceand OKX offer trading options. For a comprehensive list of exchanges, visit our crypto exchanges page. To understand Solana's performance over time, consider exploring its price history and ROI. For in-depth analysis and insights on SOL, check out our crypto insights page.
//       </p>`

interface IProps {
  project: IProject | IFund;
  text?: string;
  dropstabDescription?: {
    short?: string;
    full?: string;
    paragraphs?: string[];
  } | null;
  isSearch?: boolean;
  className?: string;
}

const getHostName = (value: string): string => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value;
  }
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizePlainText = (value: string): string =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/\b(null|undefined)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripHtml = (value: string, removeHeadings = false): string => {
  const withoutHeadings = removeHeadings
    ? value.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ")
    : value;

  return normalizePlainText(withoutHeadings.replace(/<[^>]*>/g, " "));
};

const sanitizeDescriptionHtml = (value?: string): string => {
  if (!value) return "";

  return value
    .replace(/(?:<br\s*\/?>|\s|&nbsp;)*\b(?:null|undefined)\b(?:<br\s*\/?>|\s|&nbsp;)*/gi, " ")
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br/>")
    .replace(/<p[^>]*>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, "")
    .trim();
};

const buildDropstabDescriptionHtml = (
  description?: IProps["dropstabDescription"]
): string => {
  if (!description) return "";

  const paragraphs = Array.isArray(description.paragraphs)
    ? description.paragraphs
    : [];
  const sourceParagraphs = paragraphs.length
    ? paragraphs
    : [description.full || description.short || ""];
  const cleanedParagraphs = sourceParagraphs
    .map((item) => normalizePlainText(String(item || "")))
    .filter(Boolean);

  return cleanedParagraphs.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
};

const getUsefulTextLength = (html: string): number =>
  stripHtml(html, true).length;

const getBestDescriptionHtml = (
  text?: string,
  dropstabDescription?: IProps["dropstabDescription"]
): string => {
  const sanitizedProjectText = sanitizeDescriptionHtml(text);
  const dropstabText = buildDropstabDescriptionHtml(dropstabDescription);

  if (!getUsefulTextLength(sanitizedProjectText)) return dropstabText;
  if (!getUsefulTextLength(dropstabText)) return sanitizedProjectText;

  return getUsefulTextLength(dropstabText) > getUsefulTextLength(sanitizedProjectText)
    ? dropstabText
    : sanitizedProjectText;
};

const isTwitterService = (service: ReturnType<typeof getServiceByUrl>): boolean =>
  service.name === "X" ||
  service.domain === "x.com" ||
  service.domain === "twitter.com";

const getTwitterLinkPriority = (href: string): number => {
  try {
    const parsedUrl = new URL(/^https?:\/\//i.test(href) ? href : `https://${href}`);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const firstPart = String(pathParts[0] || "").toLowerCase();
    const nonProfilePaths = new Set(["home", "i", "intent", "search", "share", "status", "hashtag"]);

    if (pathParts.length === 1 && firstPart && !nonProfilePaths.has(firstPart)) return 0;
    return 1;
  } catch {
    return 2;
  }
};

const normalizeOfficialLinks = (items: any[] = []) => {
  const regularLinks: Array<{ href: string; name: string; service: ReturnType<typeof getServiceByUrl> }> = [];
  const twitterLinks: Array<{ href: string; name: string; service: ReturnType<typeof getServiceByUrl> }> = [];
  const seenLinks = new Set<string>();

  for (const item of items) {
    const href = String(item?.href || item?.url || "").trim();
    if (!href) continue;

    const service = getServiceByUrl(href);
    if (!service.domain) continue;

    const normalizedKey = href.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (seenLinks.has(normalizedKey)) continue;
    seenLinks.add(normalizedKey);

    const link = {
      href,
      name: String(item?.name || service.name || service.domain || "Link"),
      service,
    };

    if (isTwitterService(service)) {
      twitterLinks.push(link);
    } else {
      regularLinks.push(link);
    }
  }

  const bestTwitterLink = twitterLinks.sort(
    (left, right) => getTwitterLinkPriority(left.href) - getTwitterLinkPriority(right.href)
  )[0];

  return bestTwitterLink ? [bestTwitterLink, ...regularLinks] : regularLinks;
};

const AboutProject: FC<IProps> = ({
  project,
  text,
  dropstabDescription,
  isSearch = true,
  className,
}) => {
  const { translateText } = useTranslation();
  const descriptionHtml = getBestDescriptionHtml(text, dropstabDescription);
  const officialLinks = normalizeOfficialLinks(project?.socialmedia);
  const categories = Array.isArray(project?.categories)
    ? project.categories.filter(Boolean)
    : [];
  const visibleCategories = categories.slice(0, 3);
  const hiddenCategories = categories.slice(3);
  const hiddenCategoriesCount = hiddenCategories.length;

  return (
    <Wrapper variant="main" className={className}>
      {descriptionHtml ? (
        <div
          className="about-project"
          dangerouslySetInnerHTML={sanitizedHtml(descriptionHtml)}
        />
      ) : (
        <EmptySection />
      )}
      <AboutPageLinks>
        <CardKey style={{ fontSize: "16px" }}>{translateText("Official links")}</CardKey>
        <LinksWrapper>
          {officialLinks.length ? (
            officialLinks.map((item) => {
              return (
                <a
                  href={item.href}
                  target="_blank"
                  key={item.href}
                  rel="noreferrer"
                >
                  {item.service?.icon ? (
                    <Image
                      //@ts-ignore
                      src={item.service?.icon}
                      alt={item.name}
                    />
                  ) : (
                    <img
                      src={getProjectImage(project.logo, project.name)}
                      alt={project.name}
                      onError={setProjectImageFallback}
                    />
                  )}
                  <span>{item.service?.domain || item.href}</span>
                </a>
              );
            })
          ) : (
            <></>
          )}
        </LinksWrapper>
        {isSearch ? (
          <SearchItems>
            <SearchWrapper>
              <button>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M9.65886 9.70738L9.33874 9.38727L8.9885 9.67411C8.15391 10.3576 7.09098 10.7682 5.93343 10.7682C3.27037 10.7682 1.1001 8.59795 1.1001 5.9349C1.1001 3.27184 3.27037 1.10156 5.93343 1.10156C8.59649 1.10156 10.7668 3.27184 10.7668 5.9349C10.7668 7.09244 10.3562 8.15537 9.67265 8.98996L9.3858 9.34021L9.70592 9.66032L12.8903 12.8447L12.8902 12.8448L12.8976 12.8518C12.9008 12.8549 12.9033 12.8586 12.9051 12.8627C12.9068 12.8667 12.9078 12.8711 12.9078 12.8756C12.9079 12.88 12.907 12.8844 12.9053 12.8885C12.9037 12.8926 12.9012 12.8964 12.898 12.8995C12.8949 12.9027 12.8912 12.9051 12.8871 12.9068L13.076 13.3697L12.8871 12.9068C12.8829 12.9085 12.8785 12.9093 12.8741 12.9093C12.8697 12.9092 12.8653 12.9083 12.8612 12.9066L12.6628 13.3655L12.8612 12.9066C12.8571 12.9048 12.8534 12.9022 12.8504 12.899L12.8504 12.899L12.8432 12.8918L9.65886 9.70738ZM10.7001 5.9349C10.7001 3.29602 8.5723 1.16823 5.93343 1.16823C3.29456 1.16823 1.16676 3.29602 1.16676 5.9349C1.16676 8.57377 3.29456 10.7016 5.93343 10.7016C8.5723 10.7016 10.7001 8.57377 10.7001 5.9349Z"
                    fill="#738094"
                    stroke="#738094"
                  />
                </svg>
                <span>{translateText("Explorers")}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="8"
                  height="5"
                  viewBox="0 0 8 5"
                  fill="none"
                >
                  <path
                    d="M0.5 1L4.00065 4L7.5 1"
                    stroke="#738094"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="search-dropdown">
                {project?.explorers?.map((item: string) => {
                  return (
                    <a target="__blank" href={item}>
                      {getHostName(item)}
                    </a>
                  );
                })}
              </div>
            </SearchWrapper>
            <SearchWrapper>
              <button>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M13.3846 11.9394V7.63636C13.3846 5.62806 10.9738 4 8 4C5.02616 4 2.61538 5.62806 2.61538 7.63636V11.9394M1 12H4.23077M11.7692 12L15 12"
                    stroke="#738094"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{translateText("Bridges")}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="8"
                  height="5"
                  viewBox="0 0 8 5"
                  fill="none"
                >
                  <path
                    d="M0.5 1L4.00065 4L7.5 1"
                    stroke="#738094"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="search-dropdown">
                {project?.bridge?.map((item: string) => {
                  return (
                    <a target="__blank" href={item}>
                      {getHostName(item)}
                    </a>
                  );
                })}
              </div>
            </SearchWrapper>
          </SearchItems>
        ) : (
          <br />
        )}
        <CardKey style={{ fontSize: "16px" }}>{translateText("Categories")}</CardKey>
        <Categories>
          {visibleCategories.map((item: string, i: number) => {
            return (
              <div key={i}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M11.0237 4.97959L11.0193 4.97956M13.2241 1.6455L9.19611 1.33565C8.83899 1.30818 8.4877 1.43813 8.23443 1.6914L1.69286 8.23297C1.21371 8.71212 1.21371 9.48898 1.69286 9.96813L6.03074 14.306C6.50988 14.7852 7.28674 14.7852 7.76589 14.306L14.3075 7.76443C14.5607 7.51116 14.6907 7.15987 14.6632 6.80275L14.3534 2.77472C14.3069 2.17134 13.8275 1.69191 13.2241 1.6455Z"
                    stroke="#738094"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item}
              </div>
            );
          })}
          {hiddenCategoriesCount > 0 ? (
            <div className="hidden-categories-popover">
              <div className="hidden-categories-count">+{hiddenCategoriesCount}</div>
              <div className="hidden-categories-dropdown">
                {hiddenCategories.map((item: string, i: number) => (
                  <div className="hidden-category-item" key={`${item}-${i}`}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            null
          )}
        </Categories>
      </AboutPageLinks>
    </Wrapper>
  );
};

export default AboutProject;
