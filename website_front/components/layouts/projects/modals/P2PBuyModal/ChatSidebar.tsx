import React, { FC, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as S from "./styles";
import { IBuyModalStep } from "./types";
import { IDeal, IChat } from "../../../../../types/global_types";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { getDealSeller, formatCurrency } from "./helpers";
import { useChat } from "../../../../../hooks/useChat";
import { AuthContext } from "../../../../global/Layout";
import getAuthToken from "../../../../../http/getAuthToken";
import createChat from "../../../../../http/messages/createChat";
import uploadAttachment, { UploadedAttachment } from "../../../../../http/messages/uploadAttachment";
import imageLoader from "../../../../../helpers/imageLoader";

const AUTOSCROLL_THRESHOLD_PX = 100;

interface SystemNotification {
    message: string;
    time: string;
    type: "warning" | "success";
}

interface ChatSidebarProps {
    className?: string;
    deal: IDeal | null;
    step: IBuyModalStep;
    formatTime: (seconds: number) => string;
    timeLeft: number;
    releaseTimeLeft: number;
    systemNotifications: SystemNotification[];
    onHideChat?: () => void;
}

const ChatSidebar: FC<ChatSidebarProps> = ({
    className,
    deal,
    step,
    formatTime,
    timeLeft,
    releaseTimeLeft,
    systemNotifications,
    onHideChat,
}) => {
    const { userData } = useContext(AuthContext);
    
    const getOtherParticipant = () => {
        if (!deal || !userData?._id) return null;
        
        const seller = getDealSeller(deal);
        const buyer = deal.type === "sell" ? deal.buyer : deal.creator;
        
        if (seller?._id === userData._id) {
            return buyer;
        }
        if (buyer?._id === userData._id) {
            return seller;
        }
        return deal.buyer?._id !== userData._id ? deal.buyer : deal.creator;
    };
    
    const participant = getOtherParticipant();

    const [chat, setChat] = useState<IChat | null>(null);
    const [message, setMessage] = useState<string>("");
    const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef<number>(0);
    const isInitialLoadRef = useRef<boolean>(true);
    const isNearBottomRef = useRef<boolean>(true);

    const handleMessageError = (error: { message: string; statusCode: number }) => {
        toast.error(error.message || "Failed to send message");
    };

    const { sendMessage, messages, hasMore, isLoading, isLoadingMore, loadMoreMessages } = useChat(
        chat?._id || "",
        getAuthToken(),
        userData,
        handleMessageError
    );

    useEffect(() => {
        const initChat = async () => {
            if (!participant?._id) return;

            setIsChatLoading(true);
            try {
                const { success, data } = await createChat([participant._id]);
                if (success && data) {
                    setChat(data);
                }
            } catch (error) {
                console.error("Failed to create/find chat:", error);
            } finally {
                setIsChatLoading(false);
            }
        };

        initChat();
    }, [participant?._id]);

    const scrollToBottom = (force = false) => {
        if (messagesContainerRef.current) {
            requestAnimationFrame(() => {
                if (messagesContainerRef.current) {
                    if (force) {
                        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                    } else {
                        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
                        if (isNearBottom) {
                            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                        }
                    }
                }
            });
        }
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
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

    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current && isNearBottomRef.current) {
            scrollToBottom(true);
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    useEffect(() => {
        if (!isLoading && isInitialLoadRef.current && messages.length > 0) {
            isInitialLoadRef.current = false;
            setTimeout(() => scrollToBottom(true), 100);
        }
    }, [isLoading, messages.length]);

    useEffect(() => {
        if (chat?._id) {
            prevMessagesLengthRef.current = 0;
            isInitialLoadRef.current = true;
            isNearBottomRef.current = true;
        }
    }, [chat?._id]);

    const handleSendMessage = async () => {
        if ((!message.trim() && attachments.length === 0) || !chat || !participant?._id) return;

        sendMessage({
            to: participant._id,
            message: message.trim(),
            chatId: chat._id!,
            title: "",
            attachments,
        });

        setMessage("");
        setAttachments([]);
        requestAnimationFrame(() => scrollToBottom(true));
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

    const handleScroll = () => {
        if (!messagesContainerRef.current || isLoadingMore || !hasMore) return;

        if (messagesContainerRef.current.scrollTop < 50) {
            loadMoreMessages();
        }
    };

    const formatMessageTime = (date: Date | string) => {
        const d = new Date(date);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();

        const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return isToday ? `Today at ${time}` : `${d.toLocaleDateString()} ${time}`;
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <S.ChatSidebar className={className}>
            <S.ChatHeader>
                <S.ChatHeaderInfo>
                    <S.ChatTitle>
                        Chat with <strong>{participant?.twitterData?.username || participant?.username || 'participant'}</strong>
                    </S.ChatTitle>
                    <S.ChatInfo>
                        <S.MobileStatusRow>
                            {onHideChat && (
                                <S.MobileHideChatButton onClick={onHideChat}>
                                    Hide Chat
                                </S.MobileHideChatButton>
                            )}
                            <S.ChatStatus>
                                {formatTime(
                                    step === "make-payment" ? timeLeft : releaseTimeLeft
                                )}
                                <br />
                                {step === "releasing"
                                    ? "Pending Release"
                                    : step === "completed"
                                        ? "Completed"
                                        : "Pending Payment"}
                            </S.ChatStatus>
                        </S.MobileStatusRow>
                        <S.ChatAmount>
                            Amount
                            <br />
                            <strong>{clarifyAmount(deal?.price || 0)} {formatCurrency(deal?.currency)}</strong>
                        </S.ChatAmount>
                    </S.ChatInfo>
                </S.ChatHeaderInfo>
            </S.ChatHeader>

            <S.ChatWarning>
                Release digital currency only when you have been paid. Do not send
                or receive payments through third-party apps.
            </S.ChatWarning>

            <S.ChatMessages ref={messagesContainerRef} onScroll={handleScroll}>
                {isLoadingMore && (
                    <S.LoadingIndicator>Loading...</S.LoadingIndicator>
                )}

                {(isChatLoading || isLoading) && messages.length === 0 && (
                    <S.LoadingIndicator className="full-height">Loading chat...</S.LoadingIndicator>
                )}

                {messages.map((msg) => {
                    const isMyMessage = msg.sender?._id === userData?._id || msg.from === userData?._id;

                    if (msg.isSystem) {
                        return (
                            <S.SystemNotification key={msg._id} type="warning">
                                <S.NotificationText>{msg.message}</S.NotificationText>
                                {msg.date && <S.NotificationTime>{formatMessageTime(msg.date)}</S.NotificationTime>}
                            </S.SystemNotification>
                        );
                    }

                    return (
                        <S.ChatMessage key={msg._id} isUser={isMyMessage}>
                            <S.ChatMessageContent isUser={isMyMessage}>
                                {msg.message && (
                                    <S.ChatText isUser={isMyMessage}>{msg.message}</S.ChatText>
                                )}

                                {msg.attachments && msg.attachments.length > 0 && (
                                    <S.MessageAttachments>
                                        {msg.attachments.map((att, idx) => (
                                            <S.AttachmentPreview key={idx}>
                                                {att.type?.startsWith('image/') ? (
                                                    <img src={imageLoader(att.url)} alt={att.name || 'attachment'} />
                                                ) : (
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                                                        {att.name || 'File'}
                                                    </a>
                                                )}
                                            </S.AttachmentPreview>
                                        ))}
                                    </S.MessageAttachments>
                                )}

                                {msg.date && <S.ChatTime>{formatMessageTime(msg.date)}</S.ChatTime>}
                            </S.ChatMessageContent>
                        </S.ChatMessage>
                    );
                })}

                <div ref={messagesEndRef} />
            </S.ChatMessages>

            {attachments.length > 0 && (
                <S.AttachmentsPreview>
                    {attachments.map((att, idx) => (
                        <S.AttachmentItem key={idx}>
                            <span>{att.name || 'File'}</span>
                            <button onClick={() => removeAttachment(idx)}>×</button>
                        </S.AttachmentItem>
                    ))}
                </S.AttachmentsPreview>
            )}

            <S.ChatInputWrapper>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    multiple
                />
                <div className="chat-input-container">
                    <S.ChatInput
                        placeholder="Type message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={!chat || isChatLoading}
                    />
                    <S.AttachButton onClick={handleFileClick} disabled={isUploading}>
                        {isUploading ? (
                            <span>...</span>
                        ) : (
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M11.8399 7.14146L7.21629 11.765C5.95785 13.0235 4.07051 13.1721 2.78745 11.889C1.52901 10.6306 1.69256 8.80744 2.97563 7.52437L8.17301 2.32699C8.96846 1.53154 10.2491 1.53154 11.0445 2.32699C11.84 3.12244 11.84 4.40305 11.0445 5.1985L5.75587 10.4871C5.3594 10.8836 4.71659 10.8836 4.32012 10.4871C3.92365 10.0907 3.92365 9.44786 4.32012 9.05139L9.03495 4.33655"
                                    stroke="#728094"
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}
                    </S.AttachButton>
                </div>
                <S.SendButton onClick={handleSendMessage} disabled={!chat || isChatLoading || (!message.trim() && attachments.length === 0)}>
                    Send{" "}
                    <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M11.3911 0.808924L5.17043 7.02957M1.00814 3.90391L10.6949 0.543188C11.2914 0.336227 11.8638 0.908551 11.6568 1.50509L8.29609 11.1919C8.06586 11.8555 7.13399 11.8737 6.87804 11.2195L5.33985 7.28863C5.26303 7.0923 5.1077 6.93697 4.91137 6.86015L0.980453 5.32196C0.326337 5.06601 0.344531 4.13414 1.00814 3.90391Z"
                            stroke="white"
                            strokeLinecap="round"
                        />
                    </svg>
                </S.SendButton>
            </S.ChatInputWrapper>
        </S.ChatSidebar>
    );
};

export default ChatSidebar;
