import React, { FC } from "react";
import {
  BodyWrapper,
  CardWrapper,
  DescriptionText,
  DescriptionWrapper,
  Footer,
  FooterItem,
  FullTitle,
  HeaderInfoWrapper,
  HeaderWrapper,
  InvestorsText,
  InvestorsWrapper,
  ResultItem,
  ResultWrapper,
  TitleWrapper,
} from "../styles";
import RedFlag from "../../RedFlag";
import UserAvatar from "../../common/UserAvatar";
import StatusTag from "../../StatusTag";
import UsersRow from "../../UsersRow";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { INft } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";

const NFTCard: FC<INft> = ({
  logo,
  status,
  name,
  rating,
  banner,
  fullness,
  investors,
  redFlags,
  lastFunding,
  niche,
  totalRaised,
  redStatus,
  type,
  floorPrice,
  items,
  owners,
}) => {
  return (
    <CardWrapper variant={redStatus ? "warn" : "default"}>
      <HeaderWrapper>
        <UserAvatar
          size="medium"
          variant={redStatus ? "warn" : "default"}
          avatar={imageLoader(String(logo))}
          name={name}
          rating={Number(rating)}
        />
        <HeaderInfoWrapper>
          <TitleWrapper>
            <FullTitle variant="p">{name}</FullTitle>
          </TitleWrapper>
          <DescriptionWrapper>
            <DescriptionText variant="p">{banner}</DescriptionText>
            <StatusTag variant={status} />
          </DescriptionWrapper>
        </HeaderInfoWrapper>
      </HeaderWrapper>
      <BodyWrapper>
        <InvestorsWrapper>
          <UsersRow users={[]} />
          <InvestorsText variant="p">
            Total:{" "}
            <span>
              {investors?.length || "0"}{" "}
              {investors?.length || 0 > 1 ? "persons" : "person"}{" "}
            </span>
          </InvestorsText>
        </InvestorsWrapper>
        {redFlags?.length && redFlags?.length > 0 && (
          <RedFlag count={redFlags?.length} />
        )}
      </BodyWrapper>
      <Footer>
        <FooterItem variant="p">
          Type: <br /> <span>{type || "-"}</span>
        </FooterItem>
        <FooterItem variant="p">
          Floor price: <br />{" "}
          <span>{floorPrice ? clarifyAmount(Number(floorPrice)) : "-"}</span>
        </FooterItem>
        <FooterItem variant="p">
          Items: <br /> <span>{items || "-"}</span>
        </FooterItem>
        <FooterItem variant="p">
          Owners: <br /> <span>{owners || "-"}</span>
        </FooterItem>
      </Footer>
      {status === "ended" && (
        <ResultWrapper>
          <ResultItem variant="p" amount={0}>
            USD <span>{0}x</span>
          </ResultItem>
          <ResultItem variant="p" amount={0}>
            BTC <span>{0}x</span>
          </ResultItem>
          <ResultItem variant="p" amount={0}>
            ETH <span>{0}x</span>
          </ResultItem>
        </ResultWrapper>
      )}
    </CardWrapper>
  );
};

export default NFTCard;
