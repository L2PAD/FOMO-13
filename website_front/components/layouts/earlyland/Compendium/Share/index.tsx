import React, { useState } from "react";
import Link from "next/link";
import moment from "moment/moment";
import {
  ContentWrapper,
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
  LeftHeaderPersonInfoWrapper,
  LeftHeaderWrapper,
  PageWrapper,
  ProgressHeaderWrapper,
  ProgressWrapper,
  ProjectDescriptionDataWrapper,
  ProjectDescriptionItem,
  ReviewWrapper,
  RightHeaderHead,
  RightHeaderWrapper,
  RollupContentWrapper,
  RollupHelpButton,
  RollupNextButton,
} from "../Project/styles";
import {
  AskIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  LinkIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import StatusTag from "../../../../global/StatusTag";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import NewsTab from "../../../projects/Projects/Project/NewsTab";
import Rollup from "../../../../global/common/Rollup";
// import { ProgressBar } from "../../../../global/CryptoMarketTable/table_row/styles";
import { ProgressBar } from "../../../../global/common/UniversalTableRow/styles";

const ShareCompendium = () => {
  const [doneStages, setDoneStages] = useState(0);

  return (
    <div>
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
                <HeaderPersonTitle variant="p">
                  SharkRace Club
                </HeaderPersonTitle>
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
          </LeftHeaderWrapper>
          <RightHeaderWrapper>
            <RightHeaderHead>
              <div style={{ display: "flex", gap: 10 }}>
                <HeaderDataTextWrapper>
                  <HeaderDataText variant="p">
                    -100$
                    <span>Requirements</span>
                  </HeaderDataText>
                  <HeaderDataText variant="p">
                    -20 min
                    <span>Time</span>
                  </HeaderDataText>
                  <HeaderDataText variant="p">
                    TBA
                    <span>Rewards</span>
                  </HeaderDataText>
                  <HeaderDataText variant="p">
                    40%
                    <span>Risk</span>
                  </HeaderDataText>
                </HeaderDataTextWrapper>
              </div>
              <HeaderDescriptionItemsWrapperMobile>
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
                <div>
                  <HeaderDescriptionItemsTitle>
                    Guide
                  </HeaderDescriptionItemsTitle>
                  <HeaderUsersRow>
                    <Link href="/">Link to guideline</Link>
                  </HeaderUsersRow>
                </div>
              </HeaderDescriptionItemsWrapperMobile>
            </RightHeaderHead>
          </RightHeaderWrapper>
        </HeaderWrapper>
        <div>
          <HeaderDescription variant="p">
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
            sint. Velit officia consequat duis enim velit mollit. Amet minim
            mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit
            officia consequat duis enim velit mollit.
          </HeaderDescription>
          <HeaderDescriptionItemsWrapper>
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
            <div>
              <HeaderDescriptionItemsTitle>Guide</HeaderDescriptionItemsTitle>
              <HeaderUsersRow>
                <Link href="/">Link to guideline</Link>
              </HeaderUsersRow>
            </div>
          </HeaderDescriptionItemsWrapper>
        </div>
        <ProjectDescriptionDataWrapper>
          <ProjectDescriptionItem variant="p">
            <span>Type</span>
            Node
          </ProjectDescriptionItem>
          <ProjectDescriptionItem percentage={58.17} variant="p">
            <span>Reward Pool</span>-
          </ProjectDescriptionItem>
          <ProjectDescriptionItem percentage={7.01} variant="p">
            <span>Max Participants</span>
            8.01 M GFI
          </ProjectDescriptionItem>
          <ProjectDescriptionItem variant="p">
            <span>Date of Start</span>
            {clarifyDate(moment().format("DD.MM.YYYY HH:mm"))}
          </ProjectDescriptionItem>
          <ProjectDescriptionItem variant="p">
            <span>Date of End</span>
            {clarifyDate(moment().format("DD.MM.YYYY HH:mm"))}
          </ProjectDescriptionItem>
          <ProjectDescriptionItem variant="p">
            <span>Expected Profit</span>
            50.00%
          </ProjectDescriptionItem>
        </ProjectDescriptionDataWrapper>
        <ContentWrapper>
          <p>Update</p>
        </ContentWrapper>
      </PageWrapper>
      <NewsTab />
      <PageWrapper>
        <ContentWrapper>
          <p>Fomo review:</p>
          <ReviewWrapper>
            <p>
              The Contributor Program is a community incentive program designed
              to encourage community members of different backgrounds and
              skillsets to steward and take ownership of key aspects of the
              ecosystem. Participants of the program will be given points based
              on the quality of their contributions to the ecosystem using
              evaluation criteria developed by existing leaders in the
              community.
              <br />
              <br />
              When the NEXT token goes live, the project plans to submit a
              proposal to the Connext DAO to retroactively reward participants
              proportional to points received.
              <br />
              <br />
              The program starts on the 20th of April 2022. Phase One of the
              program will run until the NEXT token launches. After the token
              and DAO are live, the taem expects to continue with further phases
              of the program.
              <br />
              <br />
              Program Structure <br />
              The program consists of 5 Tracks that are operated by Track
              Operators; experienced leaders within the community that are not
              part of the core team:
            </p>
          </ReviewWrapper>
        </ContentWrapper>
        <ContentWrapper>
          <p>What to do:</p>
          <Rollup
            title="Community Leadership"
            progress={doneStages >= 1 ? 1 : 0}
            isDone={doneStages >= 1}
            maxProgress={1}
            onChange={() => setDoneStages(1)}
          >
            <RollupContentWrapper>
              <p>
                The Contributor Program is a community incentive program
                designed to encourage community members of different backgrounds
                and skillsets to steward and take ownership of key aspects of
                the ecosystem. Participants of the program will be given points
                based on the quality of their contributions to the ecosystem
                using evaluation criteria developed by existing leaders in the
                community.
              </p>
              <div>
                <RollupHelpButton>
                  <AskIcon fill="#00C099" />
                  Need some help?
                </RollupHelpButton>
                <RollupNextButton
                  isDone={doneStages >= 1}
                  disabled={doneStages >= 1}
                  onClick={() => setDoneStages(1)}
                >
                  Next step
                </RollupNextButton>
              </div>
            </RollupContentWrapper>
          </Rollup>
          <Rollup
            title="Community Leadership"
            progress={doneStages >= 2 ? 1 : 0}
            isDone={doneStages >= 2}
            maxProgress={1}
            onChange={() => setDoneStages(2)}
          >
            <RollupContentWrapper>
              <p>
                The Contributor Program is a community incentive program
                designed to encourage community members of different backgrounds
                and skillsets to steward and take ownership of key aspects of
                the ecosystem. Participants of the program will be given points
                based on the quality of their contributions to the ecosystem
                using evaluation criteria developed by existing leaders in the
                community.
              </p>
              <div>
                <RollupHelpButton>
                  <AskIcon fill="#00C099" />
                  Need some help?
                </RollupHelpButton>
                <RollupNextButton
                  isDone={doneStages >= 2}
                  disabled={doneStages >= 2}
                  onClick={() => setDoneStages(2)}
                >
                  Next step
                </RollupNextButton>
              </div>
            </RollupContentWrapper>
          </Rollup>
          <Rollup
            title="Community Leadership"
            progress={doneStages >= 3 ? 1 : 0}
            isDone={doneStages >= 3}
            maxProgress={1}
            onChange={() => setDoneStages(3)}
          >
            <RollupContentWrapper>
              <p>
                The Contributor Program is a community incentive program
                designed to encourage community members of different backgrounds
                and skillsets to steward and take ownership of key aspects of
                the ecosystem. Participants of the program will be given points
                based on the quality of their contributions to the ecosystem
                using evaluation criteria developed by existing leaders in the
                community.
              </p>
              <div>
                <RollupHelpButton>
                  <AskIcon fill="#00C099" />
                  Need some help?
                </RollupHelpButton>
                <RollupNextButton
                  isDone={doneStages >= 3}
                  disabled={doneStages >= 3}
                  onClick={() => setDoneStages(3)}
                >
                  Next step
                </RollupNextButton>
              </div>
            </RollupContentWrapper>
          </Rollup>
          <ProgressWrapper>
            <ProgressHeaderWrapper>
              <p>Progress</p>
              <div>
                <p>
                  Current: <span>30%</span>
                </p>
                <p>
                  Total (5p reward):: <span>100%</span>
                </p>
              </div>
            </ProgressHeaderWrapper>
            <ProgressBar progress={30}>
              <div />
            </ProgressBar>
          </ProgressWrapper>
        </ContentWrapper>
      </PageWrapper>
    </div>
  );
};

export default ShareCompendium;
