import React, { useState } from "react";
import { IChat } from "../../../../../types/global_types";
import updateMessages from "../../../../../http/messages/updateMessages";
import { Wrapper } from "./styles";
import Chats from "../Clink/Chats";
import ChatMessages from "../Clink/ChatMessages";

interface ModalChatBodyProps {
  userId?: string;
  initialChatId?: string;
  isFullscreen?: boolean;
  setIsFullscreen?: (value: boolean) => void;
  onClose?: () => void;
}

const ModalChatBody: React.FC<ModalChatBodyProps> = ({ userId, initialChatId, isFullscreen = false, setIsFullscreen, onClose }) => {
  const [selectedChat, setSelectedChat] = useState<IChat | null>(null);

  const handleToggleFullscreen = () => {
    setIsFullscreen?.(!isFullscreen);
  };

  return (
    <Wrapper className={`${isFullscreen ? "fullscreen" : ""} ${selectedChat ? "mobile-chat-selected" : "mobile-chat-list"}`}>
      <Chats
        userId={userId}
        initialChatId={initialChatId}
        isFullscreen={isFullscreen}
        selectedChat={selectedChat}
        updateSelectedChat={(item: any) => {
          setSelectedChat(item);
          updateMessages(item._id);
        }}
      />
      <ChatMessages
        className="chat-messages-wrapper"
        userId={userId}
        chat={selectedChat}
        onBackToChats={() => setSelectedChat(null)}
        onToggleFullscreen={setIsFullscreen ? handleToggleFullscreen : undefined}
        isFullscreen={isFullscreen}
        onClose={onClose}
      />
    </Wrapper>
  );
};

export default ModalChatBody;
