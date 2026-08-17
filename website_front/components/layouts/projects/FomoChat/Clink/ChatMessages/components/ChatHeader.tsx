import React, { FC } from "react";
import { ChevronLeft, EllipsisIcon, Info, Maximize2, Minimize2, X } from "lucide-react";
import imageLoader from "../../../../../../../helpers/imageLoader";
import { formatOnlineStatus } from "../../../../../../../helpers/formatOnlineStatus";
import UserAvatar from "../../../../../../global/common/UserAvatar";
import {
    getDisplayChatUser,
    getSupportAwareAvatar,
    getSupportAwareName,
    isSupportUser,
} from "../../supportIdentity";
import { Header, HeaderActions, HeaderUser, Username } from "../styles";

interface ChatHeaderProps {
    chat: any;
    showPopover: boolean;
    onTogglePopover: () => void;
    onShowInfo: () => void;
    onBlock: () => void;
    onUnblock: () => void;
    isBlocked: boolean;
    popoverRef: React.RefObject<HTMLDivElement>;
    onToggleFullscreen?: () => void;
    isFullscreen?: boolean;
    onClose?: () => void;
    onBackToChats?: () => void;
}

const ChatHeader: FC<ChatHeaderProps> = ({
    chat,
    showPopover,
    onTogglePopover,
    onShowInfo,
    onBlock,
    onUnblock,
    isBlocked,
    popoverRef,
    onToggleFullscreen,
    isFullscreen,
    onClose,
    onBackToChats
}) => {
    const displayUser = getDisplayChatUser(chat);
    const support = isSupportUser(displayUser);
    const status = support ? "support" : formatOnlineStatus(displayUser?.onlineDate);
    const displayName = getSupportAwareName(displayUser);
    const displayAvatar = getSupportAwareAvatar(
        displayUser,
        displayUser?.photo ? imageLoader(displayUser.photo) : displayUser?.twitterData?.photo
    );

    return (
        <Header>
            <HeaderUser>
                {onBackToChats && (
                    <button className="back-to-chats" onClick={onBackToChats} title="Back to chats">
                        <ChevronLeft width={18} />
                    </button>
                )}
                <UserAvatar
                    size="small"
                    variant="default"
                    avatar={displayAvatar}
                    name={displayName}
                />
                <Username>
                    {displayName}
                    <p className={status}>{status}</p>
                </Username>
            </HeaderUser>

            <HeaderActions>
                {onToggleFullscreen && (
                    <button
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
                    >
                        {isFullscreen ? <Minimize2 width={16} /> : <Maximize2 width={16} />}
                    </button>
                )}
                <div style={{ position: "relative" }} ref={popoverRef}>
                    <button
                        className={showPopover ? "active" : ""}
                        onClick={onTogglePopover}
                    >
                        <EllipsisIcon transform="rotate(90)" width={16} />
                    </button>
                    {showPopover && (
                        <div className="popover-menu">
                            <button className="popover-item" onClick={onShowInfo}>
                                <span>Info</span>
                                <Info width={20} />
                            </button>
                            <hr />
                            <button className="popover-item delete" onClick={isBlocked ? onUnblock : onBlock}>
                                <span>{isBlocked ? 'Unblock' : 'Block'}</span>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M4.34323 15.6569L15.6569 4.34316M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
                                        stroke="#FF5857"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        title="Close"
                    >
                        <X width={16} />
                    </button>
                )}
            </HeaderActions>


        </Header>
    );
};

export default ChatHeader;
