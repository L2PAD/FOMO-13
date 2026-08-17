import React, { useState } from "react";
import Filter from "../../../../../global/Filter";
import {
  FilterWrapper,
  TabButton,
  TableWrapper,
  TabsRow,
  TabsTableRowsWrapper,
} from "../NFTS/styles";
import { TableContent } from "../Address/styles";
import CommentBlock from "../../../../../global/CommentBlock";
import { UsersScoreUserButton } from "../../../Persons/SocialPerson/styles";
import ContractModals from "../../../modals/ContractModals";
import {
  BigCardWrapper,
  CardsWrapper,
  RegularCardWrapper,
  RollupTableHeaderWrapper,
  RollupTableRowWrapper,
} from "./styles";

const tabs = [
  "Users deposited",
  "Deposited over time",
  "Deposits list",
  "Deposit gap",
  "Process Rollup",
  "Users",
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
const Contract = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [contractModal, setContractModal] = useState(false);

  return (
    <div>
      <FilterWrapper>
        <Filter filters={filters} />
      </FilterWrapper>
      <CardsWrapper>
        <BigCardWrapper variant="default">
          <p>Value deposited</p>
          <div>
            <span>$1.8M</span>
            <i>TVD</i>
          </div>
        </BigCardWrapper>
        <BigCardWrapper variant="default">
          <p>Total unique users</p>
          <div>
            <span>136,863</span>
            <i>Users</i>
          </div>
        </BigCardWrapper>
        <BigCardWrapper variant="default">
          <p>Total deposits</p>
          <div>
            <span>311,505</span>
            <i>Total deposit count</i>
          </div>
        </BigCardWrapper>
        <RegularCardWrapper variant="default">
          <p>Average deposit</p>
          <div>
            <span>0,33</span>
            <i>Average deposit (ETH)</i>
          </div>
        </RegularCardWrapper>
        <RegularCardWrapper variant="default">
          <p>Biggest deposit</p>
          <div>
            <span>1,236.32</span>
            <i>Total ETH deposited</i>
          </div>
        </RegularCardWrapper>
        <RegularCardWrapper variant="default">
          <p>Process rollup</p>
          <div>
            <span>9,237</span>
            <i>Total Rollup</i>
          </div>
        </RegularCardWrapper>
        <RegularCardWrapper variant="default">
          <p>Total GAS fees</p>
          <div>
            <span>295.04</span>
            <i>Total GAS Fees</i>
          </div>
        </RegularCardWrapper>
      </CardsWrapper>
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
          <TableContent>
            <RollupTableHeaderWrapper>
              <div>Date</div>
              <div>Rollup TX</div>
              <div>Since last Rollup</div>
              <div>Gas fee</div>
            </RollupTableHeaderWrapper>
            <TabsTableRowsWrapper>
              {Array(8)
                .fill("")
                .map((item, i) => {
                  return (
                    <RollupTableRowWrapper key={i + item}>
                      <div>06.06.2022</div>
                      <div>
                        <a href="components/layouts/projects/Onchain/Tabs/Contract#">
                          0c0g46d4g6d4g6fd4g6dfg5fdg65dfg654df65g4df6g5df
                        </a>
                      </div>
                      <div>00:21:15</div>
                      <div>.0075</div>
                    </RollupTableRowWrapper>
                  );
                })}
            </TabsTableRowsWrapper>
            <UsersScoreUserButton onClick={() => setContractModal(true)}>
              See all &gt;
            </UsersScoreUserButton>
          </TableContent>
        </TableWrapper>
      </div>
      <CommentBlock />
      {contractModal && (
        <ContractModals
          onClose={() => setContractModal(false)}
          activeTab={activeTab}
        />
      )}
    </div>
  );
};

export default Contract;
