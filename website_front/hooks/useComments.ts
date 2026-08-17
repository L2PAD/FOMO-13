import { useContext, useMemo } from "react";
import { LoadingContext } from "../components/global/Layout";
import { useQuery } from "react-query";
import { AuthContext } from "../components/global/Layout";
import { IComment } from "../types/global_types";
import addComment from "../http/comments/addComment";
import getComments from "../http/comments/getComments";
import { useRouter } from "next/router";

const useComments = (
  getPath: string,
  createPath: string
): {
  comments: Array<IComment>;
  confirmAddComment: (
    text: string,
    isTopic?: boolean,
    topicName?: string
  ) => Promise<void>;
  refetch: any;
} => {
  const queryKey = useMemo(() => ["comments", getPath], [getPath]);
  const { data, refetch } = useQuery(queryKey, () => getComments(getPath), {
    refetchOnWindowFocus: false,
  });
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const path = useRouter().pathname;

  const confirmAddComment = async (
    text: string,
    isTopic?: boolean,
    topicName?: string
  ): Promise<void> => {
    loadingStateHandler(true);

    if (!userData.isFullAuth) {
      loadingStateHandler(false);
      return;
    }

    const newComment: Partial<IComment> & Record<string, any> = {
      text,
      isTopic: !!isTopic,
      path,
    };

    const normalizedTopicName = topicName?.trim();
    if (isTopic && normalizedTopicName) {
      newComment.topicName = normalizedTopicName;
    }

    const { isSuccess } = await addComment(createPath, newComment);

    if (isSuccess) {
      await refetch();
    }

    loadingStateHandler(false);
  };

  const commentItems = Array.isArray(data?.comments)
    ? (data?.comments as Array<IComment>)
    : [];
  const commentsList: Array<IComment> = [...commentItems].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

  return { comments: commentsList, confirmAddComment, refetch };
};

export default useComments;
