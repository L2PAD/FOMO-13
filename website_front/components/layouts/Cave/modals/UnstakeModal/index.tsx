import React, { FC } from "react";
import ProjectTable from "../../../../global/Tables/RewardsTable";
import { ModalWrapper, SubmitButton, TableWrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const UnStakeModal: FC<Props> = ({ onClose }) => {
  return (
    <ModalWrapper title="Unstaking" onClose={onClose} variant="big">
      <TableWrapper>
        <ProjectTable />
        <SubmitButton>Claim all</SubmitButton>
      </TableWrapper>
    </ModalWrapper>
  );
};

export default UnStakeModal;
