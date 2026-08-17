import React, { useState } from "react";
import { IChat, IUser } from "../../../types/global_types";
import { Wrapper } from "./styles";
import Chats from "../Clink/Chats";
import ChatMessages from "../Clink/ChatMessages";

interface ModalChatBodyProps {
  userId?: string;
  initialChatId?: string;
  isFullscreen?: boolean;
  setIsFullscreen?: (value: boolean) => void;
  onClose?: () => void;
  userData: IUser;
  token: string;
}

const ModalChatBody: React.FC<ModalChatBodyProps> = ({
  userId,
  initialChatId,
  isFullscreen = false,
  setIsFullscreen,
  onClose,
  userData,
  token,
}) => {
  const [selectedChat, setSelectedChat] = useState<IChat | null>(null);

  const handleToggleFullscreen = () => {
    setIsFullscreen?.(!isFullscreen);
  };

  return (
    <Wrapper
      className={`${isFullscreen ? "fullscreen" : ""} ${
        selectedChat ? "mobile-chat-selected" : "mobile-chat-list"
      }`.trim()}
    >
      <Chats
        userId={userId}
        initialChatId={initialChatId}
        isFullscreen={isFullscreen}
        selectedChat={selectedChat}
        updateSelectedChat={(item: any) => {
          setSelectedChat(item);
        }}
      />
      <ChatMessages
        className="chat-messages-wrapper"
        userId={userId}
        chat={selectedChat}
        onBackToChats={() => setSelectedChat(null)}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        onClose={onClose}
        userData={userData}
        token={token}
      />
    </Wrapper>
  );
};

export default ModalChatBody;
