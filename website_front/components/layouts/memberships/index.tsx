import React, { useContext, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { AuthContext } from "../../global/Layout";
import SparklesIcon from "../../global/Icons/SparklesIcon";
import BotAvatar from "../../global/FomoAiWidget/BotAvatar";
import AnalyticsIcon from "../../global/Icons/AnalyticsIcon";
import Rocket from "../../global/Icons/Rocket";
import NftBadgeIcon from "../../global/Icons/NftBadgeIcon";
import CircleCheckIcon from "../../global/Icons/CircleCheckIcon";
import ClockIcon from "../../global/Icons/ClockIcon";
import {
  getMyMemberships, getProducts, getMembership, getMembershipsPage,
  MembershipStatus, MembershipState, Product, MembershipsPage,
} from "../../../http/products";
import { openAuthModal } from "../../../helpers/openAuthModal";
import { useFomoMoney, FomoBalanceWidget } from "../../global/money";
import { fmtUsdc, getCheckoutReadiness, CheckoutReadiness } from "../../../http/money";

/* ── G25 — compact selling landing, FOMO light/green design system ── */

const Page = styled.div`
  width: 1204px; margin: 27px auto 0; padding: 0 0 72px; color: var(--color-text-primary);
  @media (max-width: 1204px) { width: 100%; padding: 0 16px 60px; margin-top: 14px; }
`;

const Hero = styled.div` text-align: center; margin-bottom: 34px; `;
const Badge = styled.div`
  display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; letter-spacing: 0.02em;
  color: var(--color-primary-dark); background: var(--color-primary-soft); border: 1px solid var(--color-primary-soft-strong);
  padding: 6px 14px; border-radius: 999px; margin-bottom: 16px;
`;
const H1 = styled.h1` font-size: 34px; line-height: 1.15; font-weight: 700; letter-spacing: -0.02em; margin: 0 auto 12px; max-width: 720px; color: var(--color-text-primary); `;
const Lead = styled.p` font-size: 15.5px; line-height: 1.6; color: var(--color-text-secondary); margin: 0 auto; max-width: 640px; `;

const Props = styled.div` display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 30px 0 34px; @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 520px) { grid-template-columns: 1fr; } `;
const Prop = styled.div` background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; padding: 18px; box-shadow: var(--shadow-card); `;
const PropIco = styled.div` width: 38px; height: 38px; border-radius: 11px; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; `;
const PropTitle = styled.div` font-size: 14.5px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; `;
const PropText = styled.div` font-size: 12.5px; line-height: 1.5; color: var(--color-text-secondary); `;

const Grid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 20px; @media (max-width: 820px) { grid-template-columns: 1fr; } `;
const Card = styled.div<{ recommended?: boolean }>`
  background: var(--color-surface); border: ${(p) => (p.recommended ? "2px solid var(--color-primary)" : "1px solid var(--color-border)")};
  border-radius: 20px; padding: 26px; position: relative; display: flex; flex-direction: column; box-shadow: var(--shadow-card);
`;
const Ribbon = styled.div` position: absolute; top: -1px; right: 24px; background: var(--color-primary); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; padding: 5px 12px; border-radius: 0 0 10px 10px; `;
const Head = styled.div` display: flex; align-items: center; gap: 12px; `;
const Ico = styled.div<{ intel?: boolean }>` width: 44px; height: 44px; border-radius: 13px; background: ${(p) => (p.intel ? "var(--color-info-soft)" : "var(--color-primary-soft)")}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; `;
const PName = styled.div` font-size: 21px; font-weight: 700; color: var(--color-text-primary); `;
const PSub = styled.div` font-size: 13px; color: var(--color-text-secondary); margin-top: 1px; `;
const Desc = styled.div` font-size: 13.5px; line-height: 1.55; color: var(--color-text-secondary); margin: 14px 0 2px; `;
const Price = styled.div` font-size: 38px; font-weight: 700; color: var(--color-text-primary); margin: 16px 0 2px; letter-spacing: -0.02em; span { font-size: 14px; color: var(--color-text-muted); font-weight: 600; } `;
const CreditLine = styled.div` font-size: 12.5px; color: var(--color-text-muted); margin-bottom: 14px; `;
const Pill = styled.div<{ ok: boolean }>`
  display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; margin-bottom: 16px; align-self: flex-start;
  background: ${(p) => (p.ok ? "var(--color-primary-soft)" : "var(--color-surface-muted)")}; color: ${(p) => (p.ok ? "var(--color-primary-dark)" : "var(--color-text-muted)")};
  border: 1px solid ${(p) => (p.ok ? "var(--color-primary-soft-strong)" : "var(--color-border)")};
`;
const Feats = styled.div` margin-bottom: 20px; display: grid; gap: 2px; `;
const Feat = styled.div` display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: var(--color-text-strong); padding: 6px 0; `;
const Footer = styled.div` margin-top: auto; display: flex; flex-direction: column; padding-top: 8px; `;
const NoteSlot = styled.div` min-height: 34px; display: flex; align-items: center; justify-content: center; `;
const CTA = styled.button<{ intel?: boolean; ghost?: boolean }>`
  width: 100%; border: ${(p) => (p.ghost ? "1px solid var(--color-border)" : "none")};
  background: ${(p) => (p.ghost ? "transparent" : p.intel ? "radial-gradient(130% 130% at 28% 18%, #3b3b40 0%, #131316 55%, #050506 100%)" : "var(--color-primary)")};
  color: ${(p) => (p.ghost ? "var(--color-text-secondary)" : "#fff")};
  font-weight: 700; font-size: 14.5px; padding: 13px; border-radius: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: ${(p) => (p.intel && !p.ghost ? "0 6px 18px -8px rgba(0,0,0,0.55)" : "none")};
  transition: filter 0.15s ease, box-shadow 0.15s ease;
  &:hover:not(:disabled) { filter: ${(p) => (p.intel && !p.ghost ? "brightness(1.18)" : "brightness(0.96)")}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
const Note = styled.div` font-size: 11.5px; color: var(--color-text-muted); margin-top: 9px; text-align: center; `;
const NftOffer = styled.div` margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--color-border); `;
const NftTitle = styled.div` font-size: 13px; font-weight: 700; color: var(--color-text-primary); `;
const NftText = styled.div` font-size: 12.5px; color: var(--color-text-secondary); margin-top: 3px; line-height: 1.5; `;
const NftBtn = styled.button` margin-top: 10px; background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary-dark); font-weight: 700; font-size: 12.5px; padding: 8px 14px; border-radius: 10px; cursor: pointer; &:hover { background: var(--color-primary-soft); } `;

/* Web3 / NFT access — its own access lane, full width under both product cards */
const Web3Block = styled.div`
  margin-top: 20px; background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 18px; padding: 20px 24px; box-shadow: var(--shadow-card);
  display: flex; align-items: center; justify-content: space-between; gap: 22px; flex-wrap: wrap;
`;
const Web3Left = styled.div` display: flex; gap: 14px; align-items: flex-start; flex: 1; min-width: 280px; `;
const Web3Ico = styled.div` width: 46px; height: 46px; border-radius: 13px; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; `;
const Web3Title = styled.div` font-size: 15px; font-weight: 700; color: var(--color-text-primary); `;
const Web3Text = styled.div` font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; line-height: 1.55; max-width: 760px; `;
const Web3Btn = styled.button`
  flex-shrink: 0; background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary-dark);
  font-weight: 700; font-size: 13px; padding: 11px 20px; border-radius: 12px; cursor: pointer; transition: background 0.15s ease;
  &:hover { background: var(--color-primary-soft); }
`;

/* Membership status (authed) */
const Status = styled.div` background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 18px; padding: 22px; margin-bottom: 26px; box-shadow: var(--shadow-card); `;
const SRow = styled.div` display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-start; `;
const SCol = styled.div` min-width: 170px; `;
const SLabel = styled.div` font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: var(--color-text-muted); font-weight: 700; margin-bottom: 6px; `;
const SBig = styled.div` font-size: 20px; font-weight: 700; color: var(--color-text-primary); `;
const SLine = styled.div` font-size: 13px; color: var(--color-text-secondary); padding: 3px 0; display: flex; gap: 7px; align-items: center; `;
const SBtn = styled.button<{ ghost?: boolean }>` border: 1px solid ${(p) => (p.ghost ? "var(--color-border)" : "var(--color-primary)")}; background: ${(p) => (p.ghost ? "transparent" : "var(--color-primary)")}; color: ${(p) => (p.ghost ? "var(--color-text-secondary)" : "#fff")}; font-weight: 700; font-size: 12.5px; padding: 9px 14px; border-radius: 10px; cursor: pointer; &:disabled { opacity: 0.5; cursor: not-allowed; } `;

/* FAQ */
const Faqs = styled.div` margin-top: 40px; max-width: 760px; margin-left: auto; margin-right: auto; `;
const FaqTitle = styled.h2` font-size: 22px; font-weight: 700; text-align: center; color: var(--color-text-primary); margin-bottom: 18px; `;
const FaqItem = styled.div` background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 14px; padding: 16px 18px; margin-bottom: 10px; `;
const FaqQ = styled.div` font-size: 14px; font-weight: 700; color: var(--color-text-primary); `;
const FaqA = styled.div` font-size: 13px; color: var(--color-text-secondary); margin-top: 6px; line-height: 1.55; `;
const Foot = styled.div` text-align: center; font-size: 12.5px; color: var(--color-text-muted); margin-top: 30px; `;

/* Products explainer — what FOMO AI (on-site) vs FOMO Intel (external) actually are */
const floatUp = keyframes` from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } `;
const Explain = styled.div` margin: 34px auto 4px; width: 100%; `;
const ExplainHead = styled.div` text-align: center; margin-bottom: 20px; `;
const ExplainKicker = styled.div` font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 6px; `;
const ExplainTitle = styled.h2` font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0; letter-spacing: -0.02em; `;
const ExplainGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch; @media (max-width: 820px) { grid-template-columns: 1fr; } `;
const ExCard = styled.div<{ dark?: boolean }>`
  position: relative; overflow: hidden; border-radius: 20px; padding: 24px;
  animation: ${floatUp} 0.5s ease both;
  background: ${(p) => (p.dark ? "radial-gradient(120% 120% at 20% 12%, #1c1d22 0%, #101014 55%, #050506 100%)" : "var(--color-surface)")};
  border: 1px solid ${(p) => (p.dark ? "rgba(255,255,255,0.10)" : "var(--color-border)")};
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover { transform: translateY(-3px); box-shadow: 0 18px 40px -18px rgba(4,20,40,0.35); }
`;
const ExTop = styled.div` display: flex; align-items: center; gap: 12px; margin-bottom: 12px; `;
const ExIco = styled.div<{ dark?: boolean }>`
  width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  background: ${(p) => (p.dark ? "rgba(255,255,255,0.10)" : "var(--color-primary-soft)")};
`;
const ExName = styled.div<{ dark?: boolean }>` font-size: 18px; font-weight: 700; color: ${(p) => (p.dark ? "#fff" : "var(--color-text-primary)")}; `;
const ExTag = styled.span<{ dark?: boolean }>`
  font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; margin-left: 8px;
  background: ${(p) => (p.dark ? "rgba(255,255,255,0.14)" : "var(--color-primary-soft)")}; color: ${(p) => (p.dark ? "#fff" : "var(--color-primary-dark)")};
`;
const ExText = styled.p<{ dark?: boolean }>` font-size: 13.5px; line-height: 1.6; margin: 0 0 14px; color: ${(p) => (p.dark ? "rgba(255,255,255,0.74)" : "var(--color-text-secondary)")}; `;
const ExChips = styled.div` display: flex; flex-wrap: wrap; gap: 8px; `;
const ExChip = styled.span<{ dark?: boolean }>`
  font-size: 11.5px; font-weight: 600; padding: 6px 11px; border-radius: 999px;
  background: ${(p) => (p.dark ? "rgba(255,255,255,0.08)" : "var(--color-surface-muted)")};
  color: ${(p) => (p.dark ? "rgba(255,255,255,0.86)" : "var(--color-text-strong)")};
  border: 1px solid ${(p) => (p.dark ? "rgba(255,255,255,0.12)" : "var(--color-border)")};
`;

const AI_CHIPS = ["AI Chat", "Portfolio agent", "Deep research", "EarlyLand", "URL activity parsing"];
const INTEL_CHIPS = ["On-chain · 5 layers", "Sentiment", "Exchange flow", "Fractals", "M-Brain prediction", "Polymarket", "Auto TA", "Mobile trading"];

const DEFAULT_FAQ = [
  { q: "What is FOMO AI?", a: "FOMO AI is our on-site copilot. Chat with an AI trained on FOMO's crypto dataset, generate project / fund / person research in seconds, run your own portfolio agent that learns your style, and tap EarlyLand early-activity intelligence with on-chain URL parsing — all inside FOMO and paid from your FOMO Balance." },
  { q: "What is FOMO Intel, and how is it different?", a: "FOMO Intel is a separate, pro-grade platform (external web app + mobile) for serious market analysis and trading. It lives on its own site — subscribing here simply unlocks your access there. It is not the same as FOMO AI." },
  { q: "What can I do inside FOMO Intel?", a: "Trade with your deposit and manage portfolios, and use our neuro-models: five levels of on-chain analysis (exchange flow, sentiment, fractals and more), deep Twitter / Telegram sentiment, automated technical analysis, and M-Brain market prediction (including Polymarket) that forecasts where price is headed." },
  { q: "Do I need both?", a: "No. They are independent — subscribe to one, both, or neither. FOMO AI upgrades your research on-site; FOMO Intel gives you the full external trading-intelligence suite." },
];


const SRC_NAME: Record<string, string> = { SUBSCRIPTION: "Subscription", NFT_ACTIVATION: "FOMO NFT", ADMIN_GRANT: "Granted access", NFT_EVENT: "FOMO NFT", PROMO: "Promo" };
const fmtD = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—");

const PropIcon: React.FC<{ k: string }> = ({ k }) => {
  if (k === "analytics") return <AnalyticsIcon color="#04A584" />;
  if (k === "rocket") return <Rocket width={20} height={20} stroke="#04A584" />;
  if (k === "shield") return <NftBadgeIcon fill="#04A584" isActive />;
  return <SparklesIcon size={20} stroke="#04A584" />;
};

const MembershipsPageComp: React.FC = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const isAuth = !!authContext?.isAuth;
  const { balance, openCheckout } = useFomoMoney();
  const [products, setProducts] = useState<Product[]>([]);
  const [my, setMy] = useState<{ fomoAi: MembershipStatus; fomoIntel: MembershipStatus } | null>(null);
  const [membership, setMembership] = useState<MembershipState | null>(null);
  const [page, setPage] = useState<MembershipsPage | null>(null);
  const [readiness, setReadiness] = useState<CheckoutReadiness | null>(null);

  useEffect(() => {
    getProducts().then(setProducts);
    getMembershipsPage().then(setPage);
    if (isAuth) { getMyMemberships().then(setMy); getMembership().then(setMembership); getCheckoutReadiness().then(setReadiness); }
  }, [isAuth]);

  const statusFor = (t: string): MembershipStatus | null => (!my ? null : t === "FOMO_INTEL" ? my.fomoIntel : my.fomoAi);
  const nftAlt = membership?.sources?.some((s) => s.type.startsWith("NFT"));
  // Checkout readiness per product price — Intel is external (always purchasable),
  // FOMO AI needs a settlement lot + healthy engine. Never leaks "lot" to users.
  const purchasable = (p: Product): { ok: boolean; msg: string } => {
    if (p.productType === "FOMO_INTEL") return { ok: true, msg: "" };
    if (!readiness) return { ok: true, msg: "" };
    if (readiness.globalStatus !== "READY") return { ok: false, msg: "Purchases are temporarily unavailable. Please try again shortly." };
    const lot = readiness.lots?.[String(p.priceUsd)];
    if (!lot || lot.status === "OUT" || lot.status === "UNAVAILABLE") return { ok: false, msg: "Purchases are temporarily unavailable. Please try again shortly." };
    return { ok: true, msg: "" };
  };

  return (
    <Page data-testid="memberships-page">
      <Hero>
        <Badge><SparklesIcon size={14} stroke="#04A584" /> {page?.heroBadge || "FOMO Plans"}</Badge>
        <H1>{page?.heroTitle || "Choose your FOMO intelligence layer"}</H1>
        <Lead>{page?.heroSubtitle || "Two independent products on top of the always-free FOMO platform."}</Lead>
      </Hero>

      <Props>
        {(page?.valueProps || []).map((v, i) => (
          <Prop key={i} data-testid={`value-prop-${i}`}>
            <PropIco><PropIcon k={v.icon} /></PropIco>
            <PropTitle>{v.title}</PropTitle>
            <PropText>{v.text}</PropText>
          </Prop>
        ))}
      </Props>

      {isAuth && membership ? (
        <Status data-testid="membership-status-panel">
          <SRow>
            <SCol>
              <SLabel>FOMO AI</SLabel>
              <SBig style={{ color: membership.active ? "var(--color-primary-dark)" : "var(--color-text-muted)" }}>{membership.active ? "Active" : "Not active"}</SBig>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>{membership.active ? `Access until ${fmtD(membership.expiresAt)}` : "Subscribe to unlock FOMO AI"}</div>
            </SCol>
            <SCol style={{ flex: 1 }}>
              <SLabel>Your access sources</SLabel>
              {membership.sources?.length ? membership.sources.map((s, i) => (
                <SLine key={i}><CircleCheckIcon fill="#04A584" /> {SRC_NAME[s.type] || s.type}{s.tokenId ? ` #${s.tokenId}` : ""} — until {fmtD(s.expiresAt)}</SLine>
              )) : <SLine style={{ color: "var(--color-text-muted)" }}>No active access sources</SLine>}
              {membership.sources && membership.sources.length > 1 ? <SLine style={{ color: "var(--color-text-primary)", fontWeight: 700, marginTop: 4 }}><ClockIcon fill="#04A584" /> Effective access until {fmtD(membership.expiresAt)}</SLine> : null}
            </SCol>
            <SCol>
              <SLabel>AI credits</SLabel>
              <SBig>{my?.fomoAi?.credits ? `${my.fomoAi.credits.available} / ${my.fomoAi.credits.total}` : "—"}</SBig>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <SBtn onClick={() => router.push("/utility/ai")} data-testid="manage-membership">Manage</SBtn>
                <SBtn ghost disabled title="Coming soon">Buy credits</SBtn>
                {nftAlt ? <SBtn ghost onClick={() => router.push("/core/spaceport")} data-testid="view-nft-benefit">NFT benefit</SBtn> : null}
              </div>
            </SCol>
            <SCol style={{ minWidth: 264 }}>
              <FomoBalanceWidget />
            </SCol>
          </SRow>
        </Status>
      ) : null}

      <Grid>
        {products.map((p) => {
          const st = statusFor(p.productType);
          const active = st?.subscribed && st.status !== "NONE";
          const isIntel = p.productType === "FOMO_INTEL";
          const daysLeft = active && st?.currentPeriodEnd
            ? Math.ceil((new Date(st.currentPeriodEnd).getTime() - Date.now()) / 86400000)
            : null;
          const expiringSoon = daysLeft !== null && daysLeft <= 7;
          const canRenewFromBalance = balance.available >= p.priceUsd;
          const renewProduct = { productCode: p.productType, planCode: p.code, name: p.name, priceUsd: p.priceUsd, durationDays: p.durationDays, aiCredits: p.aiCredits };
          return (
            <Card key={p.code} recommended={p.recommended} data-testid={`membership-card-${p.productType}`}>
              {p.recommended ? <Ribbon>RECOMMENDED</Ribbon> : null}
              <Head>
                <Ico intel={isIntel}>{isIntel ? <AnalyticsIcon color="#2082EA" /> : <BotAvatar size={26} color="#04A584" />}</Ico>
                <div><PName>{p.name}</PName><PSub>{p.subtitle}</PSub></div>
              </Head>
              {p.description ? <Desc>{p.description}</Desc> : null}
              <Price>${p.priceUsd}<span> / {p.durationDays} days</span></Price>
              <CreditLine>{isIntel ? "Access-based · no AI credits · separate billing" : `${p.aiCredits ?? 0} AI credits included / period`}</CreditLine>
              <Pill ok={!!active} data-testid={`membership-status-${p.productType}`}>
                {active ? <>Active{st?.currentPeriodEnd ? ` · renews ${new Date(st.currentPeriodEnd).toLocaleDateString("en-US")}` : ""}</> : "Not subscribed"}
              </Pill>
              <Feats>
                {p.offerItems.map((o, i) => (
                  <Feat key={i}><CircleCheckIcon fill="#04A584" /> <span><b style={{ color: "var(--color-text-primary)" }}>{o.title}</b>{o.description ? <span style={{ color: "var(--color-text-muted)" }}> — {o.description}</span> : null}</span></Feat>
                ))}
              </Feats>

              <Footer>
              {isIntel && active && p.externalUrl ? (
                <CTA intel data-testid={`membership-open-${p.productType}`} onClick={() => window.open(p.externalUrl as string, "_blank")}><AnalyticsIcon color="#fff" />Open FOMO Intel ↗</CTA>
              ) : p.productType === "FOMO_AI" && active ? (
                <>
                  <CTA data-testid="membership-open-FOMO_AI" onClick={() => router.push("/utility/ai")}><BotAvatar size={18} color="#fff" />Open FOMO AI</CTA>
                  {expiringSoon ? (
                    <CTA
                      style={{ marginTop: 8 }}
                      data-testid="membership-renew-FOMO_AI"
                      onClick={() => openCheckout(renewProduct)}
                    >
                      <BotAvatar size={18} color="#fff" />{canRenewFromBalance ? `Renew for ${fmtUsdc(p.priceUsd)} USDC` : "Deposit & Renew"}
                    </CTA>
                  ) : null}
                </>
              ) : !isAuth ? (
                <CTA intel={isIntel} onClick={() => openAuthModal(router)}>{isIntel ? <AnalyticsIcon color="#fff" /> : <BotAvatar size={18} color="#fff" />}Sign in to subscribe</CTA>
              ) : (() => {
                const buyable = purchasable(p);
                return (
                  <CTA
                    intel={isIntel}
                    disabled={!buyable.ok}
                    data-testid={`membership-subscribe-${p.productType}`}
                    onClick={() => buyable.ok && openCheckout({ productCode: p.productType, planCode: p.code, name: p.name, priceUsd: p.priceUsd, durationDays: p.durationDays, aiCredits: p.aiCredits })}
                  >
                    {isIntel ? <AnalyticsIcon color="#fff" /> : <BotAvatar size={18} color="#fff" />}{buyable.ok ? `Buy for ${fmtUsdc(p.priceUsd)} USDC` : "Temporarily unavailable"}
                  </CTA>
                );
              })()}
              <NoteSlot>
                {isAuth && !active && !purchasable(p).ok ? (
                  <Note data-testid={`membership-unavailable-${p.productType}`}>{purchasable(p).msg}</Note>
                ) : p.productType === "FOMO_AI" && active && expiringSoon ? (
                  <Note data-testid="membership-expiry-note">Your membership expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}. {canRenewFromBalance ? `Renew for ${fmtUsdc(p.priceUsd)} USDC from your FOMO Balance.` : `Top up your FOMO Balance to renew (${fmtUsdc(balance.available)} available).`}</Note>
                ) : isAuth && !active ? (
                  <Note>{isIntel ? "Pay from your FOMO Balance — access is granted on FOMO Intel automatically." : `Pay from your FOMO Balance (${fmtUsdc(balance.available)} USDC available) — no extra wallet transaction.`}</Note>
                ) : isIntel && active ? (
                  <Note>Access active — open FOMO Intel on the external platform.</Note>
                ) : <span />}
              </NoteSlot>
              </Footer>
            </Card>
          );
        })}
      </Grid>

      {/* Web3 / NFT access lane — directly under the two plans (own access lane) */}
      <Web3Block data-testid="web3-access">
        <Web3Left>
          <Web3Ico><NftBadgeIcon fill="#04A584" isActive /></Web3Ico>
          <div>
            <Web3Title>{page?.nftOfferTitle || "Prefer Web3 access?"}</Web3Title>
            <Web3Text>{nftAlt ? "Your FOMO NFT already provides FOMO AI access — view it in Spaceport. NFTs also keep their Launchpad / SpacePort utility." : (page?.nftOfferText || "Eligible FOMO NFTs include a limited FOMO AI access period and keep their Launchpad / SpacePort utility.")}</Web3Text>
          </div>
        </Web3Left>
        <Web3Btn onClick={() => router.push("/core/spaceport")} data-testid="web3-access-cta">{nftAlt ? "View NFT benefit" : (page?.nftOfferCta || "Explore FOMO NFTs")}</Web3Btn>
      </Web3Block>

      {/* What each product actually is — on-site AI vs external Intel platform (full width, below plans) */}
      <Explain data-testid="products-explainer">
        <ExplainHead>
          <ExplainKicker>Two products, one FOMO account</ExplainKicker>
          <ExplainTitle>FOMO AI vs FOMO Intel</ExplainTitle>
        </ExplainHead>
        <ExplainGrid>
          <ExCard>
            <ExTop>
              <ExIco><BotAvatar size={26} color="#04A584" /></ExIco>
              <ExName>FOMO AI <ExTag>On-site</ExTag></ExName>
            </ExTop>
            <ExText>
              Your crypto copilot inside FOMO. Ask FOMO anything, generate project / fund / person deep-research in
              seconds, run your own portfolio agent that learns and teaches you crypto, and tap EarlyLand early-activity
              intelligence with on-chain URL parsing — all on this site, paid from your FOMO Balance.
            </ExText>
            <ExChips>{AI_CHIPS.map((c) => <ExChip key={c}>{c}</ExChip>)}</ExChips>
          </ExCard>
          <ExCard dark>
            <ExTop>
              <ExIco dark><AnalyticsIcon color="#ffffff" /></ExIco>
              <ExName dark>FOMO Intel <ExTag dark>External · Pro</ExTag></ExName>
            </ExTop>
            <ExText dark>
              A separate pro platform — external web app plus mobile — for serious market analysis and trading. Trade
              your deposit, manage portfolios, and use our neuro-models: five on-chain analysis layers, sentiment,
              exchange flow, fractals, automated technical analysis and M-Brain market prediction (incl. Polymarket and
              deep Twitter / Telegram). Subscribing here unlocks your access there.
            </ExText>
            <ExChips>{INTEL_CHIPS.map((c) => <ExChip key={c} dark>{c}</ExChip>)}</ExChips>
          </ExCard>
        </ExplainGrid>
      </Explain>

      {(() => {
        const faqs = page?.faq?.length ? page.faq : DEFAULT_FAQ;
        return (
          <Faqs data-testid="memberships-faq">
            <FaqTitle>{page?.faqTitle || "Common questions"}</FaqTitle>
            {faqs.map((f, i) => (
              <FaqItem key={i}><FaqQ>{f.q}</FaqQ><FaqA>{f.a}</FaqA></FaqItem>
            ))}
          </Faqs>
        );
      })()}

      <Foot>{page?.footnote || "The free FOMO platform always stays open."}</Foot>
    </Page>
  );
};

export default MembershipsPageComp;
