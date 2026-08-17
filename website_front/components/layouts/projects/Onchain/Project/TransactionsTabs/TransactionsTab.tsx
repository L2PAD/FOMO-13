import React from "react";
import {
  CardsTableContent,
  CardWrapper,
  TransactionsCardsWrapper,
  TransactionsTableHeader,
  TransactionsTableRow,
} from "../../Tabs/Address/styles";
import Filter from "../../../../../global/Filter";
import { TableFilterWrapper } from "../styles";

const TransactionsTab = () => {
  return (
    <>
      <TableFilterWrapper>
        <Filter />
      </TableFilterWrapper>
      <CardWrapper variant="default">
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
      </CardWrapper>
    </>
  );
};

export default TransactionsTab;
