import React, { FC } from "react";
import { Body, Header, Row, Wrapper } from "./styles";
import UserAvatar from "../../../../../../global/common/UserAvatar";
import { ICollectionNft } from "../../../../../../../types/global_types";
import imageLoader from "../../../../../../../helpers/imageLoader";

export function formatWalletAddress(
  wallet: string,
  length: number = 6
): string {
  if (wallet.length <= length * 2) {
    return wallet;
  }
  return `${wallet.slice(0, length)}...${wallet.slice(-length)}`;
}

const Info: FC<{ nftData: ICollectionNft | any }> = ({ nftData }) => {
  return (
    <Wrapper variant="default">
      <Header>
        <h3>Creator</h3>
        <div>
          <UserAvatar
            size="xSmall"
            avatar={
              nftData?.owner?.photo
                ? imageLoader(nftData?.owner?.photo)
                : nftData?.owner?.twitterData?.photo
            }
            name={nftData.name}
            variant="default"
          />
          <p>{nftData?.owner?.username || nftData?.owner?.twitterData?.name}</p>
        </div>
      </Header>
      <Body>
        <Row>
          <b>Contact address</b>
          <p>{formatWalletAddress(String(nftData.collection?.smart))}</p>
        </Row>
        <Row>
          <b>Token ID</b>
          <p>{nftData?.name?.split("#")[1] || 0}</p>
        </Row>
        <Row>
          <b>Token standart</b>
          <p>{nftData.collection?.tokenStandart}</p>
        </Row>
        <Row>
          <b>Blockchain</b>
          <p>{nftData.collection?.project?.blockchain || "-"}</p>
        </Row>
      </Body>
    </Wrapper>
  );
};

export default Info;
