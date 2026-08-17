import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import CommentBlock from "../../../../../global/CommentBlock";
import { AuthContext } from "../../../../../global/Layout";
import getComments from "../../../../../../http/comments/getComments";
import addCommentReq from "../../../../../../http/comments/addComment";
import { IComment } from "../../../../../../types/global_types";

interface Props {
  activityId: string;
  isLogin?: boolean;
}

// EL-1: one canonical discussion thread per activity. Reuses the existing FOMO
// CommentBlock + comments API. The page/topic key is stable per activity so the
// same thread renders on the detail page and is counted on the EarlyLand feed.
const activityCommentPath = (activityId: string): string =>
  `comments/earlyland-activity-${activityId}`;

const ActivityDiscussion: FC<Props> = ({ activityId }) => {
  const { userData } = useContext(AuthContext);
  const [comments, setComments] = useState<Array<IComment>>([]);

  const refetch = useCallback(async () => {
    if (!activityId) return;
    const { comments: rows } = await getComments(activityCommentPath(activityId));
    setComments(Array.isArray(rows) ? rows : []);
  }, [activityId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addComment = async (text: string): Promise<void> => {
    if (!userData?.isFullAuth) {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>You need to be fully logged in to add comments</p>
        </div>
      );
      return;
    }
    if (!text || !text.trim()) return;

    const { isSuccess } = await addCommentReq(activityCommentPath(activityId), {
      text: text.trim(),
    });

    if (isSuccess) {
      await refetch();
    } else {
      toast.error("Failed to add comment");
    }
  };

  return (
    <CommentBlock items={comments} refetch={refetch} addComment={addComment} />
  );
};

export default ActivityDiscussion;
