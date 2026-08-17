import React, { FC, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useQuery } from "react-query";
import { LoadingContext } from "../../../../../global/Layout";
import { IChat, IUser } from "../../../../../../types/global_types";
import createChat from "../../../../../../http/messages/createChat";
import getChat from "../../../../../../http/messages/getChat";
import getChats from "../../../../../../http/messages/getChats";
import togglePin from "../../../../../../http/chat/togglePin";
import UsersModal from "../../../modals/UsersModal";
import DeleteChatModal from "../modals/DeleteChatModal";
import ChatHeader from "./components/ChatHeader";
import ChatListSection from "./components/ChatListSection";
import SwipeableChat from "./components/SwipeableChat";
import { ScrollArea, Wrapper } from "./styles";

interface IProps {
  userId?: string;
  initialChatId?: string;
  isFullscreen?: boolean;
  selectedChat: any | null;
  updateSelectedChat: (item: any) => void;
}

function truncateMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) return message;
  return `${message.slice(0, maxLength - 1)}...`;
}

const Chats: FC<IProps> = ({ userId, initialChatId, isFullscreen = false, selectedChat, updateSelectedChat }) => {
  const { data, refetch } = useQuery("chats", getChats, { refetchOnWindowFocus: false });
  const { loadingStateHandler } = useContext(LoadingContext);
  const [isAddUsers, setIsAddUsers] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [swipeState, setSwipeState] = useState<{
    [key: string]: {
      translateX: number;
      startX: number;
      isDragging: boolean;
    };
  }>({});
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set());
  const hasCreatedChatRef = useRef(false);
  const processedUserIdRef = useRef<string | null>(null);

  const handleHoverLeft = (chatId: string) => {
    setSwipeState((prev) => ({
      ...prev,
      [chatId]: {
        translateX: 80,
        startX: 0,
        isDragging: false,
      },
    }));
  };

  const handleHoverRight = (chatId: string) => {
    setSwipeState((prev) => ({
      ...prev,
      [chatId]: {
        translateX: -80,
        startX: 0,
        isDragging: false,
      },
    }));
  };

  const handleTouchStart = (e: React.TouchEvent, chatId: string) => {
    const touch = e.touches[0];
    setSwipeState((prev) => ({
      ...prev,
      [chatId]: {
        translateX: prev[chatId]?.translateX || 0,
        startX: touch.clientX,
        isDragging: true,
      },
    }));
  };

  const handleTouchMove = (e: React.TouchEvent, chatId: string) => {
    const state = swipeState[chatId];
    if (!state?.isDragging) return;

    const touch = e.touches[0];
    const diff = touch.clientX - state.startX;
    const newTranslateX = Math.max(-80, Math.min(80, diff));

    setSwipeState((prev) => ({
      ...prev,
      [chatId]: {
        ...state,
        translateX: newTranslateX,
      },
    }));
  };

  const handleTouchEnd = (chatId: string) => {
    handleMouseUp(chatId);
  };

  const handleMouseDown = (e: React.MouseEvent, chatId: string) => {
    setSwipeState((prev) => ({
      ...prev,
      [chatId]: {
        translateX: prev[chatId]?.translateX || 0,
        startX: e.clientX,
        isDragging: true,
      },
    }));
  };

  const handleMouseMove = (e: React.MouseEvent, chatId: string) => {
    const state = swipeState[chatId];
    if (!state?.isDragging) return;

    const diff = e.clientX - state.startX;
    const newTranslateX = Math.max(-80, Math.min(80, diff));

    setSwipeState((prev) => ({
      ...prev,
      [chatId]: {
        ...state,
        translateX: newTranslateX,
      },
    }));
  };

  const handleMouseUp = (chatId: string) => {
    const state = swipeState[chatId];
    if (!state) return;

    const leftThreshold = 40;
    const rightThreshold = -40;

    let finalTranslateX = 0;

    if (state.translateX > leftThreshold) {
      finalTranslateX = 80;
    } else if (state.translateX < rightThreshold) {
      finalTranslateX = -80;
    }

    setSwipeState((prev) => ({
      ...prev,
      [chatId]: {
        ...state,
        translateX: finalTranslateX,
        isDragging: false,
      },
    }));
  };

  const closeSwipe = (chatId: string) => {
    setSwipeState((prev) => ({
      ...prev,
      [chatId]: {
        translateX: 0,
        startX: 0,
        isDragging: false,
      },
    }));
  };

  const handleUnread = (chatId: string) => {
    closeSwipe(chatId);
  };

  const handlePin = async (chat: IChat): Promise<void> => {
    const chatId = chat._id!;
    closeSwipe(chatId);
    await togglePin(chatId, chat.isPinned ? 'unpin' : 'pin');
    await refetch()
  };

  const confirmCreateChat = async (user: IUser): Promise<void> => {
    loadingStateHandler(true);

    const { success } = await createChat([user._id]);

    if (success) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Chat created!</p>
        </div>
      );

      const { data: refetchedData } = await refetch();

      if (refetchedData?.chats) {
        const newChat = refetchedData.chats.find((chat: IChat) => {
          return chat.user && (chat.user._id === user._id);
        });

        if (newChat) {
          updateSelectedChat(newChat);
        }
      }
    }

    setIsAddUsers(false);
    loadingStateHandler(false);
  };

  const filteredChats: Array<any> = useMemo(() => {
    if (!data?.chats) return [];

    if (!searchValue) return Array.isArray(data.chats) ? data.chats : [];

    return data.chats.filter((item: IChat) => {
      return (
        item?.user?.username
          ?.toLowerCase()
          ?.includes(searchValue.toLowerCase()) ||
        item?.user?.twitterData?.username
          ?.toLowerCase()
          ?.includes(searchValue.toLowerCase())
      );
    });
  }, [data, searchValue]);

  const pinnedFilteredChats: Array<any> = useMemo(() => {
    return filteredChats.filter((chat: IChat) => {
      return pinnedChats.has(chat._id!) || chat.isPinned
    });
  }, [filteredChats, pinnedChats]);

  const notPinnedFilteredChats: Array<any> = useMemo(() => {
    return filteredChats.filter((chat: IChat) => {
      return !pinnedChats.has(chat._id!) && !chat.isPinned
    });
  }, [filteredChats, pinnedChats]);

  useEffect(() => {
    if (!initialChatId) return;

    const existingChat = data?.chats?.find((chat: IChat) => chat._id === initialChatId);
    if (existingChat) {
      updateSelectedChat(existingChat);
      return;
    }

    getChat(initialChatId).then(({ isSuccess, chats }) => {
      if (isSuccess && chats?._id) {
        updateSelectedChat(chats);
      }
    });
  }, [initialChatId, data, updateSelectedChat]);

  useEffect(() => {
    if (!userId || hasCreatedChatRef.current) return;

    if (processedUserIdRef.current === userId) return;

    const existingChat = data?.chats.find((chat: IChat) => {
      return chat.user && (chat.user._id === userId);
    });

    if (existingChat) {
      processedUserIdRef.current = userId;
      updateSelectedChat(existingChat);
      return;
    }

    hasCreatedChatRef.current = true;
    processedUserIdRef.current = userId;

    createChat([userId])
      .then(async ({ data: newChatData }) => {
        hasCreatedChatRef.current = false;
        const { data: refetchedData } = await refetch();

        if (refetchedData?.chats) {
          const newChat = refetchedData.chats.find((chat: IChat) => {
            return chat.user && (chat.user._id === userId);
          });

          if (newChat) {
            updateSelectedChat(newChat);
          }
        }
      })
      .catch((error) => {
        console.error("Error creating chat:", error);
        hasCreatedChatRef.current = false;
      })
  }, [userId, data, updateSelectedChat, refetch]);

  const renderChat = (item: IChat) => {
    const chatState = swipeState[item._id!] || {
      translateX: 0,
      startX: 0,
      isDragging: false,
    };

    return (
      <SwipeableChat
        key={item._id}
        chat={item}
        isSelected={selectedChat?._id === item?._id}
        translateX={chatState.translateX}
        isDragging={chatState.isDragging}
        onTouchStart={(e) => handleTouchStart(e, item._id!)}
        onTouchMove={(e) => handleTouchMove(e, item._id!)}
        onTouchEnd={() => handleTouchEnd(item._id!)}
        onMouseDown={(e) => handleMouseDown(e, item._id!)}
        onMouseMove={(e) => handleMouseMove(e, item._id!)}
        onMouseUp={() => handleMouseUp(item._id!)}
        onMouseLeave={() => {
          if (swipeState[item._id!]?.isDragging) {
            handleMouseUp(item._id!);
          } else {
            closeSwipe(item._id!);
          }
        }}
        onHoverLeft={() => handleHoverLeft(item._id!)}
        onHoverRight={() => handleHoverRight(item._id!)}
        onChatClick={() => {
          updateSelectedChat(item);
          refetch();
        }}
        onUnread={() => handleUnread(item._id!)}
        onPin={() => handlePin(item)}
        onCloseSwipe={() => closeSwipe(item._id!)}
        truncateMessage={truncateMessage}
      />
    );
  };

  return (
    <>
      <Wrapper className="chats-wrapper">
        <ChatHeader
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onAddClick={() => setIsAddUsers(true)}

        />
        <ScrollArea>
          <ChatListSection
            type="pinned"
            show={pinnedFilteredChats && pinnedFilteredChats.length > 0}
          >
            {pinnedFilteredChats.map(renderChat)}
          </ChatListSection>

          <ChatListSection type="all">
            {notPinnedFilteredChats.map(renderChat)}
          </ChatListSection>
        </ScrollArea>
      </Wrapper>
      {isAddUsers ? (
        <UsersModal
          className={`users-modal ${isFullscreen ? "chat-fullscreen" : ""}`.trim()}
          onConfirm={confirmCreateChat}
          btnText="Send message"
          title="Users"
          onClose={() => setIsAddUsers(false)}
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default Chats;
