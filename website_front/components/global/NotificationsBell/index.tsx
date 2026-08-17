import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Bell, Repeat2, MessageCircle, ThumbsUp, UserPlus, Quote, X } from "lucide-react";
import {
  fetchSocialNotifications,
  fetchUnreadCount,
  markSocialRead,
  ISocialNotification,
} from "../../../http/notifications/socialNotifications";
import getAuthToken from "../../../http/getAuthToken";
import {
  BellButton,
  Dot,
  Panel,
  PanelHead,
  Row,
  RowIcon,
  RowBody,
  Empty,
  ToastWrap,
  Toast,
} from "./styles";

const LABEL: Record<string, string> = {
  REPOST: "reposted your post",
  REPLY: "replied to your post",
  LIKE: "liked your post",
  FOLLOW: "started following you",
  QUOTE: "quoted your post",
};

const iconFor = (t: string) => {
  switch (t) {
    case "REPOST": return <Repeat2 size={16} />;
    case "REPLY": return <MessageCircle size={16} />;
    case "LIKE": return <ThumbsUp size={16} />;
    case "FOLLOW": return <UserPlus size={16} />;
    case "QUOTE": return <Quote size={16} />;
    default: return <Bell size={16} />;
  }
};

const timeAgo = (iso: string): string => {
  const d = new Date(iso).getTime();
  if (!d) return "";
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const NotificationsBell: React.FC = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<ISocialNotification[]>([]);
  const [toast, setToast] = useState<ISocialNotification | null>(null);
  const prevUnread = useRef<number>(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const loggedIn = typeof window !== "undefined" && !!getAuthToken();

  const poll = useCallback(async () => {
    if (!loggedIn) return;
    const c = await fetchUnreadCount();
    setUnread(c);
    // New notification arrived -> surface a toast with the latest one.
    if (c > prevUnread.current) {
      const list = await fetchSocialNotifications(5);
      setItems(list);
      const latest = list.find((n) => !n.read) || list[0];
      if (latest) {
        setToast(latest);
        window.setTimeout(() => setToast(null), 5000);
      }
    }
    prevUnread.current = c;
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    poll();
    const id = window.setInterval(poll, 20000);
    return () => window.clearInterval(id);
  }, [poll, loggedIn]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const openPanel = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const list = await fetchSocialNotifications(30);
      setItems(list);
      if (unread > 0) {
        const remaining = await markSocialRead();
        setUnread(remaining);
        prevUnread.current = remaining;
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    }
  };

  const goTo = (n: ISocialNotification) => {
    setOpen(false);
    setToast(null);
    if (n.topicId) router.push(`/utility/news?topic=${n.topicId}`);
    else if (n.actor?.id) router.push(`/fomies/${n.actor.id}`);
  };

  if (!loggedIn) return null;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <BellButton onClick={openPanel} data-testid="notif-bell" aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && <Dot data-testid="notif-badge">{unread > 9 ? "9+" : unread}</Dot>}
      </BellButton>

      {open && (
        <Panel data-testid="notif-panel">
          <PanelHead>
            <span>Notifications</span>
            {items.length > 0 && (
              <button onClick={() => { setItems([]); }} title="Clear list">
                <X size={15} />
              </button>
            )}
          </PanelHead>
          {items.length === 0 ? (
            <Empty>No notifications yet</Empty>
          ) : (
            items.map((n) => (
              <Row key={n.id} $unread={!n.read} onClick={() => goTo(n)} data-testid="notif-row">
                <RowIcon $type={n.type}>{iconFor(n.type)}</RowIcon>
                <RowBody>
                  <p>
                    <strong>{n.actor?.name || "Someone"}</strong> {LABEL[n.type] || "interacted"}
                  </p>
                  {n.preview ? <span className="preview">{n.preview}</span> : null}
                  <span className="time">{timeAgo(n.createdAt)}</span>
                </RowBody>
              </Row>
            ))
          )}
        </Panel>
      )}

      {toast && (
        <ToastWrap>
          <Toast onClick={() => goTo(toast)} data-testid="notif-toast">
            <RowIcon $type={toast.type}>{iconFor(toast.type)}</RowIcon>
            <RowBody>
              <p>
                <strong>{toast.actor?.name || "Someone"}</strong> {LABEL[toast.type] || "interacted"}
              </p>
              {toast.preview ? <span className="preview">{toast.preview}</span> : null}
            </RowBody>
            <button onClick={(e) => { e.stopPropagation(); setToast(null); }}><X size={14} /></button>
          </Toast>
        </ToastWrap>
      )}
    </div>
  );
};

export default NotificationsBell;
