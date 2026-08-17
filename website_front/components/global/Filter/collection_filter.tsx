/* eslint-disable */
import React, { FC, useState } from "react";
import Typography from "../common/Typography";
import Modal from "../common/Modal";
import Button from "../common/Button";
import OtcCheckboxRow from "./otc_checkbox_row";
import OtcRangeRow from "./otc-range_row";
import {
  Buttons,
  OtcDropdown,
  OtcDropdownWrapper,
  OtcFilterWrapper,
  ResetWrapper,
  OtcBottom,
} from "./otc-styles";
import { FilterButton } from "./styles";
import { RotateCcw } from "lucide-react";
import { DropdownRow } from "./alloc-styles";
import {
  COLLECTION_MARKET_FILTER_DEFAULTS,
  ICollectionMarketFilters,
  normalizeCollectionMarketFilters,
} from "../../../utils/collectionMarketFilters";

interface Props {
  onSave: (data: ICollectionMarketFilters) => void;
  className?: string;
}

const defaultFilters = [
  {
    type: "checkbox",
    title: "",
    items: ["Buy Now", "Rarity ranking", "Listed", "Not listed"],
    key: "status",
  },
  {
    type: "range",
    title: "Rarity rank range",
    range: [0, 99],
    step: 1,
    key: "rarityRank",
  },
  {
    type: "range",
    title: "Price range",
    range: [0, 999],
    step: 1,
    key: "priceRange",
  },
  {
    type: "checkbox",
    title: "Rarity",
    items: [
      "FOMO Gold",
      "Uncommon",
      "Legendary",
      "Singularity",
      "Epic",
      "Hidden",
      "Rare",
      "Shards",
    ],
    key: "rarity",
  },
];

const initialFilterData = normalizeCollectionMarketFilters(
  COLLECTION_MARKET_FILTER_DEFAULTS
);

const CollectionFilter: FC<Props> = ({ onSave, className }) => {
  const [active, setActive] = useState(false);
  const [filterData, setFilterData] =
    useState<ICollectionMarketFilters>(initialFilterData);
  const [isResetVisible, setIsResetVisible] = useState(false);

  const checkIfFiltersChanged = (currentFilters: ICollectionMarketFilters) => {
    return (
      JSON.stringify(normalizeCollectionMarketFilters(currentFilters)) !==
      JSON.stringify(initialFilterData)
    );
  };

  const inputsHandler = (value: any, key: string): void => {
    const updatedFilterData = normalizeCollectionMarketFilters({
      ...filterData,
      [key]: value,
    });
    setFilterData(updatedFilterData);
    setIsResetVisible(checkIfFiltersChanged(updatedFilterData));
  };

  const handleResetFilters = () => {
    const resetFilters = normalizeCollectionMarketFilters(
      COLLECTION_MARKET_FILTER_DEFAULTS
    );
    setFilterData(resetFilters);
    setIsResetVisible(false);
    onSave(resetFilters);
    setActive(false);
  };

  const renderFilterItem = (item: any) => {
    const filterKey = item.key as keyof ICollectionMarketFilters;

    switch (item.type) {
      case "checkbox":
        return (
          <OtcCheckboxRow
            data={filterData[filterKey]}
            title={item.title}
            items={item.items}
            onChange={(value) => inputsHandler(value, filterKey)}
            className={`otc-checkbox ${item.key}`}
          />
        );
      case "range":
        return (
          <OtcRangeRow
            data={filterData[filterKey] as number[]}
            title={item.title}
            step={item.step}
            range={item.range}
            onChange={(values) => inputsHandler(values, filterKey)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <OtcFilterWrapper className={className}>
      <FilterButton
        className={[className, "collection-filter-trigger"].filter(Boolean).join(" ")}
        newSort
        onClick={() => setActive((state) => !state)}
      >
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
          className="collection"
          title="Filter"
          variant='small-medium'
          onClose={() => setActive(false)}
        >
          <OtcDropdown active={active}>
            <OtcDropdownWrapper variant="collection">
              {defaultFilters.map((item: any, i: number) => {
                return (
                  <DropdownRow key={i} style={{ marginBottom: "5px" }}>
                    {renderFilterItem(item)}
                  </DropdownRow>
                );
              })}
            </OtcDropdownWrapper>
          </OtcDropdown>

          <OtcBottom variant="collection">
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
                  onSave(normalizeCollectionMarketFilters(filterData));
                  setActive(false);
                }}
                variant="primary"
              >
                Apply
              </Button>
            </Buttons>
            <ResetWrapper variant="collection" className="small">
              <Button onClick={handleResetFilters} className="reset-btn">
                <RotateCcw size={16} />
                Reset
              </Button>
            </ResetWrapper>
          </OtcBottom>
        </Modal>
      ) : null}
    </OtcFilterWrapper>
  );
};

export default CollectionFilter;
