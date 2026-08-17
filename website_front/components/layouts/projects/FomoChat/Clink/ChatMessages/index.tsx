import React, { FC, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useChat } from "../../../../../../hooks/useChat";
import getAuthToken from "../../../../../../http/getAuthToken";
import uploadAttachment, {
  UploadedAttachment,
} from "../../../../../../http/messages/uploadAttachment";
import blockUser from "../../../../../../http/user/blockUser";
import unblockUser from "../../../../../../http/user/unblockUser";
import checkBlocked from "../../../../../../http/user/checkBlocked";
import { AuthContext, LoadingContext } from "../../../../../global/Layout";
import EmptySection from "../../../../../global/EmptySection";
import ForwardModal from "../modals/ForwardModal";
import ReportModal from "../../../../../global/modals/ReportModal";
import ChatHeader from "./components/ChatHeader";
import ChatInfoPage from "./components/ChatInfoPage";
import MessageList from "./components/MessageList";
import ReplySection from "./components/ReplySection";
import ChatInput from "./components/ChatInput";
import BlockedMessage from "./components/BlockedMessage";
import { getDisplayChatUser, getSupportAwareName } from "../supportIdentity";
import { Wrapper, EmptySectionWrapper, CloseButton } from "./styles";
import { CloseIcon } from "../../../../../global/Icons";
import { useTranslation } from "i18n";

const AUTOSCROLL_THRESHOLD_PX = 100;

interface IProps {
  userId?: string
  chat: any;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onClose?: () => void;
  className?: string;
  onBackToChats?: () => void;
}

const ChatMessages: FC<IProps> = ({ userId, chat, onToggleFullscreen, isFullscreen, onClose, className, onBackToChats }) => {
  const { t } = useTranslation();
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);

  const handleMessageError = (error: { message: string; statusCode: number }) => {
    try {
      if (error.statusCode === 403) {
        setIsBlockedByThem(true);
        toast.error(error.message || "You are blocked");
      } else {
        toast.error(error.message || "Failed to send message");
      }
    } catch (err) {
      console.error('Toast error:', err);
    }
  };

  const { sendMessage, messages, hasMore, isLoading, isLoadingMore, loadMoreMessages, updateMessage } = useChat(
    String(chat?._id),
    getAuthToken(),
    userData,
    handleMessageError
  );

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
  const [reportMsg, setReportMsg] = useState<any>(null);
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
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
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

    if (isLoadingOldMessagesRef.current && isNewMessageArrived && scrollHeightRef.current > 0) {
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

  const handleTogglePopover = (messageId: string) => {
    setShowMessagePopover(prev => prev === messageId ? null : messageId);
  };

  const handleMessageLeave = () => {
    setHoveredMessageId(null);
    setShowMessagePopover(null);
  };

  const handleReport = async (msg: any) => {
    setShowMessagePopover(null);
    setReportMsg(msg);
  };

  const handleBlock = async () => {
    if (!chat?.user?._id) return;

    loadingStateHandler(true);
    setShowPopover(false);

    const { isSuccess, error } = await blockUser(chat.user._id);

    loadingStateHandler(false);

    try {
      if (isSuccess) {
        toast.success(t("chat.toast.userBlocked"));
        setIsBlockedByMe(true);
      } else {
        toast.error(error || "Failed to block user");
      }
    } catch (err) {
      console.error('Toast error:', err);
    }
  };

  const handleUnblock = async () => {
    if (!chat?.user?._id) return;

    loadingStateHandler(true);

    const { isSuccess, error } = await unblockUser(chat.user._id);

    loadingStateHandler(false);

    try {
      if (isSuccess) {
        toast.success(t("chat.toast.userUnblocked"));
        setIsBlockedByMe(false);
      } else {
        toast.error(error || "Failed to unblock user");
      }
    } catch (err) {
      console.error('Toast error:', err);
    }
  };

  if (!chat) {
    return (
      <Wrapper className={`${className || ""} ${isFullscreen ? "fullscreen" : ""}`.trim()}>
        <EmptySectionWrapper>
          <EmptySection
            title={t("chat.title")}
            description="Select a user to start a conversation"
          />
        </EmptySectionWrapper>
        {onClose ? (
          <CloseButton onClick={onClose}>
            <CloseIcon fill="var(--main-gray)" />
          </CloseButton>
        ) : (
          <></>
        )}
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

      {reportMsg && (
        <ReportModal
          isVisible={!!reportMsg}
          onClose={() => setReportMsg(null)}
          targetType="MESSAGE"
          targetId={reportMsg._id || ""}
          targetLabel="message"
          targetSnapshot={{
            text: reportMsg.message || reportMsg.text || "",
            author: getSupportAwareName(chat?.user) || chat?.user?.username || "",
            authorId: reportMsg.from || chat?.user?._id || "",
            conversationId: chat?._id || "",
            timestamp: reportMsg.createdAt || reportMsg.date || "",
            participants: [
              userData?.username || "me",
              chat?.user?.username || "counterparty",
            ],
            context: (messages || [])
              .slice(
                Math.max(
                  0,
                  (messages || []).findIndex((m: any) => m._id === reportMsg._id) - 3
                ),
                (messages || []).findIndex((m: any) => m._id === reportMsg._id) + 4
              )
              .map((m: any) => ({
                from: m.from === userData?._id ? "me" : "counterparty",
                message: m.message || m.text || "",
                at: m.createdAt || m.date || "",
                isTarget: m._id === reportMsg._id,
              })),
          }}
        />
      )}

    </Wrapper>
  );
};

export default ChatMessages;
