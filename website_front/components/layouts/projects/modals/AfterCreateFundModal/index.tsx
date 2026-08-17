import React, { FC } from "react";
import Modal from "../../../../global/common/Modal";
import { CoinsIcon } from "../../../../global/Icons";
import { Description, SubmitButton, Title, Wrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const AfterCreateFundModal: FC<Props> = ({ onClose }) => {
  return (
    <Modal variant="small-medium" title="" onClose={onClose}>
      <Wrapper>
        <Title>Thank you for filling in the information</Title>
        <Description>
          You get <CoinsIcon /> 10 points for your help
        </Description>
        <SubmitButton
          onClick={() => {
            onClose();
          }}
        >
          OK
        </SubmitButton>
      </Wrapper>
    </Modal>
  );
};

export default AfterCreateFundModal;
