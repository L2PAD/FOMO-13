import React, { FC } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import styled from "styled-components";
import {
  Lock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  MessagesSquare,
  Bot,
  TrendingUp,
  Heart,
  Newspaper,
  Users,
  Check,
} from "lucide-react";
import Topic from "../../FomoChat/Topic";
import { fetchFeedAccess } from "../../../../../http/comments/feedAccess";

/**
 * BUZZ-AI Stage 2 — Feed access gate (conversion screen).
 * Feed + social actions require an eligible membership OR an eligible FOMO NFT.
 * When access is missing we show a proper *selling* product screen (never a raw error)
 * that explains the value of joining before routing to purchase.
 * News & Calendar tabs are unaffected (public).
 */
const MEMBERSHIPS_ROUTE = "/utility/memberships";
const SPACEPORT_ROUTE = "/core/spaceport";

const BENEFITS = [
  {
    icon: Users,
    title: "Private community",
    text: "A members-only space for holders — real people, zero noise.",
  },
  {
    icon: MessagesSquare,
    title: "Live discussions",
    text: "Topics, threads and replies in real time with active traders.",
  },
  {
    icon: TrendingUp,
    title: "Trade ideas",
    text: "Public and private trading ideas and breakdowns from the community.",
  },
  {
    icon: Bot,
    title: "FOMO AI in threads",
    text: "The AI assistant joins discussions, summarizes and replies on point.",
  },
  {
    icon: Heart,
    title: "Reactions & influence",
    text: "Likes, reposts and reputation — shape the community agenda.",
  },
  {
    icon: Newspaper,
    title: "Exclusive digests",
    text: "Editorial market recaps: weekly, monthly, quarterly — before anyone else.",
  },
];

const PREVIEW_POINTS = [
  "Full access to the Feed and every members-only post",
  "Create topics and take part in discussions",
  "FOMO AI replies and summaries right inside threads",
  "Reactions, reposts and priority visibility for your ideas",
];

const FeedGate: FC<{ searchValue?: string; filterData?: any }> = ({ searchValue, filterData }) => {
  const router = useRouter();

  const { data, isLoading } = useQuery(["buzz-feed-access"], fetchFeedAccess, {
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Gate>
        <SkeletonCard />
      </Gate>
    );
  }

  if (data?.allowed) {
    return <Topic searchValue={searchValue} filterData={filterData} />;
  }

  return (
    <Gate data-testid="feed-access-gate">
      <Card>
        <Hero>
          <IconBadge>
            <Lock size={26} />
          </IconBadge>
          <span className="eyebrow">FOMO Community · Premium</span>
          <h2>Unlock the FOMO Community</h2>
          <p className="lead">
            The Feed is a members-only community: posts, discussions, reactions and
            replies from FOMO AI. Available to members with an active membership or an
            eligible FOMO NFT. News and Calendar stay free for everyone.
          </p>
        </Hero>

        <BenefitsGrid>
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <Benefit key={b.title} data-testid={`gate-benefit-${b.title}`}>
                <BenefitIcon>
                  <Icon size={18} />
                </BenefitIcon>
                <div>
                  <strong>{b.title}</strong>
                  <span>{b.text}</span>
                </div>
              </Benefit>
            );
          })}
        </BenefitsGrid>

        <Preview>
          <div className="preview-head">
            <Sparkles size={16} />
            <span>What you get inside</span>
          </div>
          <ul>
            {PREVIEW_POINTS.map((p) => (
              <li key={p}>
                <Check size={15} />
                {p}
              </li>
            ))}
          </ul>
        </Preview>

        <Passes>
          <Pass>
            <ShieldCheck size={18} />
            <div>
              <strong>Active membership</strong>
              <span>Unlock access with an active FOMO subscription</span>
            </div>
          </Pass>
          <Pass>
            <Sparkles size={18} />
            <div>
              <strong>Eligible FOMO NFT</strong>
              <span>Hold an NFT that grants community access</span>
            </div>
          </Pass>
        </Passes>

        <Actions>
          <PrimaryBtn onClick={() => router.push(MEMBERSHIPS_ROUTE)} data-testid="gate-memberships">
            Get a membership <ArrowRight size={16} />
          </PrimaryBtn>
          <SecondaryBtn onClick={() => router.push(SPACEPORT_ROUTE)} data-testid="gate-spaceport">
            Explore Spaceport
          </SecondaryBtn>
        </Actions>
        <FinePrint>Cancel anytime · News and Calendar are always free</FinePrint>
      </Card>
    </Gate>
  );
};

export default FeedGate;

const Gate = styled.div`
  width: 100%;
  padding: 8px 0 40px;
`;

const Card = styled.div`
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  border-radius: 20px;
  padding: 40px 44px 32px;
  box-shadow: 0 12px 40px rgba(16, 24, 40, 0.06);

  @media (max-width: 767px) {
    padding: 26px 18px 24px;
  }
`;

const Hero = styled.div`
  text-align: center;

  .eyebrow {
    display: inline-block;
    margin-top: 16px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #04a584;
  }

  h2 {
    font-size: 30px;
    font-weight: 700;
    color: #070b35;
    margin: 8px 0 10px;
  }
  .lead {
    font-size: 15px;
    line-height: 23px;
    color: #667085;
    margin: 0 auto;
    max-width: 620px;
  }
`;

const IconBadge = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #04a584;
  background: linear-gradient(135deg, #04a58422, #6172f322);
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 30px 0 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Benefit = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  padding: 16px;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  border-radius: 14px;
  background: #fbfcfe;
  transition: border-color 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: #04a58455;
    transform: translateY(-2px);
  }

  strong {
    display: block;
    font-size: 14.5px;
    color: #101828;
    margin-bottom: 3px;
  }
  span {
    display: block;
    font-size: 13px;
    line-height: 18px;
    color: #98a2b3;
  }
`;

const BenefitIcon = styled.div`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #04a584;
  background: #04a5841a;
`;

const Preview = styled.div`
  border: 1px dashed #d7e3df;
  border-radius: 14px;
  padding: 20px 22px;
  background: linear-gradient(135deg, #04a5840a, #6172f30a);
  margin-bottom: 24px;

  .preview-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: #04a584;
    margin-bottom: 14px;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    color: #344054;

    svg {
      color: #04a584;
      flex-shrink: 0;
    }
  }
`;

const Passes = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 24px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Pass = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 16px;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  border-radius: 12px;
  color: #04a584;

  strong {
    display: block;
    font-size: 14px;
    color: #101828;
  }
  span {
    display: block;
    font-size: 12.5px;
    color: #98a2b3;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 26px;
  border: none;
  border-radius: 10px;
  background: #04a584;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
  &:hover { opacity: 0.92; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
  &:focus-visible { outline: 2px solid #04a58466; outline-offset: 2px; }
`;

const SecondaryBtn = styled.button`
  height: 48px;
  padding: 0 24px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  color: #344054;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
  &:hover { border-color: #04a584; color: #04a584; }
  &:focus-visible { outline: 2px solid #04a58466; outline-offset: 2px; }
`;

const FinePrint = styled.p`
  text-align: center;
  font-size: 12px;
  color: #98a2b3;
  margin: 16px 0 0;
`;

const SkeletonCard = styled.div`
  width: 100%;
  height: 460px;
  border-radius: 20px;
  background: linear-gradient(90deg, #f2f4f7 25%, #e9edf2 37%, #f2f4f7 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;

  @keyframes shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: 0 0; }
  }
`;
