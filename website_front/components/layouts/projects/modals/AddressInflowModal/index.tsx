import React, { FC, useState } from "react";
import {
  TableContent,
  TableHeader,
  TabsTableProgress,
  TabsTableRowsWrapper,
  TabTableRowWrapper,
} from "../../Onchain/Tabs/Address/styles";
import {
  onchainNegativeData,
  onchainPositiveData,
} from "../../../../../staticContent/projects/onchain";
import { simplifyAmount } from "../../../../../helpers/simplifyAmount";
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
        <TableHeader>
          <div>{activeTab === "Hot contracts" ? "Name" : "Symbol"}</div>
          <div>
            {activeTab === "Holdings" ? "Change (1d)" : ""}
            {activeTab === "Hot contracts" ? "Depositors" : ""}
            {activeTab === "Inflow" ? "Inflow" : ""}
            {activeTab === "Outflow" ? "Outflow" : ""}
          </div>
        </TableHeader>
        <TabsTableRowsWrapper>
          {(activeTab === "Outflow"
            ? onchainNegativeData
            : onchainPositiveData
          ).map((item, i) => {
            const percentage = item.value / (item.max / 100);
            return (
              <TabTableRowWrapper key={i}>
                <div>{item.name}</div>
                <div className={activeTab === "Outflow" ? "red" : ""}>
                  ${simplifyAmount(item.value)}
                  <TabsTableProgress
                    progress={percentage}
                    right={activeTab === "Outflow"}
                  >
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

export default AddressInflowModal;
