import React, { FC, useMemo, useState, MouseEvent, useEffect } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import bgImage from "../../../assets/images/nft-modal-bg.svg";
import { approveBox, BuyBox } from "../../../smart/initialSmartMain";
import { useConnectWallet } from "../../../hooks/useConnectWallet";
import {
  Title,
  Description,
  ModalWrapper,
  ModalBackground,
  ModalBody,
  InputsRow,
  InputWrapper,
  ButtonWrapper,
} from "./styles";

interface IProps {
  isVisible: boolean;
  onClose: () => void;
}

const BuyNftModal: FC<IProps> = ({ isVisible, onClose }) => {
  const { connectWallet } = useConnectWallet();
  const [isApprove, setIsApprove] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [quanity, setQuanity] = useState<string>("");

  const price: number = useMemo(() => {
    if (Number(quanity) === 3) return 270;

    return Number(quanity) * 100;
  }, [quanity]);

  const confirmApprove = async (): Promise<void> => {
    setIsDisabled(true);

    const isSuccess: boolean = await approveBox(price);

    setIsDisabled(false);
    setIsApprove(isSuccess);
  };

  const confirmBuy = async (): Promise<void> => {
    setIsDisabled(true);

    const isSuccess: boolean = await BuyBox(Number(quanity));

    setIsDisabled(false);

    if (isSuccess) {
      onClose();
      setIsApprove(false);
      setQuanity("");
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>You have successfully bought {quanity} nft!</p>
        </div>
      );
    }
  };

  const closeModalHandler = (e: any): void => {
    const { id } = e.target;
    if (id === "close-modal") {
      onClose();
      setQuanity("");
    }
  };

  useEffect(() => {
    if (isVisible) {
      connectWallet();
    }
  }, [isVisible]);

  return isVisible ? (
    <ModalWrapper id="close-modal" onClick={closeModalHandler}>
      <ModalBackground>
        <Image src={bgImage} alt="buy nft modal" />
        <ModalBody>
          <Title>Become part of FOMO</Title>
          <Description>
            Buy a piece of our NFT collection to become an important part of
            FOMO project. Our special offer for you:
            <br />
            Buying 3 NFT - 10% discount
          </Description>
          <Description>
            <br />
            One address can buy a maximum of 3 NFTs.
          </Description>
          <InputsRow>
            <InputWrapper>
              <label htmlFor="quanity-nft">Quantity [1-3]</label>
              <input
                disabled={isDisabled}
                value={quanity}
                onChange={(e) => {
                  const { value } = e.target;
                  if (Number(value) > 3) return;
                  setQuanity(value);
                }}
                type="number"
                id="quanity-nft"
              />
            </InputWrapper>
            <InputWrapper>
              <label htmlFor="price-nft">Price [USDC]</label>
              <span id="price-nft">{price || 0}</span>
            </InputWrapper>
          </InputsRow>
          <ButtonWrapper onClick={isApprove ? confirmBuy : confirmApprove}>
            {isApprove ? "Buy" : "Approve"}
          </ButtonWrapper>
        </ModalBody>
      </ModalBackground>
    </ModalWrapper>
  ) : (
    <></>
  );
};

export default BuyNftModal;
