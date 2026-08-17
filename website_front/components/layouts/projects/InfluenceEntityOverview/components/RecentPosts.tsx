import React from "react";
import styled from "styled-components";

const CardWrapper = styled.div`
  width: 100%;
  background: #f5fbfd;
  border-radius: 16px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e9f2;
  margin-bottom: 20px;
`;

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CardBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #728094;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const PostItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 0;
  border-bottom: 1px solid #e5e9f2;

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const PostText = styled.p`
  font-size: 16px;
  color: #070b35;
  margin: 0;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const PostImages = styled.div`
  display: flex;
  gap: 8px;
`;

const PostImage = styled.div<{ src?: string }>`
  width: 80px;
  height: 64px;
  border-radius: 8px;
  background: ${({ src }) =>
    src ? `url(${src}) center/cover no-repeat` : "#1a1a2e"};
  flex-shrink: 0;
`;

const PostFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 520px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const PostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const StatItem = styled.button<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: ${({ isActive }) => (isActive ? "#FF5858" : "#728094")};
  background: none;
  border: none;
  padding: 4px 8px;
  margin: -4px -8px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;

  &:hover {
    color: ${({ isActive }) => (isActive ? "#FF5858" : "#070b35")};
    background: rgba(7, 11, 53, 0.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg path {
    stroke: ${({ isActive }) => (isActive ? "#FF5858" : "#728094")};
    fill: ${({ isActive }) => (isActive ? "rgba(255, 88, 88, 0.1)" : "none")};
    transition: all 0.2s;
  }
`;

const StatIcon = styled.span`
  display: flex;
  align-items: center;
  transition: transform 0.2s;

  button:hover & {
    transform: scale(1.1);
  }
`;

const PostDate = styled.span`
  font-size: 14px;
  color: #728094;
`;

const HeartIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.78 3.18C13.4312 2.83152 13.0178 2.55473 12.5628 2.36479C12.1079 2.17485 11.6203 2.07544 11.127 2.07544C10.6337 2.07544 10.1462 2.17485 9.69118 2.36479C9.2362 2.55473 8.82283 2.83152 8.474 3.18L7.994 3.66L7.514 3.18C6.80977 2.47577 5.86114 2.07578 4.872 2.07578C3.88286 2.07578 2.93423 2.47577 2.23 3.18C1.52577 3.88423 1.12578 4.83286 1.12578 5.822C1.12578 6.81114 1.52577 7.75977 2.23 8.464L2.71 8.944L7.994 14.228L13.278 8.944L13.758 8.464C14.1065 8.11517 14.3833 7.7018 14.5732 7.24683C14.7632 6.79185 14.8626 6.30429 14.8626 5.811C14.8626 5.31771 14.7632 4.83015 14.5732 4.37518C14.3833 3.9202 14.1065 3.50683 13.758 3.158L13.78 3.18Z"
      stroke="#728094"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CommentIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.8615 11.0297C15.2711 10.1032 15.4986 9.07815 15.4986 8C15.4986 3.85786 12.141 0.5 7.99929 0.5C3.85755 0.5 0.5 3.85786 0.5 8C0.5 12.1421 3.85755 15.5 7.99929 15.5C9.33276 15.5 10.5849 15.1519 11.67 14.5417L15.5 15.4993L14.8615 11.0297Z"
      stroke="#728094"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 3C4.667 3 1.82 5.02 0.667 8C1.82 10.98 4.667 13 8 13C11.333 13 14.18 10.98 15.333 8C14.18 5.02 11.333 3 8 3Z"
      stroke="#728094"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 10.333C9.28866 10.333 10.333 9.28866 10.333 8C10.333 6.71134 9.28866 5.667 8 5.667C6.71134 5.667 5.667 6.71134 5.667 8C5.667 9.28866 6.71134 10.333 8 10.333Z"
      stroke="#728094"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RepostIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 17 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.5 14.5001C1.84315 14.5001 0.5 13.1569 0.5 11.5001V5.5C0.500002 3.84315 1.84315 2.5 3.5 2.5H8M12 2.5H13.5C15.1569 2.5 16.5 3.84315 16.5 5.5V11.5001C16.5 13.1569 15.1569 14.5001 13.5 14.5001H7M7 14.5001L9 12.5M7 14.5001L9 16.5M7 4.5L9 2.5L7 0.5"
      stroke="#728094"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const BookmarkIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.6663 14L7.99967 10.6667L3.33301 14V3.33333C3.33301 2.97971 3.47348 2.64057 3.72353 2.39052C3.97358 2.14048 4.31272 2 4.66634 2H11.333C11.6866 2 12.0258 2.14048 12.2758 2.39052C12.5259 2.64057 12.6663 2.97971 12.6663 3.33333V14Z"
      stroke="#728094"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SendIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 17 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.0587 0.941321L7.17204 9.82796M1.22591 5.36272L15.0642 0.561697C15.9164 0.266038 16.734 1.08364 16.4383 1.93584L11.6373 15.7741C11.3084 16.7221 9.97713 16.7481 9.61148 15.8136L7.41407 10.198C7.30432 9.91757 7.08243 9.69568 6.80196 9.58593L1.18636 7.38852C0.25191 7.02286 0.277902 5.69162 1.22591 5.36272Z"
      stroke="#728094"
      stroke-linecap="round"
    />
  </svg>
);

interface Post {
  id: string;
  text: string;
  date: string;
  views: string;
  comments?: string;
  likes: string;
  reposts?: string;
  bookmarks?: string;
  images?: string[];
  image?: string;
  sends?: string;
}

interface RecentPostsProps {
  posts: Post[];
  onViewAll?: () => void;
  network?: string;
}

const RecentPosts: React.FC<RecentPostsProps> = ({ posts, network }) => {
  const [postStats, setPostStats] = React.useState<
    Record<
      string,
      {
        liked: boolean;
        bookmarked: boolean;
        reposted: boolean;
        likes: number;
        reposts: number;
        bookmarks: number;
        comments: number;
        sends: number;
      }
    >
  >({});

  React.useEffect(() => {
    const initialStats: Record<string, any> = {};
    posts.forEach((post) => {
      initialStats[post.id] = {
        liked: false,
        bookmarked: false,
        reposted: false,
        likes: parseInt(post.likes) || 0,
        reposts: parseInt(post.reposts || "0") || 0,
        bookmarks: parseInt(post.bookmarks || "0") || 0,
        comments: parseInt(post.comments || "0") || 0,
        sends: parseInt(post.sends || "0") || 0,
      };
    });
    setPostStats(initialStats);
  }, [posts]);

  const handleStatClick = (
    e: React.MouseEvent,
    action: string,
    postId: string
  ) => {
    e.stopPropagation();

    setPostStats((prev) => {
      const current = prev[postId] || {
        liked: false,
        bookmarked: false,
        reposted: false,
        likes: 0,
        reposts: 0,
        bookmarks: 0,
        comments: 0,
        sends: 0,
      };

      switch (action) {
        case "like":
          return {
            ...prev,
            [postId]: {
              ...current,
              liked: !current.liked,
              likes: current.liked ? current.likes - 1 : current.likes + 1,
            },
          };
        case "bookmark":
          return {
            ...prev,
            [postId]: {
              ...current,
              bookmarked: !current.bookmarked,
              bookmarks: current.bookmarked
                ? current.bookmarks - 1
                : current.bookmarks + 1,
            },
          };
        case "repost":
          return {
            ...prev,
            [postId]: {
              ...current,
              reposted: !current.reposted,
              reposts: current.reposted
                ? current.reposts - 1
                : current.reposts + 1,
            },
          };
        default:
          return prev;
      }
    });
  };

  return (
    <CardWrapper>
      <CardHeader>
        <CardTitle>Recent Posts</CardTitle>
        <CardBadge>Preview Only</CardBadge>
      </CardHeader>

      <PostsList>
        {posts.slice(0, 3).map((post) => (
          <PostItem key={post.id}>
            {network === "x" || network === "instagram" ? (
              <>
                {" "}
                {(post.images && post.images.length > 0) || post.image ? (
                  <PostImages>
                    {post.images
                      ? post.images.map((img, idx) => (
                          <PostImage key={idx} src={img} />
                        ))
                      : post.image && <PostImage src={post.image} />}
                  </PostImages>
                ) : null}
                <PostText>{post.text}</PostText>
              </>
            ) : (
              <>
                <PostText>{post.text}</PostText>
                {(post.images && post.images.length > 0) || post.image ? (
                  <PostImages>
                    {post.images
                      ? post.images.map((img, idx) => (
                          <PostImage key={idx} src={img} />
                        ))
                      : post.image && <PostImage src={post.image} />}
                  </PostImages>
                ) : null}
              </>
            )}

            <PostFooter>
              <PostStats>
                {network === "x" && (
                  <>
                    <StatItem
                      onClick={(e) => handleStatClick(e, "comment", post.id)}
                    >
                      <StatIcon>
                        <CommentIcon />
                      </StatIcon>
                      {postStats[post.id]?.comments || post.comments || "0"}
                    </StatItem>
                    <StatItem
                      isActive={postStats[post.id]?.reposted}
                      onClick={(e) => handleStatClick(e, "repost", post.id)}
                    >
                      <StatIcon>
                        <RepostIcon />
                      </StatIcon>
                      {postStats[post.id]?.reposts || post.reposts || "0"}
                    </StatItem>
                  </>
                )}
                <StatItem
                  isActive={postStats[post.id]?.liked}
                  onClick={(e) => handleStatClick(e, "like", post.id)}
                >
                  <StatIcon>
                    <HeartIcon />
                  </StatIcon>
                  {postStats[post.id]?.likes || post.likes}
                </StatItem>
                {network !== "x" && (
                  <StatItem
                    onClick={(e) => handleStatClick(e, "comment", post.id)}
                  >
                    <StatIcon>
                      <CommentIcon />
                    </StatIcon>
                    {postStats[post.id]?.comments || post.comments || "0"}
                  </StatItem>
                )}
                {network === "instagram" ? (
                  <>
                    <StatItem
                      isActive={postStats[post.id]?.reposted}
                      onClick={(e) => handleStatClick(e, "repost", post.id)}
                    >
                      <StatIcon>
                        <RepostIcon />
                      </StatIcon>
                      {postStats[post.id]?.reposts || post.reposts || "0"}
                    </StatItem>
                    <StatItem
                      onClick={(e) => handleStatClick(e, "send", post.id)}
                    >
                      <StatIcon>
                        <SendIcon />
                      </StatIcon>
                      {postStats[post.id]?.sends || post.sends || "0"}
                    </StatItem>
                  </>
                ) : (
                  <>
                    <StatItem
                      onClick={(e) => handleStatClick(e, "view", post.id)}
                    >
                      <StatIcon>
                        <EyeIcon />
                      </StatIcon>
                      {post.views}
                    </StatItem>
                  </>
                )}
                {network === "x" && (
                  <StatItem
                    isActive={postStats[post.id]?.bookmarked}
                    onClick={(e) => handleStatClick(e, "bookmark", post.id)}
                  >
                    <StatIcon>
                      <BookmarkIcon />
                    </StatIcon>
                    {postStats[post.id]?.bookmarks || post.bookmarks || "0"}
                  </StatItem>
                )}
              </PostStats>
              <PostDate>{post.date}</PostDate>
            </PostFooter>
          </PostItem>
        ))}
      </PostsList>
    </CardWrapper>
  );
};

export default RecentPosts;
