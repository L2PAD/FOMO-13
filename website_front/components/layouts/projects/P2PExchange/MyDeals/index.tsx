import React, { useState } from "react";
import { AddBoardButton } from "../../../earlyland/Board/styles";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
  DropdownWrapper,
  TabWrapper,
  HeaderSwitchWrapper,
  SwitchButton,
} from "../styles";
import InitiativeNewSwap from "../../modals/InitiativeNewSwap";
import { useRouter } from "next/router";
import PeddingSwaps from "../PeddingSwaps";
import MarketHistory from "../MarketHistory";
import Active from "../Active";
import Ended from "../Ended";

const sort = [
  { value: "price-date", name: "price / date" },
  { value: "total_raised", name: "Total raised" },
  { value: "date_from_new", name: "Date (from new)" },
  { value: "date_from_old", name: "Date (from old)" },
];

const tabs = ["Pedding swaps", "Active", "Ended", "History"];

const MyDeals = () => {
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState(sort[0]);
  const [initiativeNewSwap, setInitiativeNewSwap] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const router = useRouter();
  const updateActiveTab = (value: string) => {
    router.push("", { query: { tab: value.toLowerCase() } }, { shallow: true });
    setActiveTab(value);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Pedding swaps":
        return <PeddingSwaps />;
      case "Active":
        return <Active />;
      case "Ended":
        return <Ended />;
      case "History":
        return <MarketHistory />;
      default:
        return <PeddingSwaps />;
    }
  };

  return (
    <TabWrapper>
      <AddBoardButton onClick={() => setInitiativeNewSwap(true)}>
        + Initiative new swap
      </AddBoardButton>
      <p>
        Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
        sint. Velit officia consequat duis enim velit mollit. Exercitation
        veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
        ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis
        enim velit mollit.
      </p>
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search for the desired deal"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
        <DropdownWrapper
          label="Sort by"
          onChange={setSortValue}
          value={sortValue}
          options={sort}
        />
      </SearchWrapper>
      <HeaderSwitchWrapper>
        {tabs.map((item) => (
          <SwitchButton
            onClick={() => updateActiveTab(item)}
            active={activeTab === item}
          >
            {item}
          </SwitchButton>
        ))}
      </HeaderSwitchWrapper>
      <br />
      {renderContent()}
      {initiativeNewSwap && (
        <InitiativeNewSwap onClose={() => setInitiativeNewSwap(false)} />
      )}
    </TabWrapper>
  );
};

export default MyDeals;
