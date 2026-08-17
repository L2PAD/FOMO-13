import styled, { keyframes, css } from "styled-components";

const GREEN = "#04A584";
const GREEN_DARK = "#037A63";

const pulseRing = keyframes`
  0%   { transform: scale(0.85); opacity: 0.6; }
  70%  { transform: scale(1.7); opacity: 0; }
  100% { transform: scale(1.7); opacity: 0; }
`;

const launcherIn = keyframes`
  0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
  60%  { transform: scale(1.12) rotate(6deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
`;

const floatIdle = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
`;

const blink = keyframes`
  0%, 92%, 100% { transform: scaleY(1); }
  96%           { transform: scaleY(0.1); }
`;

/* ── Collapsed animated bot launcher ── */
export const BotPulse = styled.span`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: ${GREEN};
  z-index: 0;
  animation: ${pulseRing} 2.6s ease-out infinite;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const BotLabel = styled.span<{ $side?: "left" | "right" }>`
  position: absolute;
  ${(p) => (p.$side === "right" ? "right: calc(100% + 12px);" : "left: calc(100% + 12px);")}
  top: 50%;
  transform: translateY(-50%) translateX(${(p) => (p.$side === "right" ? "6px" : "-6px")});
  white-space: nowrap;
  background: #0b1220;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(46, 230, 183, 0.35);
  box-shadow: 0 10px 24px rgba(3, 12, 20, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s ease;
`;

export const BotBubble = styled.button<{ $hidden?: boolean; $side?: "left" | "right" }>`
  position: fixed;
  ${(p) => (p.$side === "right" ? "right: 24px;" : "left: 24px;")}
  bottom: 26px;
  z-index: 2147480000;
  width: 66px;
  height: 66px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: radial-gradient(130% 130% at 32% 22%, #2b3852 0%, #121a2b 46%, #05070d 100%);
  box-shadow: 0 16px 34px rgba(3, 9, 18, 0.55), 0 0 0 1px rgba(46, 230, 183, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.14);
  animation: ${launcherIn} 0.5s cubic-bezier(0.22, 1, 0.36, 1) both, ${floatIdle} 4.2s ease-in-out 0.6s infinite;
  transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease, box-shadow 0.2s ease;

  & > svg { position: relative; z-index: 1; }
  & .bot-eye { transform-box: fill-box; transform-origin: center; animation: ${blink} 5s ease-in-out infinite; }

  &:hover { transform: scale(1.07) translateY(-1px); box-shadow: 0 22px 44px rgba(3, 9, 18, 0.62), 0 0 0 1px rgba(46, 230, 183, 0.5), 0 0 22px 2px rgba(46, 230, 183, 0.25); }
  &:hover ${BotLabel} { opacity: 1; }
  &:focus-visible { outline: 3px solid rgba(46, 230, 183, 0.5); outline-offset: 3px; }

  ${(p) => p.$hidden && css`transform: scale(0.2); opacity: 0; pointer-events: none;`}

  @media (max-width: 640px) { ${(p) => (p.$side === "right" ? "right: 16px;" : "left: 16px;")} bottom: 18px; width: 58px; height: 58px; }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

/* ── Optional soft scrim behind the drawer (does not block the page) ── */
export const Scrim = styled.div<{ $open?: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 2147481000;
  background: rgba(6, 40, 33, 0.18);
  backdrop-filter: blur(1.5px);
  opacity: ${(p) => (p.$open ? 1 : 0)};
  pointer-events: ${(p) => (p.$open ? "auto" : "none")};
  transition: opacity 0.28s ease;
  @media (max-width: 640px) { background: rgba(6, 40, 33, 0.32); }
`;

/* ── Panel: right-side drawer (full height) OR compact card ── */
export const Panel = styled.div<{ $open?: boolean; $size?: "drawer" | "compact"; $side?: "left" | "right" }>`
  position: fixed;
  z-index: 2147482000;
  background: linear-gradient(180deg, #ffffff 0%, #f4fbf9 100%);
  border: 1px solid rgba(4, 165, 132, 0.20);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  will-change: transform, opacity;

  ${(p) =>
    p.$size === "compact"
      ? css`
          ${p.$side === "right" ? "right: 20px;" : "left: 20px;"}
          bottom: 20px;
          width: 340px;
          height: min(452px, 62vh);
          border: none;
          border-radius: 18px;
          box-shadow: 0 22px 52px rgba(4, 62, 50, 0.24);
          transform-origin: bottom ${p.$side === "right" ? "right" : "left"};
          transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
          transform: ${p.$open ? "translateY(0) scale(1)" : "translateY(14px) scale(0.82)"};
          opacity: ${p.$open ? 1 : 0};
          pointer-events: ${p.$open ? "auto" : "none"};
          @media (max-width: 640px) { ${p.$side === "right" ? "right: 12px;" : "left: 12px;"} width: min(88vw, 320px); bottom: 16px; }
        `
      : css`
          top: 0;
          ${p.$side === "right" ? "right: 0;" : "left: 0;"}
          height: 100vh;
          height: 100dvh;
          width: min(440px, 100vw);
          ${p.$side === "right"
            ? "border-radius: 0; border-right: none;"
            : "border-radius: 0; border-left: none;"}
          box-shadow: ${p.$side === "right" ? "-24px" : "24px"} 0 70px rgba(4, 62, 50, 0.26);
          transition: transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.26s ease;
          transform: ${p.$open ? "translateX(0)" : p.$side === "right" ? "translateX(104%)" : "translateX(-104%)"};
          opacity: ${p.$open ? 1 : 0.4};
          pointer-events: ${p.$open ? "auto" : "none"};
          @media (max-width: 640px) { width: 100vw; border-radius: 0; }
        `}

  @media (prefers-reduced-motion: reduce) { transition: opacity 0.18s ease; }
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 16px 15px;
  background: linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%);
  color: #fff;
  flex: none;
`;

export const HeaderTitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  .ttl { font-size: 16px; font-weight: 800; line-height: 1.1; }
  .sub { font-size: 11.5px; opacity: 0.85; margin-top: 2px; }
`;

export const HeaderBot = styled.span`
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const CreditsPill = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 4px 9px;
  border-radius: 999px;
  white-space: nowrap;
`;

export const IconButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  &:hover { background: rgba(255, 255, 255, 0.26); transform: translateY(-1px); }
  &:focus-visible { outline: 2px solid rgba(255, 255, 255, 0.7); outline-offset: 2px; }
`;

export const Body = styled.div`
  flex: 1;
  min-height: 0;
  padding: 18px 16px 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const WelcomeTitle = styled.div`
  font-size: 19px;
  font-weight: 800;
  color: #0b1b17;
`;

export const WelcomeSub = styled.div`
  font-size: 12.5px;
  color: #64748b;
  margin: 6px 0 16px;
  line-height: 1.45;
`;

export const ChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: ${GREEN_DARK};
  background: rgba(4, 165, 132, 0.08);
  border: 1px solid rgba(4, 165, 132, 0.24);
  border-radius: 12px;
  padding: 9px 13px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
  &::before {
    content: "";
    width: 7px; height: 7px; border-radius: 50%;
    background: linear-gradient(135deg, ${GREEN}, #35D6B0);
    flex: none;
  }
  &:hover { background: rgba(4, 165, 132, 0.15); border-color: rgba(4, 165, 132, 0.4); transform: translateY(-1px); }
  &:focus-visible { outline: 2px solid rgba(4, 165, 132, 0.5); outline-offset: 2px; }
`;

export const MsgList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
`;

export const Bubble = styled.div<{ $role: "user" | "assistant"; $typing?: boolean }>`
  max-width: 88%;
  font-size: 13px;
  line-height: 1.55;
  padding: 10px 13px;
  border-radius: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  ${(p) =>
    p.$role === "user"
      ? css`
          align-self: flex-end;
          color: #fff;
          background: linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%);
          border-bottom-right-radius: 5px;
        `
      : css`
          align-self: flex-start;
          color: #0b1b17;
          background: #ffffff;
          border: 1px solid rgba(4, 165, 132, 0.16);
          border-bottom-left-radius: 5px;
        `}
  ${(p) => p.$typing && css`color: #64748b; font-style: italic;`}
`;

export const Composer = styled.form`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(4, 165, 132, 0.12);
  background: #ffffff;
  flex: none;
`;

export const ComposerInput = styled.input`
  flex: 1;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(4, 165, 132, 0.24);
  background: #f7fbfa;
  padding: 0 13px;
  font-size: 13px;
  color: #0b1b17;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  &::placeholder { color: #94a3b8; }
  &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(4, 165, 132, 0.16); }
`;

export const SendButton = styled.button`
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 12px;
  border: none;
  color: #fff;
  background: linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
  box-shadow: 0 8px 18px rgba(4, 165, 132, 0.3);
  &:hover:not(:disabled) { transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
  &:focus-visible { outline: 2px solid rgba(4, 165, 132, 0.5); outline-offset: 2px; }
`;

export const FootRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 16px 12px;
  background: #ffffff;
  flex: none;
`;

export const FootHint = styled.span`
  font-size: 11px;
  color: #94a3b8;
`;

export const OpenFullLink = styled.button`
  font-size: 11.5px;
  font-weight: 700;
  color: ${GREEN_DARK};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  &:hover { text-decoration: underline; }
`;
