/* eslint-disable */
import React, { FC } from "react";
import RedFlag from "../RedFlag";
import UserAvatar, { type AvatarVariants } from "../common/UserAvatar";
import {
  Investor,
  IPerson,
  ISocialMediaItem,
} from "../../../types/global_types";
import imageLoader from "../../../helpers/imageLoader";
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
  InvestorsWrapper,
  PercentText,
  RedFlagsWrapper,
  TitleText,
  TitleWrapper,
} from "./styles";
import StatusTag from "../StatusTag";
import Typography from "../common/Typography";
import { clarifyAmount } from "../../../helpers/clarifyAmount";
import { simplifyAmount } from "../../../helpers/simplifyAmount";
import SocialLinks from "../common/SocialLinks";
import Region from "../common/Region";
import { getServiceByUrl } from "../../../helpers/getServiceKeyByUrl";

export interface PersonCardInterface {
  avatar: string;
  name: string;
  rating?: number | string;
  status: "default" | "warn" | "success" | "none";
  variant: "default" | "warn";
  athRoi: number;
  redFlagsCount?: number;
  percentage?: number;
  className?: string;
}

const PersonCard: FC<IPerson> = ({
  _id,
  name,
  rating,
  fullness,
  logo,
  redFlagsList,
  banner,
  niche,
  socialmedia,
  regionData,
  athRoi,
  totalInvested,
  investmentsVariant = "amount",
}) => {
  const toFiniteNumber = (value: any): number | null => {
    const parsed = Number(
      typeof value === "string"
        ? value.replace(/[$,%\s]/g, "").replace(/,/g, "")
        : value
    );

    return Number.isFinite(parsed) ? parsed : null;
  };
  const getRatingVariant = (value: number): AvatarVariants => {
    if (value < 40) return "error";
    if (value < 70) return "warn";

    return "success";
  };
  const formatFullness = (value: number | null): string => {
    if (!value || value <= 0) return "-";

    return `${Math.round(value)}%`;
  };
  const formatAthRoi = (value: number | null): string => {
    if (!value || value === 0) return "-";

    return `${value.toFixed(2).replace(/\.00$/, "")}x`;
  };
  const ratingValue = toFiniteNumber(rating) || 0;
  const fullnessValue = toFiniteNumber(fullness);
  const athRoiValue = toFiniteNumber(athRoi);
  const totalInvestedValue = Number(
    typeof totalInvested === "string"
      ? totalInvested.replace(/[^0-9.-]/g, "")
      : totalInvested || 0
  );
  const investmentsDisplay =
    Number.isFinite(totalInvestedValue) && totalInvestedValue > 0
      ? investmentsVariant === "count"
        ? String(Math.round(totalInvestedValue))
        : `$${clarifyAmount(totalInvestedValue, true)}`
      : "-";

  return (
    <CardWrapper variant={"default"}>
      <HeaderWrapper>
        <UserAvatar
          size="medium"
          variant={getRatingVariant(ratingValue)}
          avatar={imageLoader(String(logo))}
          name={name}
          rating={Math.round(ratingValue)}
        />
        <HeaderInfoWrapper>
          <TitleWrapper>
            <TitleText variant="p">{name}</TitleText>
            <PercentText $score={fullnessValue}>
              {formatFullness(fullnessValue)}
            </PercentText>
            {redFlagsList?.length ? (
              <RedFlagsWrapper>
                <RedFlag count={Number(redFlagsList?.length)} />
              </RedFlagsWrapper>
            ) : (
              <></>
            )}
          </TitleWrapper>
          {banner ? (
            <HeaderTagWrapper>
              <Typography variant="p">{banner}</Typography>
            </HeaderTagWrapper>
          ) : (
            <></>
          )}
        </HeaderInfoWrapper>
      </HeaderWrapper>
      <BodyWrapper>
        <FooterItem variant="p">
          ATH ROI <br />{" "}
          <PercentText>{formatAthRoi(athRoiValue)}</PercentText>
        </FooterItem>
        <FooterItem variant="p">
          Specialization <br /> <span>{niche || "-"}</span>
        </FooterItem>
        <FooterItem variant="p">
          Investments <br />{" "}
          <span>{investmentsDisplay}</span>
        </FooterItem>
      </BodyWrapper>
      <Footer>
        <Region>
          {regionData ? `${regionData.id}, ${regionData.region}` : "-"}
        </Region>
        <SocialLinks
          className="gap-4"
          links={
            socialmedia?.map((item: ISocialMediaItem) => {
              return {
                key: getServiceByUrl(item.href),
                href: item.href,
              };
            }) || []
          }
        />
      </Footer>
    </CardWrapper>
  );
};

export default PersonCard;
