import React from "react";
import { AssetTableData } from "../../../../../../staticContent/global";
import ViewTable from "../../../../../global/Tables/ViewTable";
import {
  ContentWrapper,
  RoundTitle,
  RoundValue,
  RoundValueWrapper,
  RoundWrapper,
  ScrollWrapper,
  TableWrapper,
} from "./styles";

// @ts-ignore

const EndedFundraising = () => {
  return (
    <div>
      <ScrollWrapper>
        {Array(5)
          .fill("")
          .map((item, i) => {
            return (
              <RoundWrapper variant="default" key={i}>
                <RoundTitle variant="p">Funding Round</RoundTitle>
                <RoundValueWrapper>
                  <RoundValue variant="p">February 2022</RoundValue>
                  <RoundValue variant="p">
                    Price: <span>--</span>
                  </RoundValue>
                </RoundValueWrapper>
                <RoundValueWrapper>
                  <RoundValue variant="p">
                    Raised: <span>$205.00 M</span>
                  </RoundValue>
                  <RoundValue variant="p">
                    Pre-Valuation: <span>$205.00 M</span>
                  </RoundValue>
                </RoundValueWrapper>
              </RoundWrapper>
            );
          })}
      </ScrollWrapper>
      <ContentWrapper>
        <TableWrapper>
          <ViewTable
            type="asset"
            //@ts-ignore
            cardsData={{ cards: AssetTableData, show: 0 }}
          />
        </TableWrapper>
      </ContentWrapper>
    </div>
  );
};

export default EndedFundraising;
