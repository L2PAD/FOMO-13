import React, { useContext, useState } from "react";
import moment from "moment";
import { useQuery } from "react-query";
import {
  Columns,
  InfoBlock,
  InfoCard,
  LeftColumn,
  RightColumn,
  StatisticsCard,
  Wrapper,
} from "./styles";
import UserActivityFeed from "../ActivityFeed";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import { AuthContext } from "../../../../global/Layout";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import Connections from "../Connections";
import UserTabs from "../../../../global/UserTabs";
import UserPostedContent from "../../../../global/UserPostedContent";
import UserCommentHistory from "../../../../global/UserCommentHistory";
import fetchUserActivityStats, {
  EMPTY_USER_ACTIVITY_STATS,
} from "../../../../../http/user/fetchUserActivityStats";
import { useTotalBalance } from "../../../../../hooks/useTotalBalance";
import { useTranslation } from "i18n";

interface IDescriptionModals {
  isPoints: boolean;
  isScore: boolean;
  isBalance: boolean;
  isPartners: boolean;
  isAwards: boolean;
  isOtc: boolean;
  isSells: boolean;
  isBuys: boolean;
  isRevenue: boolean;
}

const formatNumber = (value?: number | string | null): string => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "0";
  }

  return numberValue.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

const formatCurrency = (value?: number | string | null): string =>
  `$${formatNumber(value)}`;

const formatPercent = (value?: number | string | null): string =>
  value === null || value === undefined ? "-" : `${formatNumber(value)}%`;

const formatDate = (value?: string | null): string =>
  value ? moment(value).format("ll") : "-";

const getRoiValueClassName = (value?: number | null): string => {
  if (value === null || value === undefined) return "value";
  if (value < 0) return "value main-red";
  if (value > 0) return "value main-green";

  return "value";
};

const UserActivity = () => {
  const { translateText } = useTranslation();
  const { userData } = useContext(AuthContext);
  const { total: totalBalance } = useTotalBalance();
  const { data: activityStatsResponse } = useQuery(
    ["user-activity-stats", userData?._id],
    fetchUserActivityStats,
    {
      enabled: !!userData?._id,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    }
  );
  const [descriptionModals, setDescriptionModals] =
    useState<IDescriptionModals>({
      isPoints: false,
      isScore: false,
      isBalance: false,
      isPartners: false,
      isAwards: false,
      isOtc: false,
      isSells: false,
      isBuys: false,
      isRevenue: false,
    });
  const activityStats =
    activityStatsResponse?.data || EMPTY_USER_ACTIVITY_STATS;
  const portfolioSnapshot = activityStats.portfolioSnapshot;
  const statistics = activityStats.statistics;
  const otcP2p = activityStats.otcP2p;

  return (
    <>
      <Wrapper>
        <Columns>
          <LeftColumn>
            <InfoBlock>
              <h2>{translateText("Portfolio Snapshot")}</h2>
              <div className="profile-cards">
                <InfoCard variant="main">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="34"
                    height="34"
                    viewBox="0 0 34 34"
                    fill="none"
                  >
                    <path
                      d="M21.2275 13.2561C21.3178 13.5171 21.6025 13.6554 21.8635 13.5651C22.1245 13.4748 22.2628 13.19 22.1725 12.9291L21.2275 13.2561ZM19 11.0556L19.022 10.556C19.0146 10.5557 19.0073 10.5556 19 10.5556V11.0556ZM15 17.1667V17.6667V17.1667ZM19 23.2778V23.7778V23.2778ZM15 23.2778L14.978 23.7773C14.9853 23.7776 14.9927 23.7778 15 23.7778V23.2778ZM12.7725 21.0772C12.6822 20.8163 12.3975 20.6779 12.1365 20.7682C11.8755 20.8585 11.7372 21.1433 11.8275 21.4042L12.7725 21.0772ZM17.5 8C17.5 7.72385 17.2761 7.5 17 7.5C16.7239 7.5 16.5 7.72385 16.5 8H17.5ZM16.5 11.0556C16.5 11.3317 16.7239 11.5556 17 11.5556C17.2761 11.5556 17.5 11.3317 17.5 11.0556H16.5ZM17.5 23.2778C17.5 23.0016 17.2761 22.7778 17 22.7778C16.7239 22.7778 16.5 23.0016 16.5 23.2778H17.5ZM16.5 26.3333C16.5 26.6095 16.7239 26.8333 17 26.8333C17.2761 26.8333 17.5 26.6095 17.5 26.3333H16.5ZM22.1725 12.9291C21.9413 12.261 21.5187 11.6772 20.9574 11.2538L20.3551 12.0521C20.7562 12.3547 21.0606 12.7737 21.2275 13.2561L22.1725 12.9291ZM20.9574 11.2538C20.396 10.8303 19.722 10.5868 19.022 10.556L18.978 11.5551C19.4745 11.5769 19.9541 11.7496 20.3551 12.0521L20.9574 11.2538ZM19 10.5556H15V11.5556H19V10.5556ZM15 10.5556C14.0687 10.5556 13.1775 10.9324 12.5219 11.6002L13.2355 12.3008C13.705 11.8225 14.3399 11.5556 15 11.5556V10.5556ZM12.5219 11.6002C11.8666 12.2677 11.5 13.171 11.5 14.1111H12.5C12.5 13.4304 12.7656 12.7794 13.2355 12.3008L12.5219 11.6002ZM11.5 14.1111C11.5 15.0512 11.8666 15.9545 12.5219 16.622L13.2355 15.9214C12.7656 15.4428 12.5 14.7918 12.5 14.1111H11.5ZM12.5219 16.622C13.1775 17.2898 14.0687 17.6667 15 17.6667V16.6667C14.3399 16.6667 13.705 16.3997 13.2355 15.9214L12.5219 16.622ZM15 17.6667H19V16.6667H15V17.6667ZM19 17.6667C19.66 17.6667 20.295 17.9336 20.7645 18.4119L21.4781 17.7113C20.8225 17.0435 19.9312 16.6667 19 16.6667V17.6667ZM20.7645 18.4119C21.2344 18.8905 21.5 19.5415 21.5 20.2222H22.5C22.5 19.2822 22.1334 18.3788 21.4781 17.7113L20.7645 18.4119ZM21.5 20.2222C21.5 20.9029 21.2344 21.5539 20.7645 22.0325L21.4781 22.7331C22.1334 22.0656 22.5 21.1623 22.5 20.2222H21.5ZM20.7645 22.0325C20.295 22.5108 19.66 22.7778 19 22.7778V23.7778C19.9312 23.7778 20.8225 23.4009 21.4781 22.7331L20.7645 22.0325ZM19 22.7778H15V23.7778H19V22.7778ZM15.022 22.7783C14.5255 22.7564 14.0459 22.5838 13.6449 22.2812L13.0426 23.0795C13.604 23.503 14.278 23.7465 14.978 23.7773L15.022 22.7783ZM13.6449 22.2812C13.2438 21.9786 12.9394 21.5596 12.7725 21.0772L11.8275 21.4042C12.0587 22.0723 12.4813 22.6561 13.0426 23.0795L13.6449 22.2812ZM16.5 8V11.0556H17.5V8H16.5ZM16.5 23.2778V26.3333H17.5V23.2778H16.5ZM32.5 17C32.5 25.5604 25.5604 32.5 17 32.5V33.5C26.1127 33.5 33.5 26.1127 33.5 17H32.5ZM17 32.5C8.43958 32.5 1.5 25.5604 1.5 17H0.5C0.5 26.1127 7.8873 33.5 17 33.5V32.5ZM1.5 17C1.5 8.43958 8.43958 1.5 17 1.5V0.5C7.8873 0.5 0.5 7.8873 0.5 17H1.5ZM17 1.5C25.5604 1.5 32.5 8.43958 32.5 17H33.5C33.5 7.8873 26.1127 0.5 17 0.5V1.5Z"
                      fill="#070B35"
                    />
                  </svg>
                  <div className="key">{translateText("Total Invested")}</div>
                  <div className="value">
                    {formatCurrency(portfolioSnapshot.totalInvestedUsd)}
                  </div>
                </InfoCard>
                <InfoCard variant="main">
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
                  <div className="key">{translateText("Number of Deals")}</div>
                  <div className="value">
                    {formatNumber(portfolioSnapshot.numberOfDeals)}
                  </div>
                </InfoCard>
                <InfoCard variant="main">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    fill="none"
                  >
                    <path
                      d="M20.0001 4C28.8366 4.00005 36 11.1635 36 20.0001C36 28.8366 28.8366 36.0001 20 36.0001C11.1634 36.0001 4 28.8366 4 20.0001C4 11.1635 11.1635 3.99995 20.0001 4ZM20.0001 4L20 20.0001M20 20.0001L9 31.0001M20 20.0001L9 9.0001"
                      stroke="#070B35"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="key">{translateText("Average Investments")}</div>
                  <div className="value">
                    {formatCurrency(portfolioSnapshot.averageInvestmentUsd)}
                  </div>
                </InfoCard>
                <InfoCard variant="main">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    fill="none"
                  >
                    <path
                      d="M10.4 20C10.4 21.7673 8.96731 23.2 7.2 23.2C5.43269 23.2 4 21.7673 4 20C4 18.2327 5.43269 16.8 7.2 16.8C8.96731 16.8 10.4 18.2327 10.4 20ZM10.4 20H29.6M29.6 20C29.6 21.7673 31.0327 23.2 32.8 23.2C34.5673 23.2 36 21.7673 36 20C36 18.2327 34.5673 16.8 32.8 16.8C31.0327 16.8 29.6 18.2327 29.6 20ZM29.6 7.2C29.6 8.96731 31.0327 10.4 32.8 10.4C34.5673 10.4 36 8.96731 36 7.2C36 5.43269 34.5673 4 32.8 4C31.0327 4 29.6 5.43269 29.6 7.2ZM29.6 7.2H20.4C19.5163 7.2 18.8 7.91634 18.8 8.8V31.2C18.8 32.0837 19.5163 32.8 20.4 32.8H29.6M29.6 32.8C29.6 34.5673 31.0327 36 32.8 36C34.5673 36 36 34.5673 36 32.8C36 31.0327 34.5673 29.6 32.8 29.6C31.0327 29.6 29.6 31.0327 29.6 32.8Z"
                      stroke="#070B35"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="key">{translateText("Projects Supported")}</div>
                  <div className="value">
                    {formatNumber(portfolioSnapshot.projectsSupported)}
                  </div>
                </InfoCard>
                <InfoCard variant="main">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    fill="none"
                  >
                    <path
                      d="M10 10V17M30 10V17M29 24H33C34.6568 24 36 22.6569 36 21V7C36 5.34315 34.6568 4 33 4H7C5.34315 4 4 5.34315 4 7V21C4 22.6569 5.34315 24 7 24H11M14.3416 30.3428L19.9984 35.9996M19.9984 35.9996L25.2742 30.7239M19.9984 35.9996L19.9986 24.4291M24 14C24 16.2091 22.2091 18 20 18C17.7909 18 16 16.2091 16 14C16 11.7909 17.7909 10 20 10C22.2091 10 24 11.7909 24 14Z"
                      stroke="#070B35"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="key">{translateText("Last Investments")}</div>
                  <div className="value">
                    {formatDate(portfolioSnapshot.lastInvestmentAt)}
                  </div>
                </InfoCard>
                <InfoCard variant="main">
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
                  <div className="key">{translateText("Average ROI")}</div>
                  <div
                    className={getRoiValueClassName(
                      portfolioSnapshot.averageRoiPercent
                    )}
                  >
                    {formatPercent(portfolioSnapshot.averageRoiPercent)}
                  </div>
                </InfoCard>
              </div>
            </InfoBlock>
            <UserActivityFeed />
          </LeftColumn>
          <RightColumn>
            <h2>{translateText("Statistics")}</h2>
            <StatisticsCard variant="main">
              <div className="row">
                <div className="key">
                  <span className="key-value">{translateText("My Points")}</span>
                  <button
                    onMouseEnter={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isPoints: true };
                      });
                    }}
                    onMouseLeave={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isPoints: false };
                      });
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                <div className="value">{formatNumber(statistics.points)}</div>

                <DescriptionComponent
                  className="description-component"
                  isVisible={descriptionModals.isPoints}
                  date={new Date()}
                  text={`
                                        ${translateText("Your accumulated points for platform activity: commenting, rating projects, participating in the Launchpad, or verifying data etc.")}

                                    `}
                  isDate={false}
                />
              </div>
              <div className="row">
                <div className="key">
                  <span className="key-value">{translateText("Score")}</span>
                  <button
                    onMouseEnter={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isScore: true };
                      });
                    }}
                    onMouseLeave={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isScore: false };
                      });
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                <div className="value">{formatNumber(statistics.score)}</div>

                <DescriptionComponent
                  className="description-component"
                  isVisible={descriptionModals.isScore}
                  date={new Date()}
                  text={`
                                        ${translateText("A trust score based on your overall profile activity, completed deals, project participation, and feedback from other users.")}

                                    `}
                  isDate={false}
                />
              </div>
              <div className="row">
                <div className="key">
                  <span className="key-value">{translateText("Balance")}</span>
                  <button
                    onMouseEnter={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isBalance: true };
                      });
                    }}
                    onMouseLeave={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isBalance: false };
                      });
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                <div className="value">{formatCurrency(totalBalance)}</div>

                <DescriptionComponent
                  className="description-component"
                  isVisible={descriptionModals.isBalance}
                  date={new Date()}
                  text={`
                                        ${translateText("Your current FOMO wallet balance, matching the balance shown in the navigation.")}

                                    `}
                  isDate={false}
                />
              </div>
              <div className="row">
                <div className="key">
                  <span className="key-value">{translateText("Partners")}</span>
                  <button
                    onMouseEnter={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isPartners: true };
                      });
                    }}
                    onMouseLeave={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isPartners: false };
                      });
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                <div className="value">{formatNumber(statistics.partners)}</div>

                <DescriptionComponent
                  className="description-component"
                  isVisible={descriptionModals.isPartners}
                  date={new Date()}
                  text={`
                                        ${translateText("Number of verified users who confirmed partnerships or interacted with you through projects or OTC deals.")}

                                    `}
                  isDate={false}
                />
              </div>
              <div className="row">
                <div className="key">
                  <span className="key-value">{translateText("Awards")}</span>
                  <button
                    onMouseEnter={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isAwards: true };
                      });
                    }}
                    onMouseLeave={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isAwards: false };
                      });
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                <div className="value">{formatNumber(statistics.awards)}</div>

                <DescriptionComponent
                  className="description-component"
                  isVisible={descriptionModals.isAwards}
                  date={new Date()}
                  text={`
                                        ${translateText("Badges or achievements received for contributing to projects, community engagement, or special events.")}

                                    `}
                  isDate={false}
                />
              </div>
            </StatisticsCard>
            <h2>{translateText("OTC / P2P Activity")}</h2>
            <StatisticsCard variant="main">
              <div className="row">
                <div className="key">
                  <span className="key-value">{translateText("OTC Rating")}</span>
                  <button
                    onMouseEnter={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isOtc: true };
                      });
                    }}
                    onMouseLeave={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isOtc: false };
                      });
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                <div className="value">{formatPercent(otcP2p.ratingPercent)}</div>

                <DescriptionComponent
                  className="description-component"
                  isVisible={descriptionModals.isOtc}
                  date={new Date()}
                  text={`
                                        ${translateText("Your trust score as an OTC/P2P trader. Calculated based on trade volume, successful transactions, and partner feedback.")}

                                    `}
                  isDate={false}
                />
              </div>
              <div className="row">
                <div className="key">
                  <span className="key-value">{translateText("Sells")}</span>
                  <button
                    onMouseEnter={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isSells: true };
                      });
                    }}
                    onMouseLeave={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isSells: false };
                      });
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                <div className="value">{formatNumber(otcP2p.sells)}</div>

                <DescriptionComponent
                  className="description-component"
                  isVisible={descriptionModals.isSells}
                  date={new Date()}
                  text={`
                                        ${translateText("Number of successfully completed OTC or P2P asset sales.")}
                                    `}
                  isDate={false}
                />
              </div>
              <div className="row">
                <div className="key">
                  <span className="key-value">{translateText("Buys")}</span>
                  <button
                    onMouseEnter={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isBuys: true };
                      });
                    }}
                    onMouseLeave={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isBuys: false };
                      });
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                <div className="value">{formatNumber(otcP2p.buys)}</div>

                <DescriptionComponent
                  className="description-component"
                  isVisible={descriptionModals.isBuys}
                  date={new Date()}
                  text={`
                                        ${translateText("Number of successfully completed OTC or P2P purchases.")}

                                    `}
                  isDate={false}
                />
              </div>
              <div className="row">
                <div className="key">
                  <span className="key-value">{translateText("Revenue")}</span>
                  <button
                    onMouseEnter={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isRevenue: true };
                      });
                    }}
                    onMouseLeave={() => {
                      setDescriptionModals((prev: IDescriptionModals) => {
                        return { ...prev, isRevenue: false };
                      });
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                <div className="value">{formatCurrency(otcP2p.revenueUsd)}</div>

                <DescriptionComponent
                  className="description-component"
                  isVisible={descriptionModals.isRevenue}
                  date={new Date()}
                  text={`
                                        ${translateText("Total earnings from OTC/P2P deals (excluding costs).")}

                                    `}
                  isDate={false}
                />
              </div>
            </StatisticsCard>
            <h2>{translateText("Created Tabs")}</h2>
            <UserTabs />
            <h2 style={{ marginTop: "20px" }}>{translateText("Posted Content")}</h2>
            <UserPostedContent userId={userData?._id} />
            <h2 style={{ marginTop: "20px" }}>{translateText("Comment History")}</h2>
            <UserCommentHistory />
          </RightColumn>
        </Columns>
      </Wrapper>
      <Connections />
    </>
  );
};

export default UserActivity;
