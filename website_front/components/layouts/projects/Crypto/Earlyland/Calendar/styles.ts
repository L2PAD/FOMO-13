import styled, { css } from "styled-components";

export const CalendarPageWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  width: 100%;
  align-items: flex-start;
  margin-top: 40px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

export const CalendarLeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export const CalendarRightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 400px;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

export const CalendarHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const MonthYearRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const MonthText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 30px;
  color: var(--color-text-primary);

  @media (max-width: 768px) {
    font-size: 18px;
    line-height: 22px;
  }
`;

export const YearText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 24px;
  line-height: 30px;
  color: var(--color-text-primary);

  @media (max-width: 768px) {
    font-size: 18px;
    line-height: 22px;
  }
`;

export const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 8px;
  }
`;

export const ViewSwitcher = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  background: #f9f9f9;
  border-radius: 4px;
  padding: 4px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;

    button {
      width: 100%;
    }
  }
`;

export const ViewButton = styled.button<{ $active?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 10px;
  line-height: 12px;
  padding: 6px 12px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;

  ${({ $active }) =>
    $active
      ? css`
          background: var(--color-white);
          color: var(--color-primary);
          box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
        `
      : css`
          background: transparent;
          color: var(--color-text-muted);
        `}
`;

export const TypeDropdown = styled.select`
  height: 32px;
  width: 140px;

  @media (max-width: 768px) {
    width: 100%;
  }
  padding: 0 10px;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  background: var(--color-white);
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23738094' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
`;

export const NavControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

export const NavBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #f0f2f5;
  border-radius: 50%;
  background: var(--color-white);
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background 0.15s;
  &:hover {
    background: var(--color-surface-subtle);
  }
`;

export const TodayBtn = styled.button`
  height: 28px;
  padding: 0 12px;
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  background: var(--color-white);
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  &:hover {
    background: var(--color-surface-subtle);
  }
`;

export const CalendarGrid = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f2f5;
  min-height: 640px;

  @media (max-width: 768px) {
    min-height: 360px;
  }

  @media (max-width: 380px) {
    max-width: 100%;
    overflow-x: auto;
  }
`;

export const DayColumn = styled.div<{ $isSunday?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: ${({ $isSunday }) => ($isSunday ? "var(--color-surface-subtle)" : "var(--color-white)")};
`;

export const DayHeader = styled.div<{
  $isSunday?: boolean;
  $isFirst?: boolean;
  $isLast?: boolean;
}>`
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-border-subtle);
  border-right: 1px solid var(--color-border-subtle);
  background: var(--color-surface-subtle);
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  color: #000000;
  letter-spacing: 0;
  flex-shrink: 0;

  @media (max-width: 768px) {
    height: 36px;
    font-size: 9px;
  }
`;

export const DayCell = styled.div<{
  $isSelected?: boolean;
  $isSunday?: boolean;
}>`
  flex: 1;
  border-bottom: 1px solid var(--color-border-subtle);
  border-right: 1px solid var(--color-border-subtle);
  padding: 4px 6px;
  position: relative;
  overflow: hidden;
  min-height: 100px;

  @media (max-width: 768px) {
    min-height: 56px;
    padding: 2px 2px;
  }
  cursor: pointer;
  background: ${({ $isSunday, $isSelected }) => {
    if ($isSelected) return "rgba(4,165,132,0.04)";
    if ($isSunday) return "var(--color-surface-subtle)";
    return "var(--color-white)";
  }};
  transition: background 0.1s;

  &:hover {
    background: rgba(4, 165, 132, 0.04);
  }
`;

export const DayNumber = styled.div<{
  $isToday?: boolean;
  $isDimmed?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 4px;
`;

export const DayNumberText = styled.span<{
  $isToday?: boolean;
  $isDimmed?: boolean;
}>`
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;

  ${({ $isToday }) =>
    $isToday
      ? css`
          background: var(--color-text-primary);
          color: var(--color-white);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        `
      : css`
          color: ${({ $isDimmed }: { $isDimmed?: boolean }) =>
            $isDimmed ? "#dfe9ed" : "var(--color-text-muted)"};
        `}
`;

export const WeekDayHeadInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
`;

export const DayViewWrapper = styled.div`
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  overflow: hidden;
  min-height: 640px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    min-height: 360px;
  }
`;

export const AllDaySection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface-subtle);
  min-height: 44px;
`;

export const AllDayLabel = styled.div`
  width: 68px;
  flex-shrink: 0;
  padding: 12px 10px 0;
  font-family: "Inter", sans-serif;
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: #9ca3af;
  text-align: right;
  border-right: 1px solid var(--color-border-subtle);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    width: 44px;
    font-size: 8px;
    padding: 8px 4px 0;
  }
`;

export const AllDayContent = styled.div`
  flex: 1;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const TimeGrid = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

export const TimeSlotRow = styled.div`
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid var(--color-border-subtle);
  min-height: 52px;
  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    min-height: 38px;
  }
`;

export const TimeLabel = styled.div`
  width: 68px;
  flex-shrink: 0;
  padding: 8px 10px 0;
  font-family: "Inter", sans-serif;
  font-size: 11px;
  font-weight: var(--font-weight-regular);
  color: #b0b9c5;
  border-right: 1px solid var(--color-border-subtle);
  text-align: right;

  @media (max-width: 768px) {
    width: 44px;
    font-size: 9px;
    padding: 6px 4px 0;
  }
`;

export const TimeSlotContent = styled.div`
  flex: 1;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const eventTypeStyles: Record<
  string,
  { bar: string; bg: string; text: string }
> = {
  airdrop: {
    bar: "#2970ff",
    bg: "rgba(209,224,255,0.4)",
    text: "#004eeb",
  },
  testnet: {
    bar: "#17b26a",
    bg: "rgba(220,250,230,0.4)",
    text: "#067647",
  },
  whitelist: {
    bar: "#7f56d9",
    bg: "rgba(229,222,255,0.4)",
    text: "#5925dc",
  },
  farming: {
    bar: "#f79009",
    bg: "rgba(254,240,199,0.4)",
    text: "var(--color-warning-dark)",
  },
  others: {
    bar: "#6c737f",
    bg: "rgba(243,244,246,0.4)",
    text: "#384250",
  },
};

export const EventCard = styled.div<{
  $type: string;
  $prime?: boolean;
  $locked?: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 2px;
  box-sizing: border-box;
  border: 1px solid ${({ $prime }) => ($prime ? "rgba(197, 143, 0, 0.38)" : "transparent")};
  background: ${({ $type, $prime }) =>
    $prime
      ? "linear-gradient(90deg, rgba(255,248,223,0.95), rgba(255,253,247,0.95))"
      : eventTypeStyles[$type]?.bg ?? eventTypeStyles.others.bg};
  cursor: ${({ $locked }) => ($locked ? "default" : "pointer")};

  @media (max-width: 768px) {
    height: 16px;
  }
`;

export const EventBar = styled.div<{ $type: string; $prime?: boolean }>`
  width: 3px;
  flex-shrink: 0;
  background: ${({ $type, $prime }) =>
    $prime ? "#c58f00" : eventTypeStyles[$type]?.bar ?? eventTypeStyles.others.bar};
`;

export const EventBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 4px;
  gap: 1px;
  overflow: hidden;
  flex: 1;
`;

export const TaskEventTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;

  > p {
    flex: 1;
    min-width: 0;
  }
`;

export const CalendarPrimeIcon = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const EventTitle = styled.p<{ $type: string }>`
  font-family: "Inter", sans-serif;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  line-height: 12px;
  color: ${({ $type }) =>
    eventTypeStyles[$type]?.text ?? eventTypeStyles.others.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 8px;
    line-height: 10px;
  }
`;

export const EventTime = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 8px;
  font-weight: var(--font-weight-regular);
  line-height: 10px;
  color: var(--color-text-muted);
  white-space: nowrap;
  margin: 0;
`;

export const OverflowBadge = styled.div`
  height: 20px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-family: "Inter", sans-serif;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
`;

export const LegendRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const LegendText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: #728094;
`;

export const LegendItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

export const LegendDot = styled.div<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const LegendLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
`;

export const TipBox = styled.div`
  border: 1px dashed #f0f2f5;
  border-radius: 8px;
  background: #f9f9f9;
  padding: 12px;
`;

export const TipText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: #728094;
  line-height: 18px;
  margin: 0;
`;

export const RightCard = styled.div`
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.06);

  @media (max-width: 768px) {
    padding: 14px;
    gap: 12px;
  }
`;

export const CardDateTitle = styled.h3`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-primary);
  margin: 0;
`;

export const TaskRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: flex-start;
`;

export const ProjectLogo = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #f0f2f5;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

export const TaskInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

export const TaskNameRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
`;

export const TaskStatusGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-shrink: 0;
`;

export const CalendarPrimeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border: 1px solid rgba(197, 143, 0, 0.3);
  border-radius: 5px;
  background: rgba(255, 199, 4, 0.14);
  color: #9b6b00;
  font-family: "Gilroy", sans-serif;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 15px;
  white-space: nowrap;

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const TaskDetailBlock = styled.div<{ $prime?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  border-radius: 9px;

  ${({ $prime }) =>
    $prime &&
    css`
      padding: 10px;
      border: 1px solid rgba(197, 143, 0, 0.3);
      background: linear-gradient(135deg, #fffdf7 0%, #fff8df 100%);
    `}
`;

export const CalendarTaskBlurOverlay = styled.div<{ $compact?: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ $compact }) => ($compact ? "0" : "8px")};
  padding: ${({ $compact }) => ($compact ? "0" : "8px")};
  border-radius: ${({ $compact }) => ($compact ? "4px" : "9px")};
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(${({ $compact }) => ($compact ? "5px" : "10px")});
  -webkit-backdrop-filter: blur(${({ $compact }) => ($compact ? "5px" : "10px")});
  cursor: default;

  svg {
    width: ${({ $compact }) => ($compact ? "14px" : "28px")};
    height: ${({ $compact }) => ($compact ? "14px" : "28px")};
  }
`;

export const CalendarLockedTitle = styled.p`
  margin: 0;
  color: var(--color-text-primary);
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  text-align: center;
`;

export const CalendarLockedSubtitle = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-family: "Gilroy", sans-serif;
  font-size: 11px;
  font-weight: var(--font-weight-regular);
  line-height: 15px;
  text-align: center;
`;

export const TaskName = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const TaskCategory = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const StatusBadge = styled.span<{
  $status: "in-progress" | "completed" | "todo" | "expired";
}>`
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: 4px;

  ${({ $status }) => {
    switch ($status) {
      case "in-progress":
        return css`
          background: #fefcf3;
          color: #ffc704;
        `;
      case "completed":
        return css`
          background: #e9f8f8;
          color: var(--color-primary);
        `;
      case "expired":
        return css`
          background: #fff1f1;
          color: var(--color-danger);
        `;
      case "todo":
      default:
        return css`
          background: #f7feff;
          color: var(--color-info);
        `;
    }
  }}
`;

export const ActionButtonsRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex-wrap: wrap;
`;

export const ActionBtn = styled.button<{
  $variant: "outline" | "fill" | "small-outline";
}>`
  height: 32px;
  border-radius: 6px;
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }

  ${({ $variant }) => {
    switch ($variant) {
      case "fill":
        return css`
          flex: 1;
          background: var(--color-primary);
          color: var(--color-white);
          border: none;
          padding: 0 12px;
        `;
      case "small-outline":
        return css`
          background: transparent;
          color: var(--color-primary);
          border: 1px solid var(--color-primary);
          padding: 0 10px;
        `;
      case "outline":
      default:
        return css`
          flex: 1;
          background: transparent;
          color: var(--color-primary);
          border: 1px solid var(--color-primary);
          padding: 0 12px;
        `;
    }
  }}
`;

export const CardDivider = styled.hr`
  border: none;
  border-top: 1px solid #f0f2f5;
  margin: 0;
`;

export const DeadlineTitle = styled.h3`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-primary);
  margin: 0;
`;

export const DeadlineItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DeadlineItemHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

export const DeadlineProjectLogo = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #f0f2f5;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Gilroy", sans-serif;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  overflow: hidden;
`;

export const DeadlineInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

export const DeadlineName = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const DeadlineDate = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 13px;
  color: var(--color-text-muted);
`;

export const DaysLeft = styled.span<{
  $urgency: "critical" | "warn" | "normal";
}>`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 13px;
  flex-shrink: 0;
  color: ${({ $urgency }) => {
    if ($urgency === "critical") return "var(--color-danger)";
    if ($urgency === "warn") return "#ffc704";
    return "#728094";
  }};
`;

export const DeadlineBadgesRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const CategoryBadge = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f2f5;
  color: var(--color-text-muted);
`;

export const EmptyDayText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-soft);
  text-align: center;
  padding: 24px 0;
  margin: 0;
`;
