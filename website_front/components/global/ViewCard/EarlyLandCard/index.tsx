import React, { FC } from "react";
import RedFlag from "../../RedFlag";
import UserAvatar from "../../common/UserAvatar";
import StatusTag from "../../StatusTag";
import { CircleCheckIcon } from "../../Icons";
import { IProject } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
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
  TitleWrapper,
} from "../styles";

const EarlyLandCard: FC<IProject> = ({
  reward,
  type,
  isCompendium = false,
  maxParticipants,
  logo,
  status,
  name,
  rating,
  banner,
  fullness,
  redFlags,
  redStatus,
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
            {isCompendium && <CircleCheckIcon fill="rgba(4, 165, 132, 0.5)" />}
          </TitleWrapper>
          <DescriptionWrapper>
            <DescriptionText variant="p">{banner}</DescriptionText>
            <StatusTag variant={status} />
          </DescriptionWrapper>
        </HeaderInfoWrapper>
      </HeaderWrapper>
      <BodyWrapper>
        <InvestorsWrapper>
          <InvestorsText variant="p">
            {isCompendium ? (
              <>
                Progress: <span>{fullness || "0%"}</span>
              </>
            ) : (
              <>
                {/*//@ts-ignore*/}
                Max Participants:{" "}
                <span>
                  {Number(maxParticipants) > 0 ? maxParticipants : "No limit"}
                </span>
              </>
            )}
          </InvestorsText>
        </InvestorsWrapper>
        {redFlags?.length && redFlags?.length > 0 && (
          <RedFlag count={redFlags?.length} />
        )}
      </BodyWrapper>
      <Footer>
        <FooterItem variant="p">
          Activity Type: <br /> <span>-</span>
        </FooterItem>
        <FooterItem variant="p">
          Reward: <br /> <span>Unknown</span>
        </FooterItem>
        <FooterItem variant="p">
          Type: <br /> <span>{type || "-"}</span>
        </FooterItem>
      </Footer>
    </CardWrapper>
  );
};

export default EarlyLandCard;
