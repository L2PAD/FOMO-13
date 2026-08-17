import React, { useState } from "react";
import NFTCard from "../../../../../global/NFTCard";
import Filter from "../../../../../global/Filter";
import {
  CryptoCurrencies,
  OptionsForSortProjectsPage,
} from "../../../../../../staticContent/global";
import { DropdownWrapper } from "../../../../../global/FilterSortHeader/styles";
import {
  EmptyLabel,
  HeaderWrapper,
  NFTCardWrapper,
  NFTsCardsWrapper,
  PageTitle,
  ShowAllButton,
  ShowAllWrapper,
  Wrapper,
} from "./styles";

const filters = [
  {
    type: "checkbox",
    items: ["Buy now", "Rarity ranking"],
  },
  {
    type: "range",
    title: "Rarity rank range",
    range: [0, 150],
    step: 1,
  },
  {
    type: "currencyRange",
    title: "Price range",
    range: [0, 150],
    step: 1,
    currencies: CryptoCurrencies,
  },
  {
    type: "select",
    title: "Marketplace",
    placeholder: "Choose marketplace",
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
  {
    type: "select",
    title: "Trait count",
    placeholder: "Choose trait count",
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
  {
    type: "select",
    title: "Background",
    placeholder: "Choose color",
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
  {
    type: "select",
    title: "Beak",
    placeholder: "Choose beak",
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
  {
    type: "select",
    title: "Body",
    placeholder: "Choose trait count",
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
  {
    type: "select",
    title: "Eyes",
    placeholder: "Choose eyes",
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
  {
    type: "select",
    title: "Eyewear",
    placeholder: "Choose eyewear",
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
  {
    type: "select",
    title: "Feathers",
    placeholder: "Choose feathers",
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
];

const NFTs = () => {
  const [sortValue, setSortValue] = useState(OptionsForSortProjectsPage[0]);
  const [showAll, setShowAll] = useState(false);

  return (
    <Wrapper>
      <PageTitle variant="p">NFT{`'`}s</PageTitle>
      <HeaderWrapper>
        <Filter filters={filters} />
        <DropdownWrapper
          label="Sort by"
          onChange={setSortValue}
          value={sortValue}
          options={OptionsForSortProjectsPage}
        />
      </HeaderWrapper>
      <EmptyLabel>NFT's list empty...</EmptyLabel>
      {/* <NFTsCardsWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
                <NFTCardWrapper>
                    <NFTCard />
                </NFTCardWrapper>
            </NFTsCardsWrapper> */}
      <ShowAllWrapper>
        {/* <ShowAllButton onClick={() => setShowAll(state => !state)}>
                    {showAll ? 'Hide' : 'Show'} all
                </ShowAllButton> */}
      </ShowAllWrapper>
    </Wrapper>
  );
};

export default NFTs;
