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

const defaultFilters = [
  {
    type: "checkbox",
    title: "Stage",
    items: ["Active", "Upcoming", "Ended"],
  },
  {
    type: "range",
    title: "Total raised",
    range: [0, 150],
    step: 1,
  },
  {
    type: "currencyRange",
    title: "Total raised",
    range: [0, 150],
    step: 1,
    currencies: CryptoCurrencies,
  },
  {
    type: "select",
    title: "Fund",
    placeholder: "Choose fund",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
  { type: "date", title: "Date" },
  { type: "input", title: "Address", placeholder: "" },
];

interface Props {
  filters?: any;
  right?: boolean;
  onSelectedChange?: (value: any, title?: string) => void;
  onRangeChange?: (value: any, title?: string) => void;
  newSort?: boolean;
}

const Filter: FC<Props> = ({
  filters = defaultFilters,
  right,
  onSelectedChange,
  onRangeChange,
  newSort,
}) => {
  const [active, setActive] = useState(false);

  const renderFilterItem = (item: any) => {
    switch (item.type) {
      case "checkbox":
        return (
          <CheckboxRow
            title={item.title}
            items={item.items}
            onChange={(value) =>
              onSelectedChange && onSelectedChange(value, item.title)
            }
            className={
              item.items.length === 4 || item.items.length === 2 ? "grid" : ""
            }
          />
        );
      case "select":
        return (
          <SelectRow
            title={item.title}
            placeholder={item.placeholder}
            items={item.items}
            onChange={(values) =>
              onSelectedChange && onSelectedChange(values, item.title)
            }
          />
        );
      case "range":
        return (
          <RangeRow
            title={item.title}
            step={item.step}
            range={item.range}
            onChange={(values) =>
              onRangeChange && onRangeChange(values, item.title)
            }
          />
        );
      case "currencyRange":
        return (
          <CurrencyRangeRow
            title={item.title}
            step={item.step}
            range={item.range}
            onChange={(value, currency) => {}}
          />
        );
      case "date":
        return <DateRow title={item.title} simple={item.simple} />;
      case "input":
        return (
          <InputRow
            title={item.title}
            placeholder={item.placeholder}
            onChange={(value) => {}}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {active && <Overlay onClick={() => setActive(false)} />}
      <FilterWrapper>
        <FilterButton
          newSort={!!newSort}
          onClick={() => setActive((state) => !state)}
        >
          {newSort ? (
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
          ) : (
            <FilterIcon fill="#00C099" />
          )}
          <Typography variant="p">Filter</Typography>
        </FilterButton>
        <Dropdown active={active} right={right}>
          <DropdownWrapper>
            {filters.map((item: any, i: number) => {
              return (
                <DropdownRow key={i}>{renderFilterItem(item)}</DropdownRow>
              );
            })}
          </DropdownWrapper>
        </Dropdown>
      </FilterWrapper>
    </>
  );
};

export default Filter;
