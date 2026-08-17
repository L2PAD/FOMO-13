/* eslint-disable */
import React, { FC, useState } from "react";
import {
  AllocSize,
  BodyWrapper,
  CardWrapper,
  DescriptionText,
  DescriptionWrapper,
  Footer,
  FooterItem,
  HeaderCircle,
  HeaderInfoWrapper,
  HeaderTagWrapper,
  HeaderWrapper,
  InvestorsImages,
  InvestorsText,
  InvestorsWrapper,
  PercentText,
  TitleText,
  TitleWrapper,
} from "../styles";
import RedFlag from "../../RedFlag";
import UserAvatar from "../../common/UserAvatar";
import Typography from "../../common/Typography";
import UsersRow from "../../UsersRow";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../helpers/clarifyDate";
import { useSelector } from "react-redux";
import { authState } from "../../../../store/slices/authSlice";
import ConnectWalletModal from "../../modals/ConnectWalletModal";
import Button from "../../common/Button";
import { IProject } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
import { Star } from "lucide-react";
import BuyNftModal from "../../modals/BuyModal";

export interface MarketCardInterface {
  userAvatar: string;
  userStatus: "default" | "warn" | "success" | "none";
  userName: string;
  userRating: number;
  variant: "default" | "warn";
  headerTag: string;
  title: string;
  percentage: number;
  description: string;
  investors: { avatar: string; name: string }[];
  redFlagsCount?: number;
  totalAmount: number;
  lastFundingDate: string;
  type: string;
  className?: string;
}

const MarketCard: FC<IProject> = ({
  logo,
  status,
  name,
  rating,
  banner,
  fullness,
  bio,
  investors,
  redFlags,
  lastFunding,
  niche,
  totalRaised,
  redStatus,
  type,
}) => {
  const [walletModal, setWalletModal] = useState(false);
  const [buyModal, setBuyModal] = useState(false);

  console.log("logo", name, rating, status, banner, fullness, bio, investors);

  return (
    <>
      <CardWrapper
        variant={"default"}
        className="market-card"
        gradientBorderType={
          status === "Upcoming"
            ? "upcoming"
            : status === "Active"
              ? "active"
              : undefined
        }
      >
        <HeaderWrapper className="market-card-header">
          <UserAvatar
            size="medium"
            variant={"default"}
            avatar={imageLoader(String(logo))}
            name={name}
            rating={Number(rating)}
            isSponsored
            customBorderColor={"#FFC702"}
          />
          <HeaderInfoWrapper className="market-header-info">
            <TitleWrapper>
              <TitleText variant="p">{name}</TitleText>
              <PercentText>0%</PercentText>
              <RedFlag count={redFlags?.length || 0} />
              <Star width={16} height={16} />
            </TitleWrapper>
            <DescriptionWrapper>
              <DescriptionText variant="p">
                {bio}
                <br />
                <br />
              </DescriptionText>
              <AllocSize>Alloc size: 0$</AllocSize>
            </DescriptionWrapper>
          </HeaderInfoWrapper>
        </HeaderWrapper>
        <BodyWrapper>
          <HeaderTagWrapper className="market-card-tag">
            <HeaderCircle />
            <Typography variant="p">{banner}</Typography>
          </HeaderTagWrapper>
          <InvestorsWrapper>
            <UsersRow users={[]} />
            <InvestorsText variant="p">
              Investors:
              <InvestorsImages>
                <UserAvatar
                  size="xSmall"
                  variant={"default"}
                  avatar={imageLoader("/71460.67482688709_Ellipse 1 (2).png")}
                  name={"ETH"}
                  className="investor-avatar"
                />
                <UserAvatar
                  size="xSmall"
                  variant={"default"}
                  avatar={imageLoader("/71460.67482688709_Ellipse 1 (2).png")}
                  name={"ETH"}
                  className="investor-avatar"
                />
                <UserAvatar
                  size="xSmall"
                  variant={"default"}
                  avatar={imageLoader("/71460.67482688709_Ellipse 1 (2).png")}
                  name={"ETH"}
                  className="investor-avatar"
                />{" "}
                <UserAvatar
                  size="xSmall"
                  variant={"default"}
                  avatar={imageLoader("/71460.67482688709_Ellipse 1 (2).png")}
                  name={"ETH"}
                  className="investor-avatar"
                />{" "}
                <UserAvatar
                  size="xSmall"
                  variant={"default"}
                  avatar={imageLoader("/71460.67482688709_Ellipse 1 (2).png")}
                  name={"ETH"}
                  className="investor-avatar"
                />
                <div className="badge">+80</div>
              </InvestorsImages>
            </InvestorsText>
          </InvestorsWrapper>
        </BodyWrapper>
        <Footer>
          <FooterItem variant="p">
            Total Raised: <br />{" "}
            <span>${clarifyAmount(Number(totalRaised) || 0)}</span>
          </FooterItem>{" "}
          <FooterItem variant="p">
            Type: <br /> <span>{type || "-"}</span>
          </FooterItem>
          <FooterItem variant="p">
            Last Funding: <br /> <span>{clarifyDate(String(lastFunding))}</span>
          </FooterItem>
        </Footer>
        <div className="buttons">
          {status === "Active" && (
            <Button variant="primary" onClick={() => setBuyModal(true)}>
              Buy now
            </Button>
          )}{" "}
          {status === "Upcoming" && (
            <Button
              variant="secondary"
              className="secondary"
              onClick={() => setWalletModal(true)}
            >
              Connect wallet
            </Button>
          )}
        </div>
      </CardWrapper>{" "}
      {walletModal && (
        <ConnectWalletModal
          onClose={() => {
            setWalletModal(false);
          }}
        />
      )}
      {buyModal && (
        <BuyNftModal
          onClose={() => {
            setBuyModal(false);
          }}
        />
      )}
    </>
  );
};

export default MarketCard;
