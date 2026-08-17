import React, { useState } from "react";
import Filter from "../../../../global/Filter";
import { SearchIconStyle } from "../../../../global/Navigation/styles";
import { SearchInput } from "../../Parsing/styles";
import { UsersScoreUserButton } from "../../Persons/SocialPerson/styles";
import VisualizeModal from "../../modals/VisualizeTableModal";
import {
  DateRoll,
  DateRollPoint,
  HeaderWrapper,
  PageContentWrapper,
  PageWrapper,
  PointsData,
  PointsRow,
  TableContent,
  TableHeader,
  TableRowsWrapper,
  TableRowWrapper,
  TableWrapper,
} from "./styles";

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
];

const VisualizeLayout = () => {
  const [searchValue, setSearchValue] = useState("");
  const [tableModal, setTableModal] = useState(false);

  return (
    <PageWrapper>
      <PageContentWrapper>
        <HeaderWrapper>
          <Filter filters={filters} />
          <SearchInput
            type="text"
            placeholder="Search"
            onChange={(value: string) => setSearchValue(value)}
            leftIcon={<SearchIconStyle />}
            value={searchValue}
          />
        </HeaderWrapper>
        <div>
          <PointsData>
            <PointsRow color="#FF5858">
              <div /> <p>Contralized exchages</p>
            </PointsRow>
            <PointsRow color="rgba(255, 199, 2, 0.5)" disabled>
              <div />{" "}
              <p>
                Deposit addresses <span className="green">Inflow</span>
              </p>
            </PointsRow>
            <PointsRow color="#05C9A1">
              <div /> <p>Decentralized exchanges</p>
            </PointsRow>
            <PointsRow color="rgba(39, 122, 210, 0.88)">
              <div /> <p>Lending</p>
            </PointsRow>
            <PointsRow color="#738094">
              <div /> <p>Individuals and funds</p>
            </PointsRow>
            <PointsRow color="#58D7FF" disabled>
              <div />{" "}
              <p>
                Uncategorized <span className="red">Outflow</span>
              </p>
            </PointsRow>
            <PointsRow color="rgba(115, 128, 148, 0.5)">
              <div /> <p>All</p>
            </PointsRow>
          </PointsData>
          <TableWrapper>
            <TableContent>
              <TableHeader>
                <div>Time</div>
                <div>From</div>
                <div>To</div>
                <div>Value</div>
                <div>Token</div>
                <div>USD</div>
              </TableHeader>
              <TableRowsWrapper>
                {Array(10)
                  .fill("")
                  .map((item, i) => {
                    return (
                      <TableRowWrapper key={i + item}>
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
                          <p>
                            $3.39 <span>ETH</span>
                          </p>
                        </div>
                        <div>
                          <p>$3.39</p>
                        </div>
                      </TableRowWrapper>
                    );
                  })}
              </TableRowsWrapper>
              <UsersScoreUserButton onClick={() => setTableModal(true)}>
                See all &gt;
              </UsersScoreUserButton>
            </TableContent>
          </TableWrapper>
        </div>
        <DateRoll>
          <DateRollPoint isYear>2019</DateRollPoint>
          <DateRollPoint>Apr</DateRollPoint>
          <DateRollPoint>Jul</DateRollPoint>
          <DateRollPoint>Oct</DateRollPoint>
          <DateRollPoint isYear>2020</DateRollPoint>
          <DateRollPoint>Apr</DateRollPoint>
          <DateRollPoint>Jul</DateRollPoint>
          <DateRollPoint>Oct</DateRollPoint>
          <DateRollPoint isYear>2021</DateRollPoint>
          <DateRollPoint>Apr</DateRollPoint>
          <DateRollPoint>Jul</DateRollPoint>
          <DateRollPoint>Oct</DateRollPoint>
          <DateRollPoint isYear>2022</DateRollPoint>
          <DateRollPoint>Apr</DateRollPoint>
          <DateRollPoint>Jul</DateRollPoint>
        </DateRoll>
      </PageContentWrapper>
      {tableModal && <VisualizeModal onClose={() => setTableModal(false)} />}
    </PageWrapper>
  );
};

export default VisualizeLayout;
