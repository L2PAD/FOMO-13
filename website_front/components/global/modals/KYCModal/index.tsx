import React, { FC } from "react";
import Modal from "../../common/Modal";
import {
  Description,
  FooterWrapper,
  SubmitButton,
  ThemeWrapper,
} from "./styles";

interface Props {
  onClose: () => void;
}

const KYCModal: FC<Props> = ({ onClose }) => {
  return (
    <Modal onClose={onClose} title="KYC (email)">
      <Description>
        Сonsectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
        et dolore magna
      </Description>
      <ThemeWrapper>
        <p>Email</p>
        <input type="text" />
      </ThemeWrapper>
      <FooterWrapper>
        <p>KYC</p>
        <span>Coming soon</span>
      </FooterWrapper>
      <SubmitButton>Save</SubmitButton>
    </Modal>
  );
};

export default KYCModal;
