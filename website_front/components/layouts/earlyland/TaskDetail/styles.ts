import styled, { keyframes } from "styled-components";

const slideIn = keyframes`
  from { transform: translateX(24px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(6, 12, 22, 0.62);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
`;

export const Panel = styled.div`
  width: 560px;
  max-width: 100%;
  height: 100%;
  overflow-y: auto;
  background: var(--color-surface, #0f1c2e);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: -24px 0 60px rgba(0, 0, 0, 0.45);
  animation: ${slideIn} 220ms ease;
  padding: 24px 26px 40px;
`;

export const TopBar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
`;

export const ActivityLink = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 700;
  color: #8b5cf6;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  &:hover { text-decoration: underline; }
`;

export const Title = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary, #ffffff);
  margin: 6px 0 0;
  letter-spacing: -0.3px;
`;

export const CloseBtn = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-secondary, #9797a0);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 160ms ease, color 160ms ease;
  &:hover { background: rgba(255, 255, 255, 0.09); color: #fff; }
`;

export const Description = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary, #b6bac4);
  margin: 14px 0 18px;
`;

export const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
  @media (max-width: 480px) { grid-template-columns: repeat(2, 1fr); }
`;

export const MetaItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 10px 12px;
`;

export const MetaLabel = styled.div`
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--color-text-secondary, #8b8f9a);
  margin-bottom: 3px;
`;

export const MetaValue = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary, #ffffff);
`;

export const Badge = styled.span<{ $tone?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  ${({ $tone }) => {
    switch ($tone) {
      case "prime": return "background:rgba(139,92,246,0.18);color:#C4B5FD;";
      case "green": return "background:rgba(0,221,115,0.16);color:#00DD73;";
      case "yellow": return "background:rgba(245,183,49,0.16);color:#F5B731;";
      case "red": return "background:rgba(240,90,90,0.16);color:#F05A5A;";
      case "blue": return "background:rgba(80,140,240,0.16);color:#7FB0FF;";
      default: return "background:rgba(255,255,255,0.08);color:#C7CBD3;";
    }
  }}
`;

export const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
`;

export const XpTag = styled.span`
  font-size: 15px;
  font-weight: 800;
  color: #8b5cf6;
`;

export const Section = styled.div`
  margin-bottom: 22px;
`;

export const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary, #9797a0);
  margin: 0 0 12px;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.min(100, Math.max(0, $pct))}%;
  background: linear-gradient(90deg, #7c3aed, #8b5cf6);
  transition: width 220ms ease;
`;

export const StepRow = styled.div<{ $done?: boolean; $clickable?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  margin-bottom: 10px;
  background: ${({ $done }) => ($done ? "rgba(0,221,115,0.06)" : "rgba(255,255,255,0.02)")};
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  transition: border-color 160ms ease;
  &:hover { border-color: ${({ $clickable }) => ($clickable ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.07)")}; }
`;

export const StepCheck = styled.div<{ $done?: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 7px;
  flex-shrink: 0;
  margin-top: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #fff;
  border: 2px solid ${({ $done }) => ($done ? "#00DD73" : "rgba(255,255,255,0.25)")};
  background: ${({ $done }) => ($done ? "#00DD73" : "transparent")};
`;

export const StepBody = styled.div`
  flex: 1;
`;

export const StepTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary, #ffffff);
`;

export const StepDesc = styled.div`
  font-size: 12.5px;
  color: var(--color-text-secondary, #9797a0);
  margin-top: 3px;
  line-height: 1.5;
`;

export const StepAction = styled.a`
  display: inline-block;
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: #8b5cf6;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

export const Banner = styled.div<{ $tone?: string }>`
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 18px;
  font-size: 13.5px;
  line-height: 1.55;
  ${({ $tone }) =>
    $tone === "red"
      ? "background:rgba(240,90,90,0.12);border:1px solid rgba(240,90,90,0.35);color:#FFB3B3;"
      : "background:rgba(245,183,49,0.12);border:1px solid rgba(245,183,49,0.35);color:#FCD98A;"}
`;

export const BannerTitle = styled.div`
  font-weight: 800;
  margin-bottom: 4px;
  color: #fff;
`;

export const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  position: sticky;
  bottom: 0;
  padding-top: 16px;
  margin-top: 8px;
  background: linear-gradient(180deg, rgba(15,28,46,0) 0%, var(--color-surface, #0f1c2e) 40%);
`;

export const PrimaryButton = styled.button`
  flex: 1;
  min-width: 140px;
  border: none;
  background: #8b5cf6;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 13px 18px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 160ms ease, opacity 160ms ease;
  &:hover:not(:disabled) { background: #7c3aed; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

export const GhostButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-secondary, #c7cbd3);
  font-weight: 700;
  font-size: 14px;
  padding: 13px 18px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 160ms ease;
  &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.09); color: #fff; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

export const StateChip = styled.div<{ $state?: string }>`
  flex: 1;
  min-width: 140px;
  text-align: center;
  border-radius: 12px;
  padding: 13px 18px;
  font-weight: 800;
  font-size: 14px;
  ${({ $state }) => {
    switch ($state) {
      case "completed": return "background:rgba(0,221,115,0.16);color:#00DD73;";
      case "under_review":
      case "waiting_review": return "background:rgba(245,183,49,0.16);color:#F5B731;";
      case "rejected": return "background:rgba(240,90,90,0.16);color:#F05A5A;";
      default: return "background:rgba(255,255,255,0.08);color:#C7CBD3;";
    }
  }}
`;

export const Loading = styled.div`
  padding: 60px 0;
  text-align: center;
  color: var(--color-text-secondary, #9797a0);
  font-size: 14px;
`;
