import React, { FC } from "react";

interface ReplySectionProps {
  replyToMessage: any;
  onClose: () => void;
}

const ReplySection: FC<ReplySectionProps> = ({ replyToMessage, onClose }) => {
  return (
    <div className="reply-section">
      <div className="reply-content">
        <div className="reply-header">
          <span>
            Reply to
            <strong>
              {" "}
              {replyToMessage.sender?.username || "User"}
            </strong>{" "}
          </span>
          <button onClick={onClose}>×</button>
        </div>
        <p>{replyToMessage.message}</p>
      </div>
    </div>
  );
};

export default ReplySection;
