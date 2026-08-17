import React, { FC } from "react";

interface ReplyPreviewProps {
  authorName: string;
  message: string;
}

const ReplyPreview: FC<ReplyPreviewProps> = ({ authorName, message }) => {
  return (
    <div className="reply-preview">
      <span className="reply-author">{authorName}</span>
      <span className="reply-text">{message}</span>
    </div>
  );
};

export default ReplyPreview;
