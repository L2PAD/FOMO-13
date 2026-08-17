import React from "react";
import { TableContent } from "../Address/styles";
import {
  LatestProgress,
  LatestTableHeader,
  LatestTableRow,
  TabsTableRowsWrapper,
} from "./styles";

const LatestTable = () => {
  return (
    <TableContent>
      <LatestTableHeader>
        <div>NFT collection</div>
        <div>Minters</div>
        <div>Smart minters</div>
        <div>Mint volume (ETH)</div>
        <div>Total gas (ETH)</div>
        <div>First mint</div>
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
                <div>
                  14
                  <LatestProgress progress={20}>
                    <div />
                  </LatestProgress>
                </div>
                <div>14h ago</div>
              </LatestTableRow>
            );
          })}
      </TabsTableRowsWrapper>
    </TableContent>
  );
};

export default LatestTable;
