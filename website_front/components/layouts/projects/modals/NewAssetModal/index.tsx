import React, { FC } from "react";
import { ArrowRightIcon } from "../../../../global/Icons";
import {
  SubmitButton,
  ThemeWrapper,
} from "../../../../global/modals/SupportModal/styles";
import { HeaderWrapper, ModalWrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const NewAssetModal: FC<Props> = ({ onClose }) => {
  return (
    <ModalWrapper title="" onClose={onClose} variant="small">
      <HeaderWrapper>
        <button onClick={onClose}>
          <ArrowRightIcon fill="rgba(115, 128, 148, 0.5)" />
        </button>
        <p>New asset</p>
      </HeaderWrapper>
      <ThemeWrapper style={{ marginTop: 16 }}>
        <p>Name of asset</p>
        <input type="text" />
      </ThemeWrapper>
      <SubmitButton onClick={onClose}>Save</SubmitButton>
    </ModalWrapper>
  );
};

export default NewAssetModal;
