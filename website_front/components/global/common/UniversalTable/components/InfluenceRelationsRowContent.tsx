import React from "react";
import {
  FollowersDisplay,
  ProjectData,
  ScoreProgress,
  imageLoader,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const InfluenceRelationsRowContent = ({
  item,
  onFollowersClick,
}: UniversalTableCaseProps) => {
  return (
    <>
      <ProjectData
        style={{
          backgroundColor: "#fff",
          zIndex: 101,
          height: "100%",
        }}
      >
        <UserAvatar
          size="xSmall"
          variant="default"
          avatar={imageLoader(item.accountLogo)}
          name={item.account}
        />
        <div className="project-row-data">
          <p>
            {item.account.length > 25 ? `${item.account.slice(0, 22)}...` : item.account}
          </p>
        </div>
      </ProjectData>
      <div>
        <FollowersDisplay
          followers={item.followersList || []}
          type="followers"
          onClick={() => onFollowersClick?.("followers", item.followersList || [], item.account)}
        />
      </div>
      <div>
        <FollowersDisplay
          followers={item.followingList || []}
          type="following"
          onClick={() => onFollowersClick?.("following", item.followingList || [], item.account)}
        />
      </div>
      <div style={{ fontSize: "14px", color: "#070B35" }}>{item.audienceIntersection}</div>
      <div style={{ fontSize: "14px", color: "#070B35" }}>{item.engagementRate}</div>
      <div>
        <ScoreProgress
          score={item.xScore}
          maxScore={1000}
          change={item.xScoreChange}
          lineWeight={2}
          isSmall
        />
      </div>
    </>
  );
};

export default InfluenceRelationsRowContent;
