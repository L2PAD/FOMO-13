import React, { FC, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import BotAvatar from "./BotAvatar";
import { AuthContext } from "../Layout";
import { getAiContext, askFomoAi, AiContext } from "../../../http/fomoAi";
import {
  BotBubble,
  BotPulse,
  BotLabel,
  Scrim,
  Panel,
  PanelHeader,
  HeaderTitleWrap,
  HeaderBot,
  CreditsPill,
  IconButton,
  Body,
  WelcomeTitle,
  WelcomeSub,
  ChipsRow,
  Chip,
  MsgList,
  Bubble,
  Composer,
  ComposerInput,
  SendButton,
  FootRow,
  FootHint,
  OpenFullLink,
} from "./styles";

type ChatMsg = { role: "user" | "assistant"; content: string };
type WidgetSize = "drawer" | "compact";

const DEFAULT_OPERATION = "ask_fomo";

const FomoAiWidget: FC = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<WidgetSize>("drawer");
  const [side, setSide] = useState<"left" | "right">("left");
  const [ctx, setCtx] = useState<AiContext | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [value, setValue] = useState("");
  const [operation, setOperation] = useState<string>(DEFAULT_OPERATION);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Load AI context (credits/operations) once the panel is first opened.
  useEffect(() => {
    if (!open || ctx) return;
    getAiContext().then((c) => {
      if (c) {
        setCtx(c);
        const firstAllowed = c.operations?.find((o) => o.allowed) || c.operations?.[0];
        if (firstAllowed) setOperation(firstAllowed.operation);
      }
    });
  }, [open, ctx]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  // Close on Escape for accessibility.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const credits = ctx?.credits?.available;
  const chips = (ctx?.operations || []).slice(0, 4);

  const pickAnswer = (resp: any): string => {
    if (!resp) return "";
    return (
      resp?.message?.content ||
      resp?.answer ||
      resp?.content ||
      resp?.error ||
      (typeof resp?.message === "string" ? resp.message : "") ||
      "I couldn't generate a response right now. Please try again."
    );
  };

  const send = async (text: string, op?: string) => {
    const query = (text || "").trim();
    if (!query || sending) return;
    if (!auth?.isAuth) {
      router.push("/utility/ai");
      return;
    }
    const useOp = op || operation || DEFAULT_OPERATION;
    setMessages((m) => [...m, { role: "user", content: query }]);
    setValue("");
    setSending(true);
    try {
      const resp = await askFomoAi({ operation: useOp, query });
      setMessages((m) => [...m, { role: "assistant", content: pickAnswer(resp) }]);
      if (resp?.credits?.available !== undefined && ctx) {
        setCtx({ ...ctx, credits: { ...ctx.credits, available: resp.credits.available } });
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const isDrawer = size === "drawer";
  const isCompact = size === "compact";

  return (
    <>
      {/* Soft scrim only for the full-height drawer, so the docked panel reads as a layer */}
      {isDrawer ? (
        <Scrim $open={open} data-testid="fomo-ai-scrim" onClick={() => setOpen(false)} />
      ) : null}

      <Panel
        $open={open}
        $size={size}
        $side={side}
        role="dialog"
        aria-label="FOMO AI assistant"
        aria-hidden={!open}
        data-testid="fomo-ai-panel"
      >
        <PanelHeader>
          <HeaderTitleWrap>
            <HeaderBot>
              <BotAvatar size={32} color="#ffffff" />
            </HeaderBot>
            <div>
              <div className="ttl">FOMO AI</div>
              {!isCompact ? <div className="sub">Your crypto intelligence layer</div> : null}
            </div>
          </HeaderTitleWrap>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {credits !== undefined && !isCompact ? (
              <CreditsPill data-testid="fomo-ai-widget-credits">Credits {credits}</CreditsPill>
            ) : null}
            {!isCompact ? (
              <IconButton
                type="button"
                title={side === "left" ? "Dock to right" : "Dock to left"}
                aria-label={side === "left" ? "Dock to right" : "Dock to left"}
                data-testid="fomo-ai-widget-dock"
                onClick={() => setSide(side === "left" ? "right" : "left")}
              >
                {side === "left" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></svg>
                )}
              </IconButton>
            ) : null}
            <IconButton
              type="button"
              title={isDrawer ? "Shrink to compact" : "Expand to full panel"}
              aria-label={isDrawer ? "Shrink to compact" : "Expand to full panel"}
              data-testid="fomo-ai-widget-resize"
              onClick={() => setSize(isDrawer ? "compact" : "drawer")}
            >
              {isDrawer ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 9L4 4" /><path d="M4 9V4h5" /><path d="M15 15l5 5" /><path d="M20 15v5h-5" /></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v6h6" /><path d="M20 10V4h-6" /><path d="M14 10l6-6" /><path d="M10 14l-6 6" /></svg>
              )}
            </IconButton>
            <IconButton
              type="button"
              title="Open full FOMO AI"
              aria-label="Open full FOMO AI"
              data-testid="fomo-ai-widget-expand-full"
              style={isCompact ? { display: "none" } : undefined}
              onClick={() => router.push("/utility/ai")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
            </IconButton>
            <IconButton
              type="button"
              title="Minimize"
              aria-label="Minimize FOMO AI"
              data-testid="fomo-ai-widget-close"
              onClick={() => setOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 12h12" /></svg>
            </IconButton>
          </div>
        </PanelHeader>

        <Body>
          {messages.length === 0 ? (
            <>
              <WelcomeTitle>Hey, I'm your FOMO AI bot</WelcomeTitle>
              <WelcomeSub>Ask me anything about crypto — every answer is grounded in real FOMO data.</WelcomeSub>
              <ChipsRow>
                {(chips.length
                  ? chips
                  : [
                      { operation: "ask_fomo", label: "Ask FOMO" } as any,
                      { operation: "analyze_project", label: "Analyze Project" } as any,
                      { operation: "market_brief", label: "Market Brief" } as any,
                    ]
                ).map((op) => (
                  <Chip
                    key={op.operation}
                    type="button"
                    data-testid={`fomo-ai-widget-chip-${op.operation}`}
                    onClick={() => {
                      setOperation(op.operation);
                      send(op.description || op.label, op.operation);
                    }}
                  >
                    {op.label}
                  </Chip>
                ))}
              </ChipsRow>
            </>
          ) : (
            <MsgList ref={listRef} data-testid="fomo-ai-widget-messages">
              {messages.map((m, i) => (
                <Bubble key={i} $role={m.role}>
                  {m.content}
                </Bubble>
              ))}
              {sending ? <Bubble $role="assistant" $typing>FOMO AI is thinking…</Bubble> : null}
            </MsgList>
          )}
        </Body>

        <Composer
          onSubmit={(e) => {
            e.preventDefault();
            send(value);
          }}
        >
          <ComposerInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={auth?.isAuth ? "Ask FOMO AI…" : "Sign in to chat with FOMO AI"}
            data-testid="fomo-ai-widget-input"
          />
          <SendButton type="submit" disabled={sending || !value.trim()} data-testid="fomo-ai-widget-send" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </SendButton>
        </Composer>

        <FootRow>
          <FootHint>Grounded in real FOMO data</FootHint>
          <OpenFullLink type="button" onClick={() => router.push("/utility/ai")} data-testid="fomo-ai-widget-open-full">
            Open full chat →
          </OpenFullLink>
        </FootRow>
      </Panel>

      {/* Collapsed animated bot launcher (persists across the whole site) */}
      <BotBubble
        $hidden={open}
        $side={side}
        type="button"
        aria-label="Open FOMO AI assistant"
        data-testid="fomo-ai-widget-launcher"
        onClick={() => setOpen(true)}
      >
        <BotPulse aria-hidden />
        <BotAvatar size={32} color="#ffffff" />
        <BotLabel $side={side}>Ask FOMO AI</BotLabel>
      </BotBubble>
    </>
  );
};

export default FomoAiWidget;
