import React, { FC, useState } from "react";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import imageLoader from "../../../../../../helpers/imageLoader";
import UsersRow from "../../../../../global/UsersRow";
import { PercentText } from "../../../../../global/PersonCard/styles";
import {
  PercentKey,
  PercentUpdateItem,
} from "../ProjectPriceStatistics/styles";
import SelectedIcon from "../../../../../global/Icons/SelectedIcon";
import HourGlassIcon from "../../../../../global/Icons/HourGlassIcon";
import PrivateSellIcon from "../../../../../global/Icons/PrivateSellIcon";
import { IEditProps } from "../Team/Achievements/index";
import {
  AddButtonWrapper,
  Date,
  FundsRaised,
  InvestorInfo,
  LeftColumn,
  RightColumn,
  Round,
  RoundInfoWrapper,
  RoundProgressWrapper,
  StatisticsInfo,
  Type,
  Wrapper,
} from "./styles";
import AddRoundModal from "../../Modals/add_round_modal";
import { IFundingRound, IProject } from "../../../../../../types/global_types";
import CreateButton from "../../../../../global/common/CreateButton";
import EmptyList from "../../../../../global/EmptyList";
import { Title } from "../Fundraising/styles";
import parseDate from "../../../../../../helpers/parseDate";
import moment from "moment";
import { CloseIcon, EditIcon } from "../../../../../global/Icons";
import { RemoveButton } from "../../../../../global/common/EditNameModal/styles";
import ProgressBar from "../../../../../global/common/ProgressBar";
import EditRoundModal from "../../Modals/edit_round_modal";
import { useTranslation } from "i18n";

const investors: Array<{ name: string; logo: string }> = [
  {
    name: "User",
    logo: "/inv-avatar.jpg",
  },
  {
    name: "User",
    logo: "/inv-avatar.jpg",
  },
  {
    name: "User",
    logo: "/inv-avatar.jpg",
  },
  {
    name: "User",
    logo: "/inv-avatar.jpg",
  },
  {
    name: "User",
    logo: "/inv-avatar.jpg",
  },
  {
    name: "User",
    logo: "/inv-avatar.jpg",
  },
];

const formatRoundDate = (startDate?: Date | string, endDate?: Date | string): string => {
  const start = startDate ? moment(startDate) : null;
  const end = endDate ? moment(endDate) : null;
  const startText = start?.isValid() ? start.format("ll") : "";
  const endText = end?.isValid() ? end.format("ll") : "";

  if (startText && endText) return `${startText} - ${endText}`;
  return startText || endText || "-";
};

const getRoundProgress = (item: IFundingRound): number => {
  const raised = Number(item.raised || 0);
  const goal = Number(item.goal || item.preValuation || 0);

  if (!goal || !Number.isFinite(raised) || !Number.isFinite(goal)) return 0;

  return Math.min(Math.max((raised / goal) * 100, 0), 100);
};

const getRoundIcon = (item: IFundingRound) => {
  const distributionType = item.distributionType?.trim().toLowerCase();

  if (distributionType === "ended") return <SelectedIcon />;
  if (distributionType === "launched") return <PrivateSellIcon />;

  return <HourGlassIcon />;
};

const getRoundRaised = (item: IFundingRound): number => {
  const raised = Number(item.raised || 0);
  return Number.isFinite(raised) ? raised : 0;
};

const getRoundGoal = (item: IFundingRound): number => {
  const goal = Number(item.goal || item.preValuation || 0);
  return Number.isFinite(goal) ? goal : 0;
};

const hasNonZeroValue = (value?: number | string | null): boolean => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue !== 0;
};

const formatUsdValue = (value?: number | string | null, shouldClarify = true): string => {
  if (!hasNonZeroValue(value)) return "--";

  return `$${shouldClarify ? clarifyAmount(Number(value)) : value}`;
};

const formatRoiValue = (value?: number | string | null): string => {
  if (!hasNonZeroValue(value)) return "--";

  return `${value}x`;
};

const formatCurrencies = (item: IFundingRound): string => {
  const currencies = item.currenciesList
    ?.map((currency: any) => currency?.symbol || currency?.ticker || currency?.name)
    .filter(Boolean);

  return currencies?.length ? currencies.join(", ") : "-";
};

interface FundingRoundsProps extends IEditProps {
  dataReviewBanner?: React.ReactNode;
  hideAthRoi?: boolean;
}

const FundingRounds: FC<FundingRoundsProps> = ({
  inputsHandler,
  isEditState,
  project,
  projectDataToUpdate,
  dataReviewBanner,
  hideAthRoi = false,
}) => {
  const { translateText } = useTranslation();
  const [isAddRoundModal, setIsAddRoundModal] = useState<boolean>(false);
  const [editRoundIndex, setEditRoundIndex] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<IFundingRound | null>(
    null
  );

  const removeRound = (id: number) => {
    const rounds: Array<IFundingRound> | undefined =
      projectDataToUpdate?.fundraising?.filter(
        (item: IFundingRound, i: number) => {
          return i !== id;
        }
      );

    inputsHandler && inputsHandler("fundraising", rounds);
  };

  return (
    <Wrapper>
      <Title>
        {translateText("Funding Rounds")}
        {isEditState ? (
          <AddButtonWrapper>
            <CreateButton type="add" onClick={() => setIsAddRoundModal(true)}>
              {translateText("Add Round")}
            </CreateButton>
          </AddButtonWrapper>
        ) : (
          <></>
        )}
      </Title>
      {dataReviewBanner}
      {isEditState ? (
        projectDataToUpdate?.fundraising?.map((item, index: number) => {
          const progress = getRoundProgress(item);

          return (
            <Round variant="main" key={index}>
              <RoundProgressWrapper>
                <ProgressBar
                  middleKey="Completed"
                  middle={progress}
                  leftKey="Collected"
                  rightKey="Goal"
                  low={getRoundRaised(item)}
                  high={getRoundGoal(item)}
                  progress={progress}
                  showZeroValuesAsPlaceholder
                />
              </RoundProgressWrapper>
              <RoundInfoWrapper>
                <LeftColumn>
                  <div className="header">
                    {getRoundIcon(item)}
                    <Type>{item.type}</Type>
                    <Date>{formatRoundDate(item.startDate, item.endDate)}</Date>
                  </div>
                  <div className="table">
                    <div className="table-item">
                      <div className="key">{translateText("Price")}:</div>
                      <div className="value">{formatUsdValue(item.tokenPrice, false)}</div>
                    </div>
                    <div className="table-item">
                      <div className="key">{translateText("Pre-valuation")}:</div>
                      <div className="value">
                        {formatUsdValue(item.preValuation)}
                      </div>
                    </div>
                    <div className="table-item">
                      <div className="key">{translateText("Platform")}:</div>
                      <div className="project">
                        <span>{item.platformName}</span>
                      </div>
                    </div>
                  </div>
                </LeftColumn>
                <RightColumn>
                  <FundsRaised>
                    <div>{translateText("Funds Raised")}:</div>
                    <span>{formatUsdValue(item.raised)}</span>
                    <button
                      onClick={() => {
                        setEditRoundIndex(index);
                        setSelectedRound(item);
                      }}
                      className="remove-btn"
                    >
                      <EditIcon fill="#FF5858" />
                    </button>
                    <button
                      onClick={() => removeRound(index)}
                      className="remove-btn"
                    >
                      <CloseIcon fill="#FF5858" />
                    </button>
                  </FundsRaised>
                  <InvestorInfo>
                    <div className="investor">
                      <span>{translateText("Investors")}:</span>
                      {/* {
                                            item.investors
                                                ?
                                                <>
                                                    <img
                                                        src={imageLoader(item.investorAvatar)}
                                                        alt={item.investorName}
                                                    />
                                                    <div className='value'>
                                                        {item.investorName}
                                                    </div>
                                                </>
                                                :
                                                <></>
                                        } */}
                      {item.investors ? (
                        <UsersRow users={item.investors} />
                      ) : (
                        "-"
                      )}
                    </div>
                    <div className="table-item">
                      <div className="key">{translateText("Accepted Currencies")}:</div>
                      <div className="value">{formatCurrencies(item)}</div>
                    </div>
                  </InvestorInfo>
                  <StatisticsInfo>
                    <PercentUpdateItem className="percent-wrapper">
                      <PercentText>
                        {formatRoiValue(item.usdRoi)}
                      </PercentText>
                      <PercentKey>{translateText("USD ROI")}</PercentKey>
                    </PercentUpdateItem>
                    <PercentUpdateItem className="percent-wrapper">
                      <PercentText>
                        {formatRoiValue(item.btcRoi)}
                      </PercentText>
                      <PercentKey>{translateText("BTC ROI")}</PercentKey>
                    </PercentUpdateItem>
                    <PercentUpdateItem className="percent-wrapper">
                      <PercentText>
                        {formatRoiValue(item.ethRoi)}
                      </PercentText>
                      <PercentKey>{translateText("ETH ROI")}</PercentKey>
                    </PercentUpdateItem>
                    {!hideAthRoi ? (
                      <PercentUpdateItem className="percent-wrapper">
                        <PercentText>
                          {formatRoiValue(item.athRoi)}
                        </PercentText>
                        <PercentKey>{translateText("ATH ROI")}</PercentKey>
                      </PercentUpdateItem>
                    ) : null}
                  </StatisticsInfo>
                </RightColumn>
              </RoundInfoWrapper>
            </Round>
          );
        })
      ) : project.fundraising?.length ? (
        project.fundraising.map((item, index: number) => {
          const progress = getRoundProgress(item);

          return (
            <Round variant="main" key={index}>
              <RoundProgressWrapper>
                <ProgressBar
                  middleKey="Completed"
                  middle={progress}
                  leftKey="Collected"
                  rightKey="Goal"
                  low={getRoundRaised(item)}
                  high={getRoundGoal(item)}
                  progress={progress}
                  showZeroValuesAsPlaceholder
                />
              </RoundProgressWrapper>
              <RoundInfoWrapper>
                <LeftColumn>
                  <div className="header">
                    {getRoundIcon(item)}
                    <Type>{item.type}</Type>
                    <Date>{formatRoundDate(item.startDate, item.endDate)}</Date>
                  </div>
                  <div className="table">
                    <div className="table-item">
                      <div className="key">{translateText("Price")}:</div>
                      <div className="value">{formatUsdValue(item.tokenPrice, false)}</div>
                    </div>
                    <div className="table-item">
                      <div className="key">{translateText("Pre-valuation")}:</div>
                      <div className="value">
                        {formatUsdValue(item.preValuation)}
                      </div>
                    </div>
                    <div className="table-item">
                      <div className="key">{translateText("Platform")}:</div>
                      <div className="project">
                        <span>{item.platformName}</span>
                      </div>
                    </div>
                  </div>
                </LeftColumn>
                <RightColumn>
                  <FundsRaised>
                    <div>{translateText("Funds Raised")}:</div>
                    <span>{formatUsdValue(item.raised)}</span>
                  </FundsRaised>
                  <InvestorInfo>
                    <div className="investor">
                      <span>{translateText("Investors")}:</span>
                      {/* {
                                            item.investors
                                                ?
                                                <>
                                                    <img
                                                        src={imageLoader(item.investorAvatar)}
                                                        alt={item.investorName}
                                                    />
                                                    <div className='value'>
                                                        {item.investorName}
                                                    </div>
                                                </>
                                                :
                                                <></>
                                        } */}
                      {item.investors ? (
                        <UsersRow users={item.investors} />
                      ) : (
                        "-"
                      )}
                    </div>
                    <div className="table-item">
                      <div className="key">{translateText("Accepted Currencies")}:</div>
                      <div className="value">{formatCurrencies(item)}</div>
                    </div>
                  </InvestorInfo>
                  <StatisticsInfo>
                    <PercentUpdateItem className="percent-wrapper">
                      <PercentText>
                        {formatRoiValue(item.usdRoi)}
                      </PercentText>
                      <PercentKey>{translateText("USD ROI")}</PercentKey>
                    </PercentUpdateItem>
                    <PercentUpdateItem className="percent-wrapper">
                      <PercentText>
                        {formatRoiValue(item.btcRoi)}
                      </PercentText>
                      <PercentKey>{translateText("BTC ROI")}</PercentKey>
                    </PercentUpdateItem>
                    <PercentUpdateItem className="percent-wrapper">
                      <PercentText>
                        {formatRoiValue(item.ethRoi)}
                      </PercentText>
                      <PercentKey>{translateText("ETH ROI")}</PercentKey>
                    </PercentUpdateItem>
                    {!hideAthRoi ? (
                      <PercentUpdateItem className="percent-wrapper">
                        <PercentText>
                          {formatRoiValue(item.athRoi)}
                        </PercentText>
                        <PercentKey>{translateText("ATH ROI")}</PercentKey>
                      </PercentUpdateItem>
                    ) : null}
                  </StatisticsInfo>
                </RightColumn>
              </RoundInfoWrapper>
            </Round>
          );
        })
      ) : (
        <EmptyList />
      )}

      <AddRoundModal
        isAddRoundModal={isAddRoundModal}
        project={projectDataToUpdate}
        onChange={(items: Array<IFundingRound>) => {
          inputsHandler && inputsHandler("fundraising", items);
        }}
        onClose={() => setIsAddRoundModal(false)}
      />

      <EditRoundModal
        round={selectedRound}
        index={editRoundIndex}
        isEditModal={typeof editRoundIndex === "number"}
        project={projectDataToUpdate}
        onChange={(items: Array<IFundingRound>) => {
          inputsHandler && inputsHandler("fundraising", items);
        }}
        onClose={() => {
          setEditRoundIndex(null);
        }}
      />
    </Wrapper>
  );
};

export default FundingRounds;
