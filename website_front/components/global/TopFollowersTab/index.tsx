import React, { FC } from "react";
import { Wrapper } from "./styles";
import { Investor } from "../../../types/global_types";
import Link from "next/link";
import imageLoader from "../../../helpers/imageLoader";
import RatingCircle from "../RatingCircle";
import UserAvatar from "../common/UserAvatar";
import EmptyList from "../EmptyList";
import { clarifyAmount } from "../../../helpers/clarifyAmount";
import EmptySection from "../EmptySection";

interface IProps {
  followers?: Array<any>;
}

const TopFollowersTab: FC<IProps> = ({ followers }) => {
  return (
    <Wrapper variant="main">
      {followers?.length ? (
        followers.map((item: any) => {
          const avatar = item.avatar || item.logo || item.image || "";
          const username = String(item.username || item.handle || "").replace(/^@/, "");
          const followersCount = item.followersCount || item.followers || 0;
          return (
            <Link key={item.id || username || item.name} href={item.url || "#"}>
              <div className="item">
                <UserAvatar
                  variant="default"
                  size="otc"
                  avatar={imageLoader(String(avatar))}
                  name={item.name}
                />
                <div className="info">
                  <div className="name">
                    <span>{item.name}</span>
                    {item.isLead ? <div className="lead">Lead</div> : <></>}
                  </div>
                  <div className="description">{username ? `@${username}` : ""}</div>
                </div>
              </div>
              <div className="followers">
                {clarifyAmount(followersCount, false, "k")}
              </div>
            </Link>
          );
        })
      ) : (
        <EmptySection />
      )}
    </Wrapper>
  );
};

export default TopFollowersTab;
