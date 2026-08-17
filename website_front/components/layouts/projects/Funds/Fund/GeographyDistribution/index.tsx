import React, { FC, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import styled from "styled-components";
import type { IFundProps } from "..";
import { COLORS } from "../../../Crypto/Project/Fundraising";
import { PieValuesPercentage } from "../../../Crypto/Project/Fundraising/styles";
import {
  PieWrapper,
  Table,
  TableHeader,
  TokenDistribution,
} from "../../../Crypto/Project/Unlocks/styles";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import PieGraphic from "../../../Crypto/Project/Fundraising/pie";
import EmptySection from "../../../../../global/EmptySection";
import { Title } from "../Overview/styles";
import { IGeographyDistributionItem } from "../../../../../../types/global_types";
import CreateButton from "../../../../../global/common/CreateButton";
import { CloseIcon } from "../../../../../global/Icons";
import { IPersonPortfolioItem } from "../../../Persons/Person/AddPortfolioItem";
import InvestmentHistory from "../../../Persons/Person/InvestmentHistory";
import {
  Body as InvestmentHistoryBody,
  Header as InvestmentHistoryHeader,
  Row as InvestmentHistoryRow,
  Wrapper as InvestmentHistoryWrapper,
} from "../../../Persons/Person/InvestmentHistory/styles";
import fetchPortfolioGeography from "../../../../../../http/funds/fetchFundPortfolioGeography";
import {
  PortfolioGeographyInvestor,
  PortfolioGeographyPreviewItem,
  PortfolioGeographyProject,
  PortfolioGeographyRound,
} from "../../../../../../types/portfolioGeography";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import Placeholder from "../../../../../global/common/Placeholder";
import { SupportedProjects } from "../../../../../global/common/UniversalTable/components/BackersFundsRowContent";

interface GeographyChartItem extends IGeographyDistributionItem {
  projectSlug: string;
  projectName: string;
  projectLogo: string;
  projectSymbol: string;
  projectCategory: string;
  region: string;
  investorsCount: number;
  allocatedLabel: string;
  coInvestorsPreview: Array<PortfolioGeographyPreviewItem>;
}

const ScrollableInvestmentHistoryBody = styled(InvestmentHistoryBody)`
  max-height: 610px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const GeographyProjectCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  .project-title {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .project-title strong {
    color: var(--main-black);
    font-weight: var(--font-weight-medium);
    font-size: 14px;
    line-height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .project-title span {
    color: var(--main-gray);
    font-size: 10px;
    line-height: 12px;
  }
`;

const StackValue = styled.div`
  padding: 10px;

  > div {
    justify-content: flex-start;
  }
`;

const RoundInfo = styled.div`
  min-width: 0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: var(--main-gray);
    font-size: 10px;
    line-height: 12px;
  }
`;

const RoleValue = styled.div<{ $isLead: boolean }>`
  padding: 10px;
  color: ${({ $isLead }) => ($isLead ? "#04a584" : "var(--main-black)")};
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17.15px;
`;

const SelectedTitleText = styled.span`
  .selected-project-name {
    font-weight: var(--font-weight-medium);
  }
`;

const slugify = (value: string): string => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getFundSlug = (fund: any): string => {
  return (
    fund?.slug ||
    fund?.sourceKey ||
    fund?.key ||
    fund?.sourceRefs?.key ||
    slugify(fund?.name || "")
  );
};

const buildChartItems = (
  projects: Array<PortfolioGeographyProject>
): Array<GeographyChartItem> => {
  const rawItems = projects.flatMap((project: PortfolioGeographyProject) => {
    return (project.regionCounts || [])
      .filter((regionCount) => {
        return String(regionCount.region || "").trim().toLowerCase() !== "unknown";
      })
      .map((regionCount) => ({
        projectSlug: project.projectSlug,
        projectName: project.projectName,
        projectLogo: project.logo,
        projectSymbol: project.symbol || "",
        projectCategory: project.category || "",
        region: regionCount.region,
        investorsCount: regionCount.investorsCount,
        coInvestorsPreview: regionCount.coInvestorsPreview || [],
      }));
  });
  const total = rawItems.reduce((sum: number, item) => {
    return sum + (Number.isFinite(item.investorsCount) ? item.investorsCount : 0);
  }, 0);

  return rawItems
    .filter((item) => item.investorsCount > 0)
    .map((item, index: number) => ({
      id: index,
      name: `${item.projectName} - ${item.region}`,
      value: total ? Number(((item.investorsCount / total) * 100).toFixed(1)) : 0,
      allocated: item.investorsCount,
      allocatedLabel: `${item.investorsCount} investors`,
      items: [],
      projectSlug: item.projectSlug,
      projectName: item.projectName,
      projectLogo: item.projectLogo,
      projectSymbol: item.projectSymbol,
      projectCategory: item.projectCategory,
      region: item.region,
      investorsCount: item.investorsCount,
      coInvestorsPreview: item.coInvestorsPreview,
    }))
    .sort((a, b) => b.investorsCount - a.investorsCount || a.name.localeCompare(b.name))
    .slice(0, 6);
};

const placeholderRows = [0, 1, 2, 3, 4, 5];
const investorsTableColumnsStyle = {
  gridTemplateColumns: "1.6fr 0.8fr 1fr 1.1fr",
};

const getPrimaryRound = (
  item: PortfolioGeographyInvestor
): PortfolioGeographyRound | undefined => {
  return item.rounds?.[0];
};

const getRoundMeta = (
  item: PortfolioGeographyInvestor
): string => {
  const additionalCount =
    item.additionalRoundsCount ?? Math.max(0, (item.rounds?.length || 0) - 1);
  if (additionalCount > 0) return `+${additionalCount} rounds`;
  return "";
};

const getRoundRole = (
  item: PortfolioGeographyInvestor,
  primaryRound?: PortfolioGeographyRound
): { label: string; isLead: boolean } => {
  const role = String(item.roundRole || primaryRound?.role || "").toLowerCase();
  const isLead = Boolean(item.roundIsLead || primaryRound?.isLead || role === "lead");
  if (isLead) return { label: "Lead", isLead };

  return { label: "Participant", isLead };
};

const GeographyDistributionSkeleton: FC = () => {
  return (
    <TokenDistribution variant="main">
      <PieWrapper>
        <Placeholder
          width="260px"
          height="260px"
          borderRadius="50%"
          marginBottom="0"
        />
      </PieWrapper>
      <Table>
        <TableHeader>
          <div>Project / Region</div>
          <div>Share</div>
          <div>Co-investors</div>
        </TableHeader>
        {placeholderRows.map((item) => (
          <PieValuesPercentage
            className="token-distribution"
            key={`geography-placeholder-${item}`}
            color="#e4e9f0"
            variant="p"
          >
            <div className="name">
              <Placeholder
                width="70%"
                height="16px"
                borderRadius="8px"
                marginBottom="0"
              />
            </div>
            <div>
              <Placeholder
                width="46px"
                height="16px"
                borderRadius="8px"
                marginBottom="0"
              />
            </div>
            <div>
              <Placeholder
                width="92px"
                height="16px"
                borderRadius="8px"
                marginBottom="0"
              />
            </div>
          </PieValuesPercentage>
        ))}
      </Table>
    </TokenDistribution>
  );
};

const GeographyInvestorsTableSkeleton: FC = () => {
  return (
    <InvestmentHistoryWrapper variant="main">
      <InvestmentHistoryHeader style={investorsTableColumnsStyle}>
        <div>Investor</div>
        <div>Role</div>
        <div>Portfolio</div>
        <div>Round</div>
      </InvestmentHistoryHeader>
      <ScrollableInvestmentHistoryBody>
        {placeholderRows.map((item) => (
          <InvestmentHistoryRow
            key={`co-investors-placeholder-${item}`}
            style={investorsTableColumnsStyle}
          >
            <div className="project">
              <Placeholder
                width="32px"
                height="32px"
                borderRadius="50%"
                marginBottom="0"
              />
              <div className="project-info" style={{ width: "100%" }}>
                <Placeholder
                  width="70%"
                  height="14px"
                  borderRadius="8px"
                  marginBottom="4px"
                />
                <Placeholder
                  width="44%"
                  height="10px"
                  borderRadius="8px"
                  marginBottom="0"
                />
              </div>
            </div>
            <div className="bold">
              <Placeholder width="78px" height="14px" borderRadius="8px" marginBottom="0" />
            </div>
            <div className="bold">
              <Placeholder width="42px" height="14px" borderRadius="8px" marginBottom="0" />
            </div>
            <div className="value">
              <Placeholder width="62px" height="14px" borderRadius="8px" marginBottom="4px" />
              <Placeholder width="44px" height="10px" borderRadius="8px" marginBottom="0" />
            </div>
          </InvestmentHistoryRow>
        ))}
      </ScrollableInvestmentHistoryBody>
    </InvestmentHistoryWrapper>
  );
};

const GeographyInvestorsTable: FC<{
  items: Array<PortfolioGeographyInvestor>;
}> = ({ items }) => {
  return (
    <InvestmentHistoryWrapper variant="main">
      {items.length ? (
        <>
          <InvestmentHistoryHeader style={investorsTableColumnsStyle}>
            <div>Investor</div>
            <div>Role</div>
            <div>Portfolio</div>
            <div>Round</div>
          </InvestmentHistoryHeader>
          <ScrollableInvestmentHistoryBody>
            {items.map((item: PortfolioGeographyInvestor, index: number) => {
              const primaryRound = getPrimaryRound(item);
              const roundName = item.roundName || primaryRound?.name || "-";
              const roundMeta = getRoundMeta(item);
              const roundRole = getRoundRole(item, primaryRound);

              return (
                <InvestmentHistoryRow
                  key={`${item.slug || item.name}-${index}`}
                  style={investorsTableColumnsStyle}
                >
                  <div className="project">
                    <UserAvatar
                      avatar={imageLoader(String(item.logo || ""))}
                      name={item.name || ""}
                      variant="default"
                      size="small"
                      fallbackType="project"
                    />
                    <div className="project-info">
                      <div>{item.name || "-"}</div>
                      <span>{item.category || item.slug || ""}</span>
                    </div>
                  </div>
                  <RoleValue $isLead={roundRole.isLead}>
                    {roundRole.label}
                  </RoleValue>
                  <StackValue>
                    <SupportedProjects
                      count={item.portfolioProjectsCount || 0}
                      projects={item.portfolioProjectsPreview || []}
                      showCountWhenEmpty
                    />
                  </StackValue>
                  <RoundInfo>
                    <strong>{roundName}</strong>
                    {roundMeta ? <span>{roundMeta}</span> : null}
                  </RoundInfo>
                </InvestmentHistoryRow>
              );
            })}
          </ScrollableInvestmentHistoryBody>
        </>
      ) : (
        <>
          <br />
          <EmptySection />
          <br />
        </>
      )}
    </InvestmentHistoryWrapper>
  );
};

const GeographyDistribution: FC<IFundProps> = ({
  fund,
  fundDataToUpdate,
  isEditState,
  inputsHandler,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<GeographyChartItem>();
  const fundSlug = useMemo(() => getFundSlug(fund), [fund]);
  const selectedProjectSlug = !isEditState ? selectedCategory?.projectSlug : "";
  const selectedRegion = !isEditState ? selectedCategory?.region : "";
  const {
    data: geographyResponse,
    isFetching: isGeographyFetching,
    isLoading: isGeographyLoading,
  } = useQuery(
    ["fund-portfolio-geography", fundSlug],
    () =>
      fetchPortfolioGeography(fundSlug, {
        includeUnknown: false,
        minCoInvestors: 1,
      }),
    {
      enabled: !isEditState && Boolean(fundSlug),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );
  const geographyData = geographyResponse?.data?.ok
    ? geographyResponse.data
    : null;
  const {
    data: selectedGeographyResponse,
    isLoading: isSelectedGeographyLoading,
  } = useQuery(
    [
      "fund-portfolio-geography-selected",
      fundSlug,
      selectedProjectSlug,
      selectedRegion,
    ],
    () =>
      fetchPortfolioGeography(fundSlug, {
        projectSlug: selectedProjectSlug,
        region: selectedRegion,
        includeUnknown: false,
        minCoInvestors: 1,
        selectedOnly: true,
      }),
    {
      enabled:
        !isEditState && Boolean(fundSlug) && Boolean(selectedProjectSlug),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );
  const selectedGeographyData = selectedGeographyResponse?.data?.ok
    ? selectedGeographyResponse.data
    : null;
  const chartItems = useMemo(() => {
    return buildChartItems(geographyData?.projects || []);
  }, [geographyData?.projects]);
  const selectedInvestors = selectedGeographyData?.selected?.investors || [];

  useEffect(() => {
    if (isEditState || !selectedCategory || isGeographyFetching) return;
    const hasSelectedItem = chartItems.some((item) => {
      return (
        item.projectSlug === selectedCategory.projectSlug &&
        item.region === selectedCategory.region
      );
    });
    if (!hasSelectedItem) setSelectedCategory(undefined);
  }, [chartItems, isEditState, isGeographyFetching, selectedCategory]);

  const addItem = (): void => {
    if (!fundDataToUpdate) return;

    const id: number = Math.random() * 1000 + new Date().getTime();

    const updatedItems: Array<IGeographyDistributionItem> =
      fundDataToUpdate.georaphyInvestments
        ? [
          ...fundDataToUpdate.georaphyInvestments,
          { name: "", value: 0, allocated: 0, items: [], id },
        ]
        : [{ name: "", value: 0, allocated: 0, items: [], id }];

    inputsHandler("georaphyInvestments", updatedItems);
  };

  const removeItem = (id: number): void => {
    if (!fundDataToUpdate?.georaphyInvestments?.length) return;

    const updatedItems: Array<IGeographyDistributionItem> =
      fundDataToUpdate.georaphyInvestments.filter(
        (item: IGeographyDistributionItem) => {
          return item.id !== id;
        }
      );

    inputsHandler("georaphyInvestments", updatedItems);
  };

  const inputHandler = (id: number, key: string, value: any): void => {
    if (!fundDataToUpdate?.georaphyInvestments?.length) return;

    const updatedItems: Array<IGeographyDistributionItem> =
      fundDataToUpdate.georaphyInvestments.map(
        (item: IGeographyDistributionItem) => {
          if (item.id === id) {
            return { ...item, [key]: value };
          }

          return item;
        }
      );

    inputsHandler("georaphyInvestments", updatedItems);
  };

  const investmentHistoryItems: Array<IPersonPortfolioItem> = useMemo(() => {
    if (!selectedCategory) return [];

    return (
      (isEditState ? fundDataToUpdate : fund)?.georaphyInvestments?.find(
        (item: IGeographyDistributionItem) => {
          return item.id === selectedCategory.id;
        }
      )?.items || []
    );
  }, [isEditState, fundDataToUpdate, fund, selectedCategory]);

  const isInitialGeographyLoading =
    !isEditState && (isGeographyLoading || isGeographyFetching) && !geographyData;
  const isCoInvestorsLoading =
    !isEditState &&
    Boolean(selectedCategory) &&
    isSelectedGeographyLoading &&
    !selectedGeographyData;

  return (
    <div>
      {isEditState ? (
        <TokenDistribution variant="main">
          <PieWrapper>
            <PieGraphic
              innerRadius={80}
              outerRadius={130}
              width={260}
              height={260}
              // @ts-ignore
              // items={project?.totalAllocation || []}
              onChange={(value: any) => setSelectedCategory(value)}
              items={fundDataToUpdate?.georaphyInvestments || []}
            />
          </PieWrapper>
          <Table>
            <TableHeader>
              <div>Category</div>
              <div>Total %</div>
              <div>Allocated</div>
            </TableHeader>
            {fundDataToUpdate?.georaphyInvestments?.length ? (
              fundDataToUpdate.georaphyInvestments.map(
                (item: any, index: number) => {
                  return (
                    <PieValuesPercentage
                      className="edit-item"
                      key={index}
                      color={COLORS[index]}
                      variant="p"
                    >
                      <div className="input-wrapper">
                        <i />
                        <input
                          placeholder="Enter type"
                          style={{ maxWidth: "210px" }}
                          value={item.name}
                          onChange={(e: any) =>
                            inputHandler(item.id, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="price-input">
                        <div className="left-icon">$</div>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={String(item.value)}
                          onChange={(e: any) =>
                            inputHandler(
                              item.id,
                              "value",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div className="price-input">
                        <div className="left-icon">$</div>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={String(item.allocated)}
                          onChange={(e: any) =>
                            inputHandler(
                              item.id,
                              "allocated",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="remove-btn"
                      >
                        <CloseIcon fill="#738094" />
                      </button>
                    </PieValuesPercentage>
                  );
                }
              )
            ) : (
              null
            )}
            <CreateButton onClick={addItem} type="add">
              Add Type
            </CreateButton>
          </Table>
        </TokenDistribution>
      ) : isInitialGeographyLoading ? (
        <GeographyDistributionSkeleton />
      ) : chartItems.length ? (
        <TokenDistribution variant="main">
          <PieWrapper>
            <PieGraphic
              innerRadius={80}
              outerRadius={130}
              width={260}
              height={260}
              // @ts-ignore
              // items={project?.totalAllocation || []}
              onChange={(value: any) => setSelectedCategory(value)}
              items={chartItems}
            />
          </PieWrapper>
          <Table>
            <TableHeader>
              <div>Project / Region</div>
              <div>Share</div>
              <div>Co-investors</div>
            </TableHeader>
            {chartItems.length ? (
              chartItems.map((item: GeographyChartItem, index: number) => {
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedCategory(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <PieValuesPercentage
                      className="token-distribution"
                      color={COLORS[index]}
                      variant="p"
                    >
                      <div className="name">
                        <i />
                        <GeographyProjectCell>
                          <UserAvatar
                            avatar={imageLoader(String(item.projectLogo || ""))}
                            name={item.projectName || ""}
                            variant="default"
                            size="xSmall"
                            fallbackType="project"
                          />
                          <div className="project-title">
                            <strong>{item.projectName}</strong>
                            <span>{item.region}</span>
                          </div>
                        </GeographyProjectCell>
                      </div>
                      <div>{item.value || 0}%</div>
                      <div>
                        <SupportedProjects
                          count={item.investorsCount || 0}
                          projects={item.coInvestorsPreview || []}
                          showCountWhenEmpty
                        />
                      </div>
                    </PieValuesPercentage>
                  </div>
                );
              })
            ) : (
              null
            )}
          </Table>
        </TokenDistribution>
      ) : (
        <>
          <br />
          <EmptySection />
          <br />
        </>
      )}
      {selectedCategory ? (
        <>
          <Title style={{ marginTop: "40px", marginBottom: "20px" }}>
            {isEditState ? (
              <span>{`Investment History - ${selectedCategory.name}`}</span>
            ) : (
              <SelectedTitleText>
                Co-investors -{" "}
                <span className="selected-project-name">
                  {selectedCategory.projectName}
                </span>{" "}
                - {selectedCategory.region}
              </SelectedTitleText>
            )}
            <div className="total-investment">
              <div>{isEditState ? "Total Investments:" : "Total Co-investors:"}</div>
              <span>
                {clarifyAmount(selectedCategory.allocated, true)} (
                {selectedCategory.value}%)
              </span>
            </div>
          </Title>
          {isEditState ? (
            <InvestmentHistory
              isEditState={isEditState}
              items={investmentHistoryItems}
              onChange={(items: Array<IPersonPortfolioItem>) => {
                inputHandler(selectedCategory.id, "items", items);
              }}
            />
          ) : isCoInvestorsLoading ? (
            <GeographyInvestorsTableSkeleton />
          ) : (
            <GeographyInvestorsTable items={selectedInvestors} />
          )}
        </>
      ) : (
        null
      )}
    </div>
  );
};

export default GeographyDistribution;
