import React, { FC, useState } from "react";
import {
  TableHeader,
  TableRowsWrapper,
  TableRowWrapper,
} from "../../Onchain/Visualize/styles";
import { CardsTableContent } from "../../Onchain/Tabs/Address/styles";
import Pagination from "../../../../global/Pagintaion";
import { Wrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const VisualizeModal: FC<Props> = ({ onClose }) => {
  const [page, setPage] = useState(1);
  return (
    <Wrapper title="Visualize" variant="medium" onClose={onClose}>
      <br />
      <CardsTableContent>
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
      </CardsTableContent>
      <Pagination
        page={page}
        totalPage={20}
        onChange={(value) => setPage(value)}
      />
    </Wrapper>
  );
};

export default VisualizeModal;
