import React, { useState } from "react";
import moment from "moment";
import Filter from "../../../global/Filter";
import { CommentsArray } from "../../../../staticContent/projects/persons";
import {
  ActionsWrapper,
  CommentItem,
  CommentWrapper,
  DefaultActionWrapper,
  MobileDataWrapper,
  MobileStatusWrapper,
  PinButton,
  RatingWrapper,
  StatusWrapper,
} from "../../projects/OTC/DealsList/styles";
import RedFlag from "../../../global/RedFlag";
import { StarIcon } from "../../../global/Icons";
import PinIcon from "../../../global/Icons/PinIcon";
import UserAvatar from "../../../global/common/UserAvatar";
import NewsTab from "../../projects/Projects/Project/NewsTab";
import { PageWrapper } from "../Tasks/styles";
import CommentBlock from "../../../global/CommentBlock";
import Pagination from "../../../global/Pagintaion";
import { UsersScoreUserButton } from "../../projects/Persons/SocialPerson/styles";
import FeedCardsModal from "../modals/FeedCardsModal";
import {
  ContentWrapper,
  HiddenContent,
  HotCommentContentWrapper,
  HotCommentHeaderWrapper,
  HotCommentWrapper,
  LeftContentCommentsWrapper,
  LeftContentWrapper,
  RightContentCommentsWrapper,
  RightContentWrapper,
} from "./styled";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";

const filters = [
  {
    type: "select",
    title: "Fomo activity",
    placeholder: "Choose fund",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
  {
    type: "range",
    title: "Reward ($)",
    range: [0, 150],
    step: 1,
  },
  {
    type: "range",
    title: "Requirements ($)",
    range: [0, 150],
    step: 1,
  },
  {
    type: "checkbox",
    title: "Type",
    items: ["NFT", "Airdrop", "Nodes", "Testnet", "Ambassadors"],
  },
  {
    type: "range",
    title: "Members",
    range: [0, 150],
    step: 1,
  },
  {
    type: "range",
    title: "Project rating",
    range: [0, 150],
    step: 1,
  },
  {
    type: "range",
    title: "Event rating",
    range: [0, 150],
    step: 1,
  },
  { type: "date", title: "Date" },
  {
    type: "checkbox",
    items: ["Fee"],
  },
  {
    type: "range",
    title: "Risk",
    range: [0, 100],
    step: 1,
  },
];

const FeedPage = () => {
  const [page, setPage] = useState(1);
  const [hotModal, setHotModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);

  return (
    <PageWrapper>
      <Typography variant="h1">Feed</Typography>
      <br />
      <Subtitle>
        Stay updated with the latest news and updates on your favorite projects,
        market changes, and important event announcements. Track all
        developments in real-time and stay informed about the crypto industry
        trends.{" "}
      </Subtitle>
      <br />
      <ContentWrapper>
        <LeftContentWrapper>
          <p>Events</p>
          <div>
            <Filter filters={filters} />
          </div>
          <LeftContentCommentsWrapper>
            {/* {CommentsArray.map((item, i) => {
              return (
                <CommentWrapper key={i} variant={i % 2 ? "warn" : "default"}>
                  <CommentItem {...item} />
                  <ActionsWrapper>
                    <DefaultActionWrapper>
                      Rating:
                      <span>
                        <RedFlag count={14} />
                        <RatingWrapper>
                          <StarIcon fill="#FFC702" />
                          94/100
                        </RatingWrapper>
                      </span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Category:
                      <span>Locked</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Rewards:
                      <span>1.084</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Type:
                      <span>Buying</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Requirements:
                      <span>Locked</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Max participants:
                      <span>54565</span>
                    </DefaultActionWrapper>
                    <PinButton>
                      <PinIcon fill="#04A584" />
                    </PinButton>
                  </ActionsWrapper>
                  <MobileStatusWrapper>
                    <StatusWrapper>
                      Status:
                      <span>Pending</span>
                    </StatusWrapper>
                  </MobileStatusWrapper>
                  <MobileDataWrapper>
                    <DefaultActionWrapper>
                      Rating:
                      <span>
                        <RedFlag count={14} />
                        <RatingWrapper>
                          <StarIcon fill="#FFC702" />
                          94/100
                        </RatingWrapper>
                      </span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Category:
                      <span>Locked</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Rewards:
                      <span>1.084</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Type:
                      <span>Buying</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Requirements:
                      <span>Locked</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Max participants:
                      <span>54565</span>
                    </DefaultActionWrapper>
                  </MobileDataWrapper>
                </CommentWrapper>
              );
            })} */}
          </LeftContentCommentsWrapper>
          <Pagination
            page={page}
            total={20}
            limit={10}
            totalPage={20}
            onChange={(value) => setPage(value)}
          />
        </LeftContentWrapper>
        <RightContentWrapper>
          <RightContentCommentsWrapper>
            <div>
              <p>Hot</p>
              <div>
                {Array(10)
                  .fill("")
                  .map((item, i) => {
                    return (
                      <HotCommentWrapper key={i + item} variant="default">
                        <HotCommentHeaderWrapper>
                          <div>
                            <p>Start:</p>
                            <span>{moment().format("DD.MM.YYYY")}</span>
                          </div>
                          <div>
                            <p>End:</p>
                            <span>{moment().format("DD.MM.YYYY")}</span>
                          </div>
                        </HotCommentHeaderWrapper>
                        <HotCommentContentWrapper>
                          <UserAvatar
                            size="small"
                            variant="warn"
                            avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                            name="name"
                            rating={94}
                          />
                          <div>
                            <p>SharkRace Club</p>
                            <span>Event name</span>
                          </div>
                        </HotCommentContentWrapper>
                      </HotCommentWrapper>
                    );
                  })}
              </div>
              <UsersScoreUserButton onClick={() => setHotModal(true)}>
                See all &gt;
              </UsersScoreUserButton>
            </div>
            <div>
              <p>Fomo review</p>
              <div>
                {Array(10)
                  .fill("")
                  .map((item, i) => {
                    return (
                      <HotCommentWrapper key={i + item} variant="default">
                        <HiddenContent>?</HiddenContent>
                        <HotCommentHeaderWrapper>
                          <div>
                            <p>Start:</p>
                            <span>{moment().format("DD.MM.YYYY")}</span>
                          </div>
                          <div>
                            <p>End:</p>
                            <span>{moment().format("DD.MM.YYYY")}</span>
                          </div>
                        </HotCommentHeaderWrapper>
                        <HotCommentContentWrapper>
                          <UserAvatar
                            size="small"
                            variant="warn"
                            avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                            name="name"
                            rating={94}
                          />
                          <div>
                            <p>SharkRace Club</p>
                            <span>Event name</span>
                          </div>
                        </HotCommentContentWrapper>
                      </HotCommentWrapper>
                    );
                  })}
              </div>
              <UsersScoreUserButton onClick={() => setReviewModal(true)}>
                See all &gt;
              </UsersScoreUserButton>
            </div>
          </RightContentCommentsWrapper>
        </RightContentWrapper>
      </ContentWrapper>
      <br />
      <br />
      <br />
      <br />
      <NewsTab />
      <br />
      <br />
      <br />
      <CommentBlock />
      {hotModal && (
        <FeedCardsModal onClose={() => setHotModal(false)} title="Hot" />
      )}
      {reviewModal && (
        <FeedCardsModal
          onClose={() => setReviewModal(false)}
          title="Fomo review"
        />
      )}
    </PageWrapper>
  );
};

export default FeedPage;
