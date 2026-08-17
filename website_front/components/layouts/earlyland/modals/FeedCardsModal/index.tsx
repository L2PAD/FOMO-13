import React, { FC, useState } from "react";
import moment from "moment/moment";
import UserAvatar from "../../../../global/common/UserAvatar";
import {
  HotCommentContentWrapper,
  HotCommentHeaderWrapper,
  HotCommentWrapper,
} from "../../Feed/styled";
import Pagination from "../../../../global/Pagintaion";
import { ContentWrapper, Wrapper } from "./styles";

interface Props {
  onClose: () => void;
  title: string;
}

const FeedCardsModal: FC<Props> = ({ onClose, title }) => {
  const [page, setPage] = useState(1);
  return (
    <Wrapper title={title} variant="small" onClose={onClose}>
      <br />
      <ContentWrapper>
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
      </ContentWrapper>
      <Pagination
        page={page}
        totalPage={20}
        onChange={(value) => setPage(value)}
      />
    </Wrapper>
  );
};

export default FeedCardsModal;
