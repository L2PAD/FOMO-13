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
import AllocCheckboxRow from "./alloc_checkbox_row";
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

const defaultFilters = [
  {
    type: "checkbox",
    title: "Price per NFT",
    items: ["Low to High", "High to Low"],
    key: "price",
  },
  {
    type: "checkbox",
    title: "Minimum Allocation",
    items: [
      "< $250",
      "250$ - $499",
      "500$ - $999",
      "$1,000 – $2,499",
      "$2,500 – $4,999",
      "> $5,000",
    ],
    key: "minAllocation",
  },
  {
    type: "checkbox",
    title: "Available Spots Left",
    items: ["1000+ spots", "< 500 spots", "500–999 spots", "Sold Out"],
    key: "availableSpots",
  },
];

const defaultFiltersSimple = [
  {
    type: "checkbox",
    title: "Funding Stage",
    items: ["Seed Round", "Strategic Round", "Private Round", "Public Round"],
    key: "fundingStage",
  },
  {
    type: "checkbox",
    title: "Blockchain Network",
    items: [
      "Ethereum",
      "Solana",
      "Binance Smart Chain",
      "Polygon",
      "Avalanche",
      "Arbitrum",
      "Optimism",
      "Base",
      "ZkSync",
      "Aptos/Sui",
      "Other",
    ],
    key: "blockchainNetwork",
  },
  {
    type: "checkbox",
    title: "Category / Niche",
    items: [
      "DeFi",
      "Infrastructure",
      "ZK Tech/Privacy",
      "Ai & Web3",
      "DAOs & Governance",
      "SocialFi",
      "NFT & Collectibles",
      "L2/Scrolling Solutions",
      "Metaverse",
      "Gaming/GameFi",
      "Real World Assets (RWA)",
      "Launchpads",
      "Other",
    ],
    key: "categoryNiche",
  },
  {
    type: "checkbox",
    title: "Start / End Date",
    items: ["Newest Allocations", "Ending Soon", "Pre-launch"],
    key: "startEndDate",
  },
  {
    type: "checkbox",
    title: "Popularity",
    items: [
      "Most Viewed",
      "Most Watchlisted",
      "Most Holders",
      "Least Viewed",
      "Least Watchlisted",
      "Least Holders",
    ],
    key: "popularity",
  },
  {
    type: "checkbox",
    title: "Rarity",
    items: ["Common", "Epic", "Legendary", "Rare", "FOMO Gold"],
    key: "rarity",
  },
];

interface Props {
  filters?: any;
  filterDataInitial?: any;
  right?: boolean;
  onSave: (filterData: any) => void;
  variant?: "small" | "big" | "medium";
  className?: string;
}

export const oneWeekInMs = 30 * 24 * 60 * 60 * 1000;

const initialFilterData = {
  price: ["Low to High"],
  minAllocation: [],
  availableSpots: [],
};

const initialFiltersSimple = {
  fundingStage: [],
  blockchainNetwork: [],
  categoryNiche: [],
  startEndDate: [],
  popularity: [],
  rarity: [],
};

const AllocFilter: FC<Props> = ({ onSave, className }) => {
  const [active, setActive] = useState(false);
  const [filterData, setFilterData] = useState<any>({
    ...initialFilterData,
    ...initialFiltersSimple,
  });
  const [isResetVisible, setIsResetVisible] = useState(false);

  const checkIfFiltersChanged = (currentFilters: any) => {
    return (
      JSON.stringify(currentFilters) !==
      JSON.stringify({ ...initialFilterData, ...initialFiltersSimple })
    );
  };

  const inputsHandler = (value: any, key: string): void => {
    const updatedFilterData = { ...filterData, [key]: value };
    setFilterData(updatedFilterData);
    setIsResetVisible(checkIfFiltersChanged(updatedFilterData));
  };

  const handleResetFilters = () => {
    setFilterData({ ...initialFilterData, ...initialFiltersSimple });
    setIsResetVisible(false);
  };

  return (
    <AllocFilterWrapper>
      <FilterButton
        className={className}
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
          className={`filter-modal`}
          title="Filter"
          onClose={() => setActive(false)}
        >
          <AllocDropdownWrapper className="default-filters">
            {defaultFilters.map((item: any, i: number) => {
              return (
                <DropdownRow key={i}>
                  <AllocCheckboxRow
                    data={filterData[item.key]}
                    title={item.title}
                    items={item.items}
                    onChange={(value) => inputsHandler(value, item.key)}
                    className={`alloc-checkbox grid ${item.key}`}
                  />
                </DropdownRow>
              );
            })}
          </AllocDropdownWrapper>
          <AllocDropdownWrapper>
            {defaultFiltersSimple.map((item: any, i: number) => {
              return (
                <DropdownRow key={i} className={"row"}>
                  <AllocCheckboxRow
                    data={filterData[item.key]}
                    title={item.title}
                    items={item.items}
                    onChange={(value) => inputsHandler(value, item.key)}
                    className={`alloc-checkbox grid ${item.key}`}
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

export default AllocFilter;
