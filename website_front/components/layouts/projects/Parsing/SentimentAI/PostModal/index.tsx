import React, { FC } from "react";
import MainModal from "../../../../../global/common/MainModal";
import { IKeywordTweet } from "../../../../../../types/global_types";
import EntityInfo from "../../../../../global/common/EntityInfo";
import styled from "styled-components";
import { linkify } from "../../CustomTwitterAccs";
import moment from "moment";
import MoodBar from "../../../../../global/MoodBar";
import PostCommentIcon from "../../../../../global/Icons/PostLikeIcon";
import RepostIcon from "../../../../../global/Icons/RepostIcon";
import PostLikeIcon from "../../../../../global/Icons/PostCommentIcon";
import ViewIcon from "../../../../../global/Icons/ViewIcon";
import PostSaveIcon from "../../../../../global/Icons/PostSaveIcon";
import EmptyList from "../../../../../global/EmptyList";
import { useTranslation } from "i18n";

const Body = styled.div`
  margin-top: 20px;

  & .post-text {
    font-size: 14px;
    color: var(--main-black);
    margin-bottom: 20px;
    line-height: 22px;
  }

  & .post-details-header {
    display: flex;
    justify-content: space-between;
  }

  & .post-date {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: var(--main-gray);
  }

  & .post-details-actions {
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 40px;
  }

  & .post-action {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-gray);
  }

  & .post-mood-bar {
    max-width: 190px;
    width: 100%;
    span {
      font-size: 12px;
    }
    & .mood-label {
      font-size: 12px;
    }
  }

  & .post-comments {
    margin-top: 20px;
  }

  & .post-comments-title {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
  }
`;

const ImageWrapper = styled.div`
  margin-bottom: 20px;
  img {
    max-width: 100%;
    object-fit: contain;
    border-radius: 12px;
  }
`;

interface IProps {
  isVisible: boolean;
  onClose: () => void;
  postData: IKeywordTweet | null;
}

const SentimentPostModal: FC<IProps> = ({ isVisible, onClose, postData }) => {
  const { translateText } = useTranslation();

  return (
    <MainModal
      CustomTitle={
        <div className="post-modal-title">
          <EntityInfo
            img={postData?.author?.avatar || ""}
            name={postData?.author?.name || "User"}
            username={postData?.author?.name || ""}
            variant="default"
            size="otc"
            niche={`@${postData?.author?.screenName}`}
          />
        </div>
      }
      isVisible={isVisible}
      onClose={onClose}
      title=""
      variant={"820"}
    >
      <Body>
        <div className="post-text">{linkify(postData?.text || "")}</div>
        {postData?.photos?.length ? (
          <ImageWrapper>
            <img src={postData.photos[0]} alt={postData?.text} />
          </ImageWrapper>
        ) : (
          <></>
        )}
        <div className="post-details">
          <div className="post-details-header">
            <div className="post-date">
              {postData?.createdAt
                ? moment(postData.createdAt).format("ll hh:mm a")
                : "-"}
            </div>
            <div className="post-mood-bar">
              <MoodBar
                isMain={false}
                score={postData?.mood?.score || 0}
                accuracy={postData?.mood?.score || 0}
                label={postData?.mood?.label || "Negative"}
              />
            </div>
          </div>
          <div className="post-details-actions">
            <div className="post-action">
              <PostCommentIcon />
              <span>0</span>
            </div>
            <div className="post-action">
              <RepostIcon />
              <span>0</span>
            </div>
            <div className="post-action">
              <PostLikeIcon />
              <span>0</span>
            </div>
            <div className="post-action">
              <ViewIcon />
              <span>0</span>
            </div>
            <div className="post-action">
              <PostSaveIcon />
              <span>{postData?.views || 0}</span>
            </div>
          </div>
        </div>
        <div className="post-comments">
          <h3 className="post-comments-title">{translateText("Comments")}</h3>
          {postData?.comments?.length ? (
            <></>
          ) : (
            <>
              <br />
              <EmptyList />
              <br />
            </>
          )}
        </div>
      </Body>
    </MainModal>
  );
};

export default SentimentPostModal;
