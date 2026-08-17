import React, { useState } from "react";
import moment from "moment/moment";
import { toast } from "react-toastify";
import {
  CommentsTitle,
  FlagsList,
  FlagsListItem,
  FlagsListsWrapper,
  FlagsListTitle,
  FlagsTitle,
  FlagsWrapper,
  HeaderCopyKey,
  HeaderDataText,
  HeaderDataTextWrapper,
  HeaderDescription,
  HeaderDescriptionItemsTitle,
  HeaderDescriptionItemsWrapper,
  HeaderDescriptionItemsWrapperMobile,
  HeaderPersonDescription,
  HeaderPersonTitle,
  HeaderUsersRow,
  HeaderUserWrapper,
  HeaderWrapper,
  LeftHeaderPersonalWrapper,
  LeftHeaderPersonInfoWrapper,
  LeftHeaderWrapper,
  PageWrapper,
  PersonCurrencyWrapper,
  PersonMainPrice,
  PersonPriceCurrency,
  PersonPriceTitle,
  PersonPriceWrapper,
  ProgressMinWrapper,
  ProgressWrapper,
  ProjectDescriptionItem,
  RangeDescription,
  RangeDescriptionWrapper,
  RangeTitle,
  RangeValue,
  RangeWrapper,
  RatingMediaList,
  RatingMediaListItem,
  RatingMediaWrapper,
  RightHeaderHead,
  RightHeaderWrapper,
  SocialsWrapper,
} from "../Project/styles";
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  LinkIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import StatusTag from "../../../../global/StatusTag";
import ProgressBar from "../../../../global/common/ProgressBar";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import Investors from "../Project/Investors";
import PersonsTabs from "../Project/PersonsTabs";
import { ProjectDescriptionDataWrapper } from "../../../nfts/Projects/Project/styles";

const projectEnded = false;
const keyString = "0x70asdfhalsflasjdf34ggff02";

const ShareProject = () => {
  const [isHideDesc, setIsHideDesc] = useState(true);

  const copySmartContract = () => {
    navigator.clipboard.writeText(keyString);
    toast.success("Smart contract was copied");
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <LeftHeaderWrapper>
          <LeftHeaderPersonInfoWrapper>
            <LeftHeaderPersonalWrapper>
              <UserAvatar
                avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                variant="default"
                size="medium"
                name="SharkRace Club"
              />
              <div>
                <HeaderPersonTitle variant="p">
                  SharkRace Club
                </HeaderPersonTitle>
                <HeaderPersonDescription>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Typography variant="p">NFT & Collectibles</Typography>
                    <StatusTag variant="active" />
                  </div>
                  <SocialsWrapper>
                    <LinkIcon fill="#00C099" />
                    <LinkedinIcon fill="#00C099" />
                    <FacebookIcon fill="#00C099" />
                    <InstagramIcon fill="#00C099" />
                    <TwitterIcon fill="#00C099" />
                  </SocialsWrapper>
                </HeaderPersonDescription>
              </div>
            </LeftHeaderPersonalWrapper>
          </LeftHeaderPersonInfoWrapper>
          <PersonPriceWrapper>
            {projectEnded ? (
              <ProgressMinWrapper>
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
              </ProgressMinWrapper>
            ) : (
              <>
                <PersonCurrencyWrapper>
                  <div>
                    <PersonPriceTitle variant="p">Price</PersonPriceTitle>
                    <PersonMainPrice variant="p">
                      $1.92 <span>58.17%</span>
                    </PersonMainPrice>
                  </div>
                  <div>
                    <PersonPriceCurrency variant="p">
                      0.0000636 ETH <span>58.17%</span>
                    </PersonPriceCurrency>
                    <PersonPriceCurrency variant="p">
                      0.00006356 BTC <span>58.17%</span>
                    </PersonPriceCurrency>
                  </div>
                </PersonCurrencyWrapper>
                <ProgressWrapper>
                  <ProgressBar
                    title="Price range"
                    low={1.27}
                    high={2.72}
                    progress={30}
                  />
                </ProgressWrapper>
              </>
            )}
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
                  <HeaderDescriptionItemsTitle variant="p">
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
                  <HeaderDescriptionItemsTitle variant="p">
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
                <HeaderDescriptionItemsTitle variant="p">
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
                <HeaderDescriptionItemsTitle variant="p">
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

      <ProjectDescriptionDataWrapper>
        <ProjectDescriptionItem variant="p">
          <span>Market Cap</span>${clarifyAmount(15380000)}
        </ProjectDescriptionItem>
        <ProjectDescriptionItem percentage={58.17} variant="p">
          <span>Volume 24H</span>${clarifyAmount(3670000)}
          <br />
          <i>58.17%</i>
        </ProjectDescriptionItem>
        <ProjectDescriptionItem percentage={7.01} variant="p">
          <span>Circulating Supply</span>
          8.01 M GFI
          <br />
          <i>7.01%</i>
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Total Supply</span>
          118.01 M GFI
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Fully Dil. Val</span>
          $219.43 M
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Dominance</span>
          0.00 %
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Volume/Market cap</span>
          0.24
        </ProjectDescriptionItem>
      </ProjectDescriptionDataWrapper>
      <Investors />

      <PersonsTabs />

      <FlagsWrapper>
        <FlagsTitle variant="p">Flags</FlagsTitle>
        <FlagsListsWrapper>
          <FlagsList>
            <FlagsListTitle variant="p">Green</FlagsListTitle>
            <ul>
              <FlagsListItem>
                <CheckIcon fill="#04A584" />
                Support Mulyiple Blockchains with Different Protocols
              </FlagsListItem>
              <FlagsListItem>
                <CheckIcon fill="#04A584" />
                Strong Partnership
              </FlagsListItem>
              <FlagsListItem>
                <CheckIcon fill="#04A584" />
                Solid Team
              </FlagsListItem>
              <FlagsListItem>
                <CheckIcon fill="#04A584" />
                Detailed Roadmap
              </FlagsListItem>
            </ul>
          </FlagsList>
          <FlagsList>
            <FlagsListTitle variant="p">Red</FlagsListTitle>
            <ul>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Support Mulyiple Blockchains with Different Protocols
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Strong Partnership
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Solid Team
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Detailed Roadmap
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Support Mulyiple Blockchains with Different Protocols
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Strong Partnership
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Solid Team
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Detailed Roadmap
              </FlagsListItem>
            </ul>
          </FlagsList>
        </FlagsListsWrapper>
      </FlagsWrapper>
      <RatingMediaWrapper>
        <CommentsTitle variant="p">Ratings & Media</CommentsTitle>
        <RatingMediaList>
          <RatingMediaListItem>
            <a href="components/layouts/projects/Projects/Project#">
              ArcBlock Rating Review
              <LinkIcon fill="#04A584" />
            </a>
          </RatingMediaListItem>
          <RatingMediaListItem>
            <a href="components/layouts/projects/Projects/Project#">
              ArcBlock Coin Guide
              <LinkIcon fill="#04A584" />
            </a>
          </RatingMediaListItem>
        </RatingMediaList>
      </RatingMediaWrapper>
    </PageWrapper>
  );
};

export default ShareProject;
