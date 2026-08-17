import React, { FC } from "react";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import UsersRow from "../../../../../global/UsersRow";
import { PercentText } from "../../../../../global/PersonCard/styles";
import {
  PercentKey,
  PercentUpdateItem,
} from "../ProjectPriceStatistics/styles";
import SelectedIcon from "../../../../../global/Icons/SelectedIcon";
import {
  Date,
  FundsRaised,
  InvestorInfo,
  LeftColumn,
  RightColumn,
  Round,
  RoundInfoWrapper,
  StatisticsInfo,
  Type,
  Wrapper,
} from "./styles";
import { Title } from "../Fundraising/styles";
import moment from "moment";
import PercentValue from "../../../../../global/common/PercentValue";
import TableTitleInfo from "../TableTitleInfo";

const formatPositiveUsdValue = (value: unknown): string => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "-";

  return `$${clarifyAmount(numericValue)}`;
};

const firstPositiveNumber = (...values: Array<unknown>): number | null => {
  const numericValue = values
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0);

  return numericValue || null;
};

const getRealPlatform = (item: any): { name: string; logoUrl?: string } | null => {
  if (!item?.platform || typeof item.platform !== "object") return null;

  const name =
    typeof item.platform.name === "string" ? item.platform.name.trim() : "";
  const logoUrl =
    typeof item.platform.logoUrl === "string"
      ? item.platform.logoUrl.trim()
      : "";

  return name ? { name, logoUrl } : null;
};

const CryptoMarketFundingRounds: FC<{ rounds: Array<any> }> = ({ rounds }) => {

  return (
    rounds.length
      ?
      <>
        <TableTitleInfo
          style={{ marginBottom: "20px" }}
          tooltip="Round pricing, valuation, supply share, investors, and raised capital."
        >
          <Title>Funding Rounds and ICO</Title>
        </TableTitleInfo>
        <Wrapper>
          {rounds.map((item: any, index: number) => {
            const tokensForSaleAmount = firstPositiveNumber(
              item.tokensForSaleAmount,
              item.tokenForSale
            );
            const tokensForSalePercent = firstPositiveNumber(
              item.tokensForSalePercent,
              item.totalSupplyPercent
            );
            const platform = getRealPlatform(item);

            return (
              <Round variant="main" key={index}>
                {/* <RoundProgressWrapper>
                <ProgressBar
                  middleKey="Completed"
                  middle={0}
                  leftKey={'Collected'}
                  rightKey={'Goal'}
                  low={0}
                  high={item.goal || 0}
                  progress={0}
                />
              </RoundProgressWrapper> */}
                <RoundInfoWrapper>
                  <LeftColumn>
                    <div className="header">
                      <SelectedIcon />
                      <Type>{item.stage}</Type>
                      <Date>
                        {moment(item.date).format("ll")}
                        {item?.endDate ? (
                          `
                                                    - ${moment(item.endDate).format("ll")}
                                                `
                        ) : null}
                      </Date>
                    </div>
                    <div className="table">
                      <div className="table-item">
                        <div className="key">Price:</div>
                        <div className="value">
                          {formatPositiveUsdValue(item.tokenPrice)}
                        </div>
                      </div>
                      <div className="table-item">
                        <div className="key">Pre-valuation:</div>
                        <div className="value">
                          {formatPositiveUsdValue(item.preValuation)}
                        </div>
                      </div>
                      <div className="table-item">
                        <div className="key">Tokens for Sale:</div>
                        <div className="value">
                          {tokensForSaleAmount ? clarifyAmount(tokensForSaleAmount) : "-"}
                        </div>
                      </div>
                      <div className="table-item">
                        <div className="key">% Total Supply:</div>
                        {
                          tokensForSalePercent
                            ?
                            <div className="value">
                              <PercentValue
                                isLabel={false}
                                isIcon={false}
                                value={tokensForSalePercent}
                              />
                            </div>
                            :
                            <div className="value">
                              -
                            </div>
                        }

                      </div>

                      {platform ? (
                        <div className="table-item">
                          <div className="key">Platform:</div>
                          <div className="project">
                            {platform.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={platform.logoUrl} alt={platform.name} />
                            ) : null}
                            <span>{platform.name}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </LeftColumn>
                  <RightColumn>
                    <FundsRaised>
                      <div>Funds Raised:</div>
                      <span>{`$${clarifyAmount(item.fundsRaised)}`}</span>
                    </FundsRaised>
                    <InvestorInfo>
                      <div className="investor">
                        <span>Investors:</span>
                        {
                          item.investors
                            ?
                            <UsersRow
                              users={item.investors.map((item: any) => {
                                return ({
                                  logo: item?.details?.logo || '',
                                  name: item.name
                                })
                              })}
                            />
                            :
                            <div>-</div>
                        }

                      </div>
                      <div className="table-item">
                        <div className="key">Accepted Currencies:</div>
                        <div className="value">-</div>
                      </div>
                    </InvestorInfo>
                    <StatisticsInfo>
                      <PercentUpdateItem className="percent-wrapper">
                        <PercentText>
                          {item.roiUsd ? `${item.roiUsd}x` : "-"}
                        </PercentText>
                        <PercentKey>USD ROI</PercentKey>
                      </PercentUpdateItem>
                      <PercentUpdateItem className="percent-wrapper">
                        <PercentText>
                          {item.btcRoi ? `${item.btcRoi}x` : "-"}
                        </PercentText>
                        <PercentKey>BTC ROI</PercentKey>
                      </PercentUpdateItem>
                      <PercentUpdateItem className="percent-wrapper">
                        <PercentText>
                          {item.ethRoi ? `${item.ethRoi}x` : "-"}
                        </PercentText>
                        <PercentKey>ETH ROI</PercentKey>
                      </PercentUpdateItem>
                    </StatisticsInfo>
                  </RightColumn>
                </RoundInfoWrapper>
              </Round>
            );
          })}
        </Wrapper>
      </>
      :
      null
  );
};

export default CryptoMarketFundingRounds;
