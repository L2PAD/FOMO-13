import React from "react";
import {
  clarifyAmount,
  getCirculatingSupplyProgress,
  getProjectSymbol,
  imageLoader,
  moment,
  PriceChangeCell,
  ProgressBar,
  ProjectData,
  simplifyAmount,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const RecentlyRowContent = ({ item }: UniversalTableCaseProps) => {
  const symbol = getProjectSymbol(item);

  return (
    <>
      <ProjectData>
        <UserAvatar
          size="small"
          variant="default"
          avatar={imageLoader(String(item.logo))}
          name={item.name}
          fallbackType="project"
        />
        <div className="project-row-data">
          <p>
            {(item?.name?.length || 0) > 20
              ? `${item?.name?.slice(0, 15)}...`
              : item?.name}
          </p>
          <span>{symbol}</span>
        </div>
      </ProjectData>
      <div>${simplifyAmount(Number(item.price || 0), 2)}</div>
      <PriceChangeCell value={item.usdQuote?.percent_change_1h} />
      <PriceChangeCell value={item.usdQuote?.percent_change_24h} />
      <PriceChangeCell value={item.usdQuote?.percent_change_7d} />
      <div>${clarifyAmount(item.marketCap || 0)}</div>
      <div>
        <p>${clarifyAmount(item.volume24h || 0)}</p>
      </div>
      <div>
        <p>
          {simplifyAmount(item.circulatingSupply || 0, 0)} {symbol}
        </p>
        <ProgressBar progress={getCirculatingSupplyProgress(item)}>
          <div />
        </ProgressBar>
      </div>
      <div>
        <div>{moment(item.dateAdded).startOf("day").fromNow()}</div>
      </div>
    </>
  );
};

export default RecentlyRowContent;
