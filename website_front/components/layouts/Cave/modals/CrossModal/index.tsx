import React, { FC } from "react";
import {
  DescriptionWrapper,
  HiddenImage,
  ImageWrapper,
  PriceWrapper,
  Title,
} from "../../../../global/RewardCard/styles";
import { CloseIcon } from "../../../../global/Icons";
import {
  CardWrapper,
  ContentWrapper,
  MiddleIcon,
  ModalWrapper,
  SubmitButton,
} from "./styles";

interface Props {
  onClose: () => void;
}

const CrossModal: FC<Props> = ({ onClose }) => {
  return (
    <ModalWrapper title="Stake BEED" onClose={onClose} variant="small">
      <ContentWrapper>
        <CardWrapper variant="default">
          <ImageWrapper>
            {/*<Image width={100} height={100} src={nft.src} alt="SharkRace Club"/>*/}
            <HiddenImage />
          </ImageWrapper>
          <DescriptionWrapper>
            <Title variant="p">SharkRace Club</Title>
            <PriceWrapper>
              <button>Claim</button>
              <button>Cross</button>
            </PriceWrapper>
          </DescriptionWrapper>
        </CardWrapper>
        <CardWrapper variant="default">
          <ImageWrapper>
            {/*<Image width={100} height={100} src={nft.src} alt="SharkRace Club"/>*/}
            <HiddenImage />
          </ImageWrapper>
          <DescriptionWrapper>
            <Title variant="p">SharkRace Club</Title>
            <PriceWrapper>
              <button>Claim</button>
              <button>Cross</button>
            </PriceWrapper>
          </DescriptionWrapper>
        </CardWrapper>
        <MiddleIcon>
          <CloseIcon fill="rgba(115, 128, 148, 0.5)" />
        </MiddleIcon>
      </ContentWrapper>
      <SubmitButton>Cross NFT</SubmitButton>
    </ModalWrapper>
  );
};

export default CrossModal;
