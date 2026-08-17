import React, { FC } from "react";
import { CornerUpLeft } from "lucide-react";

interface MessageActionsProps {
  onReply: () => void;
  onShowMenu: () => void;
  showPopover?: boolean;
  popoverElement?: React.ReactNode;
}

const MessageActions: FC<MessageActionsProps> = ({ onReply, onShowMenu, showPopover, popoverElement }) => {
  return (
    <div className="message-actions" onClick={(event) => event.stopPropagation()}>
      <button className="action-btn" onClick={onReply}>
        <CornerUpLeft size={16} />
      </button>
      <button className="action-btn" onClick={onShowMenu}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="13" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {showPopover && popoverElement}
    </div>
  );
};

export default MessageActions;
