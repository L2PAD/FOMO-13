import React, { FC } from "react";

interface MessageActionsProps {
  onReply: () => void;
  onShowMenu: () => void;
  showPopover?: boolean;
  popoverElement?: React.ReactNode;
}

const MessageActions: FC<MessageActionsProps> = ({
  onReply,
  onShowMenu,
  showPopover,
  popoverElement,
}) => {
  return (
    <div className="message-actions">
      <button className="action-btn" onClick={onReply}>
        Reply
      </button>
      <button className="action-btn" onClick={onShowMenu}>
        More
      </button>
      {showPopover && popoverElement}
    </div>
  );
};

export default MessageActions;
