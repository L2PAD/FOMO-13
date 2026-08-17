/* eslint-disable */
import React, { useState, useContext, FC } from "react";
import { toast } from "react-toastify";
import addReaction from "../../../http/comments/addReaction";
import EmptyComments from "../EmptyComments";
import { AuthContext } from "../Layout";
import { IComment } from "../../../types/global_types";
import Comment from "../common/Comment";
import Checkbox from "../common/Checkbox";
import Input from "../common/Input";
import deleteComment from "../../../http/comments/deleteComment";
import {
  TopicWrapper,
  CommentActionsWrapper,
  CommentsMainWrapper,
  CommentsTitle,
  CommentsWrapper,
  PublishButton,
  YourCommentTextarea,
  YourCommentWrapper,
  CommentBlockWrapper,
  TopicInputWrapper,
} from "./styles";
import ReportModal from "../modals/ReportModal";

interface IProps {
  items?: Array<IComment> | undefined;
  refetch?: () => void;
  addComment?: (
    text: string,
    isTopic?: boolean,
    topicName?: string
  ) => Promise<void>;
}

const CommentBlock: FC<IProps> = ({ items, refetch, addComment }) => {
  const { userData } = useContext(AuthContext);
  const [topic, setTopic] = useState(false);
  const [value, setValue] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [reportComment, setReportComment] = useState<IComment | null>(null);
  const isFullAuth = !!userData?.isFullAuth;
  const userId = userData?._id || "-";

  const onLike = async (id: string): Promise<void> => {
    if (!isFullAuth) {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>You need to be fully logged in to add reaction</p>
        </div>
      );
      return;
    }

    const { isSuccess } = await addReaction(id, "like");

    if (isSuccess && refetch) refetch();
  };

  const onDislike = async (id: string): Promise<void> => {
    if (!isFullAuth) {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>You need to be fully logged in to add reaction</p>
        </div>
      );
      return;
    }

    const { isSuccess } = await addReaction(id, "dislike");

    if (isSuccess && refetch) refetch();
  };

  const removeComment = async (id: string): Promise<void> => {
    await deleteComment(id);
    refetch && refetch();
  };

  const addReportToComment = async (id: string): Promise<void> => {
    if (!isFullAuth) {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>You need to be fully logged in to add report</p>
        </div>
      );
      return;
    }

    const target = items?.find((c) => c._id === id) || null;
    setReportComment(target);
  };

  return (
    <CommentBlockWrapper>
      <CommentsTitle>Comments</CommentsTitle>
      <CommentsMainWrapper>
        <CommentsWrapper>
          {items?.length ? (
            items.map((item: IComment, i: number) => {
              return (
                <Comment
                  key={i}
                  userId={userId}
                  comment={item}
                  onLike={onLike}
                  onDislike={onDislike}
                  removeComment={removeComment}
                  addReport={addReportToComment}
                />
              );
            })
          ) : (
            <EmptyComments />
          )}
        </CommentsWrapper>
        <YourCommentWrapper>
          <YourCommentTextarea
            value={text}
            onChange={(e: any) => setText(e.target.value)}
            name="comment"
            placeholder="Type your comment"
          />
          <TopicWrapper>
            <Checkbox
              checked={topic}
              onChange={() => setTopic((prevTopic) => !prevTopic)}
              label="Want to add your comment to the topic?"
            />
            {topic ? (
              <TopicInputWrapper>
                <Input
                  type="text"
                  placeholder="Enter the topic name"
                  labelText="Topic name"
                  onChange={(value) => setValue(value)}
                  value={value}
                />
              </TopicInputWrapper>
            ) : (
              <></>
            )}
          </TopicWrapper>
          <CommentActionsWrapper>
            <PublishButton
              disabled={!isFullAuth}
              onClick={() => {
                addComment && addComment(text, topic, value);
                setText("");
                setValue("");
              }}
            >
              Add comment
            </PublishButton>
          </CommentActionsWrapper>
        </YourCommentWrapper>
      </CommentsMainWrapper>

      {reportComment ? (
        <ReportModal
          isVisible={!!reportComment}
          onClose={() => setReportComment(null)}
          targetType="COMMENT"
          targetId={reportComment._id || ""}
          targetLabel="comment"
          targetSnapshot={{
            text: reportComment.text,
            author: reportComment.author?.[0]?.username || "",
            authorId: reportComment.author?.[0]?._id || "",
            page: typeof window !== "undefined" ? window.location.pathname : "",
            commentDate: reportComment.date,
          }}
        />
      ) : null}
    </CommentBlockWrapper>
  );
};

export default CommentBlock;
