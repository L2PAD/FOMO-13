import React, { useState } from "react";
import Filter from "../../../../global/Filter";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
  HeaderWrapper,
  ContentWrapper,
  HeaderSwitchWrapper,
  SwitchButton,
} from "./styles";
import { Sort } from "../../../../global/common/Sort";
import TopUsers from "./TopUsers";
import Comments from "./Comments";

const filters = [
  { type: "date", title: "Date" },
  {
    type: "range",
    title: "Price",
    range: [0, 150],
    step: 1,
  },
  {
    type: "range",
    title: "Amount",
    range: [0, 1000],
    step: 1,
  },
  {
    type: "range",
    title: "Rating",
    range: [0, 100],
    step: 1,
  },
  {
    type: "checkbox",
    title: "Service type",
    items: [
      "NFT",
      "Project account",
      "Projects",
      "KYC",
      "Services",
      "Social network",
    ],
  },
  {
    type: "checkbox",
    title: "Deal type",
    items: ["Selling", "Buying"],
  },
  {
    type: "checkbox",
    title: "Block status",
    items: ["Unlocked", "Locked"],
  },
  {
    type: "checkbox",
    title: "Risk",
    items: ["Low", "High", "Medium", "Very high"],
  },
  {
    type: "checkbox",
    title: "Users status",
    items: ["Verifed", "Red flag"],
  },
];

const TopMembers = () => {
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("");
  const [topUser, setTopUsers] = useState(true);

  return (
    <div>
      <HeaderSwitchWrapper>
        <SwitchButton onClick={() => setTopUsers(true)} active={topUser}>
          Top users
        </SwitchButton>
        <SwitchButton onClick={() => setTopUsers(false)} active={!topUser}>
          Comments
        </SwitchButton>
      </HeaderSwitchWrapper>
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search the project/fund/person"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <HeaderWrapper>
        <Filter filters={filters} />
        <Sort
          label="Sort by"
          type="Top reactions"
          options={[
            {
              label: "Top reactions",
              items: ["Low", "High"],
              value: sortValue,
              setValue: setSortValue,
            },
          ]}
        />
      </HeaderWrapper>
      <ContentWrapper>{topUser ? <TopUsers /> : <Comments />}</ContentWrapper>
    </div>
  );
};

export default TopMembers;
