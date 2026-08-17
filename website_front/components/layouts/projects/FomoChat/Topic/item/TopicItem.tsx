import React, { FC, useState, useRef, useEffect } from "react";
import imageLoader from "../../../../../../helpers/imageLoader";
import { IComment } from "../../../../../../types/global_types";
import { Title } from "../../../../../global/common/Comment/styles";
import { Item } from "../styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import moment from "moment";
import {
  EllipsisIcon,
  Eye,
  MessageCircle,
  Paperclip,
  EyeOff,
  Flag,
  Ban,
  Lock,
  Repeat2,
} from "lucide-react";
import Share from "../../../../../global/Icons/Share";
import addReport from "../../../../../../http/comments/addReport";
import { repostTopic } from "../../../../../../http/comments/repostTopic";
import { getUserId } from "../../../../../../helpers/getUserRole";
import RichContent from "../RichContent";
import followUpdate from "../../../../../../http/user/followUpdate";

const REPORT_REASONS = [
  { key: "spam", label: "Spam" },
  { key: "scam", label: "Scam" },
  { key: "abuse", label: "Abuse" },
  { key: "misleading", label: "Misleading" },
  { key: "other", label: "Other" },
];

interface IProps {
  isSubitem?: boolean;
  item: IComment;
  addReply: (id: string) => void;
  addReaction: (id: string, action: "like" | "dislike") => Promise<void>;
  onClick?: () => void;
}

const TopicItem: FC<IProps> = ({
  item,
  isSubitem,
  addReply,
  addReaction,
  onClick,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const [reportMode, setReportMode] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const myId = typeof window !== "undefined" ? getUserId() : "";
  const itemReposts = ((item as any).reposts as string[] | undefined) || [];
  const [reposted, setReposted] = useState<boolean>(
    !!myId && itemReposts.map(String).includes(String(myId))
  );
  const [repostCount, setRepostCount] = useState<number>(
    Number((item as any).repostsCount ?? itemReposts.length ?? 0)
  );
  const [repostBusy, setRepostBusy] = useState(false);

  const feedAuthorId = item.author?.[0]?._id || (item.author?.[0] as any)?.id;
  const [isFollowing, setIsFollowing] = useState<boolean>(
    Array.isArray((item.author?.[0] as any)?.followers)
      ? (item.author?.[0] as any).followers.some((f: any) => String(f?._id || f) === String(myId))
      : false
  );
  const [followBusy, setFollowBusy] = useState(false);

  const handleFollow = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!feedAuthorId || followBusy) return;
    setFollowBusy(true);
    try {
      await followUpdate(isFollowing ? "unfollow" : "follow", String(feedAuthorId), item._id);
      setIsFollowing((v) => !v);
    } catch (e) {
    } finally {
      setFollowBusy(false);
    }
  };

  const handleRepost = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!item._id || repostBusy) return;
    setRepostBusy(true);
    const res = await repostTopic(item._id);
    setRepostBusy(false);
    if (res.isSuccess) {
      setReposted(res.reposted);
      setRepostCount(res.repostsCount);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    };

    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopover]);

  const getVariant = () => {
    const a = item.author?.[0];
    if (a?.rating && Number(a.rating) < 80) {
      return "warn";
    }
    return "success";
  };

  const handleHide = () => {
    setShowPopover(false);
  };

  const handleReport = async (reason: string) => {
    if (!item._id) return;
    const res = await addReport(item._id, reason);
    setReportMsg(res.isSuccess ? "Thanks — reported to moderators" : res.error || "Already reported");
    setTimeout(() => {
      setShowPopover(false);
      setReportMode(false);
      setReportMsg("");
    }, 1400);
  };

  const handleBlock = () => {
    setShowPopover(false);
  };

  return (
    <Item
      className={`${!item.isTopic ? "subitem" : ""} ${
        isSubitem ? "first" : ""
      }`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="header">
        <div className="header-top">
          <UserAvatar
            size="otc"
            variant={getVariant()}
            avatar={
              item.author?.[0]?.avatar || item.author?.[0]?.photo
                ? imageLoader(
                    item.author?.[0]?.avatar || item.author?.[0]?.photo || ""
                  )
                : item.author?.[0]?.twitterData?.photo || ""
            }
            name={item.author?.[0]?.username || item.author?.[0]?.name || "Anonymous"}
            rating={Number(item.author?.[0]?.rating) || 94}
          />
          <div className="user-info">
            <div className="user-name-row">
              <Title variant="p">{item.author?.[0]?.username || item.author?.[0]?.name || "Anonymous"}</Title>
              {feedAuthorId && String(feedAuthorId) !== String(myId) && (
                <button
                  onClick={handleFollow}
                  disabled={followBusy}
                  data-testid="feed-follow-btn"
                  style={{
                    padding: "3px 12px",
                    borderRadius: 999,
                    border: isFollowing ? "1px solid #e6eaf0" : "1px solid #04a584",
                    background: isFollowing ? "#fff" : "#04a584",
                    color: isFollowing ? "#52606d" : "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: followBusy ? "default" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isFollowing ? "Following" : "+ Follow"}
                </button>
              )}
              <span className="timestamp">
                {moment(String(item.date)).fromNow()}
              </span>
            </div>
            <div className="user-meta">
              <span className="followers-count">
                <strong>{item.author?.[0]?.followers?.length ?? 0}</strong>{" "}
                Followers
              </span>
            </div>
          </div>
          <div className="info-right">
            {(item as any).audience === "FOLLOWERS" && (
              <div className="topic-tags">
                <span
                  className="tag"
                  style={{
                    background: "#EBE9FE",
                    color: "#6941C6",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Lock size={11} /> Followers
                </span>
              </div>
            )}
            <div className="topic-tags">
              <span className="tag">Analytics</span>
            </div>{" "}
            <div className="topic-tags">
              <span className="tag">Invests</span>
            </div>
            <div className="actions">
              <button
                title="Leave a comment"
                data-testid="topic-comment-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  addReply(item._id!);
                }}
              >
                <MessageCircle width={16} color="#728094" />
              </button>
              <button
                title={reposted ? "Reposted" : "Repost"}
                data-testid="topic-repost-btn"
                disabled={repostBusy}
                onClick={handleRepost}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <Share />
                {repostCount > 0 ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: reposted ? "#04a584" : "#728094" }}>
                    {repostCount}
                  </span>
                ) : null}
              </button>
              <button onClick={(event) => event.stopPropagation()}>
                <Paperclip width={16} color="#728094" />
              </button>
              <div style={{ position: "relative" }} ref={popoverRef}>
                <button
                  className={showPopover ? "active" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPopover(!showPopover);
                  }}
                >
                  <EllipsisIcon width={16} transform="rotate(90)" />
                </button>
                {showPopover && (
                  <div className="popover-menu">
                    {reportMode ? (
                      <>
                        {reportMsg ? (
                          <div className="popover-item" style={{ color: "#04a584", fontSize: 12 }}>
                            {reportMsg}
                          </div>
                        ) : (
                          REPORT_REASONS.map((r) => (
                            <button
                              key={r.key}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleReport(r.key);
                              }}
                              className="popover-item"
                            >
                              <Flag size={16} />
                              <span>{r.label}</span>
                            </button>
                          ))
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleHide();
                          }}
                          className="popover-item"
                        >
                          <EyeOff size={18} />
                          <span>Hide</span>
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setReportMode(true);
                          }}
                          className="popover-item"
                        >
                          <Flag size={18} />
                          <span>Report</span>
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleBlock();
                          }}
                          className="popover-item"
                        >
                          <Ban size={18} />
                          <span>Block User</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="post-content">{item.topicName}</p>
      {(item.bodyHtml || (item.images && item.images.length) || item.coverImage ||
        (item.mediaUrls && item.mediaUrls.length) || (item.tags && item.tags.length)) ? (
        <div className="post-rich" style={{ padding: "0 4px" }}>
          <RichContent
            compact
            images={item.images}
            coverImage={item.coverImage}
            image={item.image}
            mediaUrls={item.mediaUrls}
            tags={item.tags}
          />
        </div>
      ) : null}
      <div className="footer">
        <div className="stats">
          <div className="stat-item">
            <span>{item.likes?.length ?? 0} votes</span>
          </div>
          <div className="stat-item">
            <MessageCircle width={16} color="#738094" />
            <span>{item.replyCount ?? item.answersList?.length ?? 0}</span>
          </div>
          <div className="stat-item">
            <Eye size={18} color="#738094" />
            <span>{item.viewsCount ?? 0}</span>
          </div>
          <span className="timestamp mobile-show">
            {moment(String(item.date)).fromNow()}
          </span>
        </div>
      </div>
    </Item>
  );
};

export default TopicItem;
