import React, { FC, useEffect, useMemo, useState } from "react";
import { COLORS } from "../../../Crypto/Project/Fundraising";
import CategoriesChart from "../../../../../global/common/CategoriesChart";
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
import { Title } from "../../../Funds/Fund/Overview/styles";
import {
  IFundCategoryDistributionItem,
  IFund,
  IPerson,
  IProject,
} from "../../../../../../types/global_types";
import CreateButton from "../../../../../global/common/CreateButton";
import { CloseIcon } from "../../../../../global/Icons";
import InvestmentHistory from "../InvestmentHistory";
import { IPersonPortfolioItem } from "../AddPortfolioItem";
import CustomNumberInput from "../../../../../global/common/components_for_modals/custom_number_input";

interface RoundCategoryItem {
  name: string;
  value: number;
  amount: number;
  _id?: string;
  allocatedLabel?: string;
  percentageLabel?: string;
  items?: Array<IPersonPortfolioItem>;
}

const toFiniteNumber = (value: any): number => {
  const parsed = Number(
    typeof value === "string"
      ? value.replace(/[$,%\s]/g, "").replace(/,/g, "")
      : value
  );

  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCategoryPercent = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed) return "0%";

  return `${parsed.toFixed(1).replace(/\.0$/, "")}%`;
};

const isValidDateValue = (value: any): boolean => {
  if (!value || value === "-") return false;

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
};

const normalizeCategoryPercentages = (
  rounds: Array<RoundCategoryItem>
): Array<RoundCategoryItem> => {
  if (!rounds?.length) return [];

  const totalAmount = rounds.reduce((sum, item) => {
    return sum + toFiniteNumber(item.amount);
  }, 0);
  const rawPercentTotal = rounds.reduce((sum, item) => {
    return sum + toFiniteNumber(item.value);
  }, 0);
  const shouldUseRawPercent =
    rawPercentTotal > 0 && Math.abs(rawPercentTotal - 100) <= 1;

  return rounds.map((item) => {
    const amount = toFiniteNumber(item.amount);
    const value = shouldUseRawPercent
      ? toFiniteNumber(item.value)
      : totalAmount
        ? Number(((amount / totalAmount) * 100).toFixed(2))
        : toFiniteNumber(item.value);

    return {
      ...item,
      amount,
      value,
      percentageLabel: formatCategoryPercent(value),
      allocatedLabel: String(clarifyAmount(amount, true)),
    };
  });
};

export const getPieDataWithOther = (
  rounds: RoundCategoryItem[],
  maxVisible: number = 5
): RoundCategoryItem[] => {
  if (!rounds || !Array.isArray(rounds)) return [];

  const visibleItems = rounds.slice(0, maxVisible);
  const hiddenItems = rounds.slice(maxVisible);

  if (hiddenItems.length === 0) return visibleItems;

  const otherItem = {
    name: "Other",
    value: Number(
      hiddenItems.reduce((acc, item) => acc + (item.value || 0), 0).toFixed(2)
    ),
    amount: hiddenItems.reduce((acc, item) => acc + (item.amount || 0), 0),
    allocatedLabel: String(clarifyAmount(
      hiddenItems.reduce((acc, item) => acc + (item.amount || 0), 0),
      true
    )),
  };

  return [
    ...visibleItems,
    {
      ...otherItem,
      percentageLabel: formatCategoryPercent(otherItem.value),
    },
  ];
};

interface IProps {
  itemData: IPerson | IFund;
  itemDataToUpdate: IPerson | IFund | null;
  isEditState: boolean;
  onChange: (name: string, value: any) => void;
  projects?: Array<IProject>;
  historyVariant?: "default" | "fundRounds";
}

const CategoryDistribution: FC<IProps> = ({
  itemData,
  itemDataToUpdate,
  isEditState,
  onChange,
  projects = [],
  historyVariant = "default",
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<IFundCategoryDistributionItem>();
  const [isMobile, setIsMobile] = useState(false);
  const isFundRoundHistory = historyVariant === "fundRounds";

  const addItem = (): void => {
    if (!itemDataToUpdate) return;

    const id: number = Math.random() * 1000 + new Date().getTime();

    const updatedItems: Array<IFundCategoryDistributionItem> =
      itemDataToUpdate.roundsByCategory
        ? [
            ...itemDataToUpdate.roundsByCategory,
            { name: "", value: 0, amount: 0, _id: String(id) },
          ]
        : [{ name: "", value: 0, amount: 0, _id: String(id) }];

    onChange("roundsByCategory", updatedItems);
  };

  const removeItem = (id: string): void => {
    if (!itemDataToUpdate?.roundsByCategory?.length) return;

    const updatedItems: Array<IFundCategoryDistributionItem> =
      itemDataToUpdate.roundsByCategory.filter(
        (item: IFundCategoryDistributionItem, i: number) => {
          return item._id !== id;
        }
      );

    onChange("roundsByCategory", updatedItems);
  };

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const inputHandler = (id: string, key: string, value: any): void => {
    if (!itemDataToUpdate?.roundsByCategory?.length) return;

    const updatedItems: Array<IFundCategoryDistributionItem> =
      itemDataToUpdate.roundsByCategory.map(
        (item: IFundCategoryDistributionItem, i: number) => {
          if (item._id === id) {
            return { ...item, [key]: value };
          }

          return item;
        }
      );

    onChange("roundsByCategory", updatedItems);
  };

  const sourceData = (isEditState && itemDataToUpdate
    ? itemDataToUpdate
    : itemData) as any;
  const dataToShow = getPieDataWithOther(
    normalizeCategoryPercentages(sourceData?.roundsByCategory || [])
  );

  const selectCategory = (category: IFundCategoryDistributionItem): void => {
    setSelectedCategory(category);
  };

  const normalizeComparableValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "object") {
      return normalizeComparableValue(
        value.name || value.label || value.title || value.value || value.slug
      );
    }

    return String(value || "").trim().toLowerCase();
  };

  const getProjectLookupKeys = (project: any): Array<string> => {
    return [
      project?._id,
      project?.id,
      project?.slug,
      project?.projectSlug,
      project?.sourceId,
      project?.name,
      project?.projectName,
    ]
      .filter(Boolean)
      .map(normalizeComparableValue)
      .filter(Boolean);
  };

  const projectLookup = useMemo(() => {
    const lookup = new Map<string, any>();
    const sourceProjects = [
      ...projects,
      ...(sourceData?.supportedProjects || []),
      ...(sourceData?.portfolioCoins || []),
      ...(sourceData?.investmentPorfolio || []).map(
        (item: IPersonPortfolioItem) => item.project
      ),
    ].filter(Boolean);

    sourceProjects.forEach((project: any) => {
      getProjectLookupKeys(project).forEach((key) => lookup.set(key, project));
    });

    return lookup;
  }, [
    projects,
    sourceData?.supportedProjects,
    sourceData?.portfolioCoins,
    sourceData?.investmentPorfolio,
  ]);

  const enrichProject = (project: any): any => {
    const matchedProject = getProjectLookupKeys(project)
      .map((key) => projectLookup.get(key))
      .find(Boolean);

    return matchedProject ? { ...matchedProject, ...project } : project;
  };

  const getCategoryNamesForSelection = (
    category: IFundCategoryDistributionItem
  ): Array<string> => {
    if (category.name !== "Other") return [category.name];

    return (sourceData?.roundsByCategory || [])
      .slice(5)
      .map((item: IFundCategoryDistributionItem) => item.name)
      .filter(Boolean);
  };

  const getPortfolioItemCategories = (item: IPersonPortfolioItem): Array<string> => {
    const project: any = enrichProject(item.project || {});
    const categories = [
      ...(Array.isArray(project.categories) ? project.categories : []),
      ...(Array.isArray(project.tags) ? project.tags : []),
      project.mainCategory?.name,
      project.mainCategory,
      project.type,
      project.category,
      project.sector,
      project.niche,
      project.stage,
    ];

    return categories.filter(Boolean).map((value) => String(value));
  };

  const isCategoryMatch = (
    itemCategories: Array<string>,
    categoryNames: Array<string>
  ): boolean => {
    return itemCategories.some((itemCategory) => {
      return categoryNames.some((categoryName) => {
        return (
          itemCategory === categoryName ||
          itemCategory.includes(categoryName) ||
          categoryName.includes(itemCategory)
        );
      });
    });
  };

  const supportedProjectToPortfolioItem = (
    project: any,
    index: number
  ): IPersonPortfolioItem => {
    const status = project?.status === "Exit" ? "Exit" : "Active";

    return {
      id: Number(project?.id || project?._id || index),
      project: project as any,
      investedRound: project?.stage || project?.round || "-",
      investedAmount: toFiniteNumber(project?.amount || project?.investedAmount),
      currentRoi: toFiniteNumber(project?.roi || project?.currentRoi),
      status,
      exitDate:
        status === "Exit" && isValidDateValue(project?.exitDate)
          ? project.exitDate
          : "",
      exitRoi: toFiniteNumber(project?.exitRoi),
    };
  };

  const firstNonEmpty = (...values: Array<any>): any => {
    return values.find((value) => {
      if (value === 0) return true;
      if (value === null || value === undefined) return false;
      if (typeof value === "string" && !value.trim()) return false;
      return true;
    });
  };

  const normalizeRoundDate = (value: any): any => {
    if (!value || value === "-") return "";
    if (value instanceof Date) return value;
    if (typeof value === "object") {
      return firstNonEmpty(
        value.normalized,
        value.date,
        value.value,
        value.startDate?.normalized,
        value.startDate,
        value.endDate?.normalized,
        value.endDate
      );
    }

    return value;
  };

  const getRoundProject = (round: any): any => {
    const category = firstNonEmpty(
      round?.category,
      round?.projectCategory,
      round?.sector,
      round?.niche
    );

    return enrichProject({
      _id: round?.projectSlug || round?.projectId || round?.id,
      id: round?.projectId || round?.projectSlug,
      name: round?.projectName || round?.name,
      slug: round?.projectSlug || round?.slug,
      logo: round?.projectLogo || round?.logo,
      category,
      niche: category,
      stage: round?.stage || round?.roundName || round?.round,
    });
  };

  const getRoundCategories = (round: any, project: any): Array<string> => {
    const values = [
      round?.category,
      round?.projectCategory,
      round?.sector,
      round?.niche,
      ...(Array.isArray(round?.categories) ? round.categories : []),
      ...(Array.isArray(project?.categories) ? project.categories : []),
      ...(Array.isArray(project?.tags) ? project.tags : []),
      project?.mainCategory?.name,
      project?.mainCategory,
      project?.type,
      project?.category,
      project?.sector,
      project?.niche,
    ];

    return values.filter(Boolean).map((value) => String(value));
  };

  const fundraisingRoundToPortfolioItem = (
    round: any,
    index: number
  ): IPersonPortfolioItem => {
    const project = getRoundProject(round);
    const normalizedStatus = normalizeComparableValue(round?.status);
    const status =
      normalizedStatus === "ended" ||
      normalizedStatus === "closed" ||
      normalizedStatus === "completed" ||
      normalizedStatus === "finished"
        ? "Ended"
        : "Active";

    return {
      id: Number(round?.id || round?._id || index + 1) || index + 1,
      project: project as any,
      investedRound: firstNonEmpty(round?.roundName, round?.stage, round?.round) || "-",
      investedAmount: toFiniteNumber(
        firstNonEmpty(
          round?.amount,
          round?.fundsRaised,
          round?.totalRaised,
          round?.raised,
          round?.raiseAmount
        )
      ),
      preValuation: toFiniteNumber(
        firstNonEmpty(
          round?.preValuation,
          round?.valuation,
          round?.preMoneyValuation,
          round?.preValuationUsd,
          round?.preValuationUSD
        )
      ),
      stage:
        firstNonEmpty(
          round?.stage,
          project?.stage,
          round?.roundName,
          round?.round
        ) || "-",
      currentRoi: toFiniteNumber(
        firstNonEmpty(
          round?.roi,
          round?.currentRoi,
          round?.roiUsd,
          round?.usdRoi,
          round?.roiData?.roi,
          project?.roi,
          project?.currentRoi,
          project?.roiUsd,
          project?.roiData?.roi
        )
      ),
      status,
      exitDate: normalizeRoundDate(
        firstNonEmpty(
          round?.date,
          round?.roundDate,
          round?.announcedDate,
          round?.closedAt,
          round?.endDate,
          round?.dateEnd
        )
      ),
      exitRoi: 0,
    };
  };

  const buildFundRoundHistoryItems = (
    categoryNames: Array<string>
  ): Array<IPersonPortfolioItem> => {
    return (sourceData?.fundraisingRounds || [])
      .map((round: any, index: number) => {
        const project = getRoundProject(round);
        const itemCategories = getRoundCategories(round, project).map(
          normalizeComparableValue
        );

        return {
          round,
          project,
          index,
          isMatch: isCategoryMatch(itemCategories, categoryNames),
        };
      })
      .filter((item: any) => item.isMatch)
      .sort((left: any, right: any) => {
        const leftDate = new Date(
          normalizeRoundDate(left.round?.date || left.round?.endDate || "")
        ).getTime();
        const rightDate = new Date(
          normalizeRoundDate(right.round?.date || right.round?.endDate || "")
        ).getTime();

        return (Number.isNaN(rightDate) ? 0 : rightDate) -
          (Number.isNaN(leftDate) ? 0 : leftDate);
      })
      .map((item: any, index: number) =>
        fundraisingRoundToPortfolioItem(item.round, index)
      );
  };

  const investmentHistoryItems: Array<IPersonPortfolioItem> = useMemo(() => {
    if (!selectedCategory) return [];

    const categoryNames = getCategoryNamesForSelection(selectedCategory).map(
      normalizeComparableValue
    );

    if (isFundRoundHistory) {
      return buildFundRoundHistoryItems(categoryNames);
    }

    const categoryItems =
      (sourceData?.roundsByCategory || []).find(
        (item: IFundCategoryDistributionItem & { items?: Array<IPersonPortfolioItem> }) => {
          return item._id === selectedCategory._id;
        }
      )?.items || [];

    if (categoryItems.length) return categoryItems;

    const portfolioItems = (sourceData?.investmentPorfolio || []).filter(
      (item: IPersonPortfolioItem) => {
        const itemCategories = getPortfolioItemCategories(item).map(
          normalizeComparableValue
        );

        return isCategoryMatch(itemCategories, categoryNames);
      }
    );

    if (portfolioItems.length) return portfolioItems;

    const projectSources = [
      ...(sourceData?.supportedProjects || []),
      ...(sourceData?.portfolioCoins || []),
    ];

    const fromProjectSources = projectSources
      .map((project: any) => enrichProject(project))
      .filter((project: any) => {
        const itemCategories = [
          ...(Array.isArray(project?.categories) ? project.categories : []),
          ...(Array.isArray(project?.tags) ? project.tags : []),
          project?.mainCategory?.name,
          project?.mainCategory,
          project?.type,
          project?.category,
          project?.sector,
          project?.niche,
          project?.stage,
        ]
          .filter(Boolean)
          .map(normalizeComparableValue);

        return isCategoryMatch(itemCategories, categoryNames);
      })
      .map(supportedProjectToPortfolioItem);

    if (fromProjectSources.length) return fromProjectSources;

    return (sourceData?.fundraisingRounds || [])
      .map((round: any, index: number) => {
        const project = enrichProject({
          name: round?.projectName,
          slug: round?.projectSlug,
          logo: round?.projectLogo,
          category: round?.category,
          stage: round?.stage || round?.roundName,
          amount: round?.amount,
          roundDate: round?.date,
        });

        return supportedProjectToPortfolioItem(project, index);
      })
      .filter((item: IPersonPortfolioItem) => {
        const itemCategories = getPortfolioItemCategories(item).map(
          normalizeComparableValue
        );

        return isCategoryMatch(itemCategories, categoryNames);
      });
  }, [sourceData, selectedCategory, isFundRoundHistory, projectLookup]);

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
              onChange={(value: any) => selectCategory(value)}
              items={dataToShow || []}
            />
          </PieWrapper>
          {!isMobile && (
            <Table>
              <TableHeader>
                <div>Category</div>
                <div>Total %</div>
                <div>Invested</div>
              </TableHeader>
              {dataToShow?.length ? (
                dataToShow.map((item: any, index: number) => {
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
                            inputHandler(item._id, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="price-input">
                        <div className="left-icon">%</div>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={String(item.value)}
                          onChange={(e: any) =>
                            inputHandler(
                              item._id,
                              "value",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div className="price-input">
                        <div className="left-icon" />
                        <CustomNumberInput
                          icon="dollar"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(value: number) =>
                            inputHandler(item._id, "amount", value)
                          }
                        />
                      </div>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="remove-btn"
                      >
                        <CloseIcon fill="#738094" />
                      </button>
                    </PieValuesPercentage>
                  );
                })
              ) : (
                <></>
              )}
              <CreateButton onClick={addItem} type="add">
                Add Type
              </CreateButton>
            </Table>
          )}
        </TokenDistribution>
      ) : dataToShow.length ? (
        <TokenDistribution variant="main">
          <PieWrapper>
            <PieGraphic
              innerRadius={80}
              outerRadius={130}
              width={260}
              height={260}
              // @ts-ignore
              // items={project?.totalAllocation || []}
              onChange={(value: any) => selectCategory(value)}
              items={dataToShow || []}
            />
          </PieWrapper>
          {!isMobile && (
            <Table>
              <TableHeader>
                <div>Category</div>
                <div>Total %</div>
                <div>Invested</div>
              </TableHeader>
              {dataToShow?.length ? (
                dataToShow.map((item: any, index: number) => {
                  return (
                    <div
                      key={index}
                      onClick={() => selectCategory(item)}
                      style={{ cursor: "pointer" }}
                    >
                      <PieValuesPercentage
                        className="token-distribution"
                        color={COLORS[index]}
                        variant="p"
                      >
                        <div className="name">
                          <i />
                          {item.name}
                        </div>
                        <div>{formatCategoryPercent(item.value)}</div>
                        <div>{clarifyAmount(item.amount || 0)}</div>
                      </PieValuesPercentage>
                    </div>
                  );
                })
              ) : (
                <></>
              )}
            </Table>
          )}
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
            <span>Investment History - {selectedCategory.name}</span>
            <div className="total-investment">
              <div>Total Invested:</div>
              <span>
                {clarifyAmount(selectedCategory.amount, true)} (
                {formatCategoryPercent(selectedCategory.value)})
              </span>
            </div>
          </Title>
          <InvestmentHistory
            isEditState={isEditState}
            items={investmentHistoryItems}
            variant={historyVariant}
            onChange={(items: Array<IPersonPortfolioItem>) => {
              inputHandler(selectedCategory._id, "items", items);
            }}
          />
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default CategoryDistribution;
