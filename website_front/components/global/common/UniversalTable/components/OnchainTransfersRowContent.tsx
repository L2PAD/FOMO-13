import React from "react";
import { ProjectData, imageLoader, type UniversalTableCaseProps, UserAvatar } from "./shared";

const OnchainTransfersRowContent = ({ item }: UniversalTableCaseProps) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <img
          src={item.tokenLogo}
          alt={item.token}
          style={{ width: "20px", height: "20px", borderRadius: "50%" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div style={{ fontSize: "14px", color: "#738094" }}>{item.time}</div>
      <ProjectData className="sticky-column second">
        {item.fromLogo ? (
          <UserAvatar
            size="small"
            variant="default"
            avatar={imageLoader(item.fromLogo)}
            name={item.from}
          />
        ) : (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#E8EAF0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              color: "#738094",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            {item.from.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="project-row-data">
          <p>{item.from.length > 20 ? `${item.from.slice(0, 17)}...` : item.from}</p>
        </div>
      </ProjectData>
      <ProjectData>
        {item.toLogo ? (
          <UserAvatar
            size="small"
            variant="default"
            avatar={imageLoader(item.toLogo)}
            name={item.to}
          />
        ) : (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#E8EAF0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              color: "#738094",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            {item.to.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="project-row-data">
          <p>{item.to.length > 20 ? `${item.to.slice(0, 17)}...` : item.to}</p>
        </div>
      </ProjectData>
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-medium)" }}>{item.value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {item.tokenLogo && (
          <img
            src={item.tokenLogo}
            alt={item.token}
            style={{ width: "20px", height: "20px", borderRadius: "50%" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <span style={{ fontSize: "14px", color: "#070B35" }}>{item.token}</span>
      </div>
      <div style={{ fontSize: "14px", color: "#070B35", fontWeight: "var(--font-weight-medium)" }}>{item.usd}</div>
      <div style={{ fontSize: "14px", color: "#738094" }}>{item.score}</div>
    </>
  );
};

export default OnchainTransfersRowContent;
