import React, { useState } from "react";
import Tabs from "../../../global/Tabs";
import {
  ArrowDownIcon,
  EthIcon,
  ArbitrumIcon,
  PolygonIcon,
  AvalancheIcon,
  OptimismIcon,
  BNBIcon,
} from "../../../global/Icons";
import { SearchInput } from "../Parsing/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { PageWrapper, PageDescriptionWrapper } from "./styles";
import { DropdownWrapper, SearchWrapper } from "./Tabs/Address/styles";
import Address from "./Tabs/Address";
import NFTS from "./Tabs/NFTS";
import Contract from "./Tabs/Contract";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../FomoChat/styles";

const tabs = ["Address", "Smart contract", "NFT`s"];

const list = [
  { title: "Ethereum", icon: <EthIcon /> },
  { title: "Polygon", icon: <PolygonIcon /> },
  { title: "BNB Chain", icon: <BNBIcon /> },
  { title: "Arbitrum", icon: <ArbitrumIcon /> },
  { title: "Avalanche", icon: <AvalancheIcon /> },
  { title: "Optimism", icon: <OptimismIcon /> },
];

const OnChainPage = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const renderPage = () => {
    switch (activeTab) {
      case "Address":
        return <Address />;
      case "Smart contract":
        return <Contract />;
      case "NFT`s":
        return <NFTS />;
      default:
        return <Address />;
    }
  };

  return (
    <PageWrapper>
      <PageDescriptionWrapper>
        <Typography variant="h1">L0 On-chain</Typography>
        <br />
        <Subtitle>
          On-chain analysis of projects, persons, funds etc. Find a pattern or a
          clue using our on-chain data analysis and adjust your investing
          strategy or try to predict the market. The full potential of this
          function is yet to be discovered.
        </Subtitle>
      </PageDescriptionWrapper>
      <div>
        <Tabs
          items={tabs}
          activeItem={activeTab}
          onClick={(value) => setActiveTab(value)}
        />
        <SearchWrapper>
          <SearchInput
            type="text"
            placeholder="Search"
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
                  {list.map((item, i) => {
                    return (
                      <li key={i + item.title}>
                        <button>
                          {item.icon} {item.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </DropdownWrapper>
        </SearchWrapper>
        {renderPage()}
      </div>
    </PageWrapper>
  );
};

export default OnChainPage;
