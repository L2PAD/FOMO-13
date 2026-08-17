import React, { useState } from "react";
import Filter from "../../../../../global/Filter";
import { onchainPositiveData } from "../../../../../../staticContent/projects/onchain";
import { simplifyAmount } from "../../../../../../helpers/simplifyAmount";
import {
  CardsTableContent,
  CardTitleWrapper,
  CardWrapper,
  TableContent,
  TransactionsCardsWrapper,
  TransactionsTableHeader,
  TransactionsTableRow,
} from "../Address/styles";
import CommentBlock from "../../../../../global/CommentBlock";
import SmartModal from "../../../modals/SmartModal";
import { UsersScoreUserButton } from "../../../Persons/SocialPerson/styles";
import HotNftModal from "../../../modals/HotNftModal";
import SmartSellModal from "../../../modals/SmartSellModal";
import SmartMintModal from "../../../modals/SmartMintModal";
import {
  CardsWrapper,
  FilterWrapper,
  HotNFTsWrapper,
  TabButton,
  TableHeader,
  TableWrapper,
  TabsRow,
  TabsTableProgress,
  TabsTableRowsWrapper,
  TabTableRowWrapper,
} from "./styles";
import InflowTable from "./InflowTable";
import OutflowTable from "./OutflowTable";
import CurrentListingTable from "./CurrentListingTable";
import LatestTable from "./LatestTable";
import MintingTable from "./MintingTable";
import TrackerTable from "./TrackerTable";

const tabs = [
  "Inflow",
  "Outflow",
  "Current listings",
  "Latest mints",
  "Minting leaderboard",
  "Money tracker",
];
const filters = [
  { type: "input", title: "Address", placeholder: "" },
  {
    type: "range",
    title: "Volume ($)",
    range: [0, 150],
    step: 1,
  },
  {
    type: "range",
    title: "Volume (tokens)",
    range: [0, 150],
    step: 1,
  },
  {
    type: "range",
    title: "Transactions",
    range: [0, 150],
    step: 1,
  },
  {
    type: "checkbox",
    title: "Type",
    items: ["Sending", "Getting"],
  },
  { type: "input", title: "Smart contract", placeholder: "" },
  {
    type: "checkbox",
    items: ["Smart money", "Top NFT"],
  },
];

const NFTTab = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [smartModal, setSmartModal] = useState(false);
  const [hotModal, setHotModal] = useState(false);
  const [smartSellModal, setSmartSellModal] = useState(false);
  const [smartMintModal, setSmartMintModal] = useState(false);

  const renderTable = () => {
    switch (activeTab) {
      case "Inflow":
        return <InflowTable />;
      case "Outflow":
        return <OutflowTable />;
      case "Current listings":
        return <CurrentListingTable />;
      case "Latest mints":
        return <LatestTable />;
      case "Minting leaderboard":
        return <MintingTable />;
      case "Money tracker":
        return <TrackerTable />;
      default:
        return <InflowTable />;
    }
  };

  return (
    <div>
      <FilterWrapper>
        <Filter filters={filters} />
      </FilterWrapper>
      <HotNFTsWrapper>
        <TableWrapper variant="default">
          <p>Hot NFTs</p>
          <TableContent>
            <TableHeader>
              <div>Nft collection</div>
              <div>Nft collection</div>
            </TableHeader>
            <TabsTableRowsWrapper>
              {onchainPositiveData.map((item, i) => {
                const percentage = item.value / (item.max / 100);
                return (
                  <TabTableRowWrapper key={i}>
                    <div>{item.name}</div>
                    <div>
                      ${simplifyAmount(item.value)}
                      <TabsTableProgress progress={percentage} right={false}>
                        <div />
                      </TabsTableProgress>
                    </div>
                  </TabTableRowWrapper>
                );
              })}
            </TabsTableRowsWrapper>
            <UsersScoreUserButton onClick={() => setHotModal(true)}>
              See all &gt;
            </UsersScoreUserButton>
          </TableContent>
        </TableWrapper>
      </HotNFTsWrapper>
      <div>
        <TabsRow>
          {tabs.map((item, i) => {
            return (
              <TabButton
                key={i}
                active={activeTab === item}
                onClick={() => setActiveTab(item)}
              >
                {item}
              </TabButton>
            );
          })}
        </TabsRow>
        <TableWrapper variant="default">
          {renderTable()}
          <UsersScoreUserButton onClick={() => setSmartModal(true)}>
            See all &gt;
          </UsersScoreUserButton>
        </TableWrapper>
      </div>
      <CardsWrapper>
        <CardWrapper variant="default">
          <CardTitleWrapper>
            <p>24 Smart sell</p>
          </CardTitleWrapper>
          <CardsTableContent>
            <TransactionsTableHeader>
              <div>Time</div>
              <div>From</div>
              <div>To</div>
              <div>Value</div>
              <div>USD</div>
            </TransactionsTableHeader>
            <TransactionsCardsWrapper>
              {Array(10)
                .fill("")
                .map((item, i) => {
                  return (
                    <TransactionsTableRow key={i + item}>
                      <div>
                        <p>Just now</p>
                      </div>
                      <div>
                        <p>0x3371C9...0A699bA6</p>
                      </div>
                      <div>
                        <p>0x3371C9...0A699bA6</p>
                      </div>
                      <div>
                        <p>
                          $3.39 <span>ETH</span>
                        </p>
                      </div>
                      <div>
                        <p>$3.39</p>
                      </div>
                    </TransactionsTableRow>
                  );
                })}
            </TransactionsCardsWrapper>
          </CardsTableContent>
          <UsersScoreUserButton onClick={() => setSmartSellModal(true)}>
            See all &gt;
          </UsersScoreUserButton>
        </CardWrapper>
        <CardWrapper variant="default">
          <CardTitleWrapper>
            <p>24 Smart Mints</p>
          </CardTitleWrapper>
          <CardsTableContent>
            <TransactionsTableHeader>
              <div>Time</div>
              <div>From</div>
              <div>To</div>
              <div>Value</div>
              <div>USD</div>
            </TransactionsTableHeader>
            <TransactionsCardsWrapper>
              {Array(10)
                .fill("")
                .map((item, i) => {
                  return (
                    <TransactionsTableRow key={i + item}>
                      <div>
                        <p>Just now</p>
                      </div>
                      <div>
                        <p>0x3371C9...0A699bA6</p>
                      </div>
                      <div>
                        <p>0x3371C9...0A699bA6</p>
                      </div>
                      <div>
                        <p>
                          $3.39 <span>ETH</span>
                        </p>
                      </div>
                      <div>
                        <p>$3.39</p>
                      </div>
                    </TransactionsTableRow>
                  );
                })}
            </TransactionsCardsWrapper>
          </CardsTableContent>
          <UsersScoreUserButton onClick={() => setSmartMintModal(true)}>
            See all &gt;
          </UsersScoreUserButton>
        </CardWrapper>
      </CardsWrapper>
      <CommentBlock />
      {smartModal && (
        <SmartModal onClose={() => setSmartModal(false)}>
          {renderTable()}
        </SmartModal>
      )}
      {hotModal && <HotNftModal onClose={() => setHotModal(false)} />}
      {smartSellModal && (
        <SmartSellModal onClose={() => setSmartSellModal(false)} />
      )}
      {smartMintModal && (
        <SmartMintModal onClose={() => setSmartMintModal(false)} />
      )}
    </div>
  );
};

export default NFTTab;
