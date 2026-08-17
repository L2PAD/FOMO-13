import React from "react";
import {
  EngagementBadge,
  FomoScore,
  ProjectData,
  RedFlag,
  imageLoader,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const InfluenceTelegramRowContent = ({ item }: UniversalTableCaseProps) => {
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
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-regular)" }}>{item.entityType}</div>
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-regular)" }}>{item.members}</div>
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-regular)" }}>{item.members}</div>
      <div
        style={{
          fontSize: "14px",
          color: item.growth7d?.includes("+") ? "#05A584" : "#FF5858",
          fontWeight: "var(--font-weight-regular)",
        }}
      >
        {item.growth7d}
      </div>
      <div>
        <EngagementBadge level={item.activity || "medium"} />
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
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
          }}
          star={item.fomoStar}
          score={item.fomoScore}
        />
      </div>
    </>
  );
};

export default InfluenceTelegramRowContent;
