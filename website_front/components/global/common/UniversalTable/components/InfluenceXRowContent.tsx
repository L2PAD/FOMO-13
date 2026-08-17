import React from "react";
import {
  FollowersDisplay,
  FomoScore,
  ProjectData,
  RedFlag,
  ScoreProgress,
  imageLoader,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const InfluenceXRowContent = ({
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
      <div
        style={{
          fontSize: "14px",
          color: item.xScoreChange?.includes("+") ? "#05A584" : "#FF5858",
          fontWeight: "var(--font-weight-regular)",
        }}
      >
        {item.xScoreChange}
      </div>
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-regular)" }}>{item.engagementRate}</div>
      <div>
        <ScoreProgress
          score={item.xScore}
          maxScore={1000}
          change={item.xScoreChange}
          lineWeight={2}
          isSmall
        />
      </div>
      <div>
        <RedFlag
          count={item.redFlags || 0}
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row-reverse",
          }}
        />
      </div>
      <div>
        <FomoScore
          star={item.fomoStar}
          score={item.fomoScore}
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        />
      </div>
    </>
  );
};

export default InfluenceXRowContent;
