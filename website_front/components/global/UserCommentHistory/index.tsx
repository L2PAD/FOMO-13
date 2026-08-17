import React, { FC } from "react";
import { Wrapper } from "./styles";
import { useQuery } from "react-query";
import getComments from "../../../http/comments/getComments";
import EmptySection from "../EmptySection";
import { IComment } from "../../../types/global_types";
import Comment from "../common/Comment";
import addReaction from "../../../http/comments/addReaction";
import deleteComment from "../../../http/comments/deleteComment";

interface IProps {
  userId?: string;
}
const UserCommentHistory: FC<IProps> = ({ userId }) => {
  const { data, refetch } = useQuery(
    ["comment-history", userId],
    () => {
      return getComments(
        userId ? `comments/user/${userId}` : "comments/user/all"
      );
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const onLike = async (id: string): Promise<void> => {
    const { isSuccess } = await addReaction(id, "like");

    if (isSuccess && refetch) refetch();
  };

  const onDislike = async (id: string): Promise<void> => {
    const { isSuccess } = await addReaction(id, "dislike");

    if (isSuccess && refetch) refetch();
  };

  const removeComment = async (id: string): Promise<void> => {
    await deleteComment(id);
    refetch && refetch();
  };

  return (
    <Wrapper>
      {data?.comments?.length ? (
        data?.comments.map((item: IComment) => {
          return (
            <Comment
              userId={String(item.authorId)}
              isHistory
              comment={item}
              onLike={onLike}
              onDislike={onDislike}
              removeComment={removeComment}
            />
          );
        })
      ) : (
        <EmptySection description="" />
      )}
    </Wrapper>
  );
};

export default UserCommentHistory;
