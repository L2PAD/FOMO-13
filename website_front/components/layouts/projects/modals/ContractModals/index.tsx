import React, { FC, useState } from "react";
import {
  TableContent,
  TabsTableRowsWrapper,
} from "../../Onchain/Tabs/Address/styles";
import {
  RollupTableHeaderWrapper,
  RollupTableRowWrapper,
} from "../../Onchain/Tabs/Contract/styles";
import Pagination from "../../../../global/Pagintaion";
import { Wrapper } from "./styles";

interface Props {
  onClose: () => void;
  activeTab: string;
}

const AddressInflowModal: FC<Props> = ({ onClose, activeTab }) => {
  const [page, setPage] = useState(1);
  return (
    <Wrapper title={activeTab} variant="medium" onClose={onClose}>
      <br />
      <TableContent>
        <RollupTableHeaderWrapper>
          <div>Date</div>
          <div>Rollup TX</div>
          <div>Since last Rollup</div>
          <div>Gas fee</div>
        </RollupTableHeaderWrapper>
        <TabsTableRowsWrapper>
          {Array(8)
            .fill("")
            .map((item, i) => {
              return (
                <RollupTableRowWrapper key={i + item}>
                  <div>06.06.2022</div>
                  <div>
                    <a href="components/layouts/projects/Onchain/Tabs/Contract#">
                      0c0g46d4g6d4g6fd4g6dfg5fdg65dfg654df65g4df6g5df
                    </a>
                  </div>
                  <div>00:21:15</div>
                  <div>.0075</div>
                </RollupTableRowWrapper>
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

export default AddressInflowModal;
