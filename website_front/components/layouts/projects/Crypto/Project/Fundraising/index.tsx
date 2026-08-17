/* eslint-disable */
import React, { FC, useContext, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { AuthContext } from "../../../../../global/Layout";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import { AssetTableData } from "../../../../../../staticContent/global";
import Typography from "../../../../../global/common/Typography";
import { EditIcon } from "../../../../../global/Icons";
import ViewTable from "../../../../../global/Tables/ViewTable";
import { authState } from "../../../../../../store/slices/authSlice";
import { IProject } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { EditStateWrapper } from "../styles";
import {
  Content,
  ContentWrapper,
  LeftColumn,
  MetricsCol,
  MetricsContentWrapper,
  MetricsRow,
  MetricsWrapper,
  PieContentWrapper,
  PieTitleWrapper,
  PieValuesPercentage,
  PieValuesPercentageWrapper,
  PieValuesTitle,
  PieValuesWrapper,
  PieWrapper,
  RoundTitle,
  RoundValue,
  RoundValueWrapper,
  RoundWrapper,
  TableWrapper,
  Title,
  Wrapper,
} from "./styles";
import EmptyList from "../../../../../global/EmptyList";
import InvestmentsOverview from "../InvestmentsOverview";
import MetricsTable from "../MetricsTable";
import FundingRounds from "../FundingRounds";
import CryptoMarketFundingRounds from "../CryptoMarketFundingRounds";
import { useQuery } from "react-query";
import fetchProjectFundraising, {
  fetchProjectFundingRounds,
} from "../../../../../../http/projects/fetchProjectFundraising";
import Placeholder from "../../../../../global/common/Placeholder";
import PlaceholderTable from "../../../../../global/common/PlaceholderTable";
import { useTranslation } from "i18n";
import TableTitleInfo from "../TableTitleInfo";

const formatTokenSupplyValue = (symbol?: string, value?: number | string | null): string => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue) || numericValue === 0) return "--";

  const formattedValue = clarifyAmount(numericValue);
  return symbol ? `${symbol} ${formattedValue}` : String(formattedValue);
};

const table = [
  {
    stage: "ICO Token Price",
    seedRound: "-",
    privateSaleRound: "-",
    publicSale: "-",
  },
  {
    stage: "Lockup Period",
    seedRound: "-",
    privateSaleRound: "-",
    publicSale: "-",
  },
  {
    stage: "Vesting Schedule",
    seedRound: "-",
    privateSaleRound: "-",
    publicSale: "-",
  },
  {
    stage: "Accepted Currency",
    seedRound: "-",
    privateSaleRound: "-",
    publicSale: "-",
  },
  {
    stage: "KYC Requirement",
    seedRound: "-",
    privateSaleRound: "-",
    publicSale: "-",
  },
  {
    stage: "Whitelist Status",
    seedRound: "-",
    privateSaleRound: "-",
    publicSale: "-",
  },
  {
    stage: "Min/Max Personal Cap",
    seedRound: "-",
    privateSaleRound: "-",
    publicSale: "-",
  },
  {
    stage: "Early Unlock",
    stageInfo: true,
    seedRound: "-",
    privateSaleRound: "-",
    publicSale: "-",
  },
];

export const COLORS = [
  "#008A4E",
  "#BC322E",
  "#860D73",
  "#02AFB0",
  "#193081",
  "#867C0D",
  "#AB2EB9",
  "#FF8C00",
  "#1E90FF",
  "#A52A2A",
  "#4B0082",
  "#228B22",
  "#FF1493",
  "#20B2AA",
  "#FFD700",
  "#708090",
  "#DC143C",
  "#7FFF00",
];
export const ICO_COLORS = [
  "#F3B23E",
  "#E37137",
  "#E14659",
  "#E662BD",
  "#738094",
  "#008A4E",
  "#867C0D",
];

interface IProps {
  project: IProject;
  projectDataToUpdate: IProject | null;
  isEdit?: boolean;
  inputsHandler?: (name: string, value: any) => void;
  dataReviewBanner?: React.ReactNode;
}

const Fundraising: FC<IProps> = ({
  isEdit,
  inputsHandler,
  projectDataToUpdate,
  project,
  dataReviewBanner,
}) => {
  const { translateText } = useTranslation();
  const tokenSymbol = String(project?.symbol || project?.ticker || "").trim().toUpperCase();
  const isMarketV2Project = Boolean(project?.coingeckoId);
  const fundraisingLookupId = String(project?.coingeckoId || project?.slug || "").trim();
  const { data, isLoading } = useQuery(
    ["crypto-funding", isMarketV2Project ? "market-v2" : "legacy", fundraisingLookupId],
    () => {
      if (isMarketV2Project) {
        return fetchProjectFundraising(
          fundraisingLookupId,
          "?projectType=market&lookup=coingeckoId"
        );
      }

      return fetchProjectFundingRounds(fundraisingLookupId, "?lookup=slug");
    },
    { refetchOnWindowFocus: false, enabled: Boolean(fundraisingLookupId) && !project?.fundraising?.length }
  );
  const fetchedRounds = isMarketV2Project ? data?.data?.fundraising || [] : data?.data || [];
  const projectRounds = project?.fundraising?.length ? project.fundraising : fetchedRounds;
  const header = useMemo(() => {
    if (!data?.data?.length) return [];

    return [
      "Funding Stage",
      ...data?.data?.map((item: any) => {
        return item.stage;
      }),
    ];
  }, [data]);

  return (
    <Wrapper>
      <ContentWrapper>
        <Content>
          <MetricsWrapper>
            <TableTitleInfo
              tooltip={translateText(
                "Core supply and valuation fields used to understand the token economics."
              )}
            >
              <Title>{translateText("Token Metrics Table")}</Title>
            </TableTitleInfo>
            {dataReviewBanner}
            <MetricsContentWrapper variant={"main"}>
              <MetricsCol>
                <MetricsRow>
                  <span>{translateText("Market Cap (Projected)")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            tokenPrice: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.tokenPrice || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>
                      ${clarifyAmount(Number(project?.marketCap)) || "-"}
                    </span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>{translateText("Ticker")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            ticket: e.target.value,
                          })
                        }
                        value={projectDataToUpdate?.tokenMetrics?.ticket || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{tokenSymbol || "-"}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>{translateText("Token Type")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            tokenType: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.tokenType || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>
                      {project?.tokenDetails?.mining_algorithm || "-"}
                    </span>
                  )}
                </MetricsRow>
              </MetricsCol>
              <MetricsCol>
                <MetricsRow>
                  <span>{translateText("Circulating Supply")}</span>
                  <span>
                    {formatTokenSupplyValue(tokenSymbol, project?.circulatingSupply)}
                  </span>
                </MetricsRow>
                <MetricsRow>
                  <span>{translateText("Total Supply")}</span>

                  <span>
                    {formatTokenSupplyValue(tokenSymbol, project?.totalSupply)}
                  </span>
                </MetricsRow>
                <MetricsRow>
                  <span>{translateText("Pre-sale Price")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            personalCap: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.personalCap || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>
                      {project?.icoPrice?.USD || 0} USD/
                      {project?.icoPrice?.ETH || 0} ETH
                    </span>
                  )}
                </MetricsRow>
              </MetricsCol>
            </MetricsContentWrapper>
            <TableTitleInfo
              style={{ marginBottom: "20px" }}
              tooltip={translateText(
                "Fundraising rounds, investors, dates, and amounts raised for this asset."
              )}
            >
              <Title>{translateText("Investment Overview")}</Title>
            </TableTitleInfo>
            <InvestmentsOverview fundsRounds={projectRounds} />
            <CryptoMarketFundingRounds rounds={projectRounds} />
          </MetricsWrapper>
        </Content>
      </ContentWrapper>
    </Wrapper>
  );
};

export default Fundraising;
