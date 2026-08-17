import React, { useState } from "react";
import moment from "moment/moment";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  ContentWrapper,
  FactRow,
  FactsTitle,
  FactsWrapper,
  HeaderCopyKey,
  HeaderDataText,
  HeaderDataTextWrapper,
  HeaderDescription,
  HeaderDescriptionItemsTitle,
  HeaderDescriptionItemsWrapper,
  HeaderPersonDescription,
  HeaderPersonNameWrapper,
  HeaderPersonTitle,
  HeaderUsersRow,
  HeaderUserWrapper,
  HeaderWrapper,
  LeftHeaderPersonInfoWrapper,
  LeftHeaderWrapper,
  PageWrapper,
  PersonPriceWrapper,
  PrimaryButton,
  ProgressWrapper,
  ProjectContentDescription,
  ProjectContentWrapper,
  ProjectDescriptionActionsWrapper,
  PublicWrapper,
  RangeDescription,
  RangeDescriptionWrapper,
  RangeTitle,
  RangeValue,
  RangeWrapper,
  RatingCircleWrapper,
  RightHeaderHead,
  RightHeaderWrapper,
  RoundDescription,
  RoundsWrapper,
  RoundTimerTitle,
  RoundTimerValue,
  RoundTimerWrapper,
  RoundTitle,
  SecondaryButton,
  StrongWrapper,
} from "../Project/styles";
import {
  CopyIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  LinkIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import RatingCircle from "../../../../global/RatingCircle";
import Typography from "../../../../global/common/Typography";
import StatusTag from "../../../../global/StatusTag";
import { HeaderDescriptionItemsWrapperMobile } from "../../../projects/Projects/Project/styles";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import projectDescriptionImage from "../../../../../public/static/main/where_next.png";
import { useTimer } from "../../../../../hooks/useTimer";

const keyString = "0x70asdfhalsflasjdf34ggff02";

const ShareAcceleratorProject = () => {
  const [isHideDesc, setIsHideDesc] = useState(true);
  const { days, hours, minutes, seconds } = useTimer(
    "Tue Jun 28 2023 22:23:55 GMT+0300 (Eastern European Summer Time)"
  );

  const copySmartContract = () => {
    navigator.clipboard.writeText(keyString);
    toast.success("Smart contract was copied");
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <LeftHeaderWrapper>
          <LeftHeaderPersonInfoWrapper>
            <UserAvatar
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              variant="default"
              size="medium"
              name="SharkRace Club"
            />
            <div>
              <HeaderPersonNameWrapper>
                <HeaderPersonTitle variant="p">
                  SharkRace Club
                </HeaderPersonTitle>
                <RatingCircleWrapper>
                  <RatingCircle rating={75} variant="success" />
                </RatingCircleWrapper>
              </HeaderPersonNameWrapper>
              <HeaderPersonDescription>
                <Typography variant="p">NFT & Collectibles</Typography>
                <StatusTag variant="active" />
                <LinkIcon fill="#00C099" />
                <LinkedinIcon fill="#00C099" />
                <FacebookIcon fill="#00C099" />
                <InstagramIcon fill="#00C099" />
                <TwitterIcon fill="#00C099" />
              </HeaderPersonDescription>
            </div>
          </LeftHeaderPersonInfoWrapper>
          <PersonPriceWrapper>
            <ProgressWrapper>
              <RangeTitle variant="p">Token sale ended</RangeTitle>
              <RangeWrapper>
                <RangeValue percentage={100} />
              </RangeWrapper>
              <RangeDescriptionWrapper>
                <RangeDescription variant="p">
                  $1,850,000
                  <span>of</span>
                  <i>$1,850,000 (100%)</i>
                </RangeDescription>
              </RangeDescriptionWrapper>
            </ProgressWrapper>
          </PersonPriceWrapper>
        </LeftHeaderWrapper>
        <RightHeaderWrapper>
          <RightHeaderHead>
            <div style={{ display: "flex", gap: 10 }}>
              <HeaderDataTextWrapper>
                <HeaderDataText variant="p">
                  ${clarifyAmount(1800000)}
                  <span>Total Raised</span>
                </HeaderDataText>
                <HeaderDataText variant="p">
                  {clarifyDate(String(moment()))}
                  <span>Ending</span>
                </HeaderDataText>
                <HeaderDataText variant="p">
                  Seed
                  <span>Type</span>
                </HeaderDataText>
              </HeaderDataTextWrapper>
            </div>
            <div>
              <HeaderDescriptionItemsWrapperMobile>
                <div>
                  <HeaderDescriptionItemsTitle>
                    Smart contracts:
                  </HeaderDescriptionItemsTitle>
                  <HeaderCopyKey onClick={copySmartContract}>
                    {keyString.slice(0, 4)}...
                    {keyString.slice(keyString.length - 8, keyString.length)}
                    <div>
                      <CopyIcon fill="#738094" />
                    </div>
                  </HeaderCopyKey>
                </div>
                <div>
                  <HeaderDescriptionItemsTitle>
                    <TwitterIcon fill="#738094" />
                    Top Followers
                  </HeaderDescriptionItemsTitle>
                  <HeaderUsersRow>
                    <HeaderUserWrapper>
                      <UserAvatar
                        size="xSmall"
                        avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                        name="name"
                        variant="default"
                      />
                      <Typography variant="p">John Doe</Typography>
                    </HeaderUserWrapper>
                    <HeaderUserWrapper>
                      <UserAvatar
                        size="xSmall"
                        avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                        name="name"
                        variant="default"
                      />
                      <Typography variant="p">John Doe</Typography>
                    </HeaderUserWrapper>
                  </HeaderUsersRow>
                </div>
              </HeaderDescriptionItemsWrapperMobile>
            </div>
          </RightHeaderHead>
          <div>
            <HeaderDescription variant="p">
              Amet minim mollit non deserunt ullamco est sit aliqua dolor do
              amet sint. Velit officia consequat duis enim velit mollit.{" "}
              <i onClick={() => setIsHideDesc((state) => !state)}>
                {isHideDesc ? "Show more" : "Hide"}
              </i>
            </HeaderDescription>
            <HeaderDescriptionItemsWrapper>
              <div>
                <HeaderDescriptionItemsTitle>
                  Smart contracts:
                </HeaderDescriptionItemsTitle>
                <HeaderCopyKey onClick={copySmartContract}>
                  {keyString.slice(0, 4)}...
                  {keyString.slice(keyString.length - 8, keyString.length)}
                  <div>
                    <CopyIcon fill="#738094" />
                  </div>
                </HeaderCopyKey>
              </div>
              <div>
                <HeaderDescriptionItemsTitle>
                  <TwitterIcon fill="#738094" />
                  Top Followers
                </HeaderDescriptionItemsTitle>
                <HeaderUsersRow>
                  <HeaderUserWrapper>
                    <UserAvatar
                      size="xSmall"
                      avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                      name="name"
                      variant="default"
                    />
                    <Typography variant="p">John Doe</Typography>
                  </HeaderUserWrapper>
                  <HeaderUserWrapper>
                    <UserAvatar
                      size="xSmall"
                      avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                      name="name"
                      variant="default"
                    />
                    <Typography variant="p">John Doe</Typography>
                  </HeaderUserWrapper>
                </HeaderUsersRow>
              </div>
            </HeaderDescriptionItemsWrapper>
          </div>
        </RightHeaderWrapper>
      </HeaderWrapper>
      <ContentWrapper>
        <RoundsWrapper>
          <PublicWrapper>
            <RoundTitle variant="p">Public round</RoundTitle>
            <RoundDescription variant="p">
              Registrations are opened to anyone with more than $1000 worth of
              tokens in their wallet.
              <Link href="/">See Rules</Link>
            </RoundDescription>
            <RoundTimerWrapper>
              <RoundTimerTitle>Contribution Closes</RoundTimerTitle>
              <RoundTimerValue>
                {days}d {hours}h {minutes}m {seconds}s
              </RoundTimerValue>
            </RoundTimerWrapper>
          </PublicWrapper>
          <StrongWrapper>
            <RoundTitle variant="p">Strong hold offer</RoundTitle>
            <RoundDescription variant="p">
              Premium round offerings for DAO holders only. Higher winning
              chances with lower fees.
              <Link href="/">See Rules</Link>
            </RoundDescription>
            <RoundTimerWrapper>
              <RoundTimerTitle>Registration closes</RoundTimerTitle>
              <RoundTimerValue>
                {days}d {hours}h {minutes}m {seconds}s
              </RoundTimerValue>
            </RoundTimerWrapper>
          </StrongWrapper>
        </RoundsWrapper>
        <ProjectContentWrapper>
          <Image
            width={100}
            height={100}
            src={projectDescriptionImage.src}
            alt="where next"
          />
          <ProjectContentDescription variant="p">
            The Contributor Program is a community incentive program designed to
            encourage community members of different backgrounds and skillsets
            to steward and take ownership of key aspects of the ecosystem.
            Participants of the program will be given points based on the
            quality of their contributions to the ecosystem using evaluation
            criteria developed by existing leaders in the community.
          </ProjectContentDescription>
          <FactsWrapper>
            <FactsTitle variant="p">Token Sale and Economics</FactsTitle>
            <FactRow>
              <div>Hard Cap:</div>
              <div>4000000 USD</div>
            </FactRow>
            <FactRow>
              <div>Total Token Supply:</div>
              <div>40000000 ALPINE</div>
            </FactRow>
            <FactRow>
              <div>Initial Circulating Supply:</div>
              <div>28.40% of Total Token Supply</div>
            </FactRow>
            <FactRow>
              <div>Public Sale Token Price:</div>
              <div>
                1 USD (price in BNB will be determined prior to the start of
                subscription)
              </div>
            </FactRow>
            <FactRow>
              <div>Tokens Offered:</div>
              <div>4000000 ALPINE</div>
            </FactRow>
            <FactRow>
              <div>Hard Cap Per User:</div>
              <div>
                10000 USD (price in BNB will be determined prior to the start of
                subscription)
              </div>
            </FactRow>
            <FactRow>
              <div>Token Sale Vesting Period:</div>
              <div>No lockup</div>
            </FactRow>
            <FactRow>
              <div>Token Type:</div>
              <div>BEP20</div>
            </FactRow>
            <FactRow>
              <div>Token Distribution:</div>
              <div>After the end of token sale</div>
            </FactRow>
          </FactsWrapper>
          <ProjectDescriptionActionsWrapper>
            <PrimaryButton href="/gemslab/accelerator/sale/123">
              Become a participant
            </PrimaryButton>
            <SecondaryButton href="/gemslab/project/123">
              Go to project page
            </SecondaryButton>
          </ProjectDescriptionActionsWrapper>
        </ProjectContentWrapper>
      </ContentWrapper>
    </PageWrapper>
  );
};

export default ShareAcceleratorProject;
