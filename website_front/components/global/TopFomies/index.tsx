import React from "react";
import { Body, Header, ListItem } from "./styles";
import { ArrowRightIcon } from "../Icons";
import EntityInfo from "../common/EntityInfo";
import { useQuery } from "react-query";
import fetchItems from "../../../http/fetchItems";
import Placeholder from "../common/Placeholder";

const TopFomies = () => {
  const { data, isLoading } = useQuery(
    ["fomies"],
    () => fetchItems(`user/fomonauts/all?offset=0&limit=5`),
    {
      refetchOnWindowFocus: false,
    }
  );

  return isLoading ? (
    <Placeholder height="100%" />
  ) : (
    <Body>
      {data?.data?.users?.map((item: any, i: number) => {
        return (
          <ListItem key={item._id}>
            <EntityInfo
              img={String(item.photo || item.twitterData?.photo)}
              name={item.name || item.twitterData?.name || "-"}
              username="Caldera"
              niche={item.rank || ""}
              variant="success"
              rating={94}
            />
            <div className="info">
              <div className="info-item">
                <div>XP</div>
                <span>{item.activityXP || 0}</span>
              </div>
              <div className="info-item">
                <div>Followers</div>
                <span>{item.followers?.length || 0}</span>
              </div>
            </div>
          </ListItem>
        );
      })}
    </Body>
  );
};

export default TopFomies;
