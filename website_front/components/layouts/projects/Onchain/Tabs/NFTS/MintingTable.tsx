import React from "react";
import { TableContent } from "../Address/styles";
import {
  LatestProgress,
  LatestTableHeader,
  LatestTableRow,
  TabsTableRowsWrapper,
} from "./styles";

const MintingTable = () => {
  return (
    <TableContent>
      <LatestTableHeader>
        <div>Name</div>
        <div>Profile (ETH)</div>
        <div>Spent (ETH)</div>
        <div>Revenue (ETH)</div>
      </LatestTableHeader>
      <TabsTableRowsWrapper>
        {Array(8)
          .fill("")
          .map((item, i) => {
            return (
              <LatestTableRow key={i}>
                <div>Name</div>
                <div>
                  14
                  <LatestProgress progress={20}>
                    <div />
                  </LatestProgress>
                </div>
                <div>
                  14
                  <LatestProgress progress={20}>
                    <div />
                  </LatestProgress>
                </div>
                <div>
                  14
                  <LatestProgress progress={20}>
                    <div />
                  </LatestProgress>
                </div>
              </LatestTableRow>
            );
          })}
      </TabsTableRowsWrapper>
    </TableContent>
  );
};

export default MintingTable;
