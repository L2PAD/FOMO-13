import React, { FC, useEffect, useState } from "react";
import { IMessage } from "../../../../../types/global_types";
import { Body, EmptyWrapper } from "../styles";
import LoadingSpinner from "./LoadingSpinner";
import LoadMoreButton from "./LoadMoreButton";
import MessageItemComponent from "./MessageItem";

interface MessageListProps {
  messages: IMessage[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentUserId?: string;
  bodyRef: React.RefObject<HTMLDivElement>;
  hoveredMessageId: string | null;
  showMessagePopover: string | null;
  messagePopoverRef: React.RefObject<HTMLDivElement>;
  onLoadMore: () => void;
  onMessageHover: (id: string | null) => void;
  onMessageLeave: () => void;
  onReply: (message: IMessage) => void;
  onShowPopover: (id: string) => void;
  onForward: (message: IMessage) => void;
  onCopy: (text: string) => void;
  onReport: (message: IMessage) => void;
  isFullscreen?: boolean;
}

const MessageList: FC<MessageListProps> = ({
  messages,
  isLoading,
  isLoadingMore,
  hasMore,
  currentUserId,
  bodyRef,
  hoveredMessageId,
  showMessagePopover,
  messagePopoverRef,
  onLoadMore,
  onMessageHover,
  onMessageLeave,
  onReply,
  onShowPopover,
  onForward,
  onCopy,
  onReport,
  isFullscreen,
}) => {
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateIsMobileView = () => setIsMobileView(mediaQuery.matches);

    updateIsMobileView();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateIsMobileView);
      return () => mediaQuery.removeEventListener("change", updateIsMobileView);
    }

    mediaQuery.addListener(updateIsMobileView);
    return () => mediaQuery.removeListener(updateIsMobileView);
  }, []);

  return (
    <Body ref={bodyRef} className={`chat-body ${isFullscreen ? "fullscreen" : ""}`}>
      {isLoadingMore && <LoadingSpinner text="Loading messages..." />}

      {hasMore && !isLoadingMore && (
        <LoadMoreButton onClick={onLoadMore} disabled={isLoadingMore} />
      )}

      {messages?.length ? (
        messages.map((message: IMessage, index: number) => (
          <MessageItemComponent
            key={message._id}
            message={message}
            isMyMessage={message.sender?._id === currentUserId}
            isLastMessage={index === messages.length - 1}
            isFirstMessage={index === 0}
            isHovered={hoveredMessageId === message._id}
            isMobileView={isMobileView}
            showPopover={showMessagePopover === message._id}
            currentUserId={currentUserId}
            onMouseEnter={() => onMessageHover(message._id!)}
            onMouseLeave={onMessageLeave}
            onReply={() => onReply(message)}
            onShowPopover={() => onShowPopover(message._id!)}
            onForward={() => onForward(message)}
            onCopy={() => onCopy(message.message)}
            onReport={() => onReport(message)}
            popoverRef={messagePopoverRef}
          />
        ))
      ) : isLoading ? (
        <EmptyWrapper className="loading-messages">
          <LoadingSpinner fullScreen text="Loading messages..." />
        </EmptyWrapper>
      ) : (
        <EmptyWrapper>
          <div style={{ textAlign: "center", color: "#728094" }}>
            No messages yet
          </div>
        </EmptyWrapper>
      )}
    </Body>
  );
};

export default MessageList;
