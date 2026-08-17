import { Info, PlusIcon, Bell } from "lucide-react";
import React, { useState, useEffect } from "react";
import BreadCrumbs from "../../global/BreadCrumbs";
import { Button } from "../../global/common/Button";
import AnalyticsIcon from "../../global/Icons/AnalyticsIcon";
import MarketplaceIcon from "../../global/Icons/MarketplaceIcon";
import ArenaTabIcon from "../../global/Icons/ArenaTabIcon";
import DuelsTabIcon from "../../global/Icons/DuelsTabIcon";
import LeaguesTabIcon from "../../global/Icons/LeaguesTabIcon";
import { PageWrapper } from "../projects/Connection/styles";
import PromotedDeals from "../projects/OTC/PromotedDeals";
import { PageHeaderWrapper } from "../projects/OTC/styles";
import {
  HeaderWrapper,
  TitleWrapper,
  FilterWrapper,
  TabsBar,
  TabsLeft,
  TabButton,
  RightBar,
  BellWrapper,
  StatusPill,
  SeasonWrapper,
} from "./styles";
import ArenaSearch from "./ArenaSearch";
import ArenaSort, { ArenaSortType } from "./ArenaSort";
import ArenaFilter from "./ArenaFilter";
import { ArenaTab } from "./arena-tab";
import { LeaguesTab } from "./LeaguesTab";
import { DuelsTab } from "./DuelsTab";
import CustomDropdown from "../../UI/CustomDropdown";
import { NotificationsPanelComponent } from "./notification-panel/NotificationsPanel";
import { CreatePredictionModal } from "./create-prediction-modal/CreatePredictionModal";
import { CreateDuelModal } from "./create-duel-modal/CreateDuelModal";

const crumbs = [
  { title: "Utility", link: "/utility" },
  { title: "FOMO Arena", link: "/utility/arena" },
];

const seasonOptions = [
  { value: "Q1 2026", label: "Q1 2026" },
  { value: "Q4 2025", label: "Q4 2025" },
  { value: "Q3 2025", label: "Q3 2025" },
  { value: "Q2 2025", label: "Q2 2025" },
];

export const Arena: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const [isSearch, setIsSearch] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [sortBy, setSortBy] = useState<ArenaSortType>("live");
  const [filters, setFilters] = useState<any>(null);
  const [tab, setTab] = useState<"arena" | "duels" | "leagues">("arena");
  const [selectedSeason, setSelectedSeason] = useState<string>("Q1 2026");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreatePredictionOpen, setIsCreatePredictionOpen] = useState(false);
  const [isCreateDuelOpen, setIsCreateDuelOpen] = useState(false);

  const handleTabChange = (newTab: "arena" | "duels" | "leagues") => {
    setTab(newTab);
    if (newTab === "duels") {
      setSortBy("ends_soon");
    } else if (newTab === "arena") {
      setSortBy("live");
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <PageWrapper>
      <BreadCrumbs items={crumbs} />

      <PageHeaderWrapper
        className="arena"
        style={{
          marginTop: "20px",
          width: "100%",
          flexWrap: isMobile ? "wrap" : "nowrap",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: isMobile ? "flex-start" : "space-between",
          flexDirection: "row",
        }}
      >
        <HeaderWrapper>
          <TitleWrapper>
            <button className="tooltip-button">
              <Info size={16} color="#738094" />
              <span
                className="tooltip-text right"
                style={{
                  width: 200,
                  whiteSpace: "wrap",
                }}
              >
                Predict the outcomes of upcoming TGEs and compete with others.
                Forecast token launch price, ROI, and listing success to earn
                points, badges, and climb the leaderboard. <br /> Turn your
                market intuition into results and prove your edge in the
                ultimate prediction arena.
              </span>
            </button>
            <h1>FOMO Arena</h1>
            <div className="ad">
              <PromotedDeals isSearch={isSearch} setIsSearch={setIsSearch} />
            </div>
          </TitleWrapper>
        </HeaderWrapper>
        <ArenaSearch
          isSearch={isSearch}
          setIsSearch={setIsSearch}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
        <ArenaSort sortBy={sortBy} setSortBy={setSortBy} tab={tab} />
        <ArenaFilter
          filterDataInitial={filters}
          onSave={(filtersData: any) => setFilters(filtersData)}
          onReset={() => setFilters(null)}
          tab={tab}
        />
        <FilterWrapper>
          <div className="right">
            <Button
              className="analytics-button"
              variant={"outlined"}
              onClick={() => { }}
            >
              <AnalyticsIcon />
              Analytics
            </Button>
            <Button
              className="marketplace-button"
              variant={"outlined"}
              onClick={() => { }}
            >
              <MarketplaceIcon />
              Marketplace
            </Button>
            <Button
              className="create-prediction"
              variant={"outlined"}
              onClick={() => setIsCreatePredictionOpen(true)}
            >
              <PlusIcon size={16} /> Create Prediction
            </Button>
          </div>
        </FilterWrapper>
      </PageHeaderWrapper>
      <TabsBar>
        <TabsLeft>
          <TabButton
            active={tab === "arena"}
            onClick={() => handleTabChange("arena")}
            className="tab-fill"
          >
            <ArenaTabIcon className="arena-icon" /> Arena
          </TabButton>
          <TabButton
            active={tab === "duels"}
            className="tab-stroke"
            onClick={() => handleTabChange("duels")}
          >
            <DuelsTabIcon /> Duels
          </TabButton>
          <TabButton
            active={tab === "leagues"}
            onClick={() => handleTabChange("leagues")}
          >
            <LeaguesTabIcon /> Analyst Leagues
          </TabButton>
        </TabsLeft>
        <RightBar>
          {tab === "duels" && (
            <>
              <SeasonWrapper>
                <CustomDropdown
                  options={seasonOptions}
                  value={selectedSeason}
                  onChange={(value) => setSelectedSeason(value as string)}
                  placeholder="Select season"
                  searchable={false}
                  isShowSuccess={false}
                >
                  <span className="label">Season:</span>
                </CustomDropdown>
              </SeasonWrapper>
              <Button
                className="create-prediction"
                variant={"outlined"}
                onClick={() => setIsCreateDuelOpen(true)}
              >
                <PlusIcon size={16} /> Create Duel
              </Button>
            </>
          )}
          <div
            style={{
              position: "relative",
            }}
          >
            <BellWrapper
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              id="notifications-button"
            >
              <Bell size={16} color="#738094" />
              <span className="badge">2</span>
            </BellWrapper>
            <NotificationsPanelComponent
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
            />
          </div>
          <StatusPill>
            <span className="dot" /> Q1 2026 Live
          </StatusPill>
        </RightBar>
      </TabsBar>
      {tab === "arena" && <ArenaTab />}
      {tab === "duels" && <DuelsTab />}
      {tab === "leagues" && <LeaguesTab />}

      <CreatePredictionModal
        isOpen={isCreatePredictionOpen}
        onClose={() => setIsCreatePredictionOpen(false)}
      />
      <CreateDuelModal
        isOpen={isCreateDuelOpen}
        onClose={() => setIsCreateDuelOpen(false)}
      />
    </PageWrapper>
  );
};
