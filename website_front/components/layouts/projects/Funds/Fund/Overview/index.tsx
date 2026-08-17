import React, { FC, useMemo, useState } from "react";
import { useQuery } from "react-query";
import AboutProject from "../../../Crypto/Project/About";
import { Title, Wrapper } from "./styles";
import { IFund, IProject } from "../../../../../../types/global_types";
import {
  PieWrapper,
  Table,
  TableHeader,
  TokenDistribution,
} from "../../../Crypto/Project/Unlocks/styles";
import PieGraphic from "../../../Crypto/Project/Fundraising/pie";
import { PieValuesPercentage } from "../../../Crypto/Project/Fundraising/styles";
import { COLORS } from "../../../Crypto/Project/Fundraising";
import FundActivities from "../FundActivities";
import RecentExits from "../RecentExits";
import InvestmentHistory from "../InvestmentHistory";
import { IFundProps } from "..";
import AboutProjectEdit from "../../../Crypto/Project/AboutEdit";
import EmptySection from "../../../../../global/EmptySection";
import GeographyDistribution from "../GeographyDistribution";
import { useTranslation } from "i18n";
import fetchInvestor from "../../../../../../http/investors/fetchInvestor";

const slugify = (value: string): string => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getFundSlug = (fund: any): string => {
  return (
    fund?.slug ||
    fund?.sourceKey ||
    fund?.key ||
    fund?.sourceRefs?.key ||
    slugify(fund?.name || "")
  );
};

const normalizeUrl = (value: any): string => {
  const normalized = String(value || "").trim();
  return /^https?:\/\//i.test(normalized) ? normalized : "";
};

const investorSocialLinksToSocialmedia = (socialLinks: any): any[] => {
  if (!socialLinks || typeof socialLinks !== "object") return [];

  return Object.entries(socialLinks)
    .map(([name, href]) => ({
      name,
      href: normalizeUrl(href),
    }))
    .filter((item) => item.href);
};

const normalizeCategoryValue = (value: any): string => {
  if (!value) return "";
  if (typeof value === "object") {
    return normalizeCategoryValue(value.name || value.title || value.value);
  }
  const normalized = String(value).trim();
  return normalized && normalized !== "[object Object]" ? normalized : "";
};

const normalizeInvestorCategories = (investor: any): string[] => {
  const values = [
    investor?.category,
    ...(Array.isArray(investor?.sectors) ? investor.sectors : []),
    ...(Array.isArray(investor?.tags) ? investor.tags : []),
  ];
  const normalized = values
    .map(normalizeCategoryValue)
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

// const defaultText = `
//       <p>
//       Alpha Ventures is a premier venture capital firm specializing in early-stage investments in blockchain technology, artificial intelligence (AI), and decentralized finance (DeFi). Since its founding in 2018, the fund has actively participated in shaping the Web3 ecosystem, supporting over 60 projects that aim to revolutionize financial markets, digital ownership, and AI-powered solutions.      </p>
//       <p>
//       <p>
//       With a strong strategic focus on high-growth sectors, Alpha Ventures prioritizes investments in projects that demonstrate scalability, real-world adoption potential, and technological innovation. The fund actively collaborates with visionary founders, pioneering developers, and industry leaders to accelerate the growth of the next generation of decentralized applications (dApps) and blockchain infrastructure.      <br/>Another key aspect that sets Solana apart is its security. While Bitcoin and Ethereum are theoretically more decentralized, Solana has a higher Nakamoto coefficient, indicating a higher level of decentralization. This is due to the advanced hardware requirements for Solana validators, ensuring the network's capabilities are maximized.
//       </p>
//       <strong>
//       Investment Strategy & Core Vision
//       </strong>
//       <br/>
//       <br/>
//       Alpha Ventures is committed to long-term value creation, carefully selecting projects that align with its investment thesis:
//        <ul>
//             <li>
//             	Shark NFT Collection – Limited edition NFTs with upgradable traits that influence gameplay.
//             </li>
//             <li>
//                 Play-to-Earn (P2E) Game – A multiplayer battle arena where users can train, evolve, and compete with their NFT sharks for rewards.
//             </li>
//             <li>
//             	Metaverse Integration – Explore an underwater metaverse, trade items, and interact with other players.
//             </li>
//             <li>
//                 Staking & Yield Farming – Earn passive income by staking the SRC token or holding exclusive NFTs.
//             </li>
//             <li>
//             	Deflationary Tokenomics – A built-in burn mechanism reduces supply, increasing token scarcity over time.
//             </li>
//         </ul>
// `

export const dataAllocation = [
  { name: "North America", value: 35, allocated: "$1.148B (32.8%)" },
  { name: "Europe", value: 25, allocated: "$948.5M (27.1%)" },
  { name: "Asia", value: 20, allocated: "$647.5M (18.5%)" },
  { name: "Middle East", value: 10, allocated: "$483M (13.8%)" },
  { name: "Others", value: 10, allocated: "$273M (7.8%)" },
];

const Overview: FC<IFundProps> = ({
  fund,
  fundDataToUpdate,
  isEditState,
  inputsHandler,
}) => {
  const { translateText } = useTranslation();
  const [selectedFund, setSelectedFund] = useState<any | undefined>(undefined);
  const overviewProject = useMemo(() => {
    return {
      ...fund,
      descriptionText: fund.descriptionText || fund.about || fund.bio,
      socialmedia: fund.socialmedia || [],
      categories: fund.categories?.length
        ? fund.categories.slice(0, 6)
        : (fund.sectors || fund.tags || []).slice(0, 6),
    };
  }, [fund]);
  const overviewDescription = overviewProject.descriptionText || "";
  const totalInvestmentsValue =
    fund.stats?.totalInvestments ||
    fund.totalInvestments ||
    fund.numberOfInvestments ||
    fund.projectsCount ||
    fund.supportedProjectsCount ||
    fund.supportedProjects?.length;
  const totalInvestmentsLabel = Number(totalInvestmentsValue)
    ? String(Math.round(Number(totalInvestmentsValue)))
    : "-";

  return (
    <Wrapper>
      <Title>
        {translateText("What is")} {fund.name}?
      </Title>
      {isEditState && fundDataToUpdate ? (
        <AboutProjectEdit
          project={fundDataToUpdate}
          inputsHandler={inputsHandler}
        />
      ) : overviewDescription ? (
        <AboutProject
          isSearch={false}
          text={overviewDescription}
          project={overviewProject}
        />
      ) : (
        <>
          <br />
          <EmptySection />
          <br />
        </>
      )}
      <Title style={{ marginTop: "20px" }}>
        <span>{translateText("Investment Geography")}</span>
        <span className="total-investment">
          <span>{translateText("Total Investments")}:</span>
          <span>{totalInvestmentsLabel}</span>
        </span>
      </Title>
      <GeographyDistribution
        isEditState={isEditState}
        fund={fund}
        fundDataToUpdate={fundDataToUpdate}
        inputsHandler={inputsHandler}
      />
      <FundActivities
        isEditState={isEditState}
        fund={fund}
        fundDataToUpdate={fundDataToUpdate}
        inputsHandler={inputsHandler}
      />

      <RecentExits
        isEditState={isEditState}
        fund={fund}
        fundDataToUpdate={fundDataToUpdate}
        inputsHandler={inputsHandler}
      />
    </Wrapper>
  );
};

export default Overview;
