import React, { useState } from "react";
import { SearchInput } from "../../../Parsing/styles";
import { SearchIconStyle } from "../../../../../global/Navigation/styles";
import {
  DropdownWrapper,
  SearchWrapper,
  TableContent,
} from "../../Tabs/Address/styles";
import { ArrowDownIcon } from "../../../../../global/Icons";
import {
  CounterTableHeader,
  CounterTableRowsWrapper,
  CounterTableRowWrapper,
} from "../styles";

const TopCounterTab = () => {
  const [searchValue, setSearchValue] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(false);

  return (
    <>
      <SearchWrapper style={{ margin: 0, padding: "0px 16px 16px 16px" }}>
        <SearchInput
          type="text"
          placeholder="Search the project/fund/person"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle />}
          value={searchValue}
        />
        <DropdownWrapper active={activeDropdown}>
          <div>
            <button onClick={() => setActiveDropdown((state) => !state)}>
              All Networks <ArrowDownIcon />
            </button>
            {activeDropdown && (
              <ul>
                <li>
                  <button>Ethereum</button>
                </li>
                <li>
                  <button>Polygon</button>
                </li>
                <li>
                  <button>BNB Chain</button>
                </li>
                <li>
                  <button>Arbitrum</button>
                </li>
                <li>
                  <button>Avalanche</button>
                </li>
                <li>
                  <button>Ethereum</button>
                </li>
              </ul>
            )}
          </div>
        </DropdownWrapper>
      </SearchWrapper>
      <div>
        <TableContent>
          <CounterTableHeader>
            <div>Entity</div>
            <div>TX</div>
            <div>USD</div>
          </CounterTableHeader>
          <CounterTableRowsWrapper>
            {Array(8)
              .fill("")
              .map((item, i) => {
                return (
                  <CounterTableRowWrapper key={i}>
                    <div>Name</div>
                    <div>210</div>
                    <div>$57.46</div>
                  </CounterTableRowWrapper>
                );
              })}
          </CounterTableRowsWrapper>
        </TableContent>
      </div>
    </>
  );
};

export default TopCounterTab;
