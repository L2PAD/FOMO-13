import React, { FC, useState } from "react";
import { CloseIcon } from "../../../../global/Icons";
import {
  ReplyWrapper,
  MessageWrapper,
  SubmitButton,
  ButtonWrapper,
} from "./styles";

interface Props {
  topicId: string;
  onSubmit: (text: string) => Promise<void>;
  onClose: () => void;
}

const CreateReply: FC<Props> = ({ topicId, onSubmit, onClose }) => {
  const [commentText, setCommentText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(commentText.trim());
      setCommentText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ReplyWrapper className="subitem">
      <ButtonWrapper
        onClick={() => {
          if (isSubmitting) return;
          onClose();
          setCommentText("");
        }}
      >
        <CloseIcon />
      </ButtonWrapper>
      <MessageWrapper>
        <p>Comment</p>
        <textarea
          value={commentText}
          disabled={isSubmitting}
          onChange={(e: any) => setCommentText(e.target.value)}
          placeholder="Your comment... "
        />
      </MessageWrapper>
      <SubmitButton disabled={isSubmitting || !commentText.trim()} onClick={handleSubmit}>
        Add comment
      </SubmitButton>
    </ReplyWrapper>
  );
};

export default CreateReply;
