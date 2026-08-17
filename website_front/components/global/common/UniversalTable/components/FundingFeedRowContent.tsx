import React from "react";
import UsersRow from "../../../UsersRow";
import {
  clarifyAmount,
  HighlightedText,
  Image,
  imageLoader,
  LikeWrapper,
  moment,
  OtcLike,
  ProjectData,
  RedFlag,
  StarIcon,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const FundingFeedRowContent = ({
  item,
  searchValue = "",
  onFundingFeedInvestorsClick,
}: UniversalTableCaseProps) => {
  const fundsRaised = Number(item.totalRaised || item?.fundsRaised || 0);
  const preValuation = Number(item.valuation || item.preValuation || 0);
  const investors = item?.investors || [];
  const highlight = (value?: string | number | null) => (
    <HighlightedText
      text={value === undefined || value === null || value === "" ? "-" : String(value)}
      searchValue={searchValue}
      highlightAll
    />
  );

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
          <p>{highlight(item.name)}</p>
          <span>{highlight(item.niche)}</span>
        </div>
      </ProjectData>
      <div>{highlight(item.type)}</div>
      <div className="row-bold-value">
        {fundsRaised > 0 ? `${clarifyAmount(fundsRaised)}$` : "--"}
      </div>
      <div className="row-bold-value">
        {preValuation > 0 ? `${clarifyAmount(preValuation)}$` : "--"}
      </div>
      <div>
        {investors.length ? (
          <UsersRow
            users={investors}
            onUsersNumberClick={
              investors.length > 5 && onFundingFeedInvestorsClick
                ? () => onFundingFeedInvestorsClick(investors, item)
                : undefined
            }
          />
        ) : (
          "--"
        )}
      </div>
      <div>{highlight(item?.mainCategory?.name)}</div>
      <div>
        {highlight(item?.lastFunding ? moment(item.lastFunding).format("MMM D, YYYY") : "-")}
      </div>
      <div>{item.hasToken ? "Yes" : "No"}</div>
      <div>
        <RedFlag count={item.redFlagsList?.length} />
      </div>
      <LikeWrapper>
        <span>{item.fomoScore || 0}</span>
        <StarIcon fill="#FFC702" />
      </LikeWrapper>
      <LikeWrapper>
        <span>{item.likes || 0}</span>
        <Image src={OtcLike} alt="otc like" />
      </LikeWrapper>
    </>
  );
};

export default FundingFeedRowContent;
