import styled from "styled-components";

export const Wrapper = styled.div`
  width: 1302px;
  max-width: 100%;
  margin: 24px auto 60px;

  @media (max-width: 1340px) {
    width: 100%;
    padding: 0 16px;
  }
`;

export const Header = styled.div`
  margin-bottom: 22px;
`;

export const Title = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary, #ffffff);
  margin: 0;
  letter-spacing: -0.3px;
`;

export const Subtitle = styled.p`
  font-size: 14px;
  color: var(--color-text-secondary, #9797a0);
  margin: 8px 0 0;
  max-width: 780px;
`;

export const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin: 22px 0 24px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const KpiCard = styled.div`
  background: var(--color-surface, #132439);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 14px 16px;
`;

export const KpiLabel = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary, #9797a0);
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

export const KpiValue = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary, #ffffff);
  margin-top: 6px;
`;

export const TabsRow = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 20px;
`;

export const TabButton = styled.button<{ $active?: boolean }>`
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 11px 18px;
  font-size: 14px;
  font-weight: 700;
  color: ${({ $active }) => ($active ? "#8B5CF6" : "var(--color-text-secondary, #9797a0)")};
  border-bottom: 2px solid ${({ $active }) => ($active ? "#8B5CF6" : "transparent")};
  margin-bottom: -1px;
  transition: color 150ms ease;
`;

export const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
`;

export const FilterChip = styled.button<{ $active?: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#8B5CF6" : "rgba(255,255,255,0.12)")};
  background: ${({ $active }) => ($active ? "rgba(139,92,246,0.16)" : "transparent")};
  color: ${({ $active }) => ($active ? "#C4B5FD" : "var(--color-text-secondary, #9797a0)")};
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const TaskCard = styled.div`
  background: var(--color-surface, #132439);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

export const CardName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #ffffff);
`;

export const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

export const Badge = styled.span<{ $tone?: string }>`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  ${({ $tone }) => {
    switch ($tone) {
      case "prime":
        return "background:rgba(139,92,246,0.18);color:#C4B5FD;";
      case "green":
        return "background:rgba(0,221,115,0.16);color:#00DD73;";
      case "yellow":
        return "background:rgba(245,183,49,0.16);color:#F5B731;";
      case "red":
        return "background:rgba(240,90,90,0.16);color:#F05A5A;";
      case "blue":
        return "background:rgba(80,140,240,0.16);color:#7FB0FF;";
      default:
        return "background:rgba(255,255,255,0.08);color:#C7CBD3;";
    }
  }}
`;

export const XpTag = styled.span`
  font-size: 13px;
  font-weight: 800;
  color: #8b5cf6;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.max(0, Math.min(100, $pct))}%;
  background: linear-gradient(90deg, #7c3aed, #8b5cf6);
`;

export const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 2px;
`;

export const PrimaryButton = styled.button`
  border: none;
  background: #8b5cf6;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const GhostButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: var(--color-text-secondary, #9797a0);
  font-weight: 600;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const BoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const BoardColumn = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 12px;
  min-height: 200px;
`;

export const BoardColTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary, #ffffff);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const BoardCard = styled.div`
  background: var(--color-surface, #132439);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: var(--color-text-secondary, #9797a0);
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 14px;
`;

export const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
`;

export const CalendarHead = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary, #9797a0);
  text-align: center;
  text-transform: uppercase;
  padding: 6px 0;
`;

export const CalendarCell = styled.div<{ $muted?: boolean }>`
  min-height: 92px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 6px;
  background: ${({ $muted }) => ($muted ? "transparent" : "rgba(255,255,255,0.02)")};
  opacity: ${({ $muted }) => ($muted ? 0.4 : 1)};
`;

export const CalendarDate = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary, #9797a0);
  margin-bottom: 4px;
`;

export const CalendarEvent = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #c4b5fd;
  background: rgba(139, 92, 246, 0.14);
  border-radius: 6px;
  padding: 3px 6px;
  margin-bottom: 4px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CalendarNav = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

export const CalendarMonth = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #ffffff);
  min-width: 180px;
`;

export const LoginPrompt = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-secondary, #9797a0);
`;
