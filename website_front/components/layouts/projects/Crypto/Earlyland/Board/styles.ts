import styled, { css } from "styled-components";

export const ProgressCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
  background: var(--color-white);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
`;

export const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const ProgressTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
`;

export const ProgressCount = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  line-height: 20px;
  color: var(--color-text-primary);
`;

export const ProgressBarWrap = styled.div`
  position: relative;
  width: 100%;
  height: 8px;
`;

export const ProgressBarBg = styled.div`
  width: 100%;
  height: 8px;
  background: #f9f9f9;
  border-radius: 8px;
`;

export const ProgressBarFill = styled.div<{ percent: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 8px;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-info) 100%);
  width: ${({ percent }) => Math.min(100, Math.max(0, percent))}%;
`;

export const StatsRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: stretch;
  width: 100%;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
`;

export const StatCard = styled.div`
  display: flex;
  flex: 1 0 0;
  gap: 12px;
  align-items: center;
  box-sizing: border-box;
  padding: 20px;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
`;

export const StatIconWrap = styled.div<{ bg: string }>`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 12px;
  background: ${({ bg }) => bg};
  flex-shrink: 0;

  @media (max-width: 520px) {
    display: none;
  }
`;

export const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const StatValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 30px;
  color: var(--color-text-primary);
`;

export const StatLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
`;

export const BoardLayout = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  position: relative;

  @media (max-width: 900px) {
    gap: 12px;
  }
`;

export const SidebarPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0;
  width: 190px;
  box-sizing: border-box;
  flex-shrink: 0;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 12px;
  min-height: 480px;

  @media (max-width: 520px) {
    width: fit-content;
    position: sticky;
    top: 170px;
    align-self: flex-start;
  }
`;

export const SidebarTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const SidebarTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
`;

export const SidebarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const SidebarItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  background: ${({ active }) => (active ? "#f5fbfd" : "#f9f9f9")};
  transition: background 0.15s;

  &:hover {
    background: #f5fbfd;
  }

  @media (max-width: 520px) {
    justify-content: center;
    padding: 6px 8px;
    gap: 4px;
  }
`;

export const SidebarItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const SidebarItemLabel = styled.p<{ active?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "var(--color-text-primary)")};
  white-space: nowrap;

  @media (max-width: 520px) {
    display: none;
  }
`;

export const SidebarItemCount = styled.p<{ active?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "var(--color-text-muted)")};
  white-space: nowrap;
`;

export const NewBoardButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px dashed #f0f2f5;
  background: var(--color-white);
  cursor: pointer;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  white-space: nowrap;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  @media (max-width: 520px) {
    span {
      display: none;
    }
  }
`;

export const KanbanArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-width: 0;
`;

export const KanbanHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const KanbanTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 30px;
  color: var(--color-text-primary);
`;

export const KanbanSubtitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
`;

export const KanbanColumns = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

export const KanbanColumn = styled.div`
  flex: 1 0 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  min-height: 324px;

  @media (max-width: 900px) {
    min-height: auto;
    width: 100%;
  }
`;

export const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const ColumnHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const ColumnDot = styled.div<{ color: string }>`
  width: 9px;
  height: 9px;
  border-radius: 5px;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

export const ColumnTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const ColumnCount = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 20px;
  background: #f9f9f9;
  font-family: "Gilroy", sans-serif;
  font-size: 10px;
  font-weight: var(--font-weight-regular);
  color: #728094;
`;

export const AddColumnButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  color: #728094;

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const ColumnCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const TaskCard = styled.div<{
  expired?: boolean;
  $prime?: boolean;
  $locked?: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 12px;
  border-radius: 12px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  cursor: ${({ $locked }) => ($locked ? "default" : "grab")};

  &:active {
    cursor: ${({ $locked }) => ($locked ? "default" : "grabbing")};
  }

  ${({ expired, $prime }) =>
    expired
      ? css`
          background: #fef8f9;
          border: 1px solid #ffc7c9;
        `
      : $prime
      ? css`
          background: linear-gradient(135deg, #fffdf7 0%, #fff8df 100%);
          border: 1px solid #efd27a;
          box-shadow: 2px 2px 10px rgba(197, 143, 0, 0.14);
        `
      : css`
          background: var(--color-white);
          border: 1px solid #f0f2f5;
        `}
`;

export const TaskCardTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const TaskProjectRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  width: 100%;
`;

export const TaskProjectLogo = styled.img`
  width: 38px;
  height: 38px;
  border-radius: 99px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);
`;

export const TaskProjectLogoPlaceholder = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 99px;
  background: #f0f2f5;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
`;

export const TaskProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const TaskProjectName = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const TaskProjectPlatform = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const TaskBadgesRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
`;

export const PrimeTaskBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 26px;
  box-sizing: border-box;
  padding: 4px 8px;
  border: 1px solid rgba(197, 143, 0, 0.28);
  border-radius: 6px;
  background: rgba(255, 199, 4, 0.14);
  color: #9b6b00;
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  white-space: nowrap;
`;

export const TaskBadge = styled.span<{
  variant:
    | "testnet"
    | "airdrop"
    | "quest"
    | "node"
    | "other"
    | "high"
    | "medium"
    | "low";
}>`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;

  ${({ variant }) => {
    switch (variant) {
      case "testnet":
        return css`
          background: #dcfae6;
          color: #067647;
        `;
      case "airdrop":
        return css`
          background: #f6f9ff;
          color: var(--color-info);
        `;
      case "quest":
        return css`
          background: #f1f1f1;
          color: #384250;
        `;
      case "node":
        return css`
          background: #f1efff;
          color: #6941c6;
        `;
      case "other":
        return css`
          background: #f9f9f9;
          color: var(--color-text-muted);
        `;
      case "high":
        return css`
          background: #fef1f2;
          color: var(--color-danger);
          padding: 4px 8px;
        `;
      case "medium":
        return css`
          background: #fefcf3;
          color: #ffc704;
          padding: 4px 8px;
        `;
      case "low":
        return css`
          background: #e9f8f8;
          color: var(--color-primary);
          padding: 4px 8px;
        `;
    }
  }}
`;

export const TaskStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
`;

export const TaskStatusText = styled.p<{ expired?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: ${({ expired }) => (expired ? "var(--color-danger)" : "#728094")};
  white-space: nowrap;
`;

export const TaskProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const TaskProgressLabels = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: normal;
  color: var(--color-text-muted);
  white-space: nowrap;
`;

export const TaskProgressBarWrap = styled.div`
  position: relative;
  width: 100%;
  height: 8px;
`;

export const TaskProgressBarBg = styled.div`
  width: 100%;
  height: 8px;
  background: #f9f9f9;
  border-radius: 8px;
`;

export const TaskProgressBarFill = styled.div<{ percent: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 8px;
  border-radius: 8px;
  background: var(--color-primary);
  width: ${({ percent }) => Math.min(100, Math.max(0, percent))}%;
`;

export const TaskDivider = styled.div`
  width: 100%;
  height: 1px;
  background: #f0f2f5;
  flex-shrink: 0;
`;

export const TaskCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const TaskFooterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const TaskIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  color: #728094;
  transition: background 0.15s;

  &:hover {
    background: #f0f2f5;
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
    background: none;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const TaskBlurOverlay = styled.div`
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.35);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 2;
  cursor: default;
`;

export const TaskLockedTitle = styled.p`
  margin: 0;
  color: var(--color-text-primary);
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  text-align: center;
`;

export const TaskLockedSubtitle = styled.p`
  margin: 0;
  padding: 0 12px;
  color: var(--color-text-muted);
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 16px;
  text-align: center;
`;

export const AddTaskButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px dashed #f0f2f5;
  background: var(--color-white);
  cursor: pointer;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
  margin-top: auto;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`;
