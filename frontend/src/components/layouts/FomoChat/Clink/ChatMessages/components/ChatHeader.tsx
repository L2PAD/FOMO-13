import React, { FC } from "react";
import loader from "../../../../../services/loader";
import { formatOnlineStatus } from "../../../../../helpers/formatOnlineStatus";
import UserAvatar from "../../../../../common/UserAvatar";
import VerticalDotsIcon from "../../../../../common/Icons/vertical_dots_icon";
import { CloseIcon } from "../../../../../../assets";
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

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M15 18L9 12L15 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MaximizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8 3H5C3.89543 3 3 3.89543 3 5V8M16 3H19C20.1046 3 21 3.89543 21 5V8M21 16V19C21 20.1046 20.1046 21 19 21H16M8 21H5C3.89543 21 3 20.1046 3 19V16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MinimizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8 3V6C8 7.10457 7.10457 8 6 8H3M16 3V6C16 7.10457 16.8954 8 18 8H21M21 16H18C16.8954 16 16 16.8954 16 18V21M3 16H6C7.10457 16 8 16.8954 8 18V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BlockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M4.34323 15.6569L15.6569 4.34316M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
      stroke="#FF5857"
      strokeLinecap="round"
    />
  </svg>
);

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
  onBackToChats,
}) => {
  const displayUser = getDisplayChatUser(chat);
  const support = isSupportUser(displayUser);
  const status = support ? "support" : formatOnlineStatus(displayUser?.onlineDate);
  const displayName = getSupportAwareName(displayUser);
  const displayAvatar = getSupportAwareAvatar(
    displayUser,
    displayUser?.photo ? loader(displayUser.photo) : displayUser?.twitterData?.photo || ""
  );

  return (
    <Header>
      <HeaderUser>
        {onBackToChats && (
          <button className="back-to-chats" onClick={onBackToChats} title="Back to chats">
            <BackIcon />
          </button>
        )}
        <UserAvatar
          size="small"
          variant="default"
          avatar={displayAvatar || ""}
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
            {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
          </button>
        )}
        <div style={{ position: "relative" }} ref={popoverRef}>
          <button className={showPopover ? "active" : ""} onClick={onTogglePopover}>
            <VerticalDotsIcon />
          </button>
          {showPopover && (
            <div className="popover-menu">
              <button className="popover-item" onClick={onShowInfo}>
                <span>Info</span>
                <InfoIcon />
              </button>
              <hr />
              <button
                className="popover-item delete"
                onClick={isBlocked ? onUnblock : onBlock}
              >
                <span>{isBlocked ? "Unblock" : "Block"}</span>
                <BlockIcon />
              </button>
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} title="Close">
            <CloseIcon fill="#728094" />
          </button>
        )}
      </HeaderActions>
    </Header>
  );
};

export default ChatHeader;
