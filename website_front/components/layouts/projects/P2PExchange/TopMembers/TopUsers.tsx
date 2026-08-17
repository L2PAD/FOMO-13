import React, { useState } from "react";
import { CommentsArray } from "../../../../../staticContent/projects/persons";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import RedFlag from "../../../../global/RedFlag";
import {
  FingerDownIcon,
  FingerTopIcon,
  StarIcon,
} from "../../../../global/Icons";
import Pagination from "../../../../global/Pagintaion";
import {
  CommentWrapper,
  CommentItem,
  ActionsWrapper,
  DefaultActionWrapper,
  RatingWrapper,
} from "./styles";

const TopUsers = () => {
  const [page, setPage] = useState(1);

  return (
    <>
      {CommentsArray.map((item, i) => {
        return (
          <CommentWrapper key={i} variant="default">
            <div className="comment">
              {/* <CommentItem {...item} /> */}
              <div className="likes">
                <div className="like">
                  <FingerTopIcon />
                  2,5k
                </div>
                <div className="dislike">
                  <FingerDownIcon />
                  148
                </div>
              </div>
            </div>
            <ActionsWrapper>
              <DefaultActionWrapper>
                Revenue:
                <span>${clarifyAmount(1800000)}</span>
              </DefaultActionWrapper>
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
            </ActionsWrapper>
          </CommentWrapper>
        );
      })}
      <Pagination
        page={page}
        total={20}
        limit={20}
        totalPage={20}
        onChange={(value) => setPage(value)}
      />
    </>
  );
};

export default TopUsers;
