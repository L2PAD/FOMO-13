import React, { FC, useState } from "react";
import Checkbox from "../../common/Checkbox";
import MainModal from "../../common/MainModal";
import { FilterButton } from "../../Filter/styles";
import Range from "../../Range";
import { SearchInput } from "../../../layouts/projects/P2PExchange/styles";
import { SearchIconStyle } from "../../Navigation/styles";
import { SearchIcon } from "../../Icons";
import { Action } from "../../LeftNav/styles";
import Button from "../../common/Button";
import {
  Actions,
  Categories,
  CheckboxBigWrapper,
  PriceCheckboxes,
  ResetButton,
  SearchInputWrapper,
  SectionWrapper,
} from "../styles";

export interface ICheckbox {
  isActive: boolean;
  key: string;
  label: string;
}

export interface IFilter {
  key: string;
  type: "checkbox" | "range" | "search";
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
  source?: "funds" | "fundingRounds";
}

export interface IFilterBlock {
  id: string;
  className?: string;
  filters: IFilter[];
}

interface IProps {
  filters: IFilterBlock[];
  buttonText?: string;
  onChange: (filterData: Record<string, any>) => void;
  onConfirm?: () => void;
  onClose?: () => void;
}

const UniversalFilterBody: FC<IProps> = ({
  filters,
  buttonText = "Apply",
  onChange,
  onConfirm,
  onClose,
}) => {
  const [filterState, setFilterState] = useState<Record<string, any>>(
    filters.reduce((acc, filterBlock) => {
      filterBlock.filters.forEach((filter) => {
        //@ts-ignore
        acc[filter.key] = filter.values;
      });
      return acc;
    }, {})
  );

  const handleCheckboxChange = (filterKey: string, key: string) => {
    setFilterState((prev) => {
      const updatedValues = prev[filterKey].map((item: ICheckbox) =>
        item.key === key ? { ...item, isActive: !item.isActive } : item
      );
      return { ...prev, [filterKey]: updatedValues };
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
          checkboxRangesValues: values,
        };
      }

      return {
        ...prev,
        [filterKey]: values,
      };
    });
  };

  const handleSearchChange = (filterKey: string, value: string) => {
    setFilterState((prev) => ({ ...prev, [filterKey]: value }));
  };

  return (
    <>
      {filters.map((filterBlock, id: number) => (
        <SectionWrapper
          className={filterBlock.className}
          key={`${filterBlock.id}${id}`}
        >
          {filterBlock.filters.map((filter, i: number) => (
            <div className={filter.className} key={filter.label}>
              <h4>{filter.label}</h4>
              {filter.type === "checkbox" ? (
                filter.isCheckboxRange ? (
                  <div className="range-categories">
                    <Range
                      label={filter.rangeLeftLabel}
                      rightLabel={filter.rangeRightLabel || ""}
                      onChange={(values) =>
                        handleRangeChange(filter.key, values, true)
                      }
                      step={1}
                      min={filter.min || 0}
                      max={filter.max || 100}
                      values={
                        filter.checkboxRangesValues
                          ? filter.checkboxRangesValues
                          : [0, 100]
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
                              label={item.label}
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
                          label={item.label}
                        />
                      ))}
                  </Categories>
                )
              ) : (
                <></>
              )}
              {filter.type === "range" && (
                <Range
                  label={filter.rangeLeftLabel}
                  rightLabel={filter.rangeRightLabel || ""}
                  onChange={(values) => handleRangeChange(filter.key, values)}
                  step={1}
                  min={filter.min || 0}
                  max={filter.max || 100}
                  values={filterState[filter.key] || [0, 100]}
                />
              )}
              {filter.type === "search" && (
                <SearchInputWrapper>
                  <SearchInput
                    type="string"
                    value={filterState[filter.key] || ""}
                    onChange={(value: string) =>
                      handleSearchChange(filter.key, value)
                    }
                    placeholder={filter.placeholder || ""}
                    leftIcon={<SearchIconStyle />}
                  />
                </SearchInputWrapper>
              )}
              {filter.optionalCheckboxes?.length ? (
                <CheckboxBigWrapper>
                  {filter.optionalCheckboxes.map(
                    (item: ICheckbox, i: number) => {
                      return (
                        <Checkbox
                          key={item.label}
                          label={item.label}
                          checked={false}
                          onChange={() => console.log("test")}
                        />
                      );
                    }
                  )}

                  {/* <Checkbox
                                        label='Ongoing Vesting Period'
                                        checked={filter.ongoingVestingPeriod}
                                        onChange={() => inputsHandler(!filter.ongoingVestingPeriod,'ongoingVestingPeriod')}
                                        /> */}
                </CheckboxBigWrapper>
              ) : (
                <></>
              )}
            </div>
          ))}
        </SectionWrapper>
      ))}
      <Actions>
        <Action onClick={() => onClose && onClose()} actionType="red">
          Cancel
        </Action>
        <Button
          onClick={() => {
            onChange(filterState);
            onConfirm && onConfirm();
          }}
          variant="primary"
        >
          {buttonText}
        </Button>
      </Actions>
      <ResetButton>
        <button
          onClick={() =>
            setFilterState(
              filters.reduce((acc, filterBlock) => {
                filterBlock.filters.forEach((filter) => {
                  //@ts-ignore
                  acc[filter.key] = filter.values;
                });
                return acc;
              }, {})
            )
          }
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
          <span>Reset</span>
        </button>
      </ResetButton>
    </>
  );
};

export default UniversalFilterBody;
