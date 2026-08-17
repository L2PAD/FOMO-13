import React, { FC, useState } from "react";
import {
  CardsTableContent,
  TransactionsCardsWrapper,
  TransactionsTableHeader,
  TransactionsTableRow,
} from "../../Onchain/Tabs/Address/styles";
import Pagination from "../../../../global/Pagintaion";
import { Wrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const FilterTransactionsModal: FC<Props> = ({ onClose }) => {
  const [page, setPage] = useState(1);
  return (
    <Wrapper title="Filter for transactions" variant="medium" onClose={onClose}>
      <br />
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
      <Pagination
        page={page}
        totalPage={20}
        onChange={(value) => setPage(value)}
      />
    </Wrapper>
  );
};

export default FilterTransactionsModal;
