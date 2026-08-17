import React, { FC, useMemo } from "react";
import NextLink from "next/link";
import { useQuery } from "react-query";
import {
  Asset,
  Assets,
  Header,
  PriceInfo,
  ProjectData,
  Wrapper,
} from "./styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import { IFund } from "../../../../../../types/global_types";
import EmptySection from "../../../../../global/EmptySection";
import { useTranslation } from "i18n";
import fetchFundsBySlugs from "../../../../../../http/funds/fetchFundsBySlugs";

const toFiniteNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const firstFiniteNumber = (...values: any[]): number | null => {
  for (const value of values) {
    const parsed = toFiniteNumber(value);
    if (parsed !== null) return parsed;
  }

  return null;
};

const formatInvestmentCount = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed || parsed <= 0) return "-";

  return String(Math.round(parsed));
};

const formatRoi = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed) return "-";
  if (Math.abs(parsed) <= 20)
    return `${parsed.toFixed(2).replace(/\.00$/, "")}x`;

  return `${parsed > 0 ? "+" : ""}${Math.round(parsed)}%`;
};

const TopFunds: FC<{ fund: IFund }> = ({ fund }) => {
  const { translateText } = useTranslation();
  const topFunds = useMemo(() => {
    return (fund.coInvestors || [])
      .filter((item) => item?.name)
      .sort((a, b) => Number(b.dealsCount || 0) - Number(a.dealsCount || 0))
      .slice(0, 8);
  }, [fund.coInvestors]);
  const topFundSlugs = useMemo(
    () => topFunds.map((item) => item.slug).filter(Boolean) as string[],
    [topFunds]
  );
  const { data: topFundDetails } = useQuery(
    ["top-funds-details", topFundSlugs],
    () => fetchFundsBySlugs(topFundSlugs),
    {
      enabled: topFundSlugs.length > 0,
    }
  );
  const topFundDetailsBySlug = useMemo(() => {
    const items = topFundDetails?.funds || [];
    const result = new Map<string, IFund>();

    items.forEach((item) => {
      if (item.slug) result.set(item.slug, item);
    });

    return result;
  }, [topFundDetails]);

  return (
    <Wrapper>
      <h2>{translateText("Top Funds")}</h2>
      <Assets>
        {topFunds.length ? (
          topFunds.map((item, i) => {
            const fundDetails = item.slug
              ? topFundDetailsBySlug.get(item.slug)
              : null;
            const totalInvestments = firstFiniteNumber(
              fundDetails?.stats?.totalInvestments,
              fundDetails?.totalInvestments,
              fundDetails?.numberOfInvestments,
              item.totalInvestments,
              item.investmentsCount,
              item.dealsCount,
              item.count
            );
            const averageRoi = firstFiniteNumber(
              fundDetails?.averageRoi,
              fundDetails?.roi,
              item.averageRoi,
              item.roi
            );

            const content = (
              <Asset variant={"main"}>
                <Header>
                  <ProjectData>
                    <UserAvatar
                      avatar={imageLoader(String(item.logo || ""))}
                      size={"otc"}
                      variant={"default"}
                      name={item.name}
                      fallbackType="project"
                    />
                    <div className="info">
                      <div>{item.name}</div>
                      <span>{item.type || item.slug || "-"}</span>
                    </div>
                  </ProjectData>
                </Header>
                <PriceInfo>
                  <div>{translateText("Total Investments")}</div>
                  <div className="value">
                    {formatInvestmentCount(totalInvestments)}
                  </div>
                </PriceInfo>
                <PriceInfo>
                  <div>{translateText("Average ROI")}</div>
                  <div className="value">{formatRoi(averageRoi)}</div>
                </PriceInfo>
              </Asset>
            );

            return item.slug ? (
              <NextLink
                className="profile-list-card"
                href={`/crypto/funds/${item.slug}`}
                key={item.id || item.slug || `${item.name}-${i}`}
              >
                {content}
              </NextLink>
            ) : (
              <div
                className="profile-list-card"
                key={item.id || `${item.name}-${i}`}
              >
                {content}
              </div>
            );
          })
        ) : (
          <EmptySection className="profile-list-empty" />
        )}
      </Assets>
    </Wrapper>
  );
};

export default TopFunds;
