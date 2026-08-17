import React, { useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { IChat, IMessage } from "../../../../../types/global_types";
import sendMessage from "../../../../../http/support/sendMessage";
import { PageDescription } from "../../Networks/styles";
import MessageItem from "./item/TopicItem";
import UserAvatar from "../../../../global/common/UserAvatar";
import ChatIcon from "../../../../global/Icons/ChatIcon";
import Button from "../../../../global/common/Button";
import getMessages from "../../../../../http/messages/getMessages";
import { MessagesContext } from "../../../../global/Layout";
import updateMessages from "../../../../../http/messages/updateMessages";
import Chats from "./Chats";
import { AdminMessages, AdminTitle, List, Wrapper } from "./styles";
import ChatMessages from "./ChatMessages";

const Clink = () => {
  // const { data } = useQuery("all-messages", () => getMessages("all"));
  const [selectedChat, setSelectedChat] = useState<IChat | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev: boolean) => !prev);
  };

  return (
    <>
      {" "}
      <Wrapper className={isFullscreen ? "fullscreen" : ""}>
        <Chats
          isFullscreen={isFullscreen}
          selectedChat={selectedChat}
          updateSelectedChat={(item: any) => {
            setSelectedChat(item);
            updateMessages(item._id);
          }}
        />
        <ChatMessages
          chat={selectedChat}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
        />
      </Wrapper>
      {/* {data?.messages?.length ? (
        <AdminMessages>
          <AdminTitle>Support messages</AdminTitle>
          <List>
            {data?.messages.map((item: IMessage) => {
              return <MessageItem item={item} />;
            })}
          </List>
        </AdminMessages>
      ) : (
        <></>
      )} */}
    </>
  );
};

export default Clink;
