import React from "react";
import {
  EntityInfo,
  Image,
  LikeWrapper,
  OtcLike,
  RedFlag,
  SocialLinks,
  StarIcon,
  getServiceByUrl,
  sliceAddress,
  type UniversalTableCaseProps,
} from "./shared";

const getNftCount = (item: any): string | number => {
  const value = item?.spaceportNftCount ?? item?.nftsValue;

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : "-";
};

const FomonautsRowContent = ({ item }: UniversalTableCaseProps) => {
  return (
    <>
      <EntityInfo
        img={item?.photo ? item.photo : item?.twitterData?.photo || item?.discordData?.photo}
        name={item?.name || item?.twitterData?.name || "-"}
        username={item?.username || item?.twitterData?.username || item?.discordData?.username}
        rating={Number(item.rating || 0)}
        variant="success"
      />
      <div style={{ fontSize: "14px" }} className="row-default-value">
        {sliceAddress(item?.wallet)}
      </div>
      <div style={{ fontSize: "14px" }} className="row-default-value">
        {item?.followers?.length || 0}
      </div>
      <div style={{ fontSize: "14px" }} className="row-default-value">
        {getNftCount(item)}
      </div>
      <div className="row-bold-value">{item?.rank || "Stellar Awakening"}</div>
      <div
        style={{
          fontSize: "14px",
          textAlign: "center",
          paddingRight: "15px",
        }}
        className="row-default-value gray-color"
      >
        {item?.activityXP || 0} xp
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          maxWidth: "100%",
          transform: "translateX(-10%)",
        }}
      >
        {item?.verificationStatus ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M17 9L9.54217 15L7 12.9548"
              stroke="#04A584"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 8L8 16M16 16L8 8" stroke="#FF5858" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className="row-bold-value">
        <RedFlag className="reverse" count={item.redFlags || 0} />
      </div>
      <div style={{ marginLeft: "10px" }} className="rating-likes">
        <LikeWrapper>
          <span>{item?.rating || 0}</span>
          <StarIcon fill="#FFC702" />
        </LikeWrapper>
        <LikeWrapper className="like-value">
          <span>{item?.likes?.length || 0}</span>
          <Image src={OtcLike} alt="otc like" />
        </LikeWrapper>
      </div>
      <SocialLinks
        limit={3}
        links={Object.values(item?.socialNetworks || {})?.map((socialItem: any) => {
          return {
            key: getServiceByUrl(socialItem),
            href: socialItem,
          };
        })}
      />
    </>
  );
};

export default FomonautsRowContent;
