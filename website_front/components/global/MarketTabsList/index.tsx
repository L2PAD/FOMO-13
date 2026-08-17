import React, { FC, useContext, useState } from "react";
import MarketTab from "../common/MarketTab";
import HorizontalDotsIcon from "../Icons/HorizontalDots";
import { TabHubModalContext } from "../../layouts/projects/CryptoMarket/tabHub";
import { HeaderTab, ListWrapper, Wrapper } from "./styles";
import { ICryptoTab } from "../../layouts/projects/CryptoMarket/createTabContext";
import { AuthContext, LoadingContext } from "../Layout";
import pinTab from "../../../http/tabhub/pinTab";
import PlaceholderTable from "../common/PlaceholderTable";
import createTab from "../../../http/tabhub/createTab";
import EmptyList from "../EmptyList";

const tabList = [
  {
    name: "Trending",
    description:
      "Displays the most popular and high-performing assets based on recent activity and market interest.",
    date: "Upd 3 weeks ago",
    isAttatchment: true,
  },
  {
    name: "New (7d)",
    description:
      "Shows newly launched assets added in the last 7 days, helping you track fresh opportunities.",
    date: "3 months ago",
    isAttatchment: true,
  },
  {
    name: "Moonshot Tracker",
    description:
      "Monitors newly launched tokens with high growth potential, tracking their volume, FDV, and early investor activity.",
    date: "5 days ago",
    isAttatchment: false,
  },
  {
    name: "Rugpull Radar",
    description:
      "Identifies suspicious projects based on abnormal trading patterns, team activity, and historical scam indicators.",
    date: "7 months ago",
    isAttatchment: false,
  },
  {
    name: "GameFi Heavyweights",
    description:
      "Tracks the most successful blockchain gaming projects, ranking them by DAU, token utility, and investment traction.",
    date: "Upd 3 weeks ago",
    isAttatchment: false,
  },
];

interface IProps {
  tabs: Array<ICryptoTab>;
  isLoading: boolean;
  isError?: boolean;
  refetch: any;
}

const MarketTabsList: FC<IProps> = ({ tabs, isLoading, isError, refetch }) => {
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const { setIsMainModal, setIsDeleteModal, setTab, setIsUpdateTab } =
    useContext(TabHubModalContext);

  const confirmPinTab = async (id: string): Promise<void> => {
    loadingStateHandler(true);

    const { success } = await pinTab(id);

    if (success) {
      await refetch();
    }

    loadingStateHandler(false);
  };

  const confirmDuplicate = async (item: ICryptoTab): Promise<void> => {
    loadingStateHandler(true);

    const data: ICryptoTab = {
      includedAssets: item.includedAssets.map((item: any) => item._id),
      excludedAssets: item.excludedAssets.map((item: any) => item._id),
      tabs: item.tabs,
      name: item.name,
      description: item.description,
      image: item.image,
      isPublic: item.isPublic,
      saved: [],
      pined: [],
    };

    const { isSuccess } = await createTab(data);

    if (isSuccess) {
      await refetch();
    }

    loadingStateHandler(false);
  };

  return (
    <Wrapper>
      <HeaderTab>
        <div className="left-column">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M5.5 15.5V9.79402C5.5 9.2688 5.94772 8.84303 6.5 8.84303H9.5C10.0523 8.84303 10.5 9.2688 10.5 9.79402V15.5M7.42048 0.675976L0.920476 5.07169C0.65668 5.25009 0.5 5.53888 0.5 5.84671V14.0735C0.5 14.8613 1.17157 15.5 2 15.5H14C14.8284 15.5 15.5 14.8613 15.5 14.0735V5.84671C15.5 5.53888 15.3433 5.25009 15.0795 5.07169L8.57952 0.675977C8.23257 0.441341 7.76744 0.441341 7.42048 0.675976Z"
              stroke="#738094"
              strokeLinecap="round"
            />
          </svg>
          <span>Full Market</span>
        </div>
        <button>
          <HorizontalDotsIcon />
        </button>
      </HeaderTab>
      <ListWrapper>
        {isLoading ? (
          <PlaceholderTable height="90px" />
        ) : isError ? (
          <div>Failed to load tabs. Please try again.</div>
        ) : tabs?.length ? (
          tabs.map((item: ICryptoTab, i: number) => {
            return (
              <MarketTab
                key={i}
                tab={item}
                isPinned={
                  item.isPinned ?? item.pined.includes(userData._id || "")
                }
                onDelete={(tab: ICryptoTab) => {
                  setIsMainModal(false);
                  setIsDeleteModal(true);
                  setTab(tab);
                }}
                onUpdate={(tab: ICryptoTab) => {
                  setIsMainModal(false);
                  setIsUpdateTab(true);
                  setTab(tab);
                }}
                confirmPin={confirmPinTab}
                confirmDuplicate={confirmDuplicate}
              />
            );
          })
        ) : (
          <>
            <EmptyList />
            <br />
          </>
        )}
      </ListWrapper>
    </Wrapper>
  );
};

export default MarketTabsList;
