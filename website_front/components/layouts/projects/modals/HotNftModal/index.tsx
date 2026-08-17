import React, { FC, useState } from "react";
import {
  TableContent,
  TableHeader,
  TabsTableProgress,
  TabsTableRowsWrapper,
  TabTableRowWrapper,
} from "../../Onchain/Tabs/Address/styles";
import { onchainPositiveData } from "../../../../../staticContent/projects/onchain";
import { simplifyAmount } from "../../../../../helpers/simplifyAmount";
import Pagination from "../../../../global/Pagintaion";
import { Wrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const HotNftModal: FC<Props> = ({ onClose }) => {
  const [page, setPage] = useState(1);
  return (
    <Wrapper title="Hot NFT`s" variant="medium" onClose={onClose}>
      <br />
      <TableContent>
        <TableHeader>
          <div>Nft collection</div>
          <div>Nft collection</div>
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
      <Pagination
        page={page}
        totalPage={20}
        onChange={(value) => setPage(value)}
      />
    </Wrapper>
  );
};

export default HotNftModal;
