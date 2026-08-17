import React from "react";
import {
  TableContent,
  TableHeader,
  TableRowsWrapper,
  TableRowWrapper,
  TableWrapper,
} from "./styles";

const TransactionsTab = () => {
  return (
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
      </TableContent>
    </TableWrapper>
  );
};

export default TransactionsTab;
