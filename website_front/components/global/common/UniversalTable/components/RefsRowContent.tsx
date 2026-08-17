import React from "react";
import {
  ProjectData,
  imageLoader,
  moment,
  sliceAddress,
  StatusTag,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const RefsRowContent = ({ item }: UniversalTableCaseProps) => {
  return (
    <>
      <ProjectData>
        <UserAvatar
          size="small"
          variant="default"
          avatar={item.photo ? imageLoader(String(item.photo)) : item.twitterData?.photo}
          name={item.name}
        />
        <div className="project-row-data">
          <p>
            {(item?.name?.length || 0) > 20
              ? `${item?.name?.slice(0, 15)}...`
              : item?.name}
          </p>
          <span>{sliceAddress(item?.wallet)}</span>
        </div>
      </ProjectData>
      <div className="row-default-value green-color">
        {item?.username
          ? `@${item?.username}`
          : `@${item.twitterData?.username || item.discordData?.username}`}
      </div>
      <div className="row-default-value">{sliceAddress(item?.wallet || "-")}</div>
      <div className="row-default-value">{item?.fomoId || "-"}</div>
      <div className="row-default-value">{moment(item.createAt).format("ll")}</div>
      <StatusTag type="project-table" variant={item?.banned ? "inactive" : "active"} />
      <div className="row-default-value">{item.refLvlOne?.length || 0}</div>
    </>
  );
};

export default RefsRowContent;
