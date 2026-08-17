import styled from "styled-components";

export const Indicator = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
  background: var(--color-white);
  cursor: pointer;
  width: 100%;
  justify-content: flex-start;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #e9f8f8;
    background: #f5fbfd;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

export const IndicatorIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`;

export const IndicatorText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  color: var(--color-text-primary);

  strong {
    font-weight: 600;
  }

  span {
    color: var(--color-text-muted, #728094);
    font-weight: 400;
  }
`;

export const IndicatorCta = styled.span`
  margin-left: auto;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(7, 11, 53, 0.35);
  backdrop-filter: blur(3px);
  z-index: 300;
  display: flex;
  justify-content: flex-end;
`;

export const Panel = styled.div`
  width: min(520px, 100%);
  height: 100%;
  background: var(--color-white, #fff);
  box-shadow: -8px 0 32px rgba(7, 11, 53, 0.18);
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PanelHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const PanelTitle = styled.h3`
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary, #0b1437);
`;

export const PanelSub = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: #728094;
`;

export const CloseBtn = styled.button`
  border: none;
  background: #f4f6fa;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #728094;

  &:hover {
    background: #e9edf4;
  }
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const Row = styled.div`
  border: 1px solid #eef1f6;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const RowMain = styled.div`
  cursor: pointer;
`;

export const RowTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #0b1437);
`;

export const RowMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  align-items: center;
`;

export const Xp = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
`;

export const Tag = styled.span<{ $prime?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  color: ${({ $prime }) => ($prime ? "var(--color-primary)" : "#728094")};
  background: ${({ $prime }) => ($prime ? "var(--color-primary-soft)" : "#f4f6fa")};
`;

export const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const PrimaryBtn = styled.button`
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--color-primary);
  cursor: pointer;

  &:hover {
    background: var(--color-primary-hover);
  }
`;

export const GhostBtn = styled.button`
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #47506b;
  background: #fff;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f4f6fa;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;
