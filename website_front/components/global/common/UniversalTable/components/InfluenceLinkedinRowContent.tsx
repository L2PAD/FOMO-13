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

const InfluenceLinkedinRowContent = ({ item }: UniversalTableCaseProps) => {
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
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-regular)" }}>{item.companySize}</div>
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-regular)" }}>{item.publicFollowers}</div>
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

export default InfluenceLinkedinRowContent;
