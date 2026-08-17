import React, { FC } from "react";
import {
  BodyWrapper,
  CardWrapper,
  DescriptionText,
  DescriptionWrapper,
  Footer,
  FooterItem,
  HeaderInfoWrapper,
  HeaderPrice,
  HeaderTagWrapper,
  HeaderWrapper,
  InvestorsText,
  InvestorsWrapper,
  PercentText,
  TitleText,
  TitleWrapper,
} from "../styles";
import RedFlag from "../../RedFlag";
import UserAvatar from "../../common/UserAvatar";
import StatusTag from "../../StatusTag";
import UsersRow from "../../UsersRow";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../helpers/clarifyDate";

export interface GemsLabCardInterface {
  userAvatar: string;
  userStatus: "default" | "warn" | "success" | "none";
  userName: string;
  userRating: number;
  variant: "default" | "warn";
  status: "upcoming" | "ended" | "active";
  title: string;
  percentage: number;
  description: string;
  investors: { avatar: string; name: string }[];
  redFlagsCount?: number;
  totalAmount: number;
  lastFundingDate: string;
  type: string;
  className?: string;
  price: number;
  priceCurrency: number;
}

const GemsLabCard: FC<GemsLabCardInterface> = ({
  userAvatar,
  userStatus,
  userName,
  userRating,
  variant,
  status,
  title,
  percentage,
  description,
  investors,
  redFlagsCount,
  totalAmount,
  lastFundingDate,
  type,
  className,
  price,
  priceCurrency,
}) => {
  return (
    <CardWrapper variant={variant} className={className}>
      <HeaderWrapper>
        <UserAvatar
          size="medium"
          variant={userStatus}
          avatar={userAvatar}
          name={userName}
          rating={userRating}
        />
        <HeaderInfoWrapper>
          <HeaderTagWrapper>
            <HeaderPrice variant="p">
              <span>Price:</span> {priceCurrency} ETH (${price})
            </HeaderPrice>
          </HeaderTagWrapper>
          <TitleWrapper>
            <TitleText variant="p">{title}</TitleText>
            <PercentText>{percentage.toFixed(0)}%</PercentText>
          </TitleWrapper>
          <DescriptionWrapper>
            <DescriptionText variant="p">{description}</DescriptionText>
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
              {investors.length} {investors.length > 1 ? "persons" : "person"}
            </span>
          </InvestorsText>
        </InvestorsWrapper>
        {(redFlagsCount || 0) > 0 && <RedFlag count={redFlagsCount} />}
      </BodyWrapper>
      <Footer>
        <FooterItem variant="p">
          Total Raised: <br /> <span>${clarifyAmount(totalAmount)}</span>
        </FooterItem>
        <FooterItem variant="p">
          Last Funding: <br /> <span>{clarifyDate(lastFundingDate)}</span>
        </FooterItem>
        <FooterItem variant="p">
          Type: <br /> <span>{type}</span>
        </FooterItem>
      </Footer>
    </CardWrapper>
  );
};

export default GemsLabCard;
