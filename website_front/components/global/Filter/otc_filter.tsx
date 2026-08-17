/* eslint-disable */
import React, { FC, useState } from "react";
import { FilterIcon } from "../Icons";
import Typography from "../common/Typography";
import { CryptoCurrencies } from "../../../staticContent/global";
import {
  Dropdown,
  DropdownRow,
  DropdownWrapper,
  FilterButton,
  FilterWrapper,
  Overlay,
} from "./styles";
import CheckboxRow from "./checkbox_row";
import RangeRow from "./range_row";
import CurrencyRangeRow from "./currency_range_row";
import SelectRow from "./select_row";
import DateRow from "./date_row";
import InputRow from "./input_row";
import Modal from "../common/Modal";
import OtcDateRow from "./otc_date_row";
import Button from "../common/Button";
import OtcCheckboxRow from "./otc_checkbox_row";
import OtcRangeRow from "./otc-range_row";
import {
  Buttons,
  OtcDropdown,
  OtcDropdownWrapper,
  OtcFilterWrapper,
  ResetWrapper,
  OtcColumn,
  OtcBottom,
} from "./otc-styles";
import { RotateCcw } from "lucide-react";
import MainModal from "../common/MainModal";

const defaultFilters = [
  { type: "date", title: "Date", key: "dates" },
  {
    type: "range",
    title: "Price ETH",
    range: [0, 10],
    step: 0.0005,
    key: "priceEth",
    tooltip: "Filter deals by ETH price range",
  },
  {
    type: "range",
    title: "Price USDC",
    range: [0, 10000],
    step: 1,
    key: "priceUsdc",
    tooltip: "Filter deals by USDC price range",
  },
  {
    type: "range",
    title: "Amount",
    range: [0, 1000],
    step: 1,
    key: "amount",
  },
  {
    type: "range",
    title: "Rating",
    range: [0, 100],
    step: 1,
    key: "rating",
  },
  {
    type: "checkbox",
    title: "Currency",
    items: ["ETH", "USDC"],
    key: "tickers",
    tooltip: "Select the currency type for deals",
  },
  {
    type: "checkbox",
    title: "Assets Type",
    items: ["Real Assets", "Other"],
    key: "isRealAsset",
    tooltip: "Filter by asset category",
  },
  {
    type: "checkbox",
    title: "Users Status",
    items: ["Not verified", "Verifed", "Red flag"],
    key: "userStatus",
    tooltip: "Filter by user verification status",
  },
  {
    type: "checkbox",
    title: "Risk",
    items: ["Default", "Low", "Medium", "High"],
    key: "risk",
    tooltip: "Filter by risk level",
  },
  {
    type: "checkbox",
    title: "Deal Status",
    items: [
      "Available",
      "Funds reserved",
      "Wait for confirm",
      "Ended",
      "Started",
      "Closed",
    ],
    key: "dealStatus",
    tooltip: "Filter by current deal status",
  },
  {
    type: "checkbox",
    title: "Service Type",
    items: [
      "NFT",
      "Project Account",
      "Projects",
      "KYC",
      "Services",
      "Social network",
    ],
    key: "serviceType",
    tooltip: "Filter by service category",
  },
];

const defaultFiltersTopMembers = [
  {
    type: "range",
    title: "Completed Deals",
    range: [0, 200],
    step: 1,
    key: "completedDeals",
  },
  {
    type: "range",
    title: "Sales",
    range: [0, 100],
    step: 1,
    key: "sales",
  },
  {
    type: "range",
    title: "Purchases",
    range: [0, 100],
    step: 1,
    key: "purchases",
  },
  {
    type: "checkbox",
    title: "Risk",
    items: ["Default", "Low", "Medium", "High"],
    key: "risk",
    tooltip: "Filter members by risk level",
  },
  {
    type: "checkbox",
    title: "Users Status",
    items: ["Not verified", "Verifed", "Red flag"],
    key: "userStatus",
    tooltip: "Filter by user verification status",
  },
];

const defaultFiltersP2P = [
  { type: "date", title: "Date", key: "dates" },
  {
    type: "range",
    title: "Price ETH",
    range: [0, 10],
    step: 0.0005,
    key: "priceEth",
    tooltip: "Filter P2P deals by ETH price range",
  },
  {
    type: "range",
    title: "Price USDC",
    range: [0, 10000],
    step: 1,
    key: "priceUsdc",
    tooltip: "Filter P2P deals by USDC price range",
  },
  {
    type: "range",
    title: "Amount",
    range: [0, 1000],
    step: 1,
    key: "amount",
  },
  {
    type: "range",
    title: "Rating",
    range: [0, 100],
    step: 1,
    key: "rating",
  },
  {
    type: "checkbox",
    title: "Currency",
    items: ["ETH", "USDC"],
    key: "tickers",
    tooltip: "Select the currency type for P2P deals",
  },
  {
    type: "checkbox",
    title: "Users Status",
    items: ["Not verified", "Verifed", "Red flag"],
    key: "userStatus",
    tooltip: "Filter by user verification status",
  },
  {
    type: "checkbox",
    title: "Risk",
    items: ["Default", "Low", "Medium", "High"],
    key: "risk",
    tooltip: "Filter by risk level",
  },
  {
    type: "checkbox",
    title: "Deal Status",
    items: [
      "Available",
      "Funds reserved",
      "Wait for confirm",
      "Ended",
      "Started",
      "Closed",
    ],
    key: "dealStatus",
    tooltip: "Filter by current P2P deal status",
  },
];

interface Props {
  filters?: any;
  filterDataInitial?: any;
  right?: boolean;
  variant?: "small" | "big" | "medium";
  onSave: (filterData: any) => void;
  onReset: () => void
  className?: string;
}

export const oneWeekInMs = 30 * 24 * 60 * 60 * 1000;

const initialFilterData = {
  amount: [0, 1000],
  startDate: new Date(Date.now() - oneWeekInMs),
  endDate: new Date(Date.now() + oneWeekInMs),
  isRealAsset: ["Real Assets", "Other"],
  priceEth: [0, 10],
  priceUsdc: [0, 10000],
  rating: [0, 100],
  risk: ["Default", "Low", "Medium", "High"],
  serviceType: [
    "NFT",
    "KYC",
    "Project Account",
    "Services",
    "Projects",
    "Social network",
  ],
  userStatus: ["Red flag", "Verifed", "Not verified"],
  dealStatus: [
    "Available",
    "Wait for confirm",
    "Started",
    "Funds reserved",
    "Ended",
    "Closed",
  ],
  tickers: ["ETH", "USDC"],
};

const initialFilterTopMembers = {
  completedDeals: [0, 200],
  sales: [0, 100],
  purchases: [0, 100],
  risk: ["Default", "Low", "Medium", "High"],
  userStatus: ["Verifed", "Red flag", "Not verified"],
};

const initialFilterDataP2P = {
  amount: [0, 1000],
  startDate: new Date(Date.now() - oneWeekInMs),
  endDate: new Date(Date.now() + oneWeekInMs),
  priceEth: [0, 10],
  priceUsdc: [0, 10000],
  rating: [0, 100],
  risk: ["Default", "Low", "Medium", "High"],
  userStatus: ["Red flag", "Verifed", "Not verified"],
  dealStatus: [
    "Available",
    "Wait for confirm",
    "Started",
    "Funds reserved",
    "Ended",
    "Closed",
  ],
  tickers: ["ETH", "USDC"],
};

const getFilterVariant = (
  variant: "small" | "big" | "medium"
): { defaultValue: any; initialValue: any } => {
  const initials: any = {
    small: initialFilterTopMembers,
    big: initialFilterData,
    medium: initialFilterDataP2P,
  };

  const states: any = {
    small: defaultFiltersTopMembers,
    big: defaultFilters,
    medium: defaultFiltersP2P,
  };

  return { defaultValue: states[variant], initialValue: initials[variant] };
};

const OtcFilter: FC<Props> = ({
  filterDataInitial,
  right,
  variant = "big",
  onSave,
  onReset,
  className,
}) => {
  const [active, setActive] = useState(false);
  const [filterData, setFilterData] = useState<any>(
    getFilterVariant(variant).initialValue
  );

  const inputsHandler = (value: any, key: string): void => {
    const updatedFilterData = { ...filterData, [key]: value };
    setFilterData(updatedFilterData);
  };

  const handleResetFilters = () => {
    setFilterData(getFilterVariant(variant).initialValue);
    onReset()
    setActive(false)
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
            className={`otc-checkbox ${item.key}`}
            tooltip={item.tooltip}
            showInfoIcon={!!item.tooltip}
          />
        );
      case "select":
        return (
          <SelectRow
            title={item.title}
            placeholder={item.placeholder}
            items={item.items}
            onChange={(values) => inputsHandler(values, item.key)}
          />
        );
      case "range":
        return (
          <OtcRangeRow
            data={filterData[item.key]}
            title={item.title}
            step={item.step}
            range={item.range}
            onChange={(values) => inputsHandler(values, item.key)}
            tooltip={item.tooltip}
            showInfoIcon={!!item.tooltip}
          />
        );
      case "currencyRange":
        return (
          <CurrencyRangeRow
            title={item.title}
            step={item.step}
            range={item.range}
            onChange={(value) => inputsHandler(value, item.key)}
          />
        );
      case "date":
        return (
          <OtcDateRow
            startDate={filterData.startDate}
            endDate={filterData.endDate}
            onChange={(value, key) => inputsHandler(value, key)}
            title={item.title}
          />
        );
      case "input":
        return (
          <InputRow
            title={item.title}
            placeholder={item.placeholder}
            onChange={(value) => { }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <OtcFilterWrapper>
      <FilterButton
        newSort
        onClick={() => setActive((state) => !state)}
        className={className}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.37099 8.70312V5.96875L11.1571 2.18269C11.3674 1.97236 11.4375 1.76202 11.4375 1.48157C11.4375 0.920671 11.0168 0.5 10.4559 0.5H1.48157C0.920681 0.5 0.5 0.920671 0.5 1.48157C0.5 1.76202 0.570119 1.97236 0.780457 2.18269L4.56651 5.96875V11.4375L7.37099 8.70312Z" stroke="#728094" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Typography variant="p">Filter</Typography>
      </FilterButton>
      <MainModal
        isVisible={active}
        className={`filter-modal ${variant}`}
        title="Filter"
        variant={
          variant === "big" || variant === "medium" ? "filter" : "deal"
        }
        onClose={() => setActive(false)}
      >
        {variant === "big" || variant === "medium" ? (
          <OtcDropdown active={active} right={right}>
            <OtcDropdownWrapper variant={variant}>
              {getFilterVariant(variant)
                .defaultValue.slice(0, 5)
                .map((item: any, i: number) => {
                  return (
                    <DropdownRow key={i}>
                      {renderFilterItem(item)}
                    </DropdownRow>
                  );
                })}
            </OtcDropdownWrapper>
            <OtcColumn>
              {getFilterVariant(variant)
                .defaultValue.slice(5, 12)
                .map((item: any, i: number) => {
                  return (
                    <DropdownRow key={i}>
                      {renderFilterItem(item)}
                    </DropdownRow>
                  );
                })}
            </OtcColumn>
          </OtcDropdown>
        ) : (
          <OtcDropdown active={active}>
            <OtcDropdownWrapper variant={variant}>
              {defaultFiltersTopMembers.map((item: any, i: number) => {
                return (
                  <DropdownRow key={i}>{renderFilterItem(item)}</DropdownRow>
                );
              })}
            </OtcDropdownWrapper>
          </OtcDropdown>
        )}

        <OtcBottom variant={variant}>
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
              Apply
            </Button>
          </Buttons>
          <ResetWrapper variant={variant}>
            <Button
              onClick={handleResetFilters}
              className={`reset-btn ${variant}`}
            >
              {variant !== "big" ? <RotateCcw size={16} /> : null}
              Reset
            </Button>
          </ResetWrapper>
        </OtcBottom>
      </MainModal>
    </OtcFilterWrapper>
  );
};

export default OtcFilter;
