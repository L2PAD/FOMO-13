import React, { FC } from "react";
import { MessageCircle, Pin as PinChat } from "lucide-react";
import { IChat } from "../../../../../../../types/global_types";
import imageLoader from "../../../../../../../helpers/imageLoader";
import UserAvatar from "../../../../../../global/common/UserAvatar";
import {
    getDisplayChatUser,
    getSupportAwareAvatar,
    getSupportAwareName,
} from "../../supportIdentity";
import {
    ChatInfo,
    ChatItem,
    Message,
    NewMessages,
    SwipeActions,
    SwipeActionButton,
    SwipeWrapper,
    Time,
    Username,
    HoverZone,
} from "../styles";

interface SwipeableChatProps {
    chat: IChat;
    isSelected: boolean;
    translateX: number;
    isDragging: boolean;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onHoverLeft: () => void;
    onHoverRight: () => void;
    onChatClick: () => void;
    onUnread: () => void;
    onPin: () => void;
    onCloseSwipe: () => void;
    truncateMessage: (message: string, maxLength: number) => string;
}

const SwipeableChat: FC<SwipeableChatProps> = ({
    chat,
    isSelected,
    translateX,
    isDragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onHoverLeft,
    onHoverRight,
    onChatClick,
    onUnread,
    onPin,
    onCloseSwipe,
    truncateMessage,
}) => {
    const { lastMessage } = chat;
    const displayUser = getDisplayChatUser(chat);
    const displayName = getSupportAwareName(displayUser);
    const displayAvatar = getSupportAwareAvatar(
        displayUser,
        displayUser?.photo ? imageLoader(displayUser.photo) : displayUser?.twitterData?.photo
    );

    return (
        <SwipeWrapper
            translateX={translateX}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            <HoverZone
                side="right"
                className={`${translateX < 0 ? "active" : ""} ${translateX !== 0 ? "hidden" : ""
                    }`}
                onMouseEnter={onHoverRight}
            />
            <SwipeActions side="right" onMouseLeave={onCloseSwipe}>
                <SwipeActionButton
                    variant="pin"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPin();
                    }}
                >
                    <PinChat />
                    <span>{chat.isPinned ? "Unpin" : "Pin"}</span>
                </SwipeActionButton>
            </SwipeActions>

            <div className="chat-content">
                <ChatItem
                    className={isSelected ? "selected" : ""}
                    onClick={() => {
                        if (translateX === 0) {
                            onChatClick();
                        } else {
                            onCloseSwipe();
                        }
                    }}
                    isNew={false}
                >
                    <UserAvatar
                        size="small"
                        variant="default"
                        avatar={displayAvatar}
                        name={displayName}
                    />
                    <ChatInfo>
                        <Username className="fomo-chat-username">
                            {displayName}
                        </Username>
                        <Message className="fomo-chat-message">
                            {truncateMessage(lastMessage?.message || "", 30)}
                        </Message>
                    </ChatInfo>
                    <Time>
                        {lastMessage?.date
                            ? new Date(lastMessage?.date).toDateString()
                            : ""}
                    </Time>
                    {/* {lastMessage?.isNew ? <NewMessages>1</NewMessages> : <></>} */}
                </ChatItem>
            </div>
        </SwipeWrapper>
    );
};

export default SwipeableChat;
