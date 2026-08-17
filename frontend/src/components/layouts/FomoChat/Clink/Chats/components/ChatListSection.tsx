import React, { FC, ReactNode } from "react";
import { List, ListHeader, ListWrapper } from "../styles";

interface ChatListSectionProps {
  type: "pinned" | "all";
  children: ReactNode;
  show?: boolean;
}

const ChatListSection: FC<ChatListSectionProps> = ({
  type,
  children,
  show = true,
}) => {
  if (!show) return null;

  return (
    <ListWrapper>
      <ListHeader>
        <span>{type === "pinned" ? "PINNED CHATS" : "ALL MESSAGES"}</span>
      </ListHeader>
      <List>{children}</List>
    </ListWrapper>
  );
};

export default ChatListSection;
