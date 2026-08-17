import React, {
  FC,
  MouseEvent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ExpandedTopicWrapper,
  TopicHeader,
  TopicHeaderInfo,
  AuthorName,
  TopicTitle,
  TopicTags,
  Tag,
  TopicActions,
  ActionButton,
  CommentsSection,
  CommentItem,
  CommentContent,
  CommentHeader,
  CommentText,
  CommentActions,
  CommentActionButton,
  HideRepliesButton,
  JoinDiscussionInput,
} from "./styles";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Eye,
  Share2,
  Repeat2,
  Quote,
} from "lucide-react";
import { IComment } from "../../../../../../types/global_types";
import moment from "moment";
import imageLoader from "../../../../../../helpers/imageLoader";
import UserAvatar from "../../../../../global/common/UserAvatar";
import Dropdown from "../../../../../global/common/Dropdown";
import CreateReply from "../../../modals/CreateReply";
import { AuthContext } from "../../../../../global/Layout";
import { repostTopic } from "../../../../../../http/comments/repostTopic";
import RichContent from "../RichContent";
import followUpdate from "../../../../../../http/user/followUpdate";

interface IProps {
  item: IComment;
  confirmAddReply: (text: string, id: string) => Promise<void>;
  addReaction: (id: string, action: "like" | "dislike") => Promise<void>;
  replyDraft?: string;
}

const sortReplies = (comments: IComment[], sortBy: string): IComment[] => {
  const sorted = [...comments].sort((left, right) => {
    if (sortBy === "Oldest") {
      return new Date(left.date).getTime() - new Date(right.date).getTime();
    }

    if (sortBy === "Newest") {
      return new Date(right.date).getTime() - new Date(left.date).getTime();
    }

    return (right.likes?.length || 0) - (left.likes?.length || 0);
  });

  return sorted.map((comment) => ({
    ...comment,
    answersList:
      Array.isArray(comment.answersList) && comment.answersList.length
        ? sortReplies(comment.answersList, sortBy)
        : comment.answersList,
    answers:
      Array.isArray(comment.answers) && comment.answers.length
        ? sortReplies(comment.answers, sortBy)
        : comment.answers,
    replies:
      Array.isArray(comment.replies) && comment.replies.length
        ? sortReplies(comment.replies, sortBy)
        : comment.replies,
  }));
};

const ExpandedTopic: FC<IProps> = ({
  item,
  confirmAddReply,
  addReaction,
  replyDraft,
}) => {
  const { userData } = useContext(AuthContext);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [sortBy, setSortBy] = useState("Top (Default)");
  const [replyText, setReplyText] = useState("");
  const [replyId, setReplyId] = useState<string | null>(null);

  const initialReposts = (item as any).reposts as string[] | undefined;
  const [reposted, setReposted] = useState<boolean>(
    Array.isArray(initialReposts) && !!userData?._id
      ? initialReposts.map(String).includes(String(userData._id))
      : false
  );
  const [repostCount, setRepostCount] = useState<number>(
    Number((item as any).repostsCount ?? initialReposts?.length ?? 0)
  );
  const [repostBusy, setRepostBusy] = useState(false);
  const [quoteMode, setQuoteMode] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followBusy, setFollowBusy] = useState(false);

  const authorId = (item as any)?.author?.[0]?._id || (item as any)?.author?.[0]?.id;

  // Load the REAL follow status from the current user's following list (not optimistic).
  useEffect(() => {
    if (!authorId || !userData) return;
    const following = (userData as any)?.following || [];
    const already = Array.isArray(following)
      ? following.some((f: any) => String(f?._id || f) === String(authorId))
      : false;
    setIsFollowing(already);
  }, [authorId, userData]);

  const handleFollow = async () => {
    if (!authorId || followBusy) return;
    setFollowBusy(true);
    try {
      // Sends sourceTopicId so this follow is attributed to the post (feeds followersFromContent).
      await followUpdate(isFollowing ? "unfollow" : "follow", String(authorId), item._id);
      setIsFollowing((v) => !v);
    } catch (e) {
    } finally {
      setFollowBusy(false);
    }
  };

  const handleRepost = async () => {
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
    if (replyDraft) {
      setReplyText(replyDraft);
    }
  }, [replyDraft]);

  const comments = useMemo(
    () => sortReplies(item.answersList || [], sortBy),
    [item.answersList, sortBy]
  );

  const handleAddReply = async (text: string, id: string) => {
    await confirmAddReply(text, id);
    // Quote = repost with a comment: also repost the topic so it lands in Follow Me.
    if (quoteMode && !reposted) {
      await handleRepost();
    }
    setQuoteMode(false);
    setReplyId(null);
    setReplyText("");
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const stopEvent = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const getAvatar = (author: any) => {
    if (author?.[0]?.avatar || author?.[0]?.photo) {
      return imageLoader(author[0].avatar || author[0].photo || "");
    }

    return (
      author?.[0]?.twitterData?.photo ||
      author?.avatar ||
      "/static/default-avatar.png"
    );
  };

  const getAuthorName = (author: any) =>
    author?.[0]?.username || author?.name || "User";

  const getReplyChildren = (comment: any) =>
    comment?.answersList || comment?.answers || comment?.replies || [];

  return (
    <ExpandedTopicWrapper>
      <TopicTitle>{item.topicName}</TopicTitle>
      <TopicHeader>
        <UserAvatar
          size="otc"
          variant={"success"}
          avatar={getAvatar(item.author)}
          name={item.author[0]?.username || ""}
          rating={Number(item.author[0]?.rating) || 0}
        />
        <TopicHeaderInfo>
          <AuthorName>
            <p>
              <span className="name">
                {item.author[0]?.username || "Unknown User"}{" "}
              </span>

              <span className="timestamp">
                {moment(String(item.date)).format("MMMM DD, YYYY  hh:mm a")}
              </span>
            </p>
            <p className="handle">
              @{item.author[0]?.username?.toLowerCase() || "user"}
            </p>
          </AuthorName>
        </TopicHeaderInfo>
        {authorId && String(authorId) !== String(userData?._id) && (
          <button
            onClick={handleFollow}
            disabled={followBusy}
            data-testid="topic-follow-btn"
            style={{
              marginLeft: "auto",
              padding: "7px 16px",
              borderRadius: 999,
              border: isFollowing ? "1px solid #e6eaf0" : "1px solid #04a584",
              background: isFollowing ? "#fff" : "#04a584",
              color: isFollowing ? "#52606d" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: followBusy ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isFollowing ? "Following" : "+ Follow"}
          </button>
        )}
      </TopicHeader>

      <div style={{ marginBottom: 16 }}>
        <RichContent
          bodyHtml={item.bodyHtml}
          text={item.text}
          images={item.images}
          coverImage={item.coverImage}
          image={item.image}
          mediaUrls={item.mediaUrls}
          tags={item.tags}
          carousel
        />
      </div>

      <TopicActions>
        <ActionButton
          active={item.likes?.includes(userData?._id)}
          onClick={() => addReaction(item._id || "", "like")}
        >
          <ThumbsUp />
          <span>{item.likes?.length ?? 0}</span>
        </ActionButton>
        <ActionButton
          active={item.dislikes?.includes(userData?._id)}
          onClick={() => addReaction(item._id || "", "dislike")}
        >
          <ThumbsDown />
          <span>{item.dislikes?.length ?? 0}</span>
        </ActionButton>
        <ActionButton onClick={() => setReplyId(item._id || "")}>
          <MessageCircle />
          <span>{item.replyCount ?? item.answersList?.length ?? 0}</span>
        </ActionButton>
        <ActionButton>
          <Eye />
        </ActionButton>
        <ActionButton
          active={reposted}
          disabled={repostBusy}
          onClick={handleRepost}
          data-testid="topic-repost-btn"
          title="Repost to your Follow Me feed"
        >
          <Repeat2 />
          <span>{repostCount}</span>
        </ActionButton>
        <ActionButton
          onClick={() => { setReplyId(item._id || ""); setQuoteMode(true); }}
          data-testid="topic-quote-btn"
          title="Quote: repost with your comment (saved to Follow Me)"
        >
          <Quote />
          <span>Quote</span>
        </ActionButton>

        <TopicTags>
          <Tag>Strategy</Tag>
          <Tag>Analytics</Tag>
        </TopicTags>
      </TopicActions>

      <CommentsSection>
        <JoinDiscussionInput>
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Join the discussion..."
            onKeyDown={async (e) => {
              if (e.key === "Enter" && replyText.trim()) {
                await handleAddReply(replyText, item._id || "");
              }
            }}
          />
        </JoinDiscussionInput>
        <div className="dropdown">
          <Dropdown
            label="Sort by"
            options={[
              { value: "Top (Default)", name: "Top (Default)" },
              { value: "Newest", name: "Newest" },
              { value: "Oldest", name: "Oldest" },
            ]}
            value={{ value: sortBy, name: sortBy }}
            onChange={({ value }) => setSortBy(value)}
          />
        </div>

        {comments.map((comment: any) => (
          <div key={comment?._id || comment?.id}>
            <CommentItem>
              <UserAvatar
                size="otc"
                variant={"success"}
                avatar={getAvatar(comment?.author)}
                name={getAuthorName(comment?.author)}
                rating={Number(comment?.author?.[0]?.rating) || 0}
              />
              <CommentContent>
                <CommentHeader>
                  <span className="name">{getAuthorName(comment?.author)}</span>
                  <span className="timestamp">
                    {comment?.date
                      ? moment(String(comment?.date)).format(
                          "MMM DD, YYYY  hh:mm a"
                        )
                      : ""}
                  </span>
                </CommentHeader>
                <CommentText>{comment?.text}</CommentText>
                <CommentActions>
                  <CommentActionButton
                    active={comment?.likes?.includes(userData?._id)}
                    onClick={() =>
                      addReaction(comment?._id || comment?.id, "like")
                    }
                  >
                    <ThumbsUp />
                    <span>{comment?.likes?.length ?? 0}</span>
                  </CommentActionButton>
                  <CommentActionButton
                    active={comment?.dislikes?.includes(userData?._id)}
                    onClick={() =>
                      addReaction(comment?._id || comment?.id, "dislike")
                    }
                  >
                    <ThumbsDown />
                    <span>{comment?.dislikes?.length ?? 0}</span>
                  </CommentActionButton>
                  <CommentActionButton
                    onClick={(event) => {
                      stopEvent(event);
                      setReplyId(
                        comment?._id === replyId || comment?.id === replyId
                          ? null
                          : comment?._id || comment?.id
                      );
                    }}
                  >
                    Reply
                  </CommentActionButton>
                  <CommentActionButton onClick={stopEvent}>
                    <Share2 />
                  </CommentActionButton>
                </CommentActions>
                {replyId === (comment?._id || comment?.id) && (
                  <CreateReply
                    topicId={comment?._id || comment?.id}
                    onClose={() => setReplyId(null)}
                    onSubmit={(text) =>
                      handleAddReply(text, comment?._id || comment?.id)
                    }
                  />
                )}
                {getReplyChildren(comment).length > 0 && (
                  <>
                    <HideRepliesButton
                      onClick={() => toggleReplies(comment?._id || comment?.id)}
                    >
                      <hr
                        style={{
                          width: "20px",
                        }}
                      />
                      {showReplies[comment?._id || comment?.id]
                        ? "Hide replies"
                        : `Show replies (${getReplyChildren(comment).length})`}
                    </HideRepliesButton>
                    {showReplies[comment?._id || comment?.id] &&
                      getReplyChildren(comment).map((reply: any) => (
                        <CommentItem
                          key={reply._id || reply.id}
                          style={{ marginTop: "12px" }}
                        >
                          <UserAvatar
                            size="otc"
                            variant={"success"}
                            avatar={getAvatar(reply.author)}
                            name={getAuthorName(reply.author)}
                            rating={Number(reply.author?.[0]?.rating) || 0}
                          />
                          <CommentContent>
                            <CommentHeader>
                              <span className="name">
                                {getAuthorName(reply.author)}
                              </span>
                              <span className="timestamp">
                                {reply.date
                                  ? moment(String(reply.date)).format(
                                      "MMM DD, YYYY  hh:mm a"
                                    )
                                  : ""}
                              </span>
                            </CommentHeader>
                            <CommentText>{reply.text}</CommentText>
                            <CommentActions>
                              <CommentActionButton
                                active={reply.likes?.includes(userData?._id)}
                                onClick={() =>
                                  addReaction(reply._id || reply.id, "like")
                                }
                              >
                                <ThumbsUp />
                                <span>{reply.likes?.length ?? 0}</span>
                              </CommentActionButton>
                              <CommentActionButton
                                active={reply.dislikes?.includes(userData?._id)}
                                onClick={() =>
                                  addReaction(reply._id || reply.id, "dislike")
                                }
                              >
                                <ThumbsDown />
                                <span>{reply.dislikes?.length ?? 0}</span>
                              </CommentActionButton>
                              <CommentActionButton
                                onClick={(event) => {
                                  stopEvent(event);
                                  setReplyId(reply._id || reply.id);
                                }}
                              >
                                Reply
                              </CommentActionButton>
                              <CommentActionButton onClick={stopEvent}>
                                <Share2 />
                              </CommentActionButton>
                            </CommentActions>
                            {replyId === (reply._id || reply.id) && (
                              <CreateReply
                                topicId={reply._id || reply.id}
                                onClose={() => setReplyId(null)}
                                onSubmit={(text) =>
                                  handleAddReply(text, reply._id || reply.id)
                                }
                              />
                            )}
                          </CommentContent>
                        </CommentItem>
                      ))}
                  </>
                )}
              </CommentContent>
            </CommentItem>
          </div>
        ))}
      </CommentsSection>
    </ExpandedTopicWrapper>
  );
};

export default ExpandedTopic;
