import React from "react";
import { onchainPositiveData } from "../../../../../../staticContent/projects/onchain";
import { simplifyAmount } from "../../../../../../helpers/simplifyAmount";
import { TableContent } from "../Address/styles";
import {
  TableHeader,
  TabsTableProgress,
  TabsTableRowsWrapper,
  TabTableRowWrapper,
} from "./styles";

const InflowTable = () => {
  return (
    <TableContent>
      <TableHeader>
        <div>Symbol</div>
        <div>Inflow</div>
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
    </TableContent>
  );
};

export default InflowTable;
