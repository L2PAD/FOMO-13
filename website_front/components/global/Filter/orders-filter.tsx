import React, { FC, useEffect, useMemo, useState } from "react";
import Typography from "../common/Typography";
import Modal from "../common/Modal";
import Button from "../common/Button";
import AllocCheckboxRow from "./alloc_checkbox_row";
import AllocRangeRow from "./alloc-range_row";
import AllocDateRow from "./alloc_date_row";
import {
  Buttons,
  AllocDropdownWrapper,
  AllocFilterWrapper,
  DropdownRow,
  AllocBottom,
} from "./alloc-styles";
import { RotateCcw } from "lucide-react";
import { ResetWrapper } from "../../layouts/projects/modals/ListForSale/styles";
import { FilterButton } from "./styles";

export type OrdersFiltersState = {
  createdDates: {
    startDate: Date | null;
    endDate: Date | null;
  };
  expirationDates: {
    startDate: Date | null;
    endDate: Date | null;
  };
  orderStatus: string[];
  currencies: string[];
  priceRange: number[];
};

interface OrdersFilterProps {
  onApply: (filters: OrdersFiltersState) => void;
  maxPrice?: number;
}

const orderStatusOptions = ["Completed", "Pending", "Approved", "Rejected"];
const currencyOptions = ["ETH", "USDC"];

const getPriceRangeMax = (value?: number): number => {
  const normalizedValue = Number(value || 0);

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return 100;
  }

  if (normalizedValue <= 1) {
    return 1;
  }

  if (normalizedValue <= 100) {
    return Math.ceil(normalizedValue);
  }

  return Math.ceil(normalizedValue / 10) * 10;
};

export const createInitialOrdersFilters = (
  maxPrice?: number
): OrdersFiltersState => ({
  createdDates: {
    startDate: null,
    endDate: null,
  },
  expirationDates: {
    startDate: null,
    endDate: null,
  },
  orderStatus: [],
  currencies: [],
  priceRange: [0, getPriceRangeMax(maxPrice)],
});

const OrdersFilter: FC<OrdersFilterProps> = ({ onApply, maxPrice }) => {
  const [active, setActive] = useState(false);
  const initialState = useMemo(
    () => createInitialOrdersFilters(maxPrice),
    [maxPrice]
  );
  const [filters, setFilters] = useState<OrdersFiltersState>(initialState);
  const [isResetVisible, setIsResetVisible] = useState(false);

  useEffect(() => {
    if (!isResetVisible) {
      setFilters(initialState);
    }
  }, [initialState, isResetVisible]);

  const checkIfFiltersChanged = (current: OrdersFiltersState) => {
    return JSON.stringify(current) !== JSON.stringify(initialState);
  };

  const updateFilters = (updated: OrdersFiltersState) => {
    setFilters(updated);
    setIsResetVisible(checkIfFiltersChanged(updated));
  };

  const handleCheckboxChange = (
    value: string[],
    key: "orderStatus" | "currencies"
  ) => {
    updateFilters({ ...filters, [key]: value });
  };

  const handleRangeChange = (value: number[]) => {
    const numericValues = value.map(Number);
    updateFilters({ ...filters, priceRange: numericValues });
  };

  const handleDateChange = (
    value: unknown,
    group: "createdDates" | "expirationDates",
    key: "startDate" | "endDate"
  ) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    updateFilters({
      ...filters,
      [group]: {
        ...filters[group],
        [key]: normalizedValue ? new Date(normalizedValue as Date) : null,
      },
    });
  };

  const handleReset = () => {
    setFilters(initialState);
    setIsResetVisible(false);
    onApply(initialState);
    setActive(false);
  };

  return (
    <AllocFilterWrapper>
      <FilterButton newSort onClick={() => setActive((prev) => !prev)}>
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
        <Typography variant="p">Filter</Typography>
      </FilterButton>
      {active ? (
        <Modal
          className="filter-modal orders-filter"
          title="Filter"
          variant="filter"
          onClose={() => setActive(false)}
        >
          <AllocDropdownWrapper>
            <DropdownRow className="row date">
              <AllocDateRow
                title="Created Date"
                startDate={filters.createdDates.startDate || new Date()}
                endDate={filters.createdDates.endDate || new Date()}
                onChange={(value, key) =>
                  handleDateChange(
                    value as Date,
                    "createdDates",
                    key as "startDate" | "endDate"
                  )
                }
              />
            </DropdownRow>
            <DropdownRow className="row date">
              <AllocDateRow
                title="Expiration Date"
                startDate={filters.expirationDates.startDate || new Date()}
                endDate={filters.expirationDates.endDate || new Date()}
                onChange={(value, key) =>
                  handleDateChange(
                    value as Date,
                    "expirationDates",
                    key as "startDate" | "endDate"
                  )
                }
              />
            </DropdownRow>
            <DropdownRow className="row">
              <AllocCheckboxRow
                title="Order Status"
                items={orderStatusOptions}
                data={filters.orderStatus}
                onChange={(value) => handleCheckboxChange(value, "orderStatus")}
                className="alloc-checkbox grid order-status grid-2"
              />
            </DropdownRow>
            <DropdownRow className="row date">
              <AllocRangeRow
                title="Price"
                range={[0, initialState.priceRange[1]]}
                data={filters.priceRange}
                step={initialState.priceRange[1] <= 1 ? 0.0001 : 0.01}
                onChange={handleRangeChange}
              />
            </DropdownRow>
            <DropdownRow className="row">
              <AllocCheckboxRow
                title="Currency"
                items={currencyOptions}
                data={filters.currencies}
                onChange={(value) => handleCheckboxChange(value, "currencies")}
                className="alloc-checkbox grid order-type grid-2"
              />
            </DropdownRow>
          </AllocDropdownWrapper>

          <AllocBottom>
            <Buttons>
              <Button onClick={() => setActive(false)} className="red-btn">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onApply(filters);
                  setActive(false);
                }}
                variant="primary"
              >
                Apply
              </Button>
            </Buttons>
            <ResetWrapper>
              <Button onClick={handleReset} className="reset-btn">
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

export default OrdersFilter;
