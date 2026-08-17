/* eslint-disable */
import React, { FC, useState } from "react";
import FilterIcon from "../Icons/filter_icon";
import Typography from "../typography";
import { CryptoCurrencies } from "../../../static_content/global";
import {
  Dropdown,
  DropdownRow,
  DropdownWrapper,
  FilterButton,
  FilterWrapper,
  Overlay,
} from "./styles";
import Modal from "../modal";
import OtcDateRow from "./otc_date_row";
import Button from "../button";
import OtcCheckboxRow from "./otc_checkbox_row";
import OtcRangeRow from "./otc-range_row";
import {
  Buttons, OtcDropdown,
  OtcDropdownWrapper, OtcFilterWrapper,
  ResetWrapper,
  OtcColumn,
  OtcBottom,
} from "./otc-styles";

const defaultFilters = [
  { type: "date", title: "Date", key: "dates" },
  {
    type: "range",
    title: "Price ETH",
    range: [0, 10],
    step: 0.0005,
    key: "priceEth",
  },
  {
    type: "range",
    title: "Price USDC",
    range: [0, 10000],
    step: 1,
    key: "priceUsdc",
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
  },
  {
    type: "checkbox",
    title: "Assets Type",
    items: ["Real Assets", "Other"],
    key: "isRealAsset",
  },
  {
    type: "checkbox",
    title: "Users Status",
    items: ["Not verified", "Verifed", "Red flag"],
    key: "userStatus",
  },
  {
    type: "checkbox",
    title: "Risk",
    items: ["Default", "Low", "Medium", "High"],
    key: "risk",
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
  },
];
interface Props {
  filters?: any;
  filterDataInitial?: any
  right?: boolean;
  variant?: 'small' | 'big'
  onSave: (filterData: any) => void
  onReset: () => void
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
  risk: ['Default', 'Low', 'Medium', 'High'],
  serviceType: ['NFT', 'KYC', 'Project Account', 'Services', 'Projects', 'Social network'],
  userStatus: ['Red flag', 'Verifed', 'Not verified'],
  dealStatus: ["Available", "Wait for confirm", 'Started', 'Funds reserved', 'Ended', 'Closed'],
  tickers: ['ETH', 'USDC'],
}

const OtcFilter: FC<Props> = ({ filters = defaultFilters, filterDataInitial, right, variant = 'big', onSave, onReset }) => {
  const [active, setActive] = useState(false);
  const [filterData, setFilterData] = useState<any>(filterDataInitial || initialFilterData);
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
    setFilterData(filterDataInitial || initialFilterData);
    setIsResetVisible(false);
    setActive(false)
    onReset()
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

      default:
        return null;
    }
  };

  return (
    <OtcFilterWrapper>
      <FilterButton onClick={() => setActive((state) => !state)}>
        <FilterIcon />
        <Typography variant="p">Filters</Typography>
      </FilterButton>
      {active ? (
        <Modal
          className={`filter-modal ${variant}`}
          title=""
          variant={variant === 'big' ? 'filter' : 'small'}
          onClose={() => setActive(false)}
        >
          {
            variant === 'big'
              ?
              <OtcDropdown active={active} right={right}>
                <OtcDropdownWrapper
                  variant={variant}
                >
                  {
                    filters.slice(0, 5).map((item: any, i: number) => {
                      return (
                        <DropdownRow key={i}>{renderFilterItem(item)}</DropdownRow>
                      );
                    })
                  }
                </OtcDropdownWrapper>
                <OtcColumn>
                  {
                    filters.slice(5, 12).map((item: any, i: number) => {
                      return (
                        <DropdownRow key={i}>{renderFilterItem(item)}</DropdownRow>
                      );
                    })
                  }
                </OtcColumn>
              </OtcDropdown>
              :
              <OtcDropdown active={active}>
                <OtcDropdownWrapper
                  variant={variant}
                >
                  {
                    filters.map((item: any, i: number) => {
                      return (
                        <DropdownRow key={i}>{renderFilterItem(item)}</DropdownRow>
                      );
                    })
                  }
                </OtcDropdownWrapper>
              </OtcDropdown>
          }

          <OtcBottom
            variant={variant}
          >
            <Buttons>
              <Button
                type={'fill'}
                onClick={() => {
                  onSave(filterData);
                  setActive(false);
                }}
              >
                Save
              </Button>
              <Button
                type={'fill'}
                onClick={() => {
                  setActive(false)
                }} className="decline-btn">
                Cancel
              </Button>
            </Buttons>
            <ResetWrapper
              variant={variant}
            >
              {
                isResetVisible
                  ?
                  <Button onClick={handleResetFilters} className="reset-btn">
                    Reset
                  </Button>
                  :
                  <></>
              }
            </ResetWrapper>
          </OtcBottom>
        </Modal>
      )
        :
        null
      }
    </OtcFilterWrapper>
  );
};

export default OtcFilter;
