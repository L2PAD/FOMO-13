import React from "react";
import { onchainNegativeData } from "../../../../../../staticContent/projects/onchain";
import { simplifyAmount } from "../../../../../../helpers/simplifyAmount";
import { TableContent } from "../Address/styles";
import {
  TableHeader,
  TabsTableProgress,
  TabsTableRowsWrapper,
  TabTableRowWrapper,
} from "./styles";

const OutflowTable = () => {
  return (
    <TableContent>
      <TableHeader>
        <div>Symbol</div>
        <div>Outdlow</div>
      </TableHeader>
      <TabsTableRowsWrapper>
        {onchainNegativeData.map((item, i) => {
          const percentage = item.value / (item.max / 100);
          return (
            <TabTableRowWrapper key={i}>
              <div>{item.name}</div>
              <div className="red">
                ${simplifyAmount(item.value)}
                <TabsTableProgress progress={percentage} right>
                  <div />
                </TabsTableProgress>
              </div>
            </TabTableRowWrapper>
          );
        })}
      </TabsTableRowsWrapper>
    </TableContent>
  );
};

export default OutflowTable;
