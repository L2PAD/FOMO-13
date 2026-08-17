import React from "react";
import {
  clarifyAmount,
  getServiceByUrl,
  imageLoader,
  ISocialMediaItem,
  ProjectData,
  SocialLinks,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const FundsRowContent = ({ item }: UniversalTableCaseProps) => {
  return (
    <>
      <ProjectData>
        <UserAvatar
          size="otc"
          variant="default"
          avatar={imageLoader(String(item.logo) || "")}
          name={item.name}
          fallbackType="project"
        />
        <div>
          <p>{item.name}</p>
          <span>{item.niche}</span>
        </div>
      </ProjectData>
      <div className="row-bold-value">${clarifyAmount(item.investAmount || 0, true)}</div>
      <div className="row-bold-value">{item?.binanceListing?.totalProjects || 0}</div>
      <div className="row-bold-value">{item?.regionData?.region || item?.country || "-"}</div>
      <div className="row-bold-value">
        {item?.foundedDate ? new Date(item.foundedDate).getFullYear() : "-"}
      </div>
      <SocialLinks
        limit={4}
        links={
          Array.isArray(item?.socialmedia)
            ? item?.socialmedia?.map((socialItem: ISocialMediaItem) => {
              return {
                key: getServiceByUrl(socialItem.href),
                href: socialItem.href,
              };
            })
            : []
        }
      />
    </>
  );
};

export default FundsRowContent;
