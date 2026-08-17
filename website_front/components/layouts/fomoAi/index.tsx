import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { Sparkles, Plus, Send, Database, ChevronDown, Lock, TrendingUp, GitCompare, Newspaper, Briefcase, Microscope, Activity, Receipt, X } from "lucide-react";
import { AuthContext } from "../../global/Layout";
import {
  AiContext,
  AiConversationDto,
  AiMessageDto,
  AiOperation,
  AiUsageRow,
  askFomoAi,
  getAiContext,
  getAiUsageHistory,
  getConversations,
  getMessages,
} from "../../../http/fomoAi";
import { openAuthModal } from "../../../helpers/openAuthModal";
import BotAvatar from "../../global/FomoAiWidget/BotAvatar";
import { API } from "../../../config/api";
import getAuthToken from "../../../http/getAuthToken";
import { Mail, CheckCircle2 } from "lucide-react";

const Page = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  min-height: calc(100vh - 120px);
  color: #0b1b17;
  @media (max-width: 900px) { flex-direction: column; padding: 10px; }
`;
const Sidebar = styled.div`
  width: 260px; flex-shrink: 0; background: #ffffff; border: 1px solid rgba(4, 165, 132, 0.16); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 10px 30px rgba(4, 62, 50, 0.06);
  @media (max-width: 900px) { width: 100%; }
`;
const Main = styled.div`
  flex: 1; background: #ffffff; border: 1px solid rgba(4, 165, 132, 0.16); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; min-height: 560px; box-shadow: 0 10px 30px rgba(4, 62, 50, 0.06);
`;
const HeaderBar = styled.div`
  display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(4, 165, 132, 0.12);
`;
const Brand = styled.div`
  display: flex; align-items: center; gap: 10px;
  .t { font-size: 17px; font-weight: 800; color: #0b1b17; }
  .s { font-size: 12px; color: #64748b; }
`;
const CreditPill = styled.div`
  display: inline-flex; align-items: center; gap: 8px; background: rgba(4, 165, 132, 0.08); border: 1px solid rgba(4, 165, 132, 0.24); color: #037A63; font-weight: 700; font-size: 13px; padding: 8px 14px; border-radius: 999px;
  b { color: #04A584; }
`;
const NewBtn = styled.button`
  display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #04A584 0%, #037A63 100%); color: #fff; border: none; border-radius: 10px; padding: 10px 12px; font-weight: 700; cursor: pointer; font-size: 13px; box-shadow: 0 8px 18px rgba(4, 165, 132, 0.28);
  transition: transform 160ms ease, box-shadow 160ms ease; &:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(4, 165, 132, 0.36); }
`;
const ConvItem = styled.button<{ active: boolean }>`
  text-align: left; width: 100%; background: ${(p) => (p.active ? "rgba(4, 165, 132, 0.10)" : "transparent")}; border: 1px solid ${(p) => (p.active ? "rgba(4, 165, 132, 0.28)" : "transparent")}; color: ${(p) => (p.active ? "#037A63" : "#334155")}; font-weight: ${(p) => (p.active ? 700 : 500)}; border-radius: 10px; padding: 9px 11px; font-size: 13px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  &:hover { background: rgba(4, 165, 132, 0.07); }
`;
const Scroll = styled.div` flex: 1; overflow-y: auto; padding: 22px; display: flex; flex-direction: column; gap: 16px; `;
const WelcomeWrap = styled.div` max-width: 760px; margin: 8px auto; width: 100%; `;
const WelcomeTitle = styled.div` font-size: 26px; font-weight: 800; color: #0b1b17; margin-bottom: 4px; `;
const WelcomeSub = styled.div` font-size: 14px; color: #64748b; margin-bottom: 20px; `;
const Cards = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; `;
const ScenarioCard = styled.button`
  text-align: left; background: #ffffff; border: 1px solid rgba(4, 165, 132, 0.18); border-radius: 14px; padding: 14px; cursor: pointer; color: #0b1b17; transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  &:hover { transform: translateY(-2px); border-color: rgba(4, 165, 132, 0.42); box-shadow: 0 12px 26px rgba(4, 165, 132, 0.14); }
  .h { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; margin-bottom: 6px; }
  .d { font-size: 12.5px; color: #64748b; line-height: 1.5; }
  svg { color: #04A584; }
`;
const Bubble = styled.div<{ role: string }>`
  align-self: ${(p) => (p.role === "user" ? "flex-end" : "flex-start")};
  max-width: 82%;
  background: ${(p) => (p.role === "user" ? "linear-gradient(135deg, #04A584 0%, #037A63 100%)" : "#ffffff")};
  border: 1px solid ${(p) => (p.role === "user" ? "transparent" : "rgba(4, 165, 132, 0.16)")};
  border-radius: 14px; padding: 13px 15px; font-size: 13.5px; line-height: 1.6; white-space: pre-wrap; color: ${(p) => (p.role === "user" ? "#ffffff" : "#0b1b17")};
`;
const MetaRow = styled.div` display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; align-items: center; `;
const Tag = styled.span<{ c?: string }>`
  font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: ${(p) => p.c || "rgba(4, 165, 132, 0.10)"}; color: #037A63;
`;
const SourcesBox = styled.div` margin-top: 8px; border-top: 1px dashed rgba(4, 165, 132, 0.24); padding-top: 8px; `;
const SourceItem = styled.div`
  display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; padding: 3px 0;
`;
const Composer = styled.div` border-top: 1px solid rgba(4, 165, 132, 0.12); padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; background: #ffffff; `;
const OpRow = styled.div` display: flex; gap: 8px; flex-wrap: wrap; align-items: center; `;
const OpChip = styled.button<{ active: boolean; disabled?: boolean }>`
  display: inline-flex; align-items: center; gap: 6px; border: 1px solid ${(p) => (p.active ? "#04A584" : "rgba(4, 165, 132, 0.24)")}; background: ${(p) => (p.active ? "linear-gradient(135deg, #04A584 0%, #037A63 100%)" : "rgba(4, 165, 132, 0.06)")}; color: ${(p) => (p.active ? "#fff" : "#037A63")}; border-radius: 999px; padding: 7px 13px; font-size: 12.5px; font-weight: 700; cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")}; opacity: ${(p) => (p.disabled ? 0.5 : 1)};
`;
const InputRow = styled.div` display: flex; gap: 10px; align-items: flex-end; `;
const TextArea = styled.textarea`
  flex: 1; resize: none; min-height: 48px; max-height: 160px; background: #f7fbfa; border: 1px solid rgba(4, 165, 132, 0.24); border-radius: 12px; color: #0b1b17; padding: 12px 14px; font-size: 13.5px; outline: none; font-family: inherit;
  &::placeholder { color: #94a3b8; }
  &:focus { border-color: #04A584; box-shadow: 0 0 0 3px rgba(4, 165, 132, 0.14); }
`;
const SendBtn = styled.button`
  background: linear-gradient(135deg, #04A584 0%, #037A63 100%); border: none; border-radius: 12px; color: #fff; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 18px rgba(4, 165, 132, 0.3); transition: transform 140ms ease;
  &:hover:not(:disabled) { transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
`;
const EstimateNote = styled.div` font-size: 12px; color: #64748b; b { color: #04A584; } `;

// Charge history ("История списаний") — header button + slide-over panel
const LedgerBtn = styled.button<{ active?: boolean }>`
  display: inline-flex; align-items: center; gap: 7px; border: 1px solid rgba(4, 165, 132, 0.24);
  background: ${(p) => (p.active ? "linear-gradient(135deg, #04A584 0%, #037A63 100%)" : "rgba(4, 165, 132, 0.06)")};
  color: ${(p) => (p.active ? "#fff" : "#037A63")}; border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease; &:hover { transform: translateY(-1px); }
`;
const HeaderRight = styled.div` display: flex; align-items: center; gap: 10px; `;
const LedgerOverlay = styled.div`
  position: absolute; inset: 0; background: rgba(11, 27, 23, 0.28); display: flex; justify-content: flex-end; z-index: 20;
`;
const LedgerPanel = styled.div`
  width: 420px; max-width: 92%; height: 100%; background: #ffffff; border-left: 1px solid rgba(4, 165, 132, 0.16);
  display: flex; flex-direction: column; box-shadow: -12px 0 40px rgba(4, 62, 50, 0.14);
  animation: ledgerIn 220ms ease; @keyframes ledgerIn { from { transform: translateX(24px); opacity: 0.6; } to { transform: translateX(0); opacity: 1; } }
`;
const LedgerHead = styled.div`
  display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid rgba(4, 165, 132, 0.12);
  .t { display: flex; align-items: center; gap: 9px; font-size: 15px; font-weight: 800; color: #0b1b17; }
`;
const CloseBtn = styled.button` background: rgba(4, 165, 132, 0.08); border: none; border-radius: 9px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #037A63; cursor: pointer; &:hover { background: rgba(4, 165, 132, 0.16); } `;
const LedgerSummary = styled.div`
  margin: 14px 18px 6px; background: rgba(4, 165, 132, 0.07); border: 1px solid rgba(4, 165, 132, 0.2); border-radius: 12px; padding: 12px 14px;
  .l { font-size: 12px; color: #64748b; } .v { font-size: 22px; font-weight: 800; color: #037A63; margin-top: 2px; } b { color: #04A584; }
`;
const LedgerList = styled.div` flex: 1; overflow-y: auto; padding: 8px 14px 18px; display: flex; flex-direction: column; gap: 8px; `;
const LedgerRow = styled.div`
  border: 1px solid rgba(4, 165, 132, 0.14); border-radius: 12px; padding: 11px 13px; background: #fff;
  display: flex; flex-direction: column; gap: 6px; transition: border-color 140ms ease; &:hover { border-color: rgba(4, 165, 132, 0.34); }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .op { font-size: 13.5px; font-weight: 700; color: #0b1b17; }
  .credits { font-size: 14px; font-weight: 800; color: #037A63; white-space: nowrap; }
  .credits.zero { color: #94a3b8; }
  .meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 11.5px; color: #64748b; }
`;
const LedgerEmpty = styled.div` text-align: center; color: #94a3b8; font-size: 13px; padding: 40px 16px; line-height: 1.6; `;
const StatusTag = styled.span<{ c?: string; bg?: string }>`
  font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; color: ${(p) => p.c || "#037A63"}; background: ${(p) => p.bg || "rgba(4, 165, 132, 0.10)"};
`;

// Locked / membership state
const LockedWrap = styled.div` max-width: 560px; margin: 60px auto; text-align: center; color: #0b1b17; `;
const LockIcon = styled.div` width: 70px; height: 70px; border-radius: 50%; background: rgba(4, 165, 132, 0.10); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; color: #04A584; `;
const CTA = styled.button` margin-top: 18px; background: linear-gradient(135deg, #04A584 0%, #037A63 100%); color: #fff; border: none; border-radius: 12px; padding: 12px 22px; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 10px 24px rgba(4, 165, 132, 0.3); transition: transform 140ms ease; &:hover { transform: translateY(-1px); } `;
const OpPreview = styled.div` margin-top: 26px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 10px; text-align: left; `;
const OpPreviewCard = styled.div` background: #ffffff; border: 1px solid rgba(4, 165, 132, 0.18); border-radius: 12px; padding: 12px; .n { font-weight: 700; font-size: 13px; color: #0b1b17; } .c { font-size: 12px; color: #64748b; margin-top: 2px; } `;

// Email-connect gate
const EmailForm = styled.div` margin: 22px auto 0; max-width: 420px; display: flex; flex-direction: column; gap: 12px; text-align: left; `;
const EmailFieldRow = styled.div` display: flex; gap: 10px; align-items: stretch; @media (max-width: 520px) { flex-direction: column; } `;
const EmailInputEl = styled.input<{ invalid?: boolean }>`
  flex: 1; background: #f7fbfa; border: 1px solid ${(p) => (p.invalid ? "#e0564f" : "rgba(4, 165, 132, 0.28)")}; border-radius: 12px; color: #0b1b17; padding: 13px 15px; font-size: 14px; outline: none; font-family: inherit;
  &::placeholder { color: #94a3b8; }
  &:focus { border-color: #04A584; box-shadow: 0 0 0 3px rgba(4, 165, 132, 0.14); }
`;
const EmailBtn = styled.button`
  background: linear-gradient(135deg, #04A584 0%, #037A63 100%); color: #fff; border: none; border-radius: 12px; padding: 13px 22px; font-weight: 800; font-size: 14px; cursor: pointer; white-space: nowrap; box-shadow: 0 10px 24px rgba(4, 165, 132, 0.3); transition: transform 140ms ease, opacity 140ms ease;
  &:hover:not(:disabled) { transform: translateY(-1px); }
  &:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
`;
const EmailErr = styled.div` font-size: 12.5px; color: #e0564f; font-weight: 600; `;
const GhostLink = styled.button` background: transparent; border: none; color: #037A63; font-weight: 700; font-size: 13px; cursor: pointer; text-decoration: underline; align-self: center; margin-top: 4px; &:hover { color: #04A584; } `;
const SuccessNote = styled.div` display: flex; align-items: flex-start; gap: 10px; background: rgba(4, 165, 132, 0.08); border: 1px solid rgba(4, 165, 132, 0.24); border-radius: 12px; padding: 13px 15px; color: #037A63; font-size: 13.5px; line-height: 1.5; text-align: left; b { color: #04A584; } `;

const BULLET_DOT = "\u00B7";
const OP_ICONS: Record<string, JSX.Element> = {
  ask_fomo: <Sparkles size={16} />,
  token_analysis: <TrendingUp size={16} />,
  compare_projects: <GitCompare size={16} />,
  market_brief: <Newspaper size={16} />,
  portfolio_analysis: <Briefcase size={16} />,
  deep_research: <Microscope size={16} />,
};
const SCENARIO_PROMPTS: Record<string, string> = {
  ask_fomo: "What early crypto opportunities does FOMO track right now?",
  token_analysis: "Analyze Monad using FOMO data.",
  compare_projects: "Compare Monad and MegaETH.",
  market_brief: "What changed in crypto today?",
  portfolio_analysis: "Review my portfolio.",
  deep_research: "Research Monad using all available FOMO data.",
};

const FomoAiPage: React.FC = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const isAuth = !!authContext?.isAuth;
  const userData = authContext?.userData || {};
  const emailConnected = !!userData?.email;

  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailErr, setEmailErr] = useState("");

  const [ctx, setCtx] = useState<AiContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<AiConversationDto[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessageDto[]>([]);
  const [operation, setOperation] = useState("ask_fomo");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Charge history ("История списаний")
  const [showLedger, setShowLedger] = useState(false);
  const [ledger, setLedger] = useState<AiUsageRow[]>([]);
  const [ledgerTotalSpent, setLedgerTotalSpent] = useState(0);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const loadLedger = async () => {
    setLedgerLoading(true);
    const h = await getAiUsageHistory(100);
    setLedger(h.items || []);
    setLedgerTotalSpent(h.totalCreditsSpent || 0);
    setLedgerLoading(false);
  };
  const openLedger = () => { setShowLedger(true); loadLedger(); };

  const reloadContext = async () => {
    const c = await getAiContext();
    setCtx(c);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      if (!isAuth) { setLoading(false); return; }
      const [c, convs] = await Promise.all([getAiContext(), getConversations()]);
      if (!alive) return;
      setCtx(c);
      setConversations(convs);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [isAuth]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const currentOp: AiOperation | undefined = useMemo(
    () => ctx?.operations.find((o) => o.operation === operation),
    [ctx, operation]
  );
  const estimate = currentOp?.estimatedCredits ?? null;
  const available = ctx?.credits.available ?? 0;
  const insufficient = estimate != null && available < estimate;

  const openConversation = async (id: string) => {
    setActiveConv(id);
    const msgs = await getMessages(id);
    setMessages(msgs);
  };
  const startNew = () => { setActiveConv(null); setMessages([]); setInput(""); };

  const runScenario = (op: string) => {
    setOperation(op);
    setInput(SCENARIO_PROMPTS[op] || "");
  };

  const send = async () => {
    const q = input.trim();
    if (!q || sending) return;
    if (currentOp && !currentOp.allowed) return;
    setSending(true);
    const userMsg: AiMessageDto = { role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    try {
      const res = await askFomoAi({ conversationId: activeConv || undefined, operation, query: q });
      if (res?.ok === false) {
        const reason = res.errorCode === "access_denied"
          ? "This operation needs a FOMO AI membership."
          : res.errorCode === "insufficient_credits"
            ? "Not enough credits for this operation."
            : (res.reason || "Request failed.");
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${reason}`, dataMode: "error" }]);
      } else {
        if (res.conversationId && !activeConv) {
          setActiveConv(res.conversationId);
          setConversations(await getConversations());
        }
        setMessages((m) => [...m, res.message]);
        await reloadContext();
        if (showLedger) loadLedger();
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ Network error. Please try again.", dataMode: "error" }]);
    } finally {
      setSending(false);
    }
  };

  const connectEmail = async () => {
    const email = emailInput.trim();
    setEmailErr("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr("Please enter a valid email address.");
      return;
    }
    setEmailSending(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/auth/send-confirm?email=${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setEmailErr("Could not send the confirmation link. Please try again.");
      } else {
        setEmailSent(true);
      }
    } catch (e) {
      setEmailErr("Network error. Please try again.");
    } finally {
      setEmailSending(false);
    }
  };

  // --- Not authenticated ---
  if (!loading && !isAuth) {
    return (
      <Page>
        <Main>
          <LockedWrap data-testid="fomo-ai-signin">
            <LockIcon><Lock size={30} /></LockIcon>
            <WelcomeTitle>FOMO AI</WelcomeTitle>
            <WelcomeSub>Your crypto intelligence layer. Sign in to access FOMO AI.</WelcomeSub>
            <CTA data-testid="fomo-ai-signin-btn" onClick={() => openAuthModal(router)}>Sign in</CTA>
          </LockedWrap>
        </Main>
      </Page>
    );
  }

  // --- Authenticated wallet but no email connected ---
  if (!loading && isAuth && !emailConnected) {
    return (
      <Page>
        <Main>
          <LockedWrap data-testid="fomo-ai-email-gate">
            <LockIcon><Mail size={30} /></LockIcon>
            <WelcomeTitle>Connect your email</WelcomeTitle>
            <WelcomeSub>
              Your wallet is connected, but FOMO AI needs a confirmed email to secure your account,
              deliver receipts and sync your credits across devices.
            </WelcomeSub>

            {emailSent ? (
              <EmailForm>
                <SuccessNote data-testid="fomo-ai-email-sent">
                  <CheckCircle2 size={20} />
                  <span>
                    Confirmation link sent to <b>{emailInput.trim()}</b>. Open it to verify your
                    email, then reload this page.
                  </span>
                </SuccessNote>
                <EmailBtn data-testid="fomo-ai-email-reload" onClick={() => authContext?.refetchAuthData?.() || window.location.reload()}>
                  I&apos;ve confirmed — reload
                </EmailBtn>
                <GhostLink data-testid="fomo-ai-email-resend" onClick={() => { setEmailSent(false); }}>
                  Use a different email
                </GhostLink>
              </EmailForm>
            ) : (
              <EmailForm>
                <EmailFieldRow>
                  <EmailInputEl
                    data-testid="fomo-ai-email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={emailInput}
                    invalid={!!emailErr}
                    onChange={(e) => { setEmailInput(e.target.value); if (emailErr) setEmailErr(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") connectEmail(); }}
                  />
                  <EmailBtn data-testid="fomo-ai-email-submit" disabled={emailSending} onClick={connectEmail}>
                    {emailSending ? "Sending…" : "Send confirmation link"}
                  </EmailBtn>
                </EmailFieldRow>
                {emailErr ? <EmailErr data-testid="fomo-ai-email-error">{emailErr}</EmailErr> : null}
                <GhostLink data-testid="fomo-ai-email-openauth" onClick={() => openAuthModal(router)}>
                  Manage account &amp; sign-in options
                </GhostLink>
              </EmailForm>
            )}
          </LockedWrap>
        </Main>
      </Page>
    );
  }

  // --- Authenticated but no membership ---
  if (!loading && ctx && !ctx.access.allowed) {
    return (
      <Page>
        <Main>
          <LockedWrap data-testid="fomo-ai-locked">
            <LockIcon><BotAvatar size={34} color="#04A584" /></LockIcon>
            <WelcomeTitle>FOMO AI Membership required</WelcomeTitle>
            <WelcomeSub>Unlock the FOMO AI assistant, EarlyLand Prime and advanced research. Ask questions grounded in real FOMO data.</WelcomeSub>
            <CTA data-testid="fomo-ai-membership-btn" onClick={() => router.push("/utility/memberships")}>View membership</CTA>
            <OpPreview>
              {(ctx.operations || []).map((o) => (
                <OpPreviewCard key={o.operation}>
                  <div className="n">{o.label}</div>
                  <div className="c">{o.description}</div>
                </OpPreviewCard>
              ))}
            </OpPreview>
          </LockedWrap>
        </Main>
      </Page>
    );
  }

  const showWelcome = !activeConv && messages.length === 0;

  return (
    <Page data-testid="fomo-ai-page">
      <Sidebar>
        <NewBtn data-testid="fomo-ai-new-chat" onClick={startNew}><Plus size={16} /> New chat</NewBtn>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginTop: 6 }}>Recent</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          {conversations.length === 0 ? <div style={{ fontSize: 12.5, color: "#94a3b8", padding: "6px 2px" }}>No conversations yet.</div> :
            conversations.map((c) => (
              <ConvItem key={c._id} active={activeConv === c._id} onClick={() => openConversation(c._id)} data-testid={`fomo-ai-conv-${c._id}`}>{c.title || "Chat"}</ConvItem>
            ))}
        </div>
      </Sidebar>

      <Main>
        <HeaderBar>
          <Brand>
            <BotAvatar size={24} color="#04A584" />
            <div><div className="t">FOMO AI</div><div className="s">Your crypto intelligence layer</div></div>
          </Brand>
          <HeaderRight>
            <LedgerBtn data-testid="fomo-ai-ledger-btn" active={showLedger} onClick={openLedger} title="Credit spend history">
              <Receipt size={15} /> Spend history
            </LedgerBtn>
            <CreditPill data-testid="fomo-ai-credits">Credits <b>{available}</b></CreditPill>
          </HeaderRight>
        </HeaderBar>

        <Scroll ref={scrollRef}>
          {showWelcome ? (
            <WelcomeWrap>
              <WelcomeTitle>What do you want to know?</WelcomeTitle>
              <WelcomeSub>Ask anything about crypto — every answer is grounded in real FOMO data.</WelcomeSub>
              <Cards>
                {(ctx?.operations || []).map((o) => (
                  <ScenarioCard key={o.operation} data-testid={`fomo-ai-scenario-${o.operation}`} disabled={!o.allowed} onClick={() => o.allowed && runScenario(o.operation)}>
                    <div className="h">{OP_ICONS[o.operation]} {o.label} {!o.allowed && <Lock size={13} />}</div>
                    <div className="d">{SCENARIO_PROMPTS[o.operation] || o.description}</div>
                  </ScenarioCard>
                ))}
              </Cards>
              <div data-testid="fomo-ai-crosssell" onClick={() => router.push("/utility/memberships")} style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 12, background: "rgba(4, 165, 132, 0.06)", border: "1px solid rgba(4, 165, 132, 0.22)", borderRadius: 14, padding: "14px 16px", cursor: "pointer" }}>
                <Activity size={20} color="#04A584" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0b1b17" }}>Need real-time trading intelligence?</div>
                  <div style={{ fontSize: 12.5, color: "#64748b" }}>Explore FOMO Intel — a separate product for trading signals & analytics.</div>
                </div>
                <span style={{ color: "#037A63", fontWeight: 700, fontSize: 13 }}>Explore →</span>
              </div>
            </WelcomeWrap>
          ) : (
            messages.map((m, i) => (
              <Bubble key={m._id || i} role={m.role} data-testid={`fomo-ai-msg-${m.role}`}>
                {m.role === "assistant" && m.sections && m.dataMode !== "error" ? (
                  <div data-testid={`fomo-ai-sections-${i}`}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#037A63", marginBottom: 4 }}>FOMO DATA</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: m.sections.fomoData?.available ? "#0b1b17" : "#94a3b8", whiteSpace: "pre-wrap" }}>
                        {m.sections.fomoData?.text || "No matching evidence was found in the connected FOMO data sources."}
                      </div>
                    </div>
                    {m.sections.analysis?.text ? (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#6D28D9", marginBottom: 4 }}>ANALYSIS</div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#0b1b17", whiteSpace: "pre-wrap" }}>{m.sections.analysis.text}</div>
                      </div>
                    ) : null}
                    {m.sections.risks?.text ? (
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#B45309", marginBottom: 4 }}>RISKS &amp; UNCERTAINTY</div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#0b1b17", whiteSpace: "pre-wrap" }}>{m.sections.risks.text}</div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  m.content
                )}
                {m.role === "assistant" && m.dataMode !== "error" && (
                  <>
                    <MetaRow>
                      {m.provider?.name ? <Tag c="rgba(4, 165, 132, 0.08)">{m.provider.name}{m.provider.model ? ` · ${m.provider.model}` : ""}{m.provider.latencyMs ? ` · ${(m.provider.latencyMs / 1000).toFixed(1)}s` : ""}</Tag> : null}
                      {m.confidence ? <Tag c="rgba(4, 165, 132, 0.10)">Confidence: {m.confidence}</Tag> : (m.coverage ? <Tag c="rgba(4, 165, 132, 0.10)">Data coverage: {m.coverage}</Tag> : null)}
                      {m.dataMode === "mock" ? <Tag c="rgba(245, 158, 11, 0.16)">demo answer</Tag> : m.dataMode ? <Tag c="rgba(4, 165, 132, 0.12)">live</Tag> : null}
                      {m.sources && m.sources.length ? <Tag>{m.sources.length} sources</Tag> : null}
                      {typeof m.usage?.creditsCharged === "number" ? <Tag>−{m.usage.creditsCharged} credits</Tag> : null}
                    </MetaRow>
                    {(m.sources && m.sources.length > 0) ? (
                      <SourcesBox>
                        <button
                          data-testid={`fomo-ai-sources-toggle-${i}`}
                          onClick={() => setExpandedSources((s) => ({ ...s, [i]: !s[i] }))}
                          style={{ background: "none", border: "none", color: "#037A63", cursor: "pointer", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
                        >
                          <Database size={13} /> Sources · {m.sources.length} <ChevronDown size={13} />
                        </button>
                        {expandedSources[i] && m.sources.map((s, j) => (
                          <SourceItem key={j} data-testid={`fomo-ai-source-${i}-${j}`}>
                            <Tag c="rgba(4, 165, 132, 0.12)">{s.type || s.sourceType || "FOMO"}</Tag>
                            <b style={{ color: "#0b1b17" }}>{s.title}</b>
                            {s.freshness ? <span style={{ color: "#64748b" }}>{s.freshness}</span> : (s.entityType ? <span style={{ color: "#64748b" }}>{s.entityType}</span> : null)}
                          </SourceItem>
                        ))}
                      </SourcesBox>
                    ) : null}
                    {(m.grounding && !m.grounding.grounded) ? (
                      <div style={{ fontSize: 11.5, color: "#B45309", marginTop: 8 }}>No FOMO dataset evidence matched — the analysis above is model reasoning, not platform data.</div>
                    ) : null}
                    {(m.limitations && m.limitations.length > 0) ? (
                      <div style={{ fontSize: 11.5, color: "#B45309", marginTop: 8 }}>Note: {m.limitations.join(", ")}</div>
                    ) : null}
                  </>
                )}
              </Bubble>
            ))
          )}
          {sending ? <Bubble role="assistant">Thinking…</Bubble> : null}
        </Scroll>

        <Composer>
          <OpRow>
            {(ctx?.operations || []).map((o) => (
              <OpChip key={o.operation} active={operation === o.operation} disabled={!o.allowed} data-testid={`fomo-ai-op-${o.operation}`}
                onClick={() => o.allowed && setOperation(o.operation)}>
                {OP_ICONS[o.operation]} {o.label} {!o.allowed && <Lock size={12} />}
              </OpChip>
            ))}
          </OpRow>
          <EstimateNote data-testid="fomo-ai-estimate">
            {insufficient
              ? <span style={{ color: "#DC2626" }}>You need ~<b>{estimate}</b> credits · You have {available}. </span>
              : <>Estimated cost: <b>~{estimate ?? "?"} credits</b> · Balance: {available} credits</>}
            {insufficient ? <button onClick={() => router.push("/utility/memberships")} style={{ background: "none", border: "none", color: "#037A63", cursor: "pointer", fontWeight: 700 }}>Get more credits</button> : null}
          </EstimateNote>
          <InputRow>
            <TextArea
              data-testid="fomo-ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about crypto..."
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <SendBtn data-testid="fomo-ai-send" disabled={sending || !input.trim() || (currentOp && !currentOp.allowed) || insufficient} onClick={send}>
              <Send size={18} />
            </SendBtn>
          </InputRow>
        </Composer>

        {showLedger ? (
          <LedgerOverlay data-testid="fomo-ai-ledger-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLedger(false); }}>
            <LedgerPanel data-testid="fomo-ai-ledger-panel">
              <LedgerHead>
                <div className="t"><Receipt size={18} color="#04A584" /> Spend history</div>
                <CloseBtn data-testid="fomo-ai-ledger-close" onClick={() => setShowLedger(false)} aria-label="Закрыть"><X size={18} /></CloseBtn>
              </LedgerHead>

              <LedgerSummary>
                <div className="l">Total credits spent</div>
                <div className="v" data-testid="fomo-ai-ledger-total">−{ledgerTotalSpent} <b>credits</b></div>
              </LedgerSummary>

              <LedgerList>
                {ledgerLoading ? (
                  <LedgerEmpty data-testid="fomo-ai-ledger-loading">Loading history…</LedgerEmpty>
                ) : ledger.length === 0 ? (
                  <LedgerEmpty data-testid="fomo-ai-ledger-empty">
                    No spend yet.<br />Every FOMO AI request will appear here with the exact number of credits charged.
                  </LedgerEmpty>
                ) : (
                  ledger.map((row) => {
                    const failed = row.status === "FAILED" || row.status === "RELEASED";
                    const isMock = row.dataMode === "mock";
                    return (
                      <LedgerRow key={row.id} data-testid={`fomo-ai-ledger-row-${row.id}`}>
                        <div className="top">
                          <span className="op">{row.operationLabel}</span>
                          <span className={`credits${row.credits ? "" : " zero"}`} data-testid={`fomo-ai-ledger-credits-${row.id}`}>
                            {row.credits > 0 ? `−${row.credits}` : "0"} cr
                          </span>
                        </div>
                        <div className="meta">
                          {row.createdAt ? <span>{new Date(row.createdAt).toLocaleString()}</span> : null}
                          {row.totalTokens ? <span>{BULLET_DOT} {row.totalTokens} tok.</span> : null}
                          {row.model ? <span>{BULLET_DOT} {row.model}</span> : null}
                          {isMock ? <StatusTag c="#B45309" bg="rgba(245, 158, 11, 0.16)">demo</StatusTag> : <StatusTag>live</StatusTag>}
                          {failed ? <StatusTag c="#DC2626" bg="rgba(220, 38, 38, 0.12)">{row.status === "RELEASED" ? "refunded" : "error"}</StatusTag> : null}
                        </div>
                      </LedgerRow>
                    );
                  })
                )}
              </LedgerList>
            </LedgerPanel>
          </LedgerOverlay>
        ) : null}
      </Main>
    </Page>
  );
};

export default FomoAiPage;
