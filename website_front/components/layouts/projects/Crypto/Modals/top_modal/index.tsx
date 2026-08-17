import React, { FC, useEffect, useMemo, useState } from "react";
import MainModal from "../../../../../global/common/MainModal";
import { Item, List, TabButton, Tabs } from "./styles";
import { SearchInput } from "../../../P2PExchange/TopMembers/styles";
import { SearchIconStyle, SearchWrapper } from "../../../Networks/styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import moment from "moment";
import EmptyList from "../../../../../global/EmptyList";
import RatingCircle from "../../../../../global/RatingCircle";

export type TopModalVariants = "Top Followers" | "Projects" | "Funds";

export interface TopModalInterface {
  onClose: () => void;
  isVisible: boolean;
  initialTab: TopModalVariants;
  followers?: Array<any>;
  projects?: Array<any>;
  funds?: Array<any>;
  title?: string;
  tabs?: Array<TopModalVariants>;
}

const defaultTabs: Array<TopModalVariants> = ["Top Followers", "Projects", "Funds"];

const getItemName = (item: any): string => {
  return String(item?.name || item?.username || item?.slug || item?.investorSlug || "-");
};

const getItemImage = (item: any): string => {
  return String(item?.avatar || item?.logo || item?.image || item?.metadataLogo || "");
};

const getFundType = (item: any): string => {
  return String(item?.ventureType || item?.type || item?.entityType || "fund");
};

const getItemNiche = (item: any): string => {
  return String(item?.niche || item?.metadata?.rawType || getFundType(item));
};

const getItemRating = (item: any): number => {
  const rating = Number(item?.rating ?? item?.fomoScore ?? 0);

  if (!Number.isFinite(rating)) return 0;
  return rating;
};

const getFundHref = (item: any): string => {
  if (item?.url) return String(item.url);

  const id = String(item?.slug || item?.investorSlug || item?._id || item?.id || "").trim();
  if (!id) return "#";

  const type = getFundType(item).toLowerCase();
  const route = type.includes("person") || type.includes("angel")
    ? "persons"
    : "funds";

  return `/crypto/${route}/${encodeURIComponent(id)}`;
};

const getItemHref = (item: any, activeTab: TopModalVariants): string => {
  if (activeTab === "Top Followers") {
    return item?.username ? `https://x.com/${item.username}` : "#";
  }

  if (activeTab === "Funds") {
    return getFundHref(item);
  }

  const id = String(item?.slug || item?._id || item?.id || "").trim();
  return id ? `/echo/${encodeURIComponent(id)}` : "#";
};

const getItemSubtitle = (item: any, activeTab: TopModalVariants): string => {
  if (activeTab === "Top Followers") {
    return item?.username ? `@${item.username}` : "";
  }

  if (activeTab === "Funds") {
    return getItemNiche(item);
  }

  return String(item?.description || item?.category || item?.slug || "");
};

const includesSearch = (value: unknown, search: string): boolean => {
  return String(value || "").toLowerCase().includes(search);
};

const TopModal: FC<TopModalInterface> = ({
  onClose,
  isVisible,
  initialTab,
  followers,
  projects,
  funds,
  title,
  tabs = defaultTabs,
}) => {
  const [activeTab, setActiveTab] = useState<TopModalVariants>(initialTab);
  const [searchValue, setSearchValue] = useState<string>("");
  const visibleTabs = tabs.length ? tabs : defaultTabs;
  const visibleTabsKey = visibleTabs.join("|");

  useEffect(() => {
    if (isVisible) {
      setActiveTab(visibleTabs.includes(initialTab) ? initialTab : visibleTabs[0]);
      setSearchValue("");
    }
  }, [initialTab, isVisible, visibleTabsKey]);

  const getTitleByTab = (): string => {
    if (title) return title;

    const titles = {
      "Top Followers": "Top X Followers",
      Projects: "X Projects",
      Funds: "X Funds",
    };

    return titles[activeTab];
  };

  const filteredList = useMemo(() => {
    const items = {
      "Top Followers": followers || [],
      Projects: projects || [],
      Funds: funds || [],
    };

    const currentList = items[activeTab];

    if (!searchValue.trim()) return currentList;

    return currentList.filter((item) => {
      const lowerSearch = searchValue.toLowerCase();
      return (
        includesSearch(item.name, lowerSearch) ||
        includesSearch(item.username, lowerSearch) ||
        includesSearch(item.slug, lowerSearch) ||
        includesSearch(item.investorSlug, lowerSearch) ||
        includesSearch(item.niche, lowerSearch) ||
        includesSearch(item.type, lowerSearch) ||
        includesSearch(item.ventureType, lowerSearch)
      );
    });
  }, [activeTab, followers, funds, projects, searchValue]);

  return (
    <MainModal
      variant="big"
      title={getTitleByTab()}
      onClose={onClose}
      isVisible={isVisible}
    >
      {visibleTabs.length > 1 ? (
        <Tabs>
          {visibleTabs.map((item: TopModalVariants) => {
            return (
              <TabButton
                onClick={() => setActiveTab(item)}
                isActive={item === activeTab}
                key={item}
              >
                {item}
              </TabButton>
            );
          })}
        </Tabs>
      ) : (
        <></>
      )}
      <SearchWrapper>
        <SearchInput
          placeholder="Search"
          type="string"
          value={searchValue}
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <List variant="main">
        {filteredList?.length ? (
          filteredList.map((item, index: number) => {
            const href = getItemHref(item, activeTab);
            const isExternalLink = href.startsWith("http");

            return (
              <Item
                target={isExternalLink ? "_blank" : undefined}
                href={href}
                key={item.id || item._id || item.slug || item.investorSlug || index}
                onClick={(event) => {
                  if (href === "#") event.preventDefault();
                }}
              >
                <div className="project">
                  <UserAvatar
                    avatar={imageLoader(getItemImage(item))}
                    name={getItemName(item)}
                    variant="default"
                    size="otc"
                  />
                  <div className="project-info">
                    <div>{getItemName(item)}</div>
                    <span>{getItemSubtitle(item, activeTab)}</span>
                  </div>
                </div>
                <div className="twitter-info">
                  {activeTab === "Top Followers" ? (
                    <>
                      <div>
                        {clarifyAmount(item.followersCount || 0, false, "k")}{" "}
                        Followers
                      </div>
                      <div>
                        {item.createAt ? String(moment(item.createAt)) : ""}
                      </div>
                    </>
                  ) : (
                    activeTab === "Funds" ? (
                      <RatingCircle
                        rating={getItemRating(item)}
                        variant="success"
                        showPercent={false}
                      />
                    ) : (
                      <>
                        <div>{item?.tier || item?.role || item?.sourceBackerId || ""}</div>
                        <div>{getItemRating(item)}</div>
                      </>
                    )
                  )}
                </div>
              </Item>
            );
          })
        ) : (
          <EmptyList />
        )}
      </List>
    </MainModal>
  );
};

export default TopModal;
