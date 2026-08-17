import React, { FC, useMemo } from "react";
import NextLink from "next/link";
import { Items, Title, Wrapper } from "./styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import EmptySection from "../../../../../global/EmptySection";
import { useTranslation } from "i18n";
import { IFund, IPerson } from "../../../../../../types/global_types";

const toFiniteNumber = (value: any): number => {
  const parsed = Number(
    typeof value === "string"
      ? value.replace(/[$,%\sx]/g, "").replace(/,/g, "")
      : value
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatRoi = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed) return "-";
  if (Math.abs(parsed) > 9999) return parsed > 0 ? "+9999%+" : "-9999%";

  return `${parsed > 0 ? "+" : ""}${parsed.toFixed(2).replace(/\.00$/, "")}%`;
};

const TopInvestments: FC<{ fund: IFund | IPerson }> = ({ fund }) => {
  const { translateText } = useTranslation();
  const topInvestments = useMemo(() => {
    return (fund.portfolioCoins || [])
      .filter((item) => item?.name)
      .sort((a, b) => toFiniteNumber(b.roi) - toFiniteNumber(a.roi))
      .slice(0, 5);
  }, [fund.portfolioCoins]);

  return (
    <Wrapper variant="main">
      <Title>{translateText("Top 5 Performing Investments")}:</Title>
      <Items>
        {topInvestments.length ? (
          topInvestments.map((item, i: number) => {
            const content = (
              <div className="item">
                <UserAvatar
                  variant={"default"}
                  size={"otc"}
                  avatar={imageLoader(String(item.logo || item.image || ""))}
                  name={item.name}
                  fallbackType="project"
                />
                <div className="info">
                  <div className="name">
                    <span>{item.name}</span>
                  </div>
                  <div className="description">
                    {item.category || item.stage || item.symbol || "-"}
                  </div>
                </div>
                <div className={`roi ${toFiniteNumber(item.roi) < 0 ? "negative" : ""}`}>
                  <div className="roi-value">{formatRoi(item.roi)}</div>
                  <div className="description">ROI</div>
                </div>
              </div>
            );

            return item.slug ? (
              <NextLink
                href={`/crypto/project/${item.slug}`}
                key={item.id || item.slug || `${item.name}-${i}`}
              >
                {content}
              </NextLink>
            ) : (
              <div key={item.id || `${item.name}-${i}`}>{content}</div>
            );
          })
        ) : (
          <EmptySection />
        )}
      </Items>
    </Wrapper>
  );
};

export default TopInvestments;
