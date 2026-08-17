/* eslint-disable */
import React, { FC } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { LinkIcon } from "../../Icons";
import { connectWallet } from "../../../../store/slices/authSlice";
import metamask from "../../../../public/static/main/metamask.png";
import Button from "../../common/Button";
import { ButtonWrapper, ImageContentWrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const ConnectedMetamaskModal: FC<Props> = ({ onClose }) => {
  const dispatch = useDispatch();

  return (
    <>
      <ButtonWrapper variant="success">
        <ImageContentWrapper>
          <Image width={124} height={107} src={metamask.src} alt="Metamask" />
          <p>Connected!</p>
          <span>
            0xC03...D4A82
            <LinkIcon fill="#777777E8" />
          </span>
        </ImageContentWrapper>
      </ButtonWrapper>
      <Button
        variant="primary"
        className="success-button"
        onClick={() => {
          onClose();
          dispatch(connectWallet());
        }}
      >
        Sign Message
      </Button>
    </>
  );
};

export default ConnectedMetamaskModal;
