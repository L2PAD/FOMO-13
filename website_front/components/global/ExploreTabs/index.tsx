import React, { FC, useContext, useState } from "react";
import MarketTab from "../common/MarketTab";
import { Tabs, Tab, Wrapper, TabsList } from "./styles";
import ExploreTab from "../common/ExploreTab";
import { ICryptoTab } from "../../layouts/projects/CryptoMarket/createTabContext";
import { AuthContext, LoadingContext } from "../Layout";
import saveTab from "../../../http/tabhub/saveTab";
import PlaceholderTable from "../common/PlaceholderTable";
import EmptyList from "../EmptyList";
import { FOMO_ADMIN_ICON_URL } from "../../../config/fomoAdminIcon";

const tabList = [
  {
    name: "Trending",
    description:
      "Displays the most popular and high-performing assets based on recent activity and market interest.",
    date: "Upd 3 weeks ago",
    isSaved: true,
    logo: FOMO_ADMIN_ICON_URL,
    username: "FOMO",
  },
  {
    name: "New (7d)",
    description:
      "Shows newly launched assets added in the last 7 days, helping you track fresh opportunities.",
    date: "3 months ago",
    isSaved: true,
    logo: "/210ca9920034759f62b20456eaac22aa.png",
    username: "@dimadev",
  },
  {
    name: "Moonshot Tracker",
    description:
      "Monitors newly launched tokens with high growth potential, tracking their volume, FDV, and early investor activity.",
    date: "5 days ago",
    isSaved: false,
    logo: "/272b7d3ba373e0eaa0df3d5580dd4364.png",
    username: "@cryptomagic",
  },
  {
    name: "Rugpull Radar",
    description:
      "Identifies suspicious projects based on abnormal trading patterns, team activity, and historical scam indicators.",
    date: "7 months ago",
    isSaved: false,
    logo: FOMO_ADMIN_ICON_URL,
    username: "@vanykonok",
  },
  {
    name: "GameFi Heavyweights",
    description:
      "Tracks the most successful blockchain gaming projects, ranking them by DAU, token utility, and investment traction.",
    date: "Upd 3 weeks ago",
    isSaved: false,
    logo: "/210ca9920034759f62b20456eaac22aa.png",
    username: "@dimadev",
  },
  {
    name: "Rugpull Radar",
    description:
      "Identifies suspicious projects based on abnormal trading patterns, team activity, and historical scam indicators.",
    date: "7 months ago",
    isSaved: false,
    logo: FOMO_ADMIN_ICON_URL,
    username: "@vanykonok",
  },
  {
    name: "Bear Market",
    date: "7 months ago",
    isSaved: false,
    logo: FOMO_ADMIN_ICON_URL,
    username: "@cryptomagic",
  },
];

interface IProps {
  isLoading: boolean;
  isError?: boolean;
  tabs: Array<ICryptoTab>;
  activeSubtype: string;
  setActiveSubtype: (value: string) => void;
  refetch: any;
}

const ExploreTabs: FC<IProps> = ({
  isLoading,
  isError,
  tabs,
  activeSubtype,
  setActiveSubtype,
  refetch,
}) => {
  const { loadingStateHandler } = useContext(LoadingContext);
  const { userData } = useContext(AuthContext);

  const confirmSaveTab = async (tabId: string): Promise<void> => {
    loadingStateHandler(true);

    const { isSuccess } = await saveTab(tabId);

    isSuccess && (await refetch());

    loadingStateHandler(false);
  };

  return (
    <Wrapper>
      <Tabs>
        <Tab
          onClick={() => setActiveSubtype("Trending Tabs")}
          isActive={activeSubtype === "Trending Tabs"}
        >
          Trending Tabs
        </Tab>

        <Tab
          onClick={() => setActiveSubtype("New")}
          isActive={activeSubtype === "New"}
        >
          New
        </Tab>
      </Tabs>
      <TabsList>
        {isLoading ? (
          <PlaceholderTable height="90px" />
        ) : isError ? (
          <div>Failed to load tabs. Please try again.</div>
        ) : tabs?.length ? (
          tabs.map((item: ICryptoTab, i: number) => {
            return (
              <ExploreTab
                key={i}
                tab={item}
                isSaved={item.isSaved ?? item.saved.includes(userData._id)}
                confirmSave={confirmSaveTab}
              />
            );
          })
        ) : (
          <EmptyList />
        )}
      </TabsList>
    </Wrapper>
  );
};

export default ExploreTabs;
