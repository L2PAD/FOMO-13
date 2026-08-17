import React, { FC } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { connectWallet } from "../../../../store/slices/authSlice";
import walletError from "../../../../public/static/main/wallet-error.png";
import Button from "../../common/Button";
import { ButtonWrapper, Buttons, ImageContentWrapper } from "./styles";

interface Props {
  onClose: () => void;
  setContent: (content: string) => void;
}

const ErrorWalletConnect: FC<Props> = ({ onClose, setContent }) => {
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
      <Buttons>
        <Button
          variant="primary"
          className="success-button"
          onClick={() => setContent("zkSync")}
        >
          Ok, continue
        </Button>
        <Button
          variant="primary"
          className="success-button"
          onClick={() => {
            onClose();
            dispatch(connectWallet());
          }}
        >
          Buy NFT
        </Button>
      </Buttons>
    </>
  );
};

export default ErrorWalletConnect;
