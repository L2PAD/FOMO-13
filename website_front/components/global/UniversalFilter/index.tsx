import React, { FC, useEffect, useState } from "react";
import Checkbox from "../common/Checkbox";
import MainModal from "../common/MainModal";
import { FilterButton } from "../Filter/styles";
import Range from "../Range";
import { SearchInput } from "../../layouts/projects/P2PExchange/styles";
import { SearchIconStyle } from "../Navigation/styles";
import { SearchIcon } from "../Icons";
import { Action } from "../LeftNav/styles";
import Button from "../common/Button";
import {
  Actions,
  Categories,
  CheckboxBigWrapper,
  PriceCheckboxes,
  ResetButton,
  SearchInputWrapper,
  SectionWrapper,
} from "./styles";
import InvestorsSearch from "../common/InvestorsSearch";
import { useTranslation } from "i18n";

export interface ICheckbox {
  isActive: boolean;
  key: string;
  label: string;
}

export interface IFilter {
  key: string;
  type: "checkbox" | "range" | "search" | "date";
  label: string;
  values: ICheckbox[] | number[] | any[];
  checkboxRangesValues?: number[];
  min?: number;
  max?: number;
  isCheckboxRange?: boolean;
  className?: string;
  value?: any;
  placeholder?: string;
  rangeLeftLabel?: string;
  rangeRightLabel?: string;
  optionalCheckboxes?: ICheckbox[];
  dates?: Array<Date>;
  step?: number;
  formatValue?: (value: string, previousValue: string) => string;
  source?: "funds" | "fundingRounds";
}

export interface IFilterBlock {
  id: string;
  className?: string;
  filters: IFilter[];
}

export type DefaultCheckboxKeys = Record<string, string | string[]>;

interface IProps {
  filters: IFilterBlock[];
  onChange: (filterData: Record<string, any>) => void;
  onReset?: () => void;
  defaultCheckboxKeys?: DefaultCheckboxKeys;
  singleDefaultCheckbox?: boolean;
}

const isCheckboxValue = (item: unknown): item is ICheckbox => {
  return typeof item === "object" && item !== null && "isActive" in item;
};

const normalizeCheckboxValues = (
  values: IFilter["values"],
  singleDefaultCheckbox?: boolean,
  defaultKeys?: string | string[]
) => {
  if (!Array.isArray(values)) {
    return values;
  }

  if (!values.every(isCheckboxValue)) {
    return values;
  }

  const defaultKeysList = Array.isArray(defaultKeys)
    ? defaultKeys
    : defaultKeys
      ? [defaultKeys]
      : [];
  const matchingDefaultKeys = defaultKeysList.filter((key) =>
    values.some((item) => item.key === key)
  );

  if (matchingDefaultKeys.length) {
    const selectedKeys = new Set(
      singleDefaultCheckbox ? [matchingDefaultKeys[0]] : matchingDefaultKeys
    );

    return values.map((item) => ({
      ...item,
      isActive: selectedKeys.has(item.key),
    }));
  }

  if (!singleDefaultCheckbox) return values;

  const activeIndex = values.findIndex((item) => item.isActive);
  const checkedIndex = activeIndex >= 0 ? activeIndex : 0;

  return values.map((item, index) => ({
    ...item,
    isActive: index === checkedIndex,
  }));
};

const getFilterInitial = (
  filters: IFilterBlock[],
  singleDefaultCheckbox?: boolean,
  defaultCheckboxKeys?: DefaultCheckboxKeys
): any => {
  return filters.reduce((acc, filterBlock) => {
    filterBlock.filters.forEach((filter) => {
      //@ts-ignore
      acc[filter.key] = normalizeCheckboxValues(
        filter.values,
        filter.type === "checkbox" ? singleDefaultCheckbox : false,
        filter.type === "checkbox" ? defaultCheckboxKeys?.[filter.key] : undefined
      );
      if (filter.isCheckboxRange) {
        //@ts-ignore
        acc[`${filter.key}_checkboxes`] = filter.checkboxRangesValues;
      }
    });
    return acc;
  }, {});
};

const UniversalFilter: FC<IProps> = ({
  filters,
  onChange,
  onReset,
  defaultCheckboxKeys,
  singleDefaultCheckbox,
}) => {
  const { t, translateText } = useTranslation();
  const [filterState, setFilterState] = useState<Record<string, any>>(
    getFilterInitial(filters, singleDefaultCheckbox, defaultCheckboxKeys)
  );
  const [isVisible, setIsVisible] = useState(false);
  const [initialRangeState, setInitialRangeState] = useState<
    Record<string, number[]>
  >(
    filters.reduce((acc: any, filterBlock) => {
      filterBlock.filters.forEach((filter: any) => {
        if (filter.type === "range") {
          acc[filter.key] = [filter.min || 0, filter.max || 100];
        }
      });
      return acc;
    }, {})
  );

  useEffect(() => {
    setFilterState(
      getFilterInitial(filters, singleDefaultCheckbox, defaultCheckboxKeys)
    );
    setInitialRangeState(
      filters.reduce((acc: any, filterBlock) => {
        filterBlock.filters.forEach((filter: any) => {
          if (filter.type === "range") {
            acc[filter.key] = [filter.min || 0, filter.max || 100];
          }
        });
        return acc;
      }, {})
    );
  }, [filters, singleDefaultCheckbox, defaultCheckboxKeys]);

  const handleCheckboxChange = (filterKey: string, key: string) => {
    setFilterState((prev) => {
      const updatedValues = prev[filterKey].map((item: ICheckbox) =>
        item.key === key ? { ...item, isActive: !item.isActive } : item
      );
      if (prev[filterKey].some((item: ICheckbox) => item.isActive)) {
        return { ...prev, [filterKey]: updatedValues };
      }
      return {
        ...prev,
        [filterKey]: updatedValues,
        [`${filterKey}_checkboxes`]: [0, 0],
      };
    });
  };

  const handleRangeChange = (
    filterKey: string,
    values: number[],
    isCheckboxRange?: boolean
  ) => {
    setFilterState((prev) => {
      if (isCheckboxRange) {
        return {
          ...prev,
          [`${filterKey}_checkboxes`]: values,
          [filterKey]: prev[filterKey].map((item: ICheckbox) => ({
            ...item,
            isActive: false,
          })),
        };
      }

      return {
        ...prev,
        [filterKey]: values,
        [`${filterKey}_checkboxes`]: initialRangeState[filterKey],
      };
    });
  };

  const handleSearchChange = (filter: IFilter, value: string) => {
    setFilterState((prev) => {
      const previousValue =
        typeof prev[filter.key] === "string" ? prev[filter.key] : "";
      const nextValue = filter.formatValue
        ? filter.formatValue(value, previousValue)
        : value;

      return { ...prev, [filter.key]: nextValue };
    });
  };

  const handleSearchValues = (filterKey: string, values: Array<any>) => {
    setFilterState((prev) => ({ ...prev, [filterKey]: values }));
  };

  return (
    <>
      <FilterButton onClick={() => setIsVisible(true)} newSort>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M11.0513 13V9L16.5898 3.46154C16.8975 3.15385 17 2.84615 17 2.4359C17 1.61538 16.3846 1 15.5641 1H2.4359C1.6154 1 1 1.61538 1 2.4359C1 2.84615 1.10257 3.15385 1.41027 3.46154L6.94872 9V17L11.0513 13Z"
            stroke="#738094"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{t("common.actions.filter")}</span>
      </FilterButton>
      <MainModal
        className="universal-filter-modal"
        variant="big"
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
        title={t("common.actions.filter")}
      >
        {filters.map((filterBlock, i) => (
          <SectionWrapper
            className={filterBlock.className}
            key={filterBlock.id}
          >
            {filterBlock.filters.map((filter, i: number) => {
              return (
                <div className={filter.className} key={filter.label}>
                  <h4>{translateText(filter.label)}</h4>
                  {filter.type === "checkbox" ? (
                    filter.isCheckboxRange ? (
                      <div className="range-categories">
                        <Range
                          label={translateText(filter.rangeLeftLabel || "")}
                          rightLabel={translateText(filter.rangeRightLabel || "")}
                          onChange={(values) =>
                            handleRangeChange(filter.key, values, true)
                          }
                          step={filter.step || 0.1}
                          min={filter.min || 0}
                          max={filter.max || 100}
                          values={
                            filterState[`${filter.key}_checkboxes`]
                              ? filterState[`${filter.key}_checkboxes`]
                              : [0, 10]
                          }
                        />
                        <Categories className={`categories id${i}`}>
                          {filterState[filter.key] &&
                            filterState[filter.key].map(
                              (item: ICheckbox, i: number) => (
                                <Checkbox
                                  key={item.label}
                                  onChange={() =>
                                    handleCheckboxChange(filter.key, item.key)
                                  }
                                  checked={item.isActive}
                                  label={translateText(item.label)}
                                />
                              )
                            )}
                        </Categories>
                      </div>
                    ) : (
                      <Categories className={`categories id${i}`}>
                        {filterState[filter.key] &&
                          filterState[filter.key].map((item: ICheckbox) => (
                            <Checkbox
                              key={item.label}
                              onChange={() =>
                                handleCheckboxChange(filter.key, item.key)
                              }
                              checked={item.isActive}
                              label={translateText(item.label)}
                            />
                          ))}
                      </Categories>
                    )
                  ) : (
                    <></>
                  )}
                  {filter.type === "range" && (
                    <Range
                      label={translateText(filter.rangeLeftLabel || "")}
                      rightLabel={translateText(filter.rangeRightLabel || "")}
                      onChange={(values) =>
                        handleRangeChange(filter.key, values)
                      }
                      step={1}
                      min={filter.min || 0}
                      max={filter.max || 100}
                      values={filterState[filter.key] || [0, 100]}
                    />
                  )}
                  {filter.type === "search" ? (
                    filter.key === "investors" ? (
                      <InvestorsSearch
                        onChange={(investors: Array<any>) =>
                          handleSearchValues(filter.key, investors)
                        }
                        investors={filterState[filter.key] || []}
                        source={filter.source}
                      />
                    ) : (
                      <SearchInputWrapper>
                        <SearchInput
                          type="string"
                          value={filterState[filter.key] || ""}
                          onChange={(value: string) =>
                            handleSearchChange(filter, value)
                          }
                          placeholder={translateText(filter.placeholder || "")}
                          leftIcon={<SearchIconStyle />}
                        />
                      </SearchInputWrapper>
                    )
                  ) : (
                    <></>
                  )}
                </div>
              );
            })}
          </SectionWrapper>
        ))}
        <Actions>
          <Action onClick={() => setIsVisible(false)} actionType="red">
            {t("common.actions.cancel")}
          </Action>
          <Button
            onClick={() => {
              onChange(filterState);
              setIsVisible(false);
            }}
            variant="primary"
          >
            {t("common.actions.apply")}
          </Button>
        </Actions>
        <ResetButton>
          <button
            onClick={() => {
              setFilterState(() => {
                return getFilterInitial(
                  filters,
                  singleDefaultCheckbox,
                  defaultCheckboxKeys
                );
              });
              if (onReset) {
                onReset();
                setIsVisible(false);
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="12"
              viewBox="0 0 13 12"
              fill="none"
            >
              <path
                d="M1.74776 7.66797C2.42642 9.79726 4.37008 11.3346 6.66194 11.3346C9.5182 11.3346 11.8337 8.94682 11.8337 6.0013C11.8337 3.05578 9.5182 0.667969 6.66194 0.667969C4.74768 0.667969 3.07632 1.7405 2.18211 3.33464M3.75285 4.0013H1.16699V1.33464"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t("common.actions.reset")}</span>
          </button>
        </ResetButton>
      </MainModal>
    </>
  );
};

export default UniversalFilter;
