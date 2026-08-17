import React from "react";
import {
  clarifyAmount,
  getProjectSymbol,
  PercentValue,
  ProjectData,
  imageLoader,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const AccumulationRowContent = ({ item }: UniversalTableCaseProps) => {
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
      <PercentValue isIcon={false} value={Number(item.volumeToMarketCap || 0) * 100} />
      <PercentValue isIcon={false} value={Number(item.volume24hChange || 0)} />
      <PercentValue isIcon={false} value={Number(item.priceChange || item.usdQuote?.percent_change_24h || 0)} />
      <div className="row-bold-value">${clarifyAmount(item.marketCap || 0)}</div>
      <div className="chart7d">
        <img src={imageLoader(item.chart7d || `/${item._id}.png`)} alt={item?.name} loading="lazy" />
      </div>
    </>
  );
};

export default AccumulationRowContent;
