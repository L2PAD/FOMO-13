import React from "react";
import { Card, CardsWrapper, Wrapper } from "./styles";
import EmptySection from "../../../../global/EmptySection";
import { useQuery } from "react-query";
import fetchItems from "../../../../../http/fetchItems";
import ProfileDealsList from "./DealsList";
import EntityInfo from "../../../../global/common/EntityInfo";
import imageLoader from "../../../../../helpers/imageLoader";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import {
  TableHeader,
  TableList,
  TableRow,
} from "../../../gemslab/Portfolio/Breakdown/styles";
import { Overflow } from "../../../../global/common/BarDoubleChart/styles";
import { useTranslation } from "i18n";
import { getPortfolioDisplaySymbol } from "../../Portfolio/helpers/portfolio";

const formatCurrency = (value?: number | string | null): string => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "$0";
  }

  const absValue = Math.abs(numberValue).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });

  return `${numberValue < 0 ? "-" : ""}$${absValue}`;
};

const getProfitLossClassName = (value?: number | string | null): string => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue === 0) {
    return "card-value main-black";
  }

  return numberValue < 0 ? "card-value main-red" : "card-value main-green";
};

const isKnownNumber = (value: unknown): boolean => {
  const amount = Number(value);

  return value !== null && value !== undefined && Number.isFinite(amount);
};

const formatOptionalCurrency = (value: unknown): string =>
  isKnownNumber(value) ? formatCurrency(Number(value)) : "-";

const formatSignedCurrency = (value?: number | string | null): string => {
  const amount = Number(value || 0);
  const prefix = amount > 0 ? "+" : amount < 0 ? "-" : "";

  return `${prefix}${formatCurrency(Math.abs(amount))}`;
};

const formatPercent = (value?: number | string | null): string => {
  const amount = Number(value || 0);
  const prefix = amount > 0 ? "+" : amount < 0 ? "-" : "";

  return `${prefix}${Math.abs(amount).toFixed(2)}%`;
};

const MyDeals = () => {
  const { translateText } = useTranslation();
  const { data } = useQuery("deals-statistics", () => fetchItems("deals/user"));
  const investmentPortfolio = data?.data?.investmentPortfolio || {};
  const investmentAssets = Array.isArray(investmentPortfolio.assets)
    ? investmentPortfolio.assets
    : [];

  return (
    <Wrapper>
      <CardsWrapper>
        <h2>{translateText("Summary")}</h2>
        <div className="cards">
          <Card>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                d="M24.2275 16.2561C24.3178 16.5171 24.6025 16.6554 24.8635 16.5651C25.1245 16.4748 25.2628 16.19 25.1725 15.9291L24.2275 16.2561ZM22 14.0556L22.022 13.556C22.0146 13.5557 22.0073 13.5556 22 13.5556V14.0556ZM18 20.1667V20.6667V20.1667ZM22 26.2778V26.7778V26.2778ZM18 26.2778L17.978 26.7773C17.9853 26.7776 17.9927 26.7778 18 26.7778V26.2778ZM15.7725 24.0772C15.6822 23.8163 15.3975 23.6779 15.1365 23.7682C14.8755 23.8585 14.7372 24.1433 14.8275 24.4042L15.7725 24.0772ZM20.5 11C20.5 10.7239 20.2761 10.5 20 10.5C19.7239 10.5 19.5 10.7239 19.5 11H20.5ZM19.5 14.0556C19.5 14.3317 19.7239 14.5556 20 14.5556C20.2761 14.5556 20.5 14.3317 20.5 14.0556H19.5ZM20.5 26.2778C20.5 26.0016 20.2761 25.7778 20 25.7778C19.7239 25.7778 19.5 26.0016 19.5 26.2778H20.5ZM19.5 29.3333C19.5 29.6095 19.7239 29.8333 20 29.8333C20.2761 29.8333 20.5 29.6095 20.5 29.3333H19.5ZM25.1725 15.9291C24.9413 15.261 24.5187 14.6772 23.9574 14.2538L23.3551 15.0521C23.7562 15.3547 24.0606 15.7737 24.2275 16.2561L25.1725 15.9291ZM23.9574 14.2538C23.396 13.8303 22.722 13.5868 22.022 13.556L21.978 14.5551C22.4745 14.5769 22.9541 14.7496 23.3551 15.0521L23.9574 14.2538ZM22 13.5556H18V14.5556H22V13.5556ZM18 13.5556C17.0687 13.5556 16.1775 13.9324 15.5219 14.6002L16.2355 15.3008C16.705 14.8225 17.3399 14.5556 18 14.5556V13.5556ZM15.5219 14.6002C14.8666 15.2677 14.5 16.171 14.5 17.1111H15.5C15.5 16.4304 15.7656 15.7794 16.2355 15.3008L15.5219 14.6002ZM14.5 17.1111C14.5 18.0512 14.8666 18.9545 15.5219 19.622L16.2355 18.9214C15.7656 18.4428 15.5 17.7918 15.5 17.1111H14.5ZM15.5219 19.622C16.1775 20.2898 17.0687 20.6667 18 20.6667V19.6667C17.3399 19.6667 16.705 19.3997 16.2355 18.9214L15.5219 19.622ZM18 20.6667H22V19.6667H18V20.6667ZM22 20.6667C22.66 20.6667 23.295 20.9336 23.7645 21.4119L24.4781 20.7113C23.8225 20.0435 22.9312 19.6667 22 19.6667V20.6667ZM23.7645 21.4119C24.2344 21.8905 24.5 22.5415 24.5 23.2222H25.5C25.5 22.2822 25.1334 21.3788 24.4781 20.7113L23.7645 21.4119ZM24.5 23.2222C24.5 23.9029 24.2344 24.5539 23.7645 25.0325L24.4781 25.7331C25.1334 25.0656 25.5 24.1623 25.5 23.2222H24.5ZM23.7645 25.0325C23.295 25.5108 22.66 25.7778 22 25.7778V26.7778C22.9312 26.7778 23.8225 26.4009 24.4781 25.7331L23.7645 25.0325ZM22 25.7778H18V26.7778H22V25.7778ZM18.022 25.7783C17.5255 25.7564 17.0459 25.5838 16.6449 25.2812L16.0426 26.0795C16.604 26.503 17.278 26.7465 17.978 26.7773L18.022 25.7783ZM16.6449 25.2812C16.2438 24.9786 15.9394 24.5596 15.7725 24.0772L14.8275 24.4042C15.0587 25.0723 15.4813 25.6561 16.0426 26.0795L16.6449 25.2812ZM19.5 11V14.0556H20.5V11H19.5ZM19.5 26.2778V29.3333H20.5V26.2778H19.5ZM35.5 20C35.5 28.5604 28.5604 35.5 20 35.5V36.5C29.1127 36.5 36.5 29.1127 36.5 20H35.5ZM20 35.5C11.4396 35.5 4.5 28.5604 4.5 20H3.5C3.5 29.1127 10.8873 36.5 20 36.5V35.5ZM4.5 20C4.5 11.4396 11.4396 4.5 20 4.5V3.5C10.8873 3.5 3.5 10.8873 3.5 20H4.5ZM20 4.5C28.5604 4.5 35.5 11.4396 35.5 20H36.5C36.5 10.8873 29.1127 3.5 20 3.5V4.5Z"
                fill="#070B35"
              />
            </svg>
            <div className="card-key">{translateText("Total Invested")}</div>
            <div className="card-value">
              {formatCurrency(investmentPortfolio.totalInvested)}
            </div>
          </Card>
          <Card>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                d="M28.334 23.332H23.334"
                stroke="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23.6856 17.0671L20.851 18.2039C20.6274 18.2916 20.3873 18.3351 20.1453 18.3319C19.9034 18.3286 19.6647 18.2786 19.4438 18.1848C19.2197 18.0899 19.0178 17.9537 18.8496 17.7841C18.6815 17.6145 18.5505 17.4149 18.4642 17.1969C18.2943 16.7824 18.2905 16.3232 18.4538 15.9063C18.617 15.4894 18.9358 15.1439 19.3497 14.9353L22.183 13.5939C22.4893 13.4432 22.8257 13.3554 23.1701 13.3361C23.5145 13.3168 23.8594 13.3665 24.1823 13.482L30.0007 15.6578"
                stroke="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.666 23.7625H13.7244L17.6469 26.3535C17.8304 26.533 18.0872 26.6438 18.3632 26.6625C18.6392 26.6812 18.9129 26.6064 19.1264 26.4538L24.6068 22.5349C24.8234 22.3797 24.9618 22.1576 24.9928 21.9157C25.0237 21.6737 24.9448 21.4308 24.7727 21.2383L21.7534 18.332"
                stroke="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.3327 14.4418L18.0356 14.0375C17.7409 13.6722 17.3957 13.4395 17.0325 13.3613C16.6694 13.2831 16.3004 13.3621 15.9605 13.5908L11.666 16.6654"
                stroke="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.66602 24.9978H10.1116C10.5016 25.0193 10.884 24.8811 11.1753 24.6134C11.4665 24.3457 11.643 23.9702 11.666 23.5691V16.4296C11.6426 16.0287 11.4661 15.6536 11.1748 15.3861C10.8836 15.1187 10.5014 14.9807 10.1116 15.0022H6.66602"
                stroke="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M33.334 24.9978H29.8884C29.4984 25.0193 29.116 24.8811 28.8247 24.6134C28.5335 24.3457 28.357 23.9702 28.334 23.5691V16.4296C28.3574 16.0287 28.5339 15.6536 28.8252 15.3861C29.1164 15.1187 29.4986 14.9807 29.8884 15.0022H33.334"
                stroke="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 20C5 23.9782 6.58035 27.7936 9.3934 30.6066C12.2064 33.4196 16.0218 35 20 35C23.9782 35 27.7936 33.4196 30.6066 30.6066C33.4196 27.7936 35 23.9782 35 20C35 16.0218 33.4196 12.2064 30.6066 9.3934C27.7936 6.58035 23.9782 5 20 5C16.0218 5 12.2064 6.58035 9.3934 9.3934C6.58035 12.2064 5 16.0218 5 20Z"
                stroke="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="card-key">{translateText("Total Value Now")}</div>
            <div className="card-value">
              {formatCurrency(investmentPortfolio.totalValueNow)}
            </div>
          </Card>
          <Card>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                d="M16.139 14.0332C15.864 14.0082 15.6208 14.2109 15.5958 14.4859C15.5708 14.7609 15.7734 15.0041 16.0485 15.0291L16.139 14.0332ZM24.6875 15.3124L25.1855 15.2671C25.1636 15.0268 24.9732 14.8363 24.7328 14.8145L24.6875 15.3124ZM24.9708 23.9515C24.9958 24.2265 25.239 24.4292 25.5141 24.4042C25.7891 24.3792 25.9917 24.136 25.9667 23.8609L24.9708 23.9515ZM14.9589 24.3339C14.7637 24.5292 14.7637 24.8458 14.9589 25.041C15.1542 25.2363 15.4708 25.2363 15.666 25.041L14.9589 24.3339ZM16.0485 15.0291L24.6423 15.8103L24.7328 14.8145L16.139 14.0332L16.0485 15.0291ZM24.1896 15.3577L24.9708 23.9515L25.9667 23.8609L25.1855 15.2671L24.1896 15.3577ZM24.334 14.9588L14.9589 24.3339L15.666 25.041L25.0411 15.666L24.334 14.9588ZM34.5 20C34.5 28.0081 28.0081 34.5 20 34.5V35.5C28.5604 35.5 35.5 28.5604 35.5 20H34.5ZM20 34.5C11.9919 34.5 5.5 28.0081 5.5 20H4.5C4.5 28.5604 11.4396 35.5 20 35.5V34.5ZM5.5 20C5.5 11.9919 11.9919 5.5 20 5.5V4.5C11.4396 4.5 4.5 11.4396 4.5 20H5.5ZM20 5.5C28.0081 5.5 34.5 11.9919 34.5 20H35.5C35.5 11.4396 28.5604 4.5 20 4.5V5.5Z"
                fill="#070B35"
              />
            </svg>
            <div className="card-key">{translateText("Total Profit/Loss")}</div>
            <div
              className={getProfitLossClassName(
                investmentPortfolio.totalProfitLoss
              )}
            >
              {formatCurrency(investmentPortfolio.totalProfitLoss)}
            </div>
          </Card>
          <Card>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                d="M32.3702 13.3578C30.0536 9.3586 25.7238 6.66797 20.7646 6.66797C15.1419 6.66797 10.3281 10.1269 8.34055 15.0302M28.301 15.0302H35V8.34042M9.29645 26.7374C11.613 30.7366 15.9429 33.4272 20.902 33.4272C26.5248 33.4272 31.3386 29.9683 33.3261 25.065M13.3657 25.065H6.66667V31.7548"
                stroke="#070B35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="card-key">{translateText("Active Deals")}</div>
            <div className="card-value">{data?.data?.activeDeals || 0}</div>
          </Card>
          <Card>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                d="M36 20C36 28.8366 28.8366 36 20 36C11.1634 36 4 28.8366 4 20C4 11.1634 11.1634 4 20 4C28.8366 4 36 11.1634 36 20Z"
                stroke="#070B35"
              />
              <path
                d="M26 16L17.0506 24L14 21.273"
                stroke="#070B35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="card-key">{translateText("Ended Deals")}</div>
            <div className="card-value">{data?.data?.endedDeals || 0}</div>
          </Card>
        </div>
      </CardsWrapper>
      <CardsWrapper style={{ marginTop: "20px" }}>
        <h2>{translateText("Investment Portfolio")}</h2>
        <div className="dataBody">
          {investmentAssets.length ? (
            <Overflow>
              <TableHeader>
                <div>{translateText("Token")}</div>
                <div>{translateText("Amount Held")}</div>
                <div>{translateText("Invested")}</div>
                <div>{translateText("Avg. Buy Price")}</div>
                <div>{translateText("Current Profit")}</div>
              </TableHeader>
              <TableList>
                {investmentAssets.map((asset: any) => {
                  const project = asset.projectId || {};
                  const displaySymbol =
                    getPortfolioDisplaySymbol(project, asset) || "-";
                  const amount = Number(asset.amount || 0);
                  const hasCurrentPrice =
                    asset.hasCurrentPrice !== false &&
                    isKnownNumber(asset.currentValue);
                  const currentValue = hasCurrentPrice
                    ? Number(asset.currentValue)
                    : null;
                  const totalPrice = isKnownNumber(asset.invested)
                    ? Number(asset.invested)
                    : isKnownNumber(asset.totalPrice)
                      ? Number(asset.totalPrice)
                      : null;
                  const avgBuyPrice = isKnownNumber(asset.avgBuyPrice)
                    ? Number(asset.avgBuyPrice)
                    : isKnownNumber(asset.price)
                      ? Number(asset.price)
                      : null;
                  const profit =
                    hasCurrentPrice && isKnownNumber(asset.profit)
                      ? Number(asset.profit)
                      : null;
                  const profitPercent =
                    hasCurrentPrice && isKnownNumber(asset.profitPercent)
                      ? Number(asset.profitPercent)
                      : null;

                  return (
                    <TableRow key={asset._id || project._id || asset.currency}>
                      <div className="item">
                        <EntityInfo
                          img={imageLoader(project.logo)}
                          name={project.name || translateText("Unknown asset")}
                          niche={displaySymbol}
                          variant="default"
                        />
                      </div>
                      <div className="table-column item">
                        <div className="value bold">
                          {formatOptionalCurrency(currentValue)}
                        </div>
                        <span>
                          {clarifyAmount(amount)}{" "}
                          {displaySymbol}
                        </span>
                      </div>
                      <div className="item">
                        <div className="value">
                          {formatOptionalCurrency(totalPrice)}
                        </div>
                      </div>
                      <div className="item">
                        <div className="value">
                          {formatOptionalCurrency(avgBuyPrice)}
                        </div>
                      </div>
                      <div className="table-column item">
                        <div
                          className={
                            profit === null
                              ? "value"
                              : profit < 0
                                ? "value red"
                                : "value green"
                          }
                        >
                          {profit === null ? "-" : formatSignedCurrency(profit)}
                        </div>
                        <div
                          className={
                            profitPercent === null
                              ? "small-value"
                              : profitPercent < 0
                                ? "small-value red"
                                : "small-value green"
                          }
                        >
                          {profitPercent === null
                            ? "-"
                            : formatPercent(profitPercent)}
                        </div>
                      </div>
                    </TableRow>
                  );
                })}
              </TableList>
            </Overflow>
          ) : (
            <EmptySection
              className="empty"
              title={translateText("Your deal book is empty")}
              description={translateText("Start building your investment portfolio! Add your first deal and track your growth journey.")}
            />
          )}
        </div>
      </CardsWrapper>
      <CardsWrapper style={{ marginTop: "20px" }}>
        <h2>{translateText("P2P Deals")}</h2>
        <div className="dataBody">
          <ProfileDealsList
            section="p2p"
            sectionEmptyTitle={translateText("No P2P activity yet")}
            sectionEmptyDescription={translateText("Start exploring direct investment opportunities. Track your private deals, manage progress, and grow your portfolio here!")}
          />
        </div>
      </CardsWrapper>
      <CardsWrapper style={{ marginTop: "20px" }}>
        <h2>{translateText("OTC Deals")}</h2>
        <ProfileDealsList />
      </CardsWrapper>
      <CardsWrapper style={{ marginTop: "20px" }}>
        <h2>{translateText("Allocation Market")}</h2>
        <ProfileDealsList
          sectionEmptyTitle={translateText("No Allocation Market activity")}
          section="allocation"
        />
      </CardsWrapper>
      <CardsWrapper style={{ marginTop: "20px" }}>
        <h2>{translateText("NFT Market")}</h2>
        <ProfileDealsList
          sectionEmptyTitle={translateText("No NFT Market activity")}
          section="nft-market"
        />
      </CardsWrapper>
    </Wrapper>
  );
};

export default MyDeals;
