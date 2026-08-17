import React, { FC, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useChat } from "../../../../hooks/useChat";
import uploadAttachment, {
  UploadedAttachment,
} from "../../../../services/messages/uploadAttachment";
import reportMessage from "../../../../services/messages/reportMessage";
import blockUser from "../../../../services/user/blockUser";
import unblockUser from "../../../../services/user/unblockUser";
import checkBlocked from "../../../../services/user/checkBlocked";
import { IMessage } from "../../../../types/global_types";
import ForwardModal from "../modals/ForwardModal";
import DeleteMessageModal from "../modals/DeleteMessageModal";
import DeleteChatModal from "../modals/DeleteChatModal";
import ChatHeader from "./components/ChatHeader";
import ChatInfoPage from "./components/ChatInfoPage";
import MessageList from "./components/MessageList";
import ReplySection from "./components/ReplySection";
import ChatInput from "./components/ChatInput";
import BlockedMessage from "./components/BlockedMessage";
import { Wrapper, EmptySectionWrapper } from "./styles";

const AUTOSCROLL_THRESHOLD_PX = 100;

interface IProps {
  userId?: string;
  chat: any;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onClose?: () => void;
  className?: string;
  onBackToChats?: () => void;
  userData: any;
  token: string;
}

const ChatMessages: FC<IProps> = ({
  userId,
  chat,
  onToggleFullscreen,
  isFullscreen,
  onClose,
  className,
  onBackToChats,
  userData,
  token,
}) => {
  const handleMessageError = (error: { message: string; statusCode: number }) => {
    if (error.statusCode === 403) {
      setIsBlockedByThem(true);
      toast.error(error.message || "You are blocked");
    } else {
      toast.error(error.message || "Failed to send message");
    }
  };

  const { sendMessage, messages, hasMore, isLoading, isLoadingMore, loadMoreMessages, updateMessage } =
    useChat(String(chat?._id), token, userData, handleMessageError);

  const [showPopover, setShowPopover] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showInfoPage, setShowInfoPage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<any>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showMessagePopover, setShowMessagePopover] = useState<string | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const messagePopoverRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const scrollHeightRef = useRef<number>(0);
  const isLoadingOldMessagesRef = useRef<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(true);
  const isNearBottomRef = useRef<boolean>(true);

  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!chat?.user?._id || !userData?._id) return;
      const { isBlocked, isBlockedByThem } = await checkBlocked(chat.user._id);
      setIsBlockedByMe(isBlocked);
      setIsBlockedByThem(isBlockedByThem);
    };
    checkBlockStatus();
  }, [chat?.user?._id, userData?._id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
      if (
        messagePopoverRef.current &&
        !messagePopoverRef.current.contains(event.target as Node)
      ) {
        setShowMessagePopover(null);
      }
    };

    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopover, showMessagePopover]);

  const scrollToBottom = (force = false) => {
    if (bodyRef.current) {
      requestAnimationFrame(() => {
        if (bodyRef.current) {
          if (force) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
          } else {
            const { scrollTop, scrollHeight, clientHeight } = bodyRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            if (isNearBottom) {
              bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    const updateNearBottom = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      isNearBottomRef.current = distanceFromBottom <= AUTOSCROLL_THRESHOLD_PX;
    };

    updateNearBottom();
    container.addEventListener("scroll", updateNearBottom);

    return () => {
      container.removeEventListener("scroll", updateNearBottom);
    };
  }, [chat?._id]);

  const confirmSendMessage = async (): Promise<void> => {
    if (!message.trim() && attachments.length === 0) return;

    sendMessage({
      to: String(chat.user._id),
      message: message.trim(),
      chatId: chat._id,
      title: "",
      attachments,
      replyTo: replyingTo?._id,
    });

    setMessage("");
    setAttachments([]);
    setReplyingTo(null);

    requestAnimationFrame(() => {
      scrollToBottom(true);
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowMessagePopover(null);
  };

  const handleForward = (msg: any) => {
    setSelectedMessageForAction(msg);
    setShowForwardModal(true);
    setShowMessagePopover(null);
  };

  const handleReply = (msg: any) => {
    setReplyingTo(msg);
    setShowMessagePopover(null);
  };

  const handleShowInfo = () => {
    setShowPopover(false);
    setShowInfoPage(true);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploaded: UploadedAttachment[] = [];

    for (const file of files) {
      const { isSuccess, attachment } = await uploadAttachment(file);
      if (isSuccess && attachment?.url) {
        uploaded.push(attachment);
      }
    }

    setAttachments((prev) => [...prev, ...uploaded]);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isLoadingMore && bodyRef.current) {
      scrollHeightRef.current = bodyRef.current.scrollHeight;
      isLoadingOldMessagesRef.current = true;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    if (!bodyRef.current) return;

    const isNewMessageArrived = messages.length > prevMessagesLengthRef.current;

    if (
      isLoadingOldMessagesRef.current &&
      isNewMessageArrived &&
      scrollHeightRef.current > 0
    ) {
      const newScrollHeight = bodyRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - scrollHeightRef.current;
      if (scrollDiff > 0) {
        bodyRef.current.scrollTop = scrollDiff;
      }
      scrollHeightRef.current = 0;
      isLoadingOldMessagesRef.current = false;
    } else if (!isLoadingOldMessagesRef.current && isNewMessageArrived && isNearBottomRef.current) {
      scrollToBottom(true);
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (chat?._id) {
      prevMessagesLengthRef.current = 0;
      scrollHeightRef.current = 0;
      isLoadingOldMessagesRef.current = false;
      isInitialLoadRef.current = true;
      isNearBottomRef.current = true;
    }
  }, [chat?._id]);

  useEffect(() => {
    if (!isLoading && isInitialLoadRef.current && messages.length > 0) {
      isInitialLoadRef.current = false;
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
  }, [isLoading, messages.length]);

  const handleForwardConfirm = (users: any[]) => {
    console.log("Forward to:", users, "Message:", selectedMessageForAction);
  };

  const handleDeleteConfirm = (deleteForBoth: boolean) => {
    console.log("Delete message:", selectedMessageForAction, "For both:", deleteForBoth);
  };

  const handleDeleteChatConfirm = () => {
    console.log("Delete entire chat with:", chat?.user);
  };

  const handleTogglePopover = (messageId: string) => {
    setShowMessagePopover((prev) => (prev === messageId ? null : messageId));
  };

  const handleMessageLeave = () => {
    setHoveredMessageId(null);
    setShowMessagePopover(null);
  };

  const handleReport = async (msg: any) => {
    setShowMessagePopover(null);

    const { isSuccess, error } = await reportMessage(msg._id);

    if (isSuccess) {
      toast.success("Message reported successfully");

      if (userData?._id) {
        updateMessage(msg._id, {
          reports: [...(msg.reports || []), userData._id],
        });
      }
    } else {
      toast.error(error || "Failed to report message");
    }
  };

  const handleBlock = async () => {
    if (!chat?.user?._id) return;

    setShowPopover(false);
    const { isSuccess, error } = await blockUser(chat.user._id);

    if (isSuccess) {
      toast.success("User blocked successfully");
      setIsBlockedByMe(true);
    } else {
      toast.error(error || "Failed to block user");
    }
  };

  const handleUnblock = async () => {
    if (!chat?.user?._id) return;

    const { isSuccess, error } = await unblockUser(chat.user._id);

    if (isSuccess) {
      toast.success("User unblocked successfully");
      setIsBlockedByMe(false);
    } else {
      toast.error(error || "Failed to unblock user");
    }
  };

  if (!chat) {
    return (
      <Wrapper className={`${className || ""} ${isFullscreen ? "fullscreen" : ""}`.trim()}>
        <EmptySectionWrapper>
          <div style={{ color: "#728094" }}>Select a chat to start</div>
        </EmptySectionWrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper className={`${className || ""} ${isFullscreen ? "fullscreen" : ""}`.trim()}>
      <ChatHeader
        chat={chat}
        onBackToChats={onBackToChats}
        showPopover={showPopover}
        onTogglePopover={() => setShowPopover(!showPopover)}
        onShowInfo={handleShowInfo}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        isBlocked={isBlockedByMe}
        popoverRef={popoverRef}
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
        onClose={onClose}
      />

      {showInfoPage ? (
        <ChatInfoPage chat={chat} onBack={() => setShowInfoPage(false)} />
      ) : isBlockedByMe || isBlockedByThem ? (
        <BlockedMessage
          blockedByMe={isBlockedByMe}
          onUnblock={isBlockedByMe ? handleUnblock : undefined}
        />
      ) : (
        <>
          <MessageList
            messages={messages}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            currentUserId={userData?._id}
            bodyRef={bodyRef}
            hoveredMessageId={hoveredMessageId}
            showMessagePopover={showMessagePopover}
            messagePopoverRef={messagePopoverRef}
            onLoadMore={loadMoreMessages}
            onMessageHover={setHoveredMessageId}
            onMessageLeave={handleMessageLeave}
            onReply={handleReply}
            onShowPopover={handleTogglePopover}
            onForward={handleForward}
            onCopy={handleCopy}
            onReport={handleReport}
            isFullscreen={isFullscreen}
          />

          {replyingTo && (
            <ReplySection
              replyToMessage={replyingTo}
              onClose={() => setReplyingTo(null)}
            />
          )}

          <ChatInput
            message={message}
            attachments={attachments}
            isUploading={isUploading}
            onMessageChange={setMessage}
            onSend={confirmSendMessage}
            onFileChange={handleFileChange}
            onRemoveAttachment={removeAttachment}
            onFileClick={handleFileClick}
            fileInputRef={fileInputRef}
          />
        </>
      )}

      {showForwardModal && (
        <ForwardModal
          onClose={() => setShowForwardModal(false)}
          onConfirm={handleForwardConfirm}
        />
      )}
      {showDeleteModal && (
        <DeleteMessageModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          recipientName={chat?.user?.username || chat?.user?.twitterData?.username}
        />
      )}
      {showDeleteChatModal && (
        <DeleteChatModal
          onClose={() => setShowDeleteChatModal(false)}
          onConfirm={handleDeleteChatConfirm}
          recipientName={chat?.user?.username || chat?.user?.twitterData?.username}
        />
      )}
    </Wrapper>
  );
};

export default ChatMessages;
