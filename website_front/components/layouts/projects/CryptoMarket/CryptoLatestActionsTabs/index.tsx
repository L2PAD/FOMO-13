import React, { FC, useState } from "react";
import { useRouter } from "next/router";
import { Header, Wrapper } from "./styles";
import { ArrowRightIcon } from "../../../../global/Icons";
import RecentlyIcon from "../../../../global/Icons/CryptoMarketIcons/RecentlyIcon";
import TrendingIcon from "../../../../global/Icons/CryptoMarketIcons/TrendingIcon";
import UnlocksIcon from "../../../../global/Icons/CryptoMarketIcons/UnlocksIcon";
import NewActivities from "../../../../global/NewActivities";
import TrendingTwitterSearch from "../../../../global/TrendingTwitterSearch";
import TopUnlocks from "../../../../global/TopUnlocks";
import FomiesIcon from "../../../../global/Icons/CryptoMarketIcons/FomiesIcon";
import TrendingSearchIcon from "../../../../global/Icons/CryptoMarketIcons/TrendingSearchIcon";
import TopFomies from "../../../../global/TopFomies";
import HotProjects from "../../../../global/HotProjects";
import Placeholder from "../../../../global/common/Placeholder";
import { IProject } from "../../../../../types/global_types";
import { useTranslation } from "i18n";

interface IProps {
  isLoading: boolean;
  projects: Array<IProject>;
  activitiesData?: any;
  activitiesLoading?: boolean;
}

const CryptoLatest: FC<IProps> = ({ isLoading, projects, activitiesData, activitiesLoading }) => {
  const router = useRouter();
  const { translateText } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("activities");

  const getCurrentHeader = (tab: string): React.ReactNode => {
    switch (tab) {
      case "activities":
        return (
          <>
            <h3>{translateText("New Activities")}</h3>
            <button
              type="button"
              aria-label={translateText("View all Earlyland activities")}
              onClick={() => router.push("/crypto/earlyland")}
            >
              <ArrowRightIcon type="new" />
            </button>
          </>
        );
      case "trending":
        return (
          <>
            <h3>{translateText("Trending Search on X")}</h3>
            <button>
              <ArrowRightIcon type="new" />
            </button>
          </>
        );
      case "unlocks":
        return (
          <>
            <h3>{translateText("Token Unlocks")}</h3>
            <button>
              <ArrowRightIcon type="new" />
            </button>
          </>
        );
      case "fomies":
        return (
          <>
            <h3>{translateText("Top Fomies (by Score)")}</h3>
            <button>
              <ArrowRightIcon type="new" />
            </button>
          </>
        );
      case "projects":
        return (
          <>
            <h3>{translateText("Hot Projects")}</h3>
            <button>
              <ArrowRightIcon type="new" />
            </button>
          </>
        );
      default:
        <>
          <h3>{translateText("New Activities")}</h3>
          <button>
            <ArrowRightIcon type="new" />
          </button>
        </>;
    }
  };

  const getCurrentTabBody = (tab: string): React.ReactNode => {
    switch (tab) {
      case "activities":
        return activitiesLoading
          ? <Placeholder width="100%" height="300px" />
          : <NewActivities data={activitiesData} />;
      case "trending":
        return <TrendingTwitterSearch hideHeader />;
      case "unlocks":
        return <TopUnlocks />;
      case "fomies":
        return <TopFomies />;
      case "projects":
        return <HotProjects isLoading={isLoading} projects={projects} />;
      default:
    }
  };

  return (
    <Wrapper variant="main" className="shadow-card">
      <Header>
        <div className="header-left activities">
          {getCurrentHeader(activeTab)}
        </div>
        <div className="header-actions">
          <button onClick={() => setActiveTab("activities")}>
            <RecentlyIcon isActive={activeTab === "activities"} />
          </button>
          <button onClick={() => setActiveTab("projects")}>
            <TrendingIcon isActive={activeTab === "projects"} />
          </button>
          <button onClick={() => setActiveTab("unlocks")}>
            <UnlocksIcon isActive={activeTab === "unlocks"} />
          </button>
          <button onClick={() => setActiveTab("fomies")}>
            <FomiesIcon isActive={activeTab === "fomies"} />
          </button>
          <button onClick={() => setActiveTab("trending")}>
            <TrendingSearchIcon isActive={activeTab === "trending"} />
          </button>
        </div>
      </Header>
      <div className="body">{getCurrentTabBody(activeTab)}</div>
    </Wrapper>
  );
};

export default CryptoLatest;
