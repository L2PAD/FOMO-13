import React, { FC, useState } from "react";
import Link from "next/link";
import { CardsWrapper } from "../styles";
import RecentlyAdded from "../recently_added";
import { ICryptoMarketCategories } from "../../../../../http/projects/fetchProjectsCategories";
import { Header } from "./styles";
import RecentlyIcon from "../../../../global/Icons/CryptoMarketIcons/RecentlyIcon";
import TrendingIcon from "../../../../global/Icons/CryptoMarketIcons/TrendingIcon";
import GainersIcon from "../../../../global/Icons/CryptoMarketIcons/GainersIcon";
import AccIcon from "../../../../global/Icons/CryptoMarketIcons/AccIcon";
import { ArrowRightIcon } from "../../../../global/Icons";
import CommentsIcon from "../../../../global/Icons/CryptoMarketIcons/CommentsIcon";
import TopBuzz from "../../../../global/TopBuzz";
import { useTranslation } from "i18n";

interface IProps {
  data?: ICryptoMarketCategories;
}

const categoryHeaders: Record<string, { title: string; href?: string }> = {
  gainers: { title: "TOP Gainers (24h)", href: "/crypto/gainers" },
  recently: { title: "Recently Added", href: "/crypto/recently" },
  accumulation: {
    title: "Accumulation (24h)",
    href: "/crypto/accumulation",
  },
  trending: { title: "Trending", href: "/crypto/trending" },
  buzz: { title: "Buzz" },
};

const CategoriesTabs: FC<IProps> = ({ data }) => {
  const { translateText } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("gainers");

  const getCurrentHeader = (tab: string): React.ReactNode => {
    const header = categoryHeaders[tab] || categoryHeaders.gainers;
    const translatedTitle = translateText(header.title);

    return (
      <>
        <h3>{translatedTitle}</h3>
        {header.href ? (
          <Link
            className="category-page-link"
            href={header.href}
            aria-label={`${translateText("Open")} ${translatedTitle}`}
          >
            <ArrowRightIcon type="new" />
          </Link>
        ) : null}
      </>
    );
  };

  const getActiveBlock = (tab: string): any => {
    const blocks = {
      recently: {
        title: "Recently Added",
        data: data?.recentlyAdded || [],
        type: "recently",
      },
      gainers: {
        title: "TOP Gainers (24h)",
        data: data?.topGainers || [],
        type: "gainers",
      },
      trending: {
        title: "Trending",
        data: data?.trending || [],
        type: "trending",
      },
      accumulation: {
        title: "Accumulation (24h)",
        data: data?.accumulation || [],
        type: "accumulation",
      },
    };

    switch (tab) {
      case "gainers":
        return blocks.gainers;
      case "recently":
        return blocks.recently;
      case "trending":
        return blocks.trending;
      case "accumulation":
        return blocks.accumulation;
      default:
        return blocks.gainers;
    }
  };

  return (
    <CardsWrapper className="column shadow-card" variant="main">
      <Header>
        <div className="header-left">{getCurrentHeader(activeTab)}</div>
        <div className="header-actions">
          <button onClick={() => setActiveTab("gainers")}>
            <GainersIcon isActive={activeTab === "gainers"} />
          </button>
          <button onClick={() => setActiveTab("accumulation")}>
            <AccIcon isActive={activeTab === "accumulation"} />
          </button>
          <button onClick={() => setActiveTab("recently")}>
            <RecentlyIcon isActive={activeTab === "recently"} />
          </button>
          <button onClick={() => setActiveTab("trending")}>
            <TrendingIcon isActive={activeTab === "trending"} />
          </button>
          <button onClick={() => setActiveTab("buzz")}>
            <CommentsIcon isActive={activeTab === "buzz"} />
          </button>
        </div>
      </Header>
      <div className="body">
        {activeTab === "buzz" ? (
          <TopBuzz />
        ) : (
          <RecentlyAdded
            data={getActiveBlock(activeTab).data}
            onClick={() => {}}
            type={getActiveBlock(activeTab).type}
          />
        )}
      </div>
    </CardsWrapper>
  );
};

export default CategoriesTabs;
