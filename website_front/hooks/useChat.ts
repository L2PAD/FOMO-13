import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { IMessage, IUser } from "../types/global_types";
import { LOADER_API } from "../config/api";

interface UseChat {
  messages: IMessage[];
  hasMore: boolean;
  total: number;
  isLoadingMore: boolean;
  isLoading: boolean;
  sendMessage: (data: SendMessageData) => void;
  getMessages: () => void;
  loadMoreMessages: () => void;
  updateMessage: (messageId: string, updates: Partial<IMessage>) => void;
}

interface SendMessageData {
  chatId: string;
  to: string;
  title?: string;
  message: string;
  attachments?: Array<{
    url: string;
    name?: string;
    type?: string;
    size?: number;
  }>;
  replyTo?: string;
}

export function useChat(
  chatId: string, 
  token: string | null, 
  userData?: IUser,
  onMessageError?: (error: { message: string; statusCode: number }) => void
): UseChat {
  const socketRef = useRef<Socket | null>(null);
  const activeChatRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Throttling для ограничения частоты запросов загрузки
  const lastLoadMoreTimeRef = useRef<number>(0);
  const lastGetMessagesTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!token) return;

    if (!socketRef.current) {
      socketRef.current = io(LOADER_API, {
        transports: ["websocket"],
        auth: { token: token },
      });

      socketRef.current.on("allMessages", (data: { messages: IMessage[]; total: number; hasMore: boolean } | IMessage[]) => {
        if (Array.isArray(data)) {
          // Старый формат (для обратной совместимости)
          setMessages(data);
          setTotal(data.length);
          setHasMore(false);
        } else {
          // Новый формат с пагинацией
          setMessages(data.messages);
          setTotal(data.total);
          setHasMore(data.hasMore);
        }
        setIsLoading(false);
      });

      socketRef.current.on("moreMessages", (data: { messages: IMessage[]; total: number; hasMore: boolean }) => {
        setMessages((prevMessages) => {
          // Избегаем дублирования сообщений
          const existingIds = new Set(prevMessages.map(m => m._id));
          const newMessages = data.messages.filter(m => !existingIds.has(m._id));
          return [...newMessages, ...prevMessages];
        });
        setTotal(data.total);
        setHasMore(data.hasMore);
        setIsLoadingMore(false);
      });

      socketRef.current.on("receiveMessage", (message: IMessage) => {
        setMessages((prevMessages) => {
          // Проверяем, есть ли уже оптимистичное сообщение с таким же содержимым
          const optimisticIndex = prevMessages.findIndex(
            (msg) => msg._id?.startsWith('temp-') && 
            msg.message === message.message &&
            msg.from === message.from
          );

          if (optimisticIndex !== -1) {
            // Заменяем оптимистичное сообщение на реальное
            const updated = [...prevMessages];
            updated[optimisticIndex] = message;
            return updated;
          }

          // Добавляем новое сообщение (от другого пользователя или если не нашли оптимистичное)
          return [...prevMessages, message];
        });
        setTotal((prevTotal) => prevTotal + 1);
      });

      socketRef.current.on("chatError", () => {
        setMessages([]);
        setTotal(0);
        setHasMore(false);
      });

      socketRef.current.on("messageError", (error: { message: string; statusCode: number }) => {
        console.error("Message error:", error);
        setMessages((prevMessages) => 
          prevMessages.filter(msg => !msg._id?.startsWith('temp-'))
        );
        setTotal((prevTotal) => Math.max(0, prevTotal - 1));
        
        if (onMessageError) {
          onMessageError(error);
        }
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Connection error:", error);
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      activeChatRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!chatId || !socketRef.current) return;

    if (activeChatRef.current && activeChatRef.current !== chatId) {
      socketRef.current.emit("leaveChat", activeChatRef.current);
    }

    setMessages([]);
    setHasMore(false);
    setTotal(0);
    
    lastGetMessagesTimeRef.current = 0;
    lastLoadMoreTimeRef.current = 0;

    activeChatRef.current = chatId;
    socketRef.current.emit("joinChat", chatId);
    
    setIsLoading(true);
    socketRef.current.emit("getMessages", { chatId, limit: 20, skip: 0 });
  }, [chatId]);

  const sendMessage = ({ to, message, title, attachments, replyTo }: SendMessageData) => {
    if (!socketRef.current) return;

    const now = new Date();
    const currentTime = now.getTime();
    const tempId = `temp-${currentTime}-${Math.random()}`;

    const replyToMsg = replyTo ? messages.find(m => m._id === replyTo) : undefined;

    const optimisticMessage: IMessage = {
      _id: tempId,
      from: userData?._id || '',
      to,
      message,
      title: title || '',
      date: now,
      attachments: attachments || [],
      sender: userData,
      isNew: false,
      replyTo,
      replyToMessage: replyToMsg ? {
        _id: replyToMsg._id,
        message: replyToMsg.message,
        sender: replyToMsg.sender,
      } : undefined,
    };

    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
    setTotal((prevTotal) => prevTotal + 1);

    socketRef.current.emit("sendMessage", {
      chatId,
      to,
      title,
      message,
      attachments,
      replyTo,
      date: now,
    });
  };

  const getMessages = () => {
    if (!socketRef.current || !chatId) return;
    
    const currentTime = Date.now();
    const timeSinceLastGet = currentTime - lastGetMessagesTimeRef.current;
    const MIN_GET_INTERVAL = 2000; // 2 секунды
    
    if (timeSinceLastGet < MIN_GET_INTERVAL) {
      console.log('Getting messages too fast, please wait...');
      return;
    }
    
    lastGetMessagesTimeRef.current = currentTime;
    socketRef.current.emit("getMessages", { chatId, limit: 20, skip: 0 });
  };

  const loadMoreMessages = () => {
    if (!socketRef.current || !chatId || !hasMore || isLoadingMore) return;
    
    const currentTime = Date.now();
    const timeSinceLastLoad = currentTime - lastLoadMoreTimeRef.current;
    const MIN_LOAD_INTERVAL = 2000; 
    
    if (timeSinceLastLoad < MIN_LOAD_INTERVAL) {
      console.log('Loading too fast, please wait...');
      return;
    }
    
    lastLoadMoreTimeRef.current = currentTime;
    setIsLoadingMore(true);
    
    const realMessagesCount = messages.filter(m => !m._id?.startsWith('temp-')).length;
    
    socketRef.current.emit("loadMoreMessages", { 
      chatId, 
      skip: realMessagesCount, 
      limit: 20 
    });
  };

  const updateMessage = (messageId: string, updates: Partial<IMessage>) => {
    setMessages((prevMessages) => 
      prevMessages.map(msg => 
        msg._id === messageId ? { ...msg, ...updates } : msg
      )
    );
  };

  return { messages, hasMore, total, isLoading, isLoadingMore, sendMessage, getMessages, loadMoreMessages, updateMessage };
}
