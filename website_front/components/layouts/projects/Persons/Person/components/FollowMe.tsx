import React, { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Repeat2, MessageCircle } from "lucide-react";
import styled from "styled-components";
import RichContent from "../../../FomoChat/Topic/RichContent";
import { fetchUserReposts, IUserRepost } from "../../../../../../http/comments/fetchUserReposts";

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1a1d26;
  font-weight: 700;
  font-size: 18px;
  svg { color: #04a584; }
  .count { color: #94a3b8; font-weight: 600; font-size: 14px; }
`;

const Card = styled.div`
  border: 1px solid #e6eaf0;
  border-radius: 16px;
  padding: 18px 20px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  &:hover { border-color: #04a584; box-shadow: 0 8px 24px rgba(4,165,132,0.10); }

  h4 { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #1a1d26; }
  .meta { display: flex; gap: 16px; margin-top: 12px; color: #52606d; font-size: 13px; align-items: center; }
  .meta span { display: inline-flex; align-items: center; gap: 5px; }
`;

const Empty = styled.div`
  padding: 46px 16px;
  text-align: center;
  color: #94a3b8;
  border: 1px dashed #e6eaf0;
  border-radius: 16px;
`;

const QuoteStrip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  margin-bottom: 10px;
  border-left: 3px solid #04a584;
  background: #f2fbf8;
  border-radius: 0 8px 8px 0;
  color: #0f766e;
  font-size: 12.5px;
  font-weight: 600;
  svg { color: #04a584; }
`;

interface Props { userId?: string; }

const FollowMe: FC<Props> = ({ userId }) => {
  const router = useRouter();
  const [items, setItems] = useState<IUserRepost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    fetchUserReposts(userId)
      .then((r) => setItems(r))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <Wrap data-testid="followme-tab">
      <Head>
        <Repeat2 size={20} />
        Follow Me <span className="count">· saved discussions ({items.length})</span>
      </Head>
      {loading ? (
        <Empty>Loading…</Empty>
      ) : items.length === 0 ? (
        <Empty>No reposted discussions yet. Repost a post to keep the conversation here.</Empty>
      ) : (
        items.map((t) => (
          <Card key={t._id} onClick={() => router.push(`/utility/news?topic=${t._id}`)} data-testid="followme-item">
            <QuoteStrip>
              <Repeat2 size={14} />
              <span>You reposted{t.author?.[0]?.username ? ` @${String(t.author[0].username).toLowerCase()}` : t.author?.[0]?.name ? ` ${t.author[0].name}` : ""} — continue the discussion</span>
            </QuoteStrip>
            {t.topicName ? <h4>{t.topicName}</h4> : null}
            <RichContent
              compact
              text={t.text}
              images={t.images}
              coverImage={t.coverImage}
              mediaUrls={t.mediaUrls}
              tags={t.tags}
            />
            <div className="meta">
              <span><Repeat2 size={15} /> {t.repostsCount ?? 0}</span>
              <span><MessageCircle size={15} /> {t.replyCount ?? 0}</span>
            </div>
          </Card>
        ))
      )}
    </Wrap>
  );
};

export default FollowMe;
