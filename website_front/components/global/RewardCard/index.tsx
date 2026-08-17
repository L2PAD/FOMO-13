import React, { FC } from "react";
import {
  DescriptionWrapper,
  HiddenImage,
  ImageWrapper,
  PriceWrapper,
  Title,
  Wrapper,
} from "./styles";

interface Props {
  onCross: () => void;
}

const RewardCard: FC<Props> = ({ onCross }) => {
  return (
    <Wrapper variant="default">
      <ImageWrapper>
        {/*<Image width={100} height={100} src={nft.src} alt="SharkRace Club"/>*/}
        <HiddenImage />
      </ImageWrapper>
      <DescriptionWrapper>
        <Title variant="p">SharkRace Club</Title>
        <PriceWrapper>
          <button>Claim</button>
          <button onClick={onCross}>Cross</button>
        </PriceWrapper>
      </DescriptionWrapper>
      {/*<HiddenContent>*/}
      {/*    ?*/}
      {/*</HiddenContent>*/}
    </Wrapper>
  );
};

export default RewardCard;
