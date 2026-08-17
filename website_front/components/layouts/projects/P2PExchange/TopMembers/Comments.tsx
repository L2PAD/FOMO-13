import React, { useState } from "react";
import { CommentsArray } from "../../../../../staticContent/projects/persons";
import RedFlag from "../../../../global/RedFlag";
import { StarIcon, TopRatingIcon } from "../../../../global/Icons";
import Pagination from "../../../../global/Pagintaion";
import {
  CommentWrapper,
  CommentItem,
  ActionsWrapper,
  DefaultActionWrapper,
  RatingWrapper,
  ListWrapper,
  PaginationWrapper,
} from "./styles";
import Image from "next/image";

const Comments = () => {
  const [page, setPage] = useState(1);

  return (
    <>
      <ListWrapper>
        {CommentsArray.map((item, i) => {
          return (
            <CommentWrapper key={i} variant="default">
              <div className="comment">
                {/* <CommentItem
                {...item}
                content={
                  <span className="deal">
                    Deal: <b>Deal name</b>
                  </span>
                }
              /> */}
                <div className="likes">
                  <div className="like">
                    <Image
                      width="16"
                      height="16"
                      alt="icon"
                      src="data:image/png;base64,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"
                    />
                    2,5k
                  </div>
                  <div className="dislike">
                    <TopRatingIcon />
                    148
                  </div>
                </div>
              </div>
              <ActionsWrapper>
                <DefaultActionWrapper>
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
      </ListWrapper>
      <PaginationWrapper>
        <Pagination
          page={page}
          total={20}
          limit={20}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </PaginationWrapper>
    </>
  );
};

export default Comments;
