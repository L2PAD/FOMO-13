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
  ComparisonFiltersWrapper,
  ComparisonTableHeader,
  ComparisonTableRowWrapper,
  CounterTableRowsWrapper,
} from "../styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import RedFlag from "../../../../../global/RedFlag";

const ComparisonTab = () => {
  const [searchValue, setSearchValue] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(false);

  return (
    <>
      <ComparisonFiltersWrapper>
        <div>
          <p>Address #1</p>
          <input type="text" />
        </div>
        <div>
          <p>Address #2</p>
          <input type="text" />
        </div>
        <button>Compare</button>
      </ComparisonFiltersWrapper>
      <SearchWrapper style={{ marginTop: 0 }}>
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
          <ComparisonTableHeader>
            <div>Name</div>
            <div>Rating</div>
            <div>Transactions</div>
            <div>Address</div>
            <div>Volume</div>
            <div>Red flags</div>
          </ComparisonTableHeader>
          <CounterTableRowsWrapper>
            {Array(8)
              .fill("")
              .map((item, i) => {
                return (
                  <ComparisonTableRowWrapper key={i}>
                    <div>
                      <UserAvatar
                        size="xSmall"
                        variant="default"
                        avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                        name="name"
                      />
                      Name
                    </div>
                    <div>94</div>
                    <div>144</div>
                    <div>0xxf65...54654</div>
                    <div>$3.39</div>
                    <div>
                      <RedFlag count={14} />
                    </div>
                  </ComparisonTableRowWrapper>
                );
              })}
          </CounterTableRowsWrapper>
        </TableContent>
      </div>
    </>
  );
};

export default ComparisonTab;
