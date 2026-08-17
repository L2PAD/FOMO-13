import React from "react";
import Link from "next/link";
import Image from "next/image";
import nft from "../../../public/static/nft_card.png";
import {
  DescriptionWrapper,
  ImageTagWrapper,
  ImageWrapper,
  NumberTag,
  PriceWrapper,
  Tag,
  TagCircle,
  Title,
  Wrapper,
} from "./styles";

const NFTCard = () => {
  return (
    <Wrapper variant="default">
      <ImageWrapper>
        <ImageTagWrapper>
          <TagCircle />
          <Tag>RARE</Tag>
        </ImageTagWrapper>
        <Image width={100} height={100} src={nft.src} alt="SharkRace Club" />
        {/*<HiddenImage />*/}
        <NumberTag>#7003</NumberTag>
      </ImageWrapper>
      <DescriptionWrapper>
        <Title variant="p">SharkRace Club</Title>
        <PriceWrapper>
          <span>1.004 ETH</span>
          <Link href="/nfts/card/234">Details {">"}</Link>
        </PriceWrapper>
      </DescriptionWrapper>
      {/*<HiddenContent>*/}
      {/*    ?*/}
      {/*</HiddenContent>*/}
    </Wrapper>
  );
};

export default NFTCard;
