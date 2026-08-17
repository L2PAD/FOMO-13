/* eslint-disable */
import React, { FC, useState } from "react";
import Typography from "../common/Typography";
import { FilterButton } from "./styles";
import CurrencyRangeRow from "./currency_range_row";
import SelectRow from "./select_row";
import InputRow from "./input_row";
import Modal from "../common/Modal";
import AllocDateRow from "./alloc_date_row";
import Button from "../common/Button";
import AllocCheckboxRow from "./market_checkbox_row";
import AllocRangeRow from "./alloc-range_row";
import {
  Buttons,
  AllocDropdownWrapper,
  AllocFilterWrapper,
  DropdownRow,
  AllocBottom,
} from "./alloc-styles";
import { RotateCcw } from "lucide-react";
import { ResetWrapper } from "../../layouts/projects/modals/ListForSale/styles";
import AllocRadioRow from "./alloc_radio_row";
import RadioRow from "./radio_row";

const defaultFilters = [
  {
    type: "radio",
    title: "Allocation Size",
    items: ["Low to High", "High to Low"],
    key: "allocationSize",
  },
  {
    type: "radio",
    title: "Last Funding Date",
    items: ["Newest First", "Oldest First"],
    key: "lastFundingDate",
  },
  {
    type: "radio",
    title: "Total Raised",
    items: ["Low to High", "High to Low"],
    key: "totalRaised",
  },
];

const allocationType = [
  {
    type: "checkbox",
    title: "Allocation Type",
    items: [
      "Seed",
      "Private",
      "Public",

      "Strategic",
      "Pre-Seed",
      "Series A",

      "Treasury",
      "Series B",
      "Community",
    ],
    key: "allocationType",
  },
];

const allocationFilled = [
  {
    type: "radio",
    title: "Last Funding Date",
    items: ["Most Filled", "Least Filled"],
    key: "allocationFilled",
  },
];

const recentlyAdded = [
  {
    type: "checkbox",
    title: "Recently Added",
    items: ["Show only newly listed"],
    key: "recentlyAdded",
  },
];

interface Props {
  filters?: any;
  filterDataInitial?: any;
  right?: boolean;
  onSave: (filterData: any) => void;
  variant?: "small" | "big" | "medium";
}

export const oneWeekInMs = 30 * 24 * 60 * 60 * 1000;

const initialFilterData = {
  allocationSize: ["Low to High"],
  lastFundingDate: [],
  totalRaised: [],
  allocationType: [],
  recentlyAdded: [],
  allocationFilled: [],
};

const MarketFilter: FC<Props> = ({ onSave }) => {
  const [active, setActive] = useState(false);
  const [filterData, setFilterData] = useState<any>(initialFilterData);
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

  return (
    <AllocFilterWrapper>
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
            stroke-miterlimit="10"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <Typography variant="p">Filter</Typography>
      </FilterButton>
      {active ? (
        <Modal
          className={`filter-modal`}
          title="Filter"
          onClose={() => setActive(false)}
        >
          <AllocDropdownWrapper className="default-filters">
            <div className="market-radios">
              {defaultFilters.map((item: any, i: number) => {
                return (
                  <DropdownRow key={i}>
                    <RadioRow
                      value={filterData[item.key]}
                      title={item.title}
                      items={item.items}
                      onChange={(value) => inputsHandler(value, item.key)}
                      className={`alloc-checkbox grid ${item.key}`}
                    />
                  </DropdownRow>
                );
              })}
            </div>
            {allocationType.map((item: any, i: number) => {
              return (
                <DropdownRow key={i} className="row">
                  <AllocCheckboxRow
                    data={filterData[item.key]}
                    title={item.title}
                    items={item.items}
                    onChange={(value) => inputsHandler(value, item.key)}
                    className={`alloc-checkbox flex ${item.key}`}
                  />
                </DropdownRow>
              );
            })}
            {allocationFilled.map((item: any, i: number) => {
              return (
                <DropdownRow key={i}>
                  <RadioRow
                    value={filterData[item.key]}
                    title={item.title}
                    items={item.items}
                    onChange={(value) => inputsHandler(value, item.key)}
                    className={`alloc-checkbox grid ${item.key}`}
                  />
                </DropdownRow>
              );
            })}
            {recentlyAdded.map((item: any, i: number) => {
              return (
                <DropdownRow key={i} className="row">
                  <AllocCheckboxRow
                    data={filterData[item.key]}
                    title={item.title}
                    items={item.items}
                    onChange={(value) => inputsHandler(value, item.key)}
                    className={`alloc-checkbox flex ${item.key}`}
                  />
                </DropdownRow>
              );
            })}
          </AllocDropdownWrapper>

          <AllocBottom>
            <Buttons>
              <Button
                onClick={() => {
                  setActive(false);
                }}
                className="red-btn"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onSave(filterData);
                  setActive(false);
                }}
                variant="primary"
              >
                Save
              </Button>
            </Buttons>
            <ResetWrapper>
              <Button onClick={handleResetFilters} className="reset-btn">
                <RotateCcw size={16} />
                Reset
              </Button>
            </ResetWrapper>
          </AllocBottom>
        </Modal>
      ) : null}
    </AllocFilterWrapper>
  );
};

export default MarketFilter;
