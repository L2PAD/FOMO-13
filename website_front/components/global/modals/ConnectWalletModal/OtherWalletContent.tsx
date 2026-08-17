/* eslint-disable */
import React, { FC } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { connectWallet } from "../../../../store/slices/authSlice";
import walletError from "../../../../public/static/main/wallet-error.png";
import Button from "../../common/Button";
import { ButtonWrapper, ImageContentWrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const OtherWalletContent: FC<Props> = ({ onClose }) => {
  const dispatch = useDispatch();

  return (
    <>
      <ButtonWrapper variant="error">
        <ImageContentWrapper>
          <Image
            width={124}
            height={107}
            src={walletError.src}
            alt="Wallet error"
          />
          <p>You don&apos;t have a FOMO NFT!</p>
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
        Buy on FOMO
      </Button>
    </>
  );
};

export default OtherWalletContent;
