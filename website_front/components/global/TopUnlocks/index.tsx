import React from "react";
import { ActivityItem, Body, Header, SliderContainer, Wrapper } from "./styles";
import { ArrowRightIcon } from "../Icons";
import EntityInfo from "../common/EntityInfo";
import UsersRow from "../UsersRow";
import { useQuery } from "react-query";
import fetchTokenUnlocks from "../../../http/unlocks/fetchTokenUnlocks";
import EmptyList from "../EmptyList";
import Placeholder from "../common/Placeholder";
import TrendingTwitterSearch from "../TrendingTwitterSearch";

const items = [
  {
    _id: "686d5ca50a980894b786e4a2",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca50a980894b786e4a7",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4ac",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4b0",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4ba",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4c2",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4c8",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4cd",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
];

const TopUnlocks = () => {
  const { data, isLoading } = useQuery(
    "token-unlocks",
    () => fetchTokenUnlocks(),
    {
      refetchOnWindowFocus: false,
    }
  );

  return isLoading ? (
    <Placeholder height="100%" />
  ) : (
    <Body>
      {data?.unlocks?.length ? (
        data.unlocks.slice(0, 5).map((item: any) => {
          const name = item.detailed?.name || item.coinSlug;
          const symbol = String(item.coinSymbol || item?.detailed?.symbol || "")
            .trim()
            .toUpperCase();
          const logo = item.detailed?.image;
          const description = `Unlocking progress: ${item.totalTokensUnlockedPercent.toFixed(2)}% unlocked / ${item.totalTokensLockedPercent.toFixed(2)}% locked`;
          const allocationTag = item.detailed?.mainCategory?.name || "General";

          return (
            <ActivityItem key={item._id}>
              <EntityInfo
                img={logo}
                name={name}
                username={symbol}
                niche={symbol}
                variant="default"
                fallbackType="project"
              />
              <div className="text">{description}</div>
              <div className="users">
                <div className="value">
                  {item.fdv
                    ? `$${(item.fdv / 1_000_000).toFixed(2)}` + "M"
                    : "—"}
                </div>
                {/* <UsersRow
                                        users={Array(6).fill({ logo: '/inv-avatar.jpg', name: '' })}
                                    /> */}
              </div>
              <div className="tag">{allocationTag}</div>
            </ActivityItem>
          );
        })
      ) : (
        <>
          <br />
          <EmptyList />
        </>
      )}
    </Body>
  );
};

export default TopUnlocks;
