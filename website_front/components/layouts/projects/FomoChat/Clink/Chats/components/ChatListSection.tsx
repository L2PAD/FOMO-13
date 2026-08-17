import React, { FC, ReactNode } from "react";
import Image from "next/image";
import Pin from "../../../../../../global/Icons/Pin";
import MessagesIcon from "../../../../../../../assets/icons/all-messages.svg";
import { List, ListHeader, ListWrapper } from "../styles";
import { useTranslation } from "i18n";

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
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <ListWrapper>
      <ListHeader>
        {type === "pinned" ? (
          <>
            <Pin />
            <span>{t("chat.sections.pinnedChats")}</span>
          </>
        ) : (
          <>
            <Image src={MessagesIcon} alt="ALL" />
            <span>{t("chat.sections.allMessages")}</span>
          </>
        )}
      </ListHeader>
      <List>{children}</List>
    </ListWrapper>
  );
};

export default ChatListSection;
