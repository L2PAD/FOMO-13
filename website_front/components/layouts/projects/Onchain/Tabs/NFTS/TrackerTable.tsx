import React from "react";
import { TableContent } from "../Address/styles";
import {
  LatestProgress,
  TabsTableRowsWrapper,
  TrackerTableHeader,
  TrackerTableRow,
} from "./styles";

const TrackerTable = () => {
  return (
    <TableContent>
      <TrackerTableHeader>
        <div>Name</div>
        <div>Type</div>
        <div>Quantity</div>
        <div>NFT Collection</div>
        <div>ID</div>
        <div>Value (ETH)</div>
        <div>Gas (ETH)</div>
        <div>Time</div>
      </TrackerTableHeader>
      <TabsTableRowsWrapper>
        {Array(8)
          .fill("")
          .map((item, i) => {
            return (
              <TrackerTableRow key={i}>
                <div>Name</div>
                <div>Sell</div>
                <div>1</div>
                <div>Name</div>
                <div>13213</div>
                <div>
                  3.96
                  <LatestProgress progress={20}>
                    <div />
                  </LatestProgress>
                </div>
                <div>.0075</div>
                <div>15m ago</div>
              </TrackerTableRow>
            );
          })}
      </TabsTableRowsWrapper>
    </TableContent>
  );
};

export default TrackerTable;
