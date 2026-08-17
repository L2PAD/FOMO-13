import React, { FC, useMemo, useState } from "react";
import {
  PieValuesPercentage,
  PieValuesPercentageWrapper,
  PieValuesWrapper,
  PieWrapper,
} from "../../../projects/Crypto/Project/Fundraising/styles";
import PieGraphic from "../../../projects/Crypto/Project/Fundraising/pie";
import {
  COLORS,
  ICO_COLORS,
} from "../../../projects/Crypto/Project/Fundraising";
import styled, { keyframes } from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";
import { simplifyAmount } from "../../../../../helpers/simplifyAmount";
import Typography from "../../../../global/common/Typography";
import { Header } from "../Breakdown/styles";
import Tabs from "../../../../global/Tabs";
import { IPortfolio } from "../../../../../types/global_types";
import { useQuery } from "react-query";
import { fetchPortfolioAssets } from "../../../../../http/portfolio";
import { getPortfolioDisplaySymbol } from "../helpers/portfolio";
import Placeholder from "../../../../global/common/Placeholder";

export const Wrapper = styled.div<{ $core?: boolean }>`
  margin-top: ${({ $core }) => ($core ? "0" : "40px")};
`;

export const PieRowWrapper = styled(BaseCard)<{ $core?: boolean }>`
  width: 100%;
  display: flex;
  gap: ${({ $core }) => ($core ? "24px" : "40px")};
  ${({ $core }) =>
    $core &&
    `
      border: 1px solid #f0f2f5;
      border-radius: 14px;
      box-shadow: rgba(0, 5, 48, 0.06) 2px 2px 8px;
      flex-direction: column;
      align-items: center;
    `}
  @media (max-width: 1100px) {
    flex-direction: column;
  }
  @media (max-width: 640px) {
    gap: 24px;
    padding: 20px;
  }
`;

const ResponsivePieWrapper = styled(PieWrapper)<{ $core?: boolean }>`
  ${({ $core }) =>
    $core &&
    `
      @media (max-width: 380px) {
        width: 216px;
        height: 216px;
        overflow: hidden;

        > div {
          width: 280px;
          height: 280px;
          transform: scale(0.7714286);
          transform-origin: top left;
        }
      }
    `}
`;

const allocationPulse = keyframes`
  0%, 100% { opacity: 0.62; }
  50% { opacity: 1; }
`;

const CoreAllocationSkeleton = styled.div`
  width: 100%;
  min-height: 280px;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  justify-items: center;
  gap: 28px;

  @media (max-width: 640px) {
    min-height: 250px;
    gap: 22px;
  }
`;

const CoreAllocationRingSkeleton = styled.div`
  width: 210px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(
    #e7edf2 0 34%,
    #dce5eb 34% 58%,
    #edf1f5 58% 82%,
    #e2e8ee 82% 100%
  );
  mask: radial-gradient(circle, transparent 0 54%, #000 55%);
  -webkit-mask: radial-gradient(circle, transparent 0 54%, #000 55%);
  animation: ${allocationPulse} 1.7s ease-in-out infinite;

  @media (max-width: 640px) {
    width: 180px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const CoreAllocationRowsSkeleton = styled.div`
  width: 100%;
  display: grid;
  gap: 17px;

  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
  }
`;

const PieValuesTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: #738094;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 10px !important;
  span {
    font-weight: var(--font-weight-semibold);
    color: #070b35;
  }
`;

export const PieTitleWrapper = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1fr 1fr;
`;

const AllocationValuesWrapper = styled(PieValuesWrapper)<{ $core?: boolean }>`
  ${({ $core }) =>
    $core &&
    `
      min-width: 0;
      align-self: stretch;
      margin-top: 0;
    `}
`;

const AllocationTitleWrapper = styled(PieTitleWrapper)<{ $core?: boolean }>`
  ${({ $core }) =>
    $core &&
    `
      grid-template-columns: minmax(0, 1fr) max-content;
      gap: 16px;
      border-bottom: 1px solid #f0f2f5;

      > div {
        min-width: 0;
        padding: 10px 0 12px !important;
      }

      > div:last-child {
        justify-content: flex-end;
        text-align: right;
      }

      > div span {
        font-size: 12px;
        line-height: 16px;
      }

      @media (max-width: 640px) {
        gap: 12px;
      }
    `}
`;

const AllocationRow = styled(PieValuesPercentage)<{ $core?: boolean }>`
  ${({ $core }) =>
    $core &&
    `
      &&.row-wrapper {
        display: grid;
        grid-template-columns: minmax(0, 1fr) max-content;
        gap: 16px;
        min-width: 0;
        border-top: 0;
        border-bottom: 1px solid #f0f2f5;
      }

      &&.row-wrapper:last-child {
        border-bottom: 0;
      }

      &&.row-wrapper > div {
        min-width: 0;
        padding: 13px 0 !important;
      }

      &&.row-wrapper .name {
        align-items: flex-start;
        line-height: 20px;
        overflow-wrap: anywhere;
      }

      &&.row-wrapper .name i {
        flex: 0 0 12px;
        width: 12px !important;
        height: 12px !important;
        min-width: 12px;
        min-height: 12px;
        margin-top: 4px;
      }

      &&.row-wrapper .allocation-value {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        text-align: right;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      &&.row-wrapper .allocation-value strong {
        color: #070b35;
        font-size: 14px;
        font-weight: var(--font-weight-semibold);
        line-height: 18px;
      }

      &&.row-wrapper .allocation-value span {
        color: #738094;
        font-size: 12px;
        font-weight: var(--font-weight-regular);
        line-height: 16px;
      }

      @media (max-width: 640px) {
        &&.row-wrapper {
          gap: 12px;
        }
      }
    `}
`;

const formatCoreAllocationValue = (value: number): string => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";

  if (Math.abs(numericValue) >= 100_000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  return simplifyAmount(numericValue);
};

interface IProps {
  portfolio: IPortfolio;
  isPublic?: boolean;
  variant?: "default" | "core";
}

const WalletBalancePie: FC<IProps> = ({
  portfolio,
  isPublic = false,
  variant = "default",
}) => {
  const isCore = variant === "core";
  const { data, isLoading } = useQuery(
    ["portfolio-assets", portfolio?._id, isPublic],
    () => fetchPortfolioAssets(portfolio?._id || "", isPublic),
    {
      refetchOnWindowFocus: false,
      enabled: !!portfolio?._id,
    }
  );
  const [activeTab, setActiveTab] = useState<string>("Category");

  const assetItems = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) return [];

    const totalValue = data.data.reduce((sum: number, asset: any) => {
      const amountUsdValue =
        parseFloat(asset.amountUsd.replace("$", "").replace(/,/g, "")) || 0;
      return sum + amountUsdValue;
    }, 0);

    return data.data
      .map((asset: any) => {
        const amountUsdValue =
          parseFloat(asset.amountUsd.replace("$", "").replace(/,/g, "")) || 0;
        const symbol = getPortfolioDisplaySymbol(asset) || asset.name;
        const percentage =
          totalValue > 0 ? (amountUsdValue / totalValue) * 100 : 0;

        return {
          name: symbol,
          value: parseFloat(percentage.toFixed(2)),
          allocated: amountUsdValue,
        };
      })
      .filter((item) => item.allocated > 0)
      .sort((a, b) => b.allocated - a.allocated);
  }, [data?.data]);
  const categoryItems = useMemo(() => {
    if (!portfolio?.categoryDistribution) return [];

    if (Array.isArray(portfolio.categoryDistribution)) {
      return portfolio.categoryDistribution.map((item) => ({
        name: item.name,
        value: item.value,
        allocated: item.allocated,
      }));
    }

    if (typeof portfolio.categoryDistribution === "object") {
      const distribution = portfolio.categoryDistribution as Record<
        string,
        number
      >;
      const totalBalance = portfolio.totalBalance || 0;

      return Object.entries(distribution)
        .map(([name, value]) => ({
          name,
          value: parseFloat(value.toFixed(1)),
          allocated: parseFloat(((totalBalance * value) / 100).toFixed(2)),
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);
    }

    return [];
  }, [portfolio?.categoryDistribution, portfolio?.totalBalance]);

  const currentItems: Array<any> = useMemo(() => {
    switch (activeTab) {
      case "Category":
        return categoryItems;
      case "Asset":
        return assetItems;
      default:
        return [];
    }
  }, [activeTab, assetItems, categoryItems]);
  const isCurrentViewLoading = isLoading && (!isCore || activeTab === "Asset");

  return (
    <Wrapper $core={isCore}>
      <Header $core={isCore}>
        <h2>{isCore ? "Allocation" : "Wallet Balance"}</h2>
        <Tabs
          className="main"
          onClick={(value: string) => setActiveTab(value)}
          activeItem={activeTab}
          items={["Category", "Asset"]}
        />
      </Header>
      <PieRowWrapper variant="main" $core={isCore}>
        {isCore && isCurrentViewLoading ? (
          <CoreAllocationSkeleton
            role="status"
            aria-label="Loading allocation data"
          >
            <CoreAllocationRingSkeleton />
            <CoreAllocationRowsSkeleton>
              {["68%", "55%", "73%", "48%"].map((width, index) => (
                <div key={`${width}-${index}`}>
                  <Placeholder
                    width={width}
                    height="12px"
                    borderRadius="999px"
                    marginBottom="0"
                  />
                  <Placeholder
                    width="58px"
                    height="12px"
                    borderRadius="999px"
                    marginBottom="0"
                  />
                </div>
              ))}
            </CoreAllocationRowsSkeleton>
          </CoreAllocationSkeleton>
        ) : (
          <>
            <ResponsivePieWrapper $core={isCore}>
              <PieGraphic
                innerRadius={80}
                outerRadius={140}
                width={280}
                height={280}
                items={currentItems}
                customColors={activeTab === "Category" ? COLORS : ICO_COLORS}
              />
            </ResponsivePieWrapper>
            <AllocationValuesWrapper $core={isCore}>
              <AllocationTitleWrapper $core={isCore}>
                <PieValuesTitle variant="div">
                  <span style={{ color: "var(--main-gray)" }}>
                    {isCore ? activeTab : "Category"}
                  </span>
                </PieValuesTitle>
                <PieValuesTitle variant="div">
                  <span style={{ color: "var(--main-gray)" }}>
                    {isCore ? "Current value" : "Total Invested"}
                  </span>
                </PieValuesTitle>
              </AllocationTitleWrapper>

              <PieValuesPercentageWrapper>
                {isCurrentViewLoading ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#738094",
                    }}
                  >
                    Loading data...
                  </div>
                ) : currentItems?.length ? (
                  currentItems.map((item: any, index: number) => {
                    return (
                      <AllocationRow
                        className="row-wrapper"
                        key={index}
                        $core={isCore}
                        color={
                          activeTab === "Category"
                            ? COLORS[index]
                            : ICO_COLORS[index]
                        }
                        variant="p"
                      >
                        <div className="name">
                          <i
                            style={{
                              width: "16px",
                              height: "16px",
                              display: "block",
                            }}
                          />
                          {item.name}
                        </div>
                        {isCore ? (
                          <div
                            className="allocation-value"
                            aria-label={`$${simplifyAmount(item.allocated)}, ${item.value}%`}
                          >
                            <strong
                              title={`$${simplifyAmount(item.allocated)}`}
                            >
                              ${formatCoreAllocationValue(item.allocated)}
                            </strong>
                            <span>{item.value}%</span>
                          </div>
                        ) : (
                          <div>
                            ${simplifyAmount(item.allocated)} ({item.value}%)
                          </div>
                        )}
                      </AllocationRow>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#738094",
                    }}
                  >
                    No data available
                  </div>
                )}
              </PieValuesPercentageWrapper>
            </AllocationValuesWrapper>
          </>
        )}
      </PieRowWrapper>
    </Wrapper>
  );
};

export default WalletBalancePie;
