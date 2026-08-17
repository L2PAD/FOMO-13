import React, { FC } from "react";
import * as S from "./styles";

interface IProps {
  nft: any;
}

const ApproveCollection: FC<IProps> = ({ nft }) => {
  return (
    <S.ApproveNft>
      <S.ApproveNftWrapper>
        <S.ApproveNftImg src={nft.image} alt="nft-img" />
        <S.ApproveNftInfo>
          <S.ApproveNftTitle>{nft.name}</S.ApproveNftTitle>
          <S.ApproveNftDescription>{nft.type}</S.ApproveNftDescription>
        </S.ApproveNftInfo>
      </S.ApproveNftWrapper>
      <S.ApproveNftText>
        <span>Go to your wallet</span>
        <div>
          You'll be asked to approve this collection from your wallet. You only
          need to approve each collection once.
        </div>
      </S.ApproveNftText>
    </S.ApproveNft>
  );
};

export default ApproveCollection;
