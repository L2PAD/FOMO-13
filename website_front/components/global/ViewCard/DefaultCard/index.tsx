/* eslint-disable */
import React, { FC } from "react";
import styled from "styled-components";
import {
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
  InvestorsText,
  InvestorsWrapper,
  PercentText,
  RedFlagsWrapper,
  RefundWrapper,
  ResultItem,
  ResultWrapper,
  TitleText,
  TitleWrapper,
} from "../styles";
import RedFlag from "../../RedFlag";
import UserAvatar, { AvatarVariants } from "../../common/UserAvatar";
import Typography from "../../common/Typography";
import StatusTag from "../../StatusTag";
import UsersRow from "../../UsersRow";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../helpers/clarifyDate";
import { IProject } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
import { StarIcon } from "components/global/Icons";
import HighlightedText from "../../HighlightedText";

export interface DefaultCardInterface {
  userAvatar: string;
  userStatus: "default" | "warn" | "success" | "none";
  userName: string;
  userRating: number;
  variant: "default" | "warn";
  headerTag: string;
  status: "Upcoming" | "Ended" | "Active";
  title: string;
  percentage: number;
  description: string;
  investors: { avatar: string; name: string }[];
  redFlagsCount?: number;
  totalAmount: number;
  lastFunding: string;
  type: string;
  className?: string;
  usd?: number;
  btc?: number;
  eth?: number;
}

const isMissingValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "number") {
    return value === 0 || Number.isNaN(value);
  }

  if (typeof value === "string") {
    return value.trim() === "" || value.trim() === "0";
  }

  return value === null || value === undefined;
};

const getDisplayValue = (value: unknown) =>
  isMissingValue(value) ? "--" : String(value);

const getDisplayText = (value: unknown) => {
  if (isMissingValue(value)) return "--";

  if (typeof value === "object") {
    const textValue = value as { name?: unknown; title?: unknown; label?: unknown };

    return getDisplayValue(textValue.name || textValue.title || textValue.label);
  }

  return String(value);
};

const cleanDescriptionValue = (...values: Array<unknown>) => {
  for (const value of values) {
    if (isMissingValue(value)) continue;

    const text = Array.isArray(value) ? value.join(" ") : String(value);
    const normalized = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (normalized) return normalized;
  }

  return "";
};

const getRatingVariant = (rating: number): AvatarVariants => {
  if (rating < 50) return "error";
  if (rating < 70) return "warn";

  return "success";
};

const CompactTitleText = styled(TitleText)`
  font-size: 18px;
  line-height: 26px;
`;

const FavoriteButton = styled.button`
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  line-height: 0;
  cursor: pointer;
`;

type DefaultCardProps = IProject & {
  className?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  searchValue?: string;
};

const DefaultCard: FC<DefaultCardProps> = ({
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
  isRefunded,
  redFlagsList,
  type,
  isSponsored,
  mainCategory,
  description,
  descriptionText,
  overviewText,
  rawIcoData,
  source,
  isFavorite = false,
  onToggleFavorite,
  searchValue = "",
}) => {
  const normalizedInvestors = Array.isArray(investors) ? investors : [];
  const numericRating = Number(rating) || 1;
  const ratingVariant = getRatingVariant(numericRating);
  const statusVariant = !isMissingValue(status)
    ? String(status).toLowerCase()
    : null;
  const formattedLastFunding = !isMissingValue(lastFunding)
    ? clarifyDate(String(lastFunding))
    : "--";
  const lastFundingValue =
    formattedLastFunding === "Invalid date" ? "--" : formattedLastFunding;
  const totalRaisedValue = isMissingValue(totalRaised)
    ? "--"
    : `$${clarifyAmount(Number(totalRaised))}`;
  const typeValue = getDisplayText(!isMissingValue(type)
    ? type
    : !isMissingValue(mainCategory?.name)
      ? mainCategory?.name
      : "--");
  const mainCategoryValue = getDisplayText(mainCategory);
  const isIcoProject =
    source === "icodrops" ||
    !isMissingValue(rawIcoData?.shortDescription);
  const headerTagValue = isIcoProject
    ? cleanDescriptionValue(
      descriptionText,
      overviewText,
      description,
      rawIcoData?.fullDescription,
      rawIcoData?.shortDescription,
      bio,
      banner
    )
    : banner;
  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleFavorite?.();
  };
  const highlight = (value: unknown) => (
    <HighlightedText
      text={getDisplayText(value)}
      searchValue={searchValue}
      highlightAll
    />
  );

  return (
    <CardWrapper variant={redStatus ? "warn" : "default"}>
      <HeaderWrapper>
        <UserAvatar
          size="medium"
          variant={ratingVariant}
          avatar={imageLoader(String(logo))}
          name={getDisplayValue(name)}
          rating={numericRating}
          isSponsored={!!isSponsored}
        />
        <HeaderInfoWrapper>
          <TitleWrapper>
            <CompactTitleText variant="p">{highlight(name)}</CompactTitleText>
            <PercentText>{highlight(fullness)}</PercentText>
            {redFlagsList?.length ? (
              <RedFlagsWrapper>
                <RedFlag count={Number(redFlagsList?.length)} />
              </RedFlagsWrapper>
            ) : (
              <></>
            )}
            <FavoriteButton
              type="button"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={handleFavoriteClick}
            >
              {isFavorite ? (
                <StarIcon fill="#FFC702" />
              ) : (
                <StarIcon variant="outlined" fill="black" />
              )}
            </FavoriteButton>
          </TitleWrapper>
          <DescriptionWrapper>
            <DescriptionText variant="p">{highlight(mainCategoryValue)}</DescriptionText>
            {statusVariant ? (
              <StatusTag variant={statusVariant} />
            ) : (
              <DescriptionText variant="p">--</DescriptionText>
            )}
          </DescriptionWrapper>
        </HeaderInfoWrapper>
      </HeaderWrapper>

      <BodyWrapper>
        <HeaderTagWrapper className={isIcoProject ? "ico-description-tag" : ""}>
          {!isMissingValue(headerTagValue) ? <HeaderCircle /> : null}
          <Typography variant="p">{highlight(headerTagValue)}</Typography>
        </HeaderTagWrapper>
        <InvestorsWrapper>
          <span>Investors:</span>
          {isMissingValue(normalizedInvestors) ? (
            <Typography variant="p">--</Typography>
          ) : (
            <UsersRow users={normalizedInvestors} />
          )}
        </InvestorsWrapper>
      </BodyWrapper>
      <Footer>
        <FooterItem variant="p">
          Total Raised: <br />{" "}
          <span>{highlight(totalRaisedValue)}</span>
        </FooterItem>
        <FooterItem variant="p">
          Type: <br /> <span>{highlight(typeValue)}</span>
        </FooterItem>
        <FooterItem variant="p">
          Last Funding: <br /> <span>{highlight(lastFundingValue)}</span>
        </FooterItem>
      </Footer>
      {/* {status === 'Ended' && <ResultWrapper>
                <ResultItem
                    variant='p'
                    amount={0}
                >
                    USD <span>{0}x</span>
                </ResultItem>
                <ResultItem
                    variant='p'
                    amount={0}
                >
                    BTC <span>{0}x</span>
                </ResultItem>
                <ResultItem
                    variant='p'
                    amount={0}
                >
                    ETH <span>{0}x</span>
                </ResultItem>
            </ResultWrapper>} */}
      {isRefunded ? <RefundWrapper>REFUNDED</RefundWrapper> : <></>}
    </CardWrapper>
  );
};

export default DefaultCard;
