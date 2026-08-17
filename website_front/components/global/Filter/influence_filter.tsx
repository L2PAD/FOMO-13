/* eslint-disable */
import React, { FC, useState } from "react";
import { Button } from "../common/Button";
import MainModal from "../common/MainModal";
import OtcRangeRow from "./otc-range_row";
import { AllocBottom, AllocFilterWrapper } from "./alloc-styles";
import {
  OtcDropdownWrapper,
  OtcDropdown,
  OtcBottom,
  Buttons,
  ResetWrapper,
  OtcColumn,
} from "./otc-styles";
import { DropdownRow } from "./styles";
import OtcCheckboxRow from "./otc_checkbox_row";
import { FilterButton } from "./styles";
import { RotateCcw } from "lucide-react";

const defaultInfluenceFilters = [
  {
    type: "rangeWithCheckbox",
    title: "Followers",
    range: [0, 10000000],
    step: 10000,
    key: "followers",
    checkboxItems: ["0 - 10k", "10k - $100k", "100k - 1M", "> 1M"],
    checkboxKey: "followersRange",
  },
  {
    type: "rangeWithCheckbox",
    title: "Real Views",
    range: [0, 10000000],
    step: 10000,
    key: "realViews",
    checkboxItems: ["0 - 10k", "10k - $100k", "100k - 1M", "> 1M"],
    checkboxKey: "realViewsRange",
  },
  {
    type: "rangeWithCheckbox",
    title: "FOMO Score",
    range: [0, 1000],
    step: 1,
    key: "fomoScore",
    checkboxItems: [],
    checkboxKey: "fomoScoreSlider",
  },
  {
    type: "checkbox",
    title: "Activity Level",
    items: ["Low", "Medium", "High", "Very High"],
    key: "activityLevel",
  },
  {
    type: "checkbox",
    title: "Product Type",
    items: ["Private Group", "Project", "Education", "Advertising"],
    key: "productType",
  },
  {
    type: "checkbox",
    title: "Language",
    items: ["Russian (RU)", "English (EN)", "Ukrainian (UA)"],
    key: "language",
  },
  {
    type: "checkbox",
    title: "Red Flags",
    items: ["0", "1-5", "> 5"],
    key: "redFlags",
  },
];

const initialFilterData = {
  followers: [0, 10000000],
  followersRange: ["0 - 10k", "10k - $100k", "100k - 1M", "> 1M"],
  realViews: [0, 10000000],
  realViewsRange: ["0 - 10k", "10k - $100k", "100k - 1M", "> 1M"],
  fomoScore: [0, 1000],
  fomoScoreSlider: [],
  activityLevel: ["Low", "Medium", "High", "Very High"],
  productType: ["Private Group", "Project", "Education", "Advertising"],
  language: ["Russian (RU)", "English (EN)", "Ukrainian (UA)"],
  fomoScoreRange: ["0%-25%", "25%-50%", "50%-75%", "75%-100%"],
  redFlags: ["0", "1-5", "> 5"],
};

interface Props {
  filters?: any;
  filterDataInitial?: any;
  right?: boolean;
  onSave: (filterData: any) => void;
  variant?: "small" | "big" | "medium";
}

const InfluenceFilter: FC<Props> = ({
  filterDataInitial,
  right,
  variant = "big",
  onSave,
}) => {
  const [active, setActive] = useState(false);
  const [filterData, setFilterData] = useState<any>(
    filterDataInitial || initialFilterData
  );
  const [isResetVisible, setIsResetVisible] = useState(false);

  const checkIfFiltersChanged = (currentFilters: any) => {
    return JSON.stringify(currentFilters) !== JSON.stringify(initialFilterData);
  };

  const inputsHandler = (value: any, key: string): void => {
    const updatedFilterData = { ...filterData, [key]: value };
    setFilterData(updatedFilterData);
    setIsResetVisible(checkIfFiltersChanged(updatedFilterData));
  };

  const handleResetFilters = () => {
    setFilterData(initialFilterData);
    setIsResetVisible(false);
  };

  const handleApply = () => {
    onSave(filterData);
    setActive(false);
  };

  const handleCancel = () => {
    setFilterData(filterDataInitial || initialFilterData);
    setActive(false);
    setIsResetVisible(false);
  };
  const formatCurrency = (value: number) => {
    if (value === 0) return "$0";
    return `$${value.toLocaleString("en-US")}`;
  };
  const formatNumber = (value: number) => {
    return value.toLocaleString("en-US");
  };
  const renderFilterItem = (item: any) => {
    switch (item.type) {
      case "checkbox":
        return (
          <OtcCheckboxRow
            data={filterData[item.key]}
            title={item.title}
            items={item.items}
            onChange={(value) => inputsHandler(value, item.key)}
            showInfoIcon={false}
            className={`otc-checkbox  ${item.key}`}
          />
        );
      case "range":
        return (
          <OtcRangeRow
            data={filterData[item.key]}
            title={item.title}
            step={item.step}
            range={item.range}
            showInfoIcon={false}
            onChange={(values) => inputsHandler(values, item.key)}
          />
        );
      case "rangeWithCheckbox":
        return (
          <>
            <OtcRangeRow
              data={filterData[item.key]}
              title={item.title}
              step={item.step}
              range={item.range}
              onChange={(values) => inputsHandler(values, item.key)}
              showInfoIcon={false}
              formatValue={
                item.key === "campaignBudget"
                  ? formatCurrency
                  : item.key === "realViews" || item.key === "followers"
                    ? formatNumber
                    : undefined
              }
            />
            {item.checkboxItems && item.checkboxItems.length > 0 && (
              <OtcCheckboxRow
                data={filterData[item.checkboxKey]}
                title=""
                items={item.checkboxItems}
                onChange={(value) => inputsHandler(value, item.checkboxKey)}
                className={`otc-checkbox ad-mode ${item.checkboxKey}`}
                showInfoIcon={false}
              />
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AllocFilterWrapper className="influence-filter">
      <FilterButton newSort onClick={() => setActive((state) => !state)}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.0513 13V9L16.5898 3.46154C16.8975 3.15385 17 2.84615 17 2.4359C17 1.61538 16.3846 1 15.5641 1H2.4359C1.6154 1 1 1.61538 1 2.4359C1 2.84615 1.10257 3.15385 1.41027 3.46154L6.94872 9V17L11.0513 13Z"
            stroke="#738094"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p>Filter</p>
      </FilterButton>
      <MainModal
        isVisible={active}
        className={`filter-modal ${variant}`}
        title="Filter"
        variant="filter"
        onClose={handleCancel}
      >
        <OtcDropdown
          active={active}
          right={right}
          style={{
            flexDirection: "column",
            maxWidth: "400px",
            gap: "20px",
          }}
        >
          <OtcDropdownWrapper variant={variant}>
            {defaultInfluenceFilters.slice(0, 3).map((item: any, i: number) => {
              return (
                <DropdownRow key={i}>{renderFilterItem(item)}</DropdownRow>
              );
            })}
          </OtcDropdownWrapper>
          <OtcColumn className="column">
            {defaultInfluenceFilters.slice(3, 8).map((item: any, i: number) => {
              return (
                <DropdownRow className={`row ${item.key}`} key={i}>
                  {renderFilterItem(item)}
                </DropdownRow>
              );
            })}
          </OtcColumn>
        </OtcDropdown>

        <AllocBottom>
          <Buttons>
            <Button className="red-btn" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApply}>
              Apply
            </Button>
          </Buttons>
          <ResetWrapper>
            <Button onClick={handleResetFilters} className="reset-btn">
              <RotateCcw size={16} />
              Reset
            </Button>
          </ResetWrapper>
        </AllocBottom>
      </MainModal>
    </AllocFilterWrapper>
  );
};

export default InfluenceFilter;
