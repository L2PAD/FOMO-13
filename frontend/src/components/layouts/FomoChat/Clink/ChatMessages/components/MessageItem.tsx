import React, { FC } from "react";
import { IMessage } from "../../../../../types/global_types";
import loader from "../../../../../services/loader";
import changeDateType from "../../../../../helpers/changeDateType";
import {
  getSupportAwareAvatar,
  getSupportAwareName,
} from "../../supportIdentity";
import {
  MessageItem as StyledMessageItem,
  UserData,
  Username,
  Date,
  MessageBody,
} from "../styles";
import ReplyPreview from "./ReplyPreview";
import MessageAttachments from "./MessageAttachments";
import MessageActions from "./MessageActions";
import MessagePopover from "./MessagePopover";

interface MessageItemProps {
  message: IMessage;
  isMyMessage: boolean;
  isLastMessage?: boolean;
  isFirstMessage?: boolean;
  isHovered: boolean;
  isMobileView: boolean;
  showPopover: boolean;
  currentUserId?: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onReply: () => void;
  onShowPopover: () => void;
  onForward: () => void;
  onCopy: () => void;
  onReport: () => void;
  popoverRef?: React.RefObject<HTMLDivElement>;
}

const MessageItemComponent: FC<MessageItemProps> = ({
  message,
  isMyMessage,
  isLastMessage = false,
  isFirstMessage = false,
  isHovered,
  isMobileView,
  showPopover,
  currentUserId,
  onMouseEnter,
  onMouseLeave,
  onReply,
  onShowPopover,
  onForward,
  onCopy,
  onReport,
  popoverRef,
}) => {
  const isReported = !!(
    currentUserId && message.reports?.includes(currentUserId)
  );
  const senderName = getSupportAwareName(message.sender);
  const senderAvatar = getSupportAwareAvatar(
    message.sender,
    message.sender?.photo
      ? loader(message.sender.photo)
      : message.sender?.twitterData?.photo
  );
  const replySenderName = getSupportAwareName(message.replyToMessage?.sender);
  const handleMessageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isMobileView) return;

    const target = event.target as HTMLElement;
    if (
      target.closest(".message-actions") ||
      target.closest(".message-popover") ||
      target.closest("a")
    ) {
      return;
    }

    if (isHovered) {
      onMouseLeave();
      return;
    }

    onMouseEnter();
  };

  return (
    <StyledMessageItem
      isMyMessage={isMyMessage}
      onMouseEnter={isMobileView ? undefined : onMouseEnter}
      onMouseLeave={isMobileView ? undefined : onMouseLeave}
    >
      <UserData className="user-data">
        <img src={senderAvatar} alt={senderName} />
        <Username className="user-data-name">{senderName}</Username>
        <Date className="user-data-date">{changeDateType(message.date)}</Date>
      </UserData>
      <div>
        <MessageBody
          className="message-body"
          onClick={handleMessageClick}
          style={{
            position: "relative",
            cursor: isMobileView ? "pointer" : "default",
            zIndex: isHovered ? 1 : "auto",
          }}
        >
          {message.replyToMessage?.message && (
            <ReplyPreview
              authorName={replySenderName || "User"}
              message={message.replyToMessage.message}
            />
          )}
          {message.message}
          <MessageAttachments attachments={message.attachments || []} />
          {isHovered && (
            <MessageActions
              onReply={onReply}
              onShowMenu={onShowPopover}
              showPopover={showPopover}
              popoverElement={
                <MessagePopover
                  messageDate={message.date}
                  isLastMessage={isLastMessage}
                  isFirstMessage={isFirstMessage}
                  isReported={isReported}
                  onForward={onForward}
                  onCopy={onCopy}
                  onReport={onReport}
                  innerRef={popoverRef}
                />
              }
            />
          )}
        </MessageBody>
      </div>
    </StyledMessageItem>
  );
};

export default MessageItemComponent;
