import React from "react";
import {
  FollowersDisplay,
  ProjectData,
  imageLoader,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const InfluenceTiktokRowContent = ({
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
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-regular)" }}>{item.avgLikes}</div>
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-regular)" }}>{item.engagementRate}</div>
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-regular)" }}>{item.postFreq}</div>
    </>
  );
};

export default InfluenceTiktokRowContent;
