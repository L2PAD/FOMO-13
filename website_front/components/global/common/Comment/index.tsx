/* eslint-disable */
import React, { FC, useState } from "react";
import moment from "moment";
import UserAvatar from "../UserAvatar";
import { CloseIcon, FingerDownIcon, FingerTopIcon } from "../../Icons";
import Modal from "../Modal";
import { IComment, IUser } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
import sliceAddress from "../../../../helpers/sliceAddress";
import {
  CommentActions,
  CommentText,
  CommentWrapper,
  DateText,
  DeleteCommentWrapper,
  GrayLine,
  HeaderWrapper,
  ModalAction,
  ModalActionsWrapper,
  ModalCancelButton,
  ModalContent,
  ModalTitle,
  Title,
  TitleWrapper,
} from "./styles";
import OtcLike from "../../Icons/OtcLike";
import OtcDisike from "../../Icons/OtcDislike";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import DescriptionComponent from "../DescriptionComponent";

interface IProps {
  userId: string;
  comment: IComment;
  isHistory?: boolean;
  onLike?: (commentId: string) => void;
  onDislike?: (commentId: string) => void;
  removeComment?: (commentId: string) => void;
  addReport?: (commentId: string) => void;
}

const Comment: FC<IProps> = ({
  userId,
  comment,
  isHistory,
  onLike,
  onDislike,
  removeComment,
  addReport,
}) => {
  const [isDeleteState, setIsDeleteState] = useState<boolean>(false);
  const [isDeleteDescription, setIsDeleteDescription] =
    useState<boolean>(false);
  const [isReportDescription, setIsReportDescription] =
    useState<boolean>(false);

  if (!comment?.author) return <></>;

  const author: IUser = comment.author[0];
  const isAuthor: boolean = author?._id === userId;
  const isReported: boolean = !!comment?.reports?.includes(userId);

  return isDeleteState ? (
    <DeleteCommentWrapper>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
      >
        <path
          d="M7.39911 7.39844H14.5991M7.39911 12.1984H11.5991M20.5991 10.9984C20.5991 12.3785 20.3079 13.6905 19.7836 14.8764L20.6009 20.5975L15.698 19.3718C14.3091 20.1529 12.7061 20.5984 10.9991 20.5984C5.69718 20.5984 1.39911 16.3004 1.39911 10.9984C1.39911 5.6965 5.69718 1.39844 10.9991 1.39844C16.301 1.39844 20.5991 5.6965 20.5991 10.9984Z"
          stroke="#04A584"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="delete-info">
        <h4>Changed your mind?</h4>
        <p>Delete this comment</p>
      </div>
      <div className="buttons">
        <button onClick={() => setIsDeleteState(false)} className="red-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="16"
            viewBox="0 0 17 16"
            fill="none"
          >
            <path
              d="M11.1666 5.33203L5.83325 10.6654M11.1666 10.6654L5.83325 5.33203"
              stroke="#FF5858"
              strokeLinecap="round"
            />
          </svg>
          <span>Cancel</span>
        </button>

        <button
          onClick={() => {
            setIsDeleteState(false);
            setIsDeleteDescription(false);
            removeComment && removeComment(comment._id || "");
          }}
          className="green-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="8"
            height="6"
            viewBox="0 0 8 6"
            fill="none"
          >
            <path
              d="M7 1L2.5253 4.99998L1 3.63649"
              stroke="#04A584"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Delete</span>
        </button>
      </div>
    </DeleteCommentWrapper>
  ) : (
    <CommentWrapper>
      <HeaderWrapper>
        <UserAvatar
          size="otc"
          variant="default"
          avatar={
            comment.author[0]?.photo
              ? imageLoader(String(author.photo))
              : (comment.author && author?.twitterData?.photo) || ""
          }
          name={author?.username || ""}
        />
        <div className="user-actions">
          <TitleWrapper>
            <Title variant="p">{author?.username || ""} </Title>
            {isHistory ? (
              <button
                className="remove-btn"
                onClick={() =>
                  removeComment && removeComment(comment._id || "")
                }
              >
                <CloseIcon fill={"var(--main-gray)"} />
              </button>
            ) : (
              <div className="title-buttons">
                <div className="report-wrapper">
                  <button
                    onMouseEnter={() => setIsReportDescription(true)}
                    onMouseLeave={() => setIsReportDescription(false)}
                    onClick={() =>
                      !isReported && addReport && addReport(comment._id || "")
                    }
                  >
                    {isReported ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="#738094"
                      >
                        <path
                          d="M0.666687 11.3346H3.57578M2.12123 6.23319V0.667969H11.3334L9.87881 3.45058L11.3334 6.23319H2.12123ZM2.12123 6.23319V10.8709"
                          stroke="#738094"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M0.666687 11.3346H3.57578M2.12123 6.23319V0.667969H11.3334L9.87881 3.45058L11.3334 6.23319H2.12123ZM2.12123 6.23319V10.8709"
                          stroke="#738094"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <DescriptionComponent
                    className="report-description-modal"
                    isVisible={isReportDescription}
                    text="Report this comment for review"
                    date={new Date()}
                    isDate={false}
                  />
                </div>
                {isAuthor ? (
                  <div className="delete-wrapper">
                    <button
                      onMouseEnter={() => setIsDeleteDescription(true)}
                      onMouseLeave={() => setIsDeleteDescription(false)}
                      onClick={() => {
                        setIsDeleteState(true);
                        setIsDeleteDescription(false);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                      >
                        <path
                          d="M6.66671 1.33203L1.33337 6.66536M6.66671 6.66536L1.33337 1.33203"
                          stroke="#738094"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <DescriptionComponent
                      className="remove-description-modal"
                      isVisible={isDeleteDescription}
                      text="Delete your comment"
                      date={new Date()}
                      isDate={false}
                    />
                  </div>
                ) : (
                  <></>
                )}
              </div>
            )}
          </TitleWrapper>
          <DateText variant="p">
            {moment(comment.date).format("DD.MM.YYYY HH:mm a")}
          </DateText>
        </div>
      </HeaderWrapper>
      <CommentText className="comment-text" variant="p">
        {comment.text}
      </CommentText>
      <CommentActions>
        <button onClick={() => onLike && onLike(comment._id || "")}>
          <OtcLike
            status={comment?.likes?.includes(userId) ? "active" : "default"}
          />
          {clarifyAmount(comment?.likes?.length || 0)}
        </button>
        <button onClick={() => onDislike && onDislike(comment._id || "")}>
          <OtcDisike
            status={comment?.dislikes?.includes(userId) ? "active" : "default"}
          />
          {clarifyAmount(comment?.dislikes?.length || 0)}
        </button>
      </CommentActions>
    </CommentWrapper>
  );
};

export default Comment;
