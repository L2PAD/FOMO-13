import styled from "styled-components";

export const rarityColor: Record<string, string> = {
  Common: "var(--color-text-muted)",
  Rare: "#5085bd",
  Epic: "#8a53ff",
  Legendary: "var(--color-danger)",
  "FOMO Gold": "var(--color-warning)",
};

export const NFTFusionWrapper = styled.div`
  width: 100%;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export const SelectorRow = styled.div`
  display: flex;
  gap: 40px;
  align-items: center;
  width: 100%;
  min-height: 482px;

  @media (max-width: 900px) {
    flex-direction: column;
    min-height: unset;
  }
`;

export const NFTSelectorCard = styled.div`
  flex: 1;
  min-width: 0;
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  align-self: stretch;
  min-height: 480px;
`;

export const SelectorTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 30px;
`;

export const NFTImageArea = styled.div`
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  max-height: 340px;
  height: 340px;
  width: 100%;
  max-width: 340px;

  img {
    width: 100%;
    height: 340px;
    object-fit: cover;
    border-radius: 12px;
  }
`;

export const NFTEmptyArea = styled.div`
  flex: 1;
  border-radius: 12px;
  border: 1.5px dashed #f0f2f5;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 280px;
  width: 100%;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f0f2f5;
  }

  .plus-icon {
    color: var(--color-text-muted);
  }

  span {
    font-size: 16px;
    color: var(--color-text-muted);
    line-height: 20px;
  }
`;

export const NFTDropdown = styled.div`
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  width: 100%;
  flex-shrink: 0;

  select {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: var(--color-text-primary);
    cursor: pointer;
    font-family: inherit;
    appearance: none;

    &:invalid,
    option[value=""] {
      color: var(--color-text-soft);
    }
  }

  .chevron {
    color: var(--color-text-muted);
    flex-shrink: 0;
    pointer-events: none;
  }
`;

export const FusionCenter = styled.div`
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

export const FusionIcon = styled.div`
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FusionText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  width: 100%;

  h2 {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    line-height: 30px;
  }

  p {
    font-size: 16px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    margin: 0;
    line-height: 20px;
  }
`;

export const StatsRow = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;

  @media (max-width: 700px) {
    flex-wrap: wrap;
  }
`;

export const StatCard = styled.div`
  flex: 1;
  min-width: 0;
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .label {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  @media (max-width: 700px) {
    flex: 1 1 100%;
    padding: 15px;
  }
`;

export const StatBadge = styled.div<{ color?: string }>`
  background: ${({ color }) => color || "#E9F8F8"};
  border-radius: 6px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;

  span {
    font-size: 14px;
    color: var(--color-primary);
    white-space: nowrap;
    line-height: 20px;
  }
`;

export const OutcomeBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const OutcomeBadge = styled.div<{ rarity: string }>`
  background: #f5fbfd;
  border-radius: 8px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 14px;
    color: ${({ rarity }) => rarityColor[rarity] || "var(--color-text-muted)"};
    white-space: nowrap;
  }
`;

export const FusionButtonRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StartFusionButton = styled.button`
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  width: 400px;
  padding: 15px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: #04946f;
  }

  &:disabled {
    background: var(--color-text-soft);
    cursor: not-allowed;
  }

  span {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-white);
    line-height: 20px;
  }

  @media (max-width: 500px) {
    width: 100%;
  }
`;

export const HistorySectionTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 30px;
`;

export const HistorySection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const HistoryCard = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;

  @media (max-width: 700px) {
    flex-wrap: wrap;
  }
`;

export const HistoryItems = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
`;

export const NFTChip = styled.div`
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  .nft-name {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
  }
`;

export const ChipBadge = styled.span<{ color?: string; bg?: string }>`
  background: ${({ bg }) => bg || "#f5fbfd"};
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: ${({ color }) => (color ? "600" : "400")};
  color: ${({ color }) => color || "var(--color-text-muted)"};
  white-space: nowrap;
  line-height: normal;
`;

export const ArrowSep = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  padding: 0 4px;
`;

export const PlusSep = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  padding: 0 4px;
`;

export const HistoryTime = styled.span`
  font-size: 14px;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const FuseAgainButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: var(--color-primary);
    color: var(--color-white);
  }
`;
