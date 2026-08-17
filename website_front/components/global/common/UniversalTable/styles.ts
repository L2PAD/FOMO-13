import styled from "styled-components";

export const TableWrapper = styled.div`
  margin-top: 20px;
  width: 100%;
  overflow-x: auto;

  &.fomies {
    margin-top: 0px;
  }

  &.connections,
  &.onchain,
  &.influence,
  &.influence-table {
    margin-top: 0;
  }

  @media (max-width: 1024px) {
    margin-top: 16px;
  }

  @media (max-width: 768px) {
    margin-top: 12px;
    overflow-x: scroll;
    -webkit-overflow-scrolling: touch;
  }

  @media (max-width: 480px) {
    margin-top: 8px;
  }

  /* Custom scrollbar for webkit browsers */
  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
  }

  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
`;

export const HeaderWrapper = styled.div<{
  gridColumns: string;
  stickyIndex: number;
  minWidth?: number;
}>`
  display: grid;
  padding: 15px 13px !important;
  width: 100%;
  box-sizing: border-box;
  grid-template-columns: ${({ gridColumns }) => gridColumns};
  min-width: ${({ minWidth }) => minWidth}px;

  &.fomies-header {
    & > :nth-child(8) {
      justify-content: center !important;
      margin-right: 8px;
    }
  }

  &.projects-ico-header {
    & > div,
    & > button {
      white-space: nowrap;
    }
  }

  &.backers-funds-header {
    & > *:nth-child(8),
    & > *:nth-child(9) {
      justify-self: stretch;
      justify-content: center;
      font-size: 13px;
      max-width: 100%;
      min-width: 0;
      padding-left: 0;
      padding-right: 0;
      transform: translateX(-4px);
    }

    & > *:nth-child(9) {
      padding-left: 0;
      padding-right: 0;
    }

    & > *:nth-child(10) {
      justify-self: start;
      justify-content: flex-start;
      max-width: 100%;
    }
  }

  &.connections-header,
  &.onchain-header,
  &.influence-header,
  &.influence-table-header {
    background: #f5fbfd;

    &
      > *:nth-child(
        ${(props) => {
          return props.stickyIndex;
        }}
      ) {
      background: #f5fbfd;
    }
  }

  &.onchain-header,
  &.influence-header,
  &.influence-table-header {
    padding: 7px 10px !important;
  }

  /* Fixed first column (project data) */
  &
    > *:nth-child(
      ${(props) => {
        return props.stickyIndex;
      }}
    ) {
    @media (max-width: 768px) {
      position: sticky;
      left: 0;
      z-index: 1;
      background: white;
      border-right: 1px solid #eee;
    }
  }

  &.onchain-header > *:nth-child(1) {
    position: relative;
  }
  &.onchain-header > *:nth-child(3) {
    @media (max-width: 768px) {
      position: sticky;
      left: 0;
      z-index: 1;
      background: #f5fbfd;
      border-right: 1px solid #eee;
    }
  }
  &.blue-bg
    > *:nth-child(
      ${(props) => {
        return props.stickyIndex;
      }}
    ) {
    background: #f5f8fa;
  }

  &.otc,
  &.deals {
    height: 100%;
  }

  @media (max-width: 1024px) {
    padding: 12px 10px !important;
  }

  @media (max-width: 768px) {
    padding: 10px 8px !important;
  }

  @media (max-width: 480px) {
    padding: 8px 6px !important;
    &.crypto {
      button:nth-child(4) {
        padding-left: 12px;
      }
    }
  }

  & > div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 14px;
    color: var(--color-text-muted);
    max-width: fit-content;
    display: flex;
    align-items: center;

    @media (max-width: 768px) {
      font-size: 13px;
      line-height: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 12px;
    }
  }

  & > button {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 14px;
    color: var(--color-text-muted);
    max-width: fit-content;
    display: flex;
    align-items: center;
    border: none;
    background: none;
    cursor: pointer;
    transition: all 0.3s ease;

    @media (max-width: 768px) {
      font-size: 13px;
      line-height: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 12px;
    }

    &:hover {
      color: var(--color-primary);
    }

    &:active {
      color: #29a87c;
    }
  }
`;

export const RowsWrapper = styled.div<{
  minWidth?: number;
}>`
  display: flex;
  flex-direction: column;
  min-width: ${({ minWidth }) => minWidth}px;

  .sticky-column {
    position: sticky;
    left: 0;
    background: white;
    border-right: 1px solid #eee;
    z-index: 1;
    height: 100%;
  }
`;

export const ScrollButton = styled.button`
  position: fixed;
  bottom: 40px;
  right: 60px;
  width: 50px;
  height: 50px;
  background-color: rgba(0, 0, 0, 0.1);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 1000;
  transition: all 0.3s ease;

  @media (max-width: 1024px) {
    bottom: 32px;
    right: 48px;
    width: 45px;
    height: 45px;
    font-size: 16px;
  }

  @media (max-width: 768px) {
    bottom: 24px;
    right: 24px;
    width: 40px;
    height: 40px;
    font-size: 14px;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    bottom: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    font-size: 12px;
    border-radius: 8px;
  }

  img {
    transform: rotate(-90deg);

    @media (max-width: 768px) {
      width: 16px;
      height: 16px;
    }

    @media (max-width: 480px) {
      width: 14px;
      height: 14px;
    }
  }
`;

export const LikeWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  @media (max-width: 768px) {
    gap: 3px;
  }

  @media (max-width: 480px) {
    gap: 2px;
  }

  span {
    font-weight: var(--font-weight-semibold);

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }

  &.like-value {
    img {
      width: 16px;
      height: 16px;

      @media (max-width: 768px) {
        width: 14px;
        height: 14px;
      }

      @media (max-width: 480px) {
        width: 12px;
        height: 12px;
      }
    }
  }
`;

export const StageWrapper = styled.div`
  color: var(--color-primary) !important;

  @media (max-width: 768px) {
    font-size: 13px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;
export const Actions = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 768px) {
    gap: 8px;
    margin-top: 4px !important;

    &.actions-wrapper > button {
      width: 100% !important;
      max-width: 100% !important;
    }
  }

  @media (max-width: 480px) {
    gap: 6px;
    flex-direction: column;
  }
`;

export const UnlockingActionButton = styled.button<{ isActive?: boolean }>`
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: ${({ isActive }) =>
    isActive ? "var(--color-primary-soft)" : "transparent"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;

  svg path {
    stroke: ${({ isActive }) => (isActive ? "var(--color-primary)" : "var(--color-text-muted)")};
  }

  &:hover:not(:disabled) {
    background: var(--color-primary-soft);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  span {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(115, 128, 148, 0.25);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: token-unlock-action-spin 0.8s linear infinite;
  }

  @keyframes token-unlock-action-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
export const PriceWrapper = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 3px;
  }

  @media (max-width: 480px) {
    gap: 2px;
    flex-direction: column;
    align-items: flex-start;
  }
`;
export const PricePercentChange = styled.div<{ isLow: boolean }>`
  color: ${({ isLow }) => (isLow ? "var(--color-danger)" : "var(--color-primary)")};
  font-weight: var(--font-weight-semibold);

  @media (max-width: 768px) {
    font-size: 13px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

export const UnlockProgressWrapper = styled.div`
  display: flex;
  width: 150px;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);

  @media (max-width: 1024px) {
    width: 125px;
  }

  @media (max-width: 768px) {
    width: 105px;
    font-size: 13px;
    line-height: 16px;
  }

  @media (max-width: 480px) {
    width: 82px;
    font-size: 12px;
    line-height: 15px;
  }
`;

export const UnlockProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 4px;
  border-radius: 8px;
  background: #eeeeee;
  overflow: hidden;

  div {
    width: ${({ progress }) => progress}%;
    height: 100%;
    border-radius: 8px;
    background: #05c9a1;
  }
`;
