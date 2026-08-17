import React, { FC, useContext } from "react";
import styled from "styled-components";
import OtcLike from "../../Icons/OtcLike";
import OtcDisike from "../../Icons/OtcDislike";
import { AuthContext } from "../../Layout";
import { toast } from "react-toastify";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
`;

const ButtonWrapper = styled.div`
  position: relative;

  & .value-icon {
    position: absolute;
    top: -10px;
    right: -14px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 9px;
    border-radius: 50%;
    font-weight: var(--font-weight-semibold);
    box-shadow: 2px 2px 1px -1px var(--main-gray);
  }
`;

interface IProps {
  likes?: Array<any>;
  dislikes?: Array<any>;
  likesCount?: number;
  dislikesCount?: number;
  userReaction?: "like" | "dislike" | null;
  onLikeClick: () => void;
  onDislikeClick: () => void;
}

const EntityLikes: FC<IProps> = ({
  likes = [],
  dislikes = [],
  likesCount,
  dislikesCount,
  userReaction,
  onLikeClick,
  onDislikeClick,
}) => {
  const { userData } = useContext(AuthContext);
  const userId = userData?._id ? String(userData._id) : "";

  const getReactionUserId = (reaction: any): string => {
    if (!reaction) return "";
    if (typeof reaction === "string") return reaction;
    if (typeof reaction.userId === "string") return reaction.userId;
    if (reaction.userId?._id) return String(reaction.userId._id);
    if (reaction._id) return String(reaction._id);
    if (reaction.id) return String(reaction.id);

    return "";
  };

  const hasUserReaction = (items: Array<any>): boolean => {
    if (!userId) return false;

    return items.some((item) => getReactionUserId(item) === userId);
  };

  const likeValue = likesCount ?? likes.length;
  const dislikeValue = dislikesCount ?? dislikes.length;
  const isLikeActive =
    userReaction === "like" || (!userReaction && hasUserReaction(likes));
  const isDislikeActive =
    userReaction === "dislike" || (!userReaction && hasUserReaction(dislikes));

  const sendAuthError = (): void => {
    toast.error(
      <div>
        <h3>Error!</h3>
        <p>Full authorization required</p>
      </div>
    );
  };

  return (
    <Wrapper>
      <ButtonWrapper>
        <button onClick={userData?.isFullAuth ? onLikeClick : sendAuthError}>
          <OtcLike status={isLikeActive ? "active" : "default"} />
          {likeValue > 0 ? (
            <div className="value-icon">{likeValue}</div>
          ) : (
            <></>
          )}
        </button>
      </ButtonWrapper>
      <ButtonWrapper>
        <button onClick={userData?.isFullAuth ? onDislikeClick : sendAuthError}>
          <OtcDisike
            status={isDislikeActive ? "active" : "default"}
          />
          {dislikeValue > 0 ? (
            <div className="value-icon">{dislikeValue}</div>
          ) : (
            <></>
          )}
        </button>
      </ButtonWrapper>
    </Wrapper>
  );
};

export default EntityLikes;
