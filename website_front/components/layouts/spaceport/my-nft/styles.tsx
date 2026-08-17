import styled from "styled-components";

export const rarityColor: Record<string, string> = {
  Common: "var(--color-text-muted)",
  Rare: "#5085bd",
  Epic: "#8a53ff",
  Legendary: "var(--color-danger)",
  "FOMO Gold": "var(--color-warning)",
};

export const MyNFTWrapper = styled.div`
  width: 100%;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;

  .image-modal {
    .modal-style {
      max-width: 820px;
      width: 100%;

      img {
        object-fit: cover;
        margin-top: 40px;
        border-radius: 8px;
        width: 100%;
        max-height: 70vh;
      }
    }

    @media (max-width: 900px) {
      .internal-wrapper {
        padding: 10px;

        .content {
          overflow-x: auto;
        }

        img {
          max-width: 100%;
          aspect-ratio: 1;
          height: auto;
          max-height: 50vh;
          margin-top: 0;
        }
      }
    }
  }
`;

export const FeaturedCard = styled.div`
  background: var(--color-white);
  border-radius: 16px;
  box-shadow: var(--main-section-shadow);
  display: flex;
  align-items: stretch;
  min-height: 566px;
  padding: 18px;
  gap: 28px;

  @media (max-width: 900px) {
    flex-direction: column;
    padding: 16px;
    gap: 20px;
  }
`;

export const FeaturedImageSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 0;
  flex: 0 0 50%;
  position: relative;
  min-width: 0;
  justify-content: space-between;

  .nft-image {
    width: 100%;
    max-width: 440px;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    position: relative;
    min-height: 300px;
    background: #000000;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
    .expand-icon {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
      z-index: 1;
      background: rgba(7, 11, 53, 0.48);
      border: none;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;

      &:hover {
        transform: scale(1.05);
      }
    }
  }

  @media (max-width: 900px) {
    flex: 1 1 auto;
  }

  @media (max-width: 600px) {
    .nft-image {
      max-width: 100%;
    }
  }
`;

export const ViewDetailsLink = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #728094;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  text-decoration: none;
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 8px;

  &:hover {
    background: #f5fbfd;
    color: #4b6bfb;
  }
`;

export const FeaturedInfoSide = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 6px 4px 0;
  flex: 1;
  min-width: 0;

  .info-content {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .action-block {
      margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  @media (max-width: 600px) {
    padding: 0;
  }
`;

export const NFTTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    @media (max-width: 600px) {
      align-items: flex-start;
      gap: 8px;
    }
  }

  h2 {
    flex: 1;
    font-size: 32px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    line-height: 40px;
  }

  .badges {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-shrink: 0;
  }

  .floor-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-muted);
    font-size: 14px;
  }
`;

export const SmallBadge = styled.span<{ color?: string }>`
  background: #f5fbfd;
  border-radius: 8px;
  padding: 6px 12px;
  max-width: fit-content;
  font-size: 14px;
  font-weight: ${({ color }) => (color ? 600 : 400)};
  color: ${({ color }) => color || "var(--color-text-muted)"};
  line-height: normal;
`;

export const FeaturedMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const FeaturedMetaCard = styled.div`
  background: var(--color-white);
  border: 1px solid #edf1f5;
  border-radius: 16px;
  padding: 14px 20px;
  min-height: 76px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;

  .card-label {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: #8a9ab0;
    text-transform: uppercase;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .meta-caption {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #213056;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #7b88a0;
  }

  .status-pill.active .dot {
    background: var(--color-primary);
  }
`;

export const FeaturedWalletCard = styled.div`
  background: var(--color-white);
  border: 1px solid #edf1f5;
  border-radius: 16px;
  padding: 14px 20px;

  .wallet-copy-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .wallet-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .card-label {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: #8a9ab0;
    text-transform: uppercase;
  }

  .wallet-value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    word-break: break-all;
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 96px;
    padding: 10px 16px;
    border-radius: 12px;
    border: 1px solid #edf1f5;
    background: var(--color-surface-raised);
    color: #213056;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    transition: background 0.2s ease, border-color 0.2s ease;

    &:hover {
      background: #f1f7fb;
      border-color: #dde8f0;
    }
  }
`;

export const FeaturedBenefitsCard = styled.div`
  background: var(--color-white);
  border: 1px solid #edf1f5;
  border-radius: 16px;
  padding: 14px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .card-label {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: #8a9ab0;
    text-transform: uppercase;
  }

  .benefits-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .benefit-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: var(--color-primary);

    svg {
      flex-shrink: 0;
      margin-top: 2px;
    }
  }

  .benefit-text {
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  .benefit-text strong {
    color: #213056;
    font-weight: var(--font-weight-semibold);
  }
`;

export const StakedBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-white);
  flex-shrink: 0;
`;

export const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 40px;
`;

export const InfoBox = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  gap: 20px;
  align-items: stretch;
`;

export const InfoBoxSingle = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
`;

export const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;

  .avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    .label {
      font-size: 14px;
      color: var(--color-text-muted);
      line-height: 18px;
    }

    .value {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      line-height: normal;
    }
  }
`;

export const StakeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: var(--color-primary);
  border: none;
  border-radius: 12px;
  padding: 16px 12px;
  cursor: pointer;
  color: var(--color-white);
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  transition: background 0.2s;

  &:hover {
    background: #04936f;
  }

  &:disabled {
    background: #82d2c1;
    cursor: not-allowed;
  }
`;

export const StakeSubtext = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
  line-height: 22px;
`;

export const StakingProgressBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  padding: 18px 20px;
  background: var(--color-white);
  border: 1px solid #edf1f5;
  border-radius: 16px;
  box-shadow: none;

  @media (max-width: 600px) {
    margin: 0;
  }
`;

export const StakingProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 18px;

  .label {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-regular);
  }

  .value {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
`;

export const ProgressBarTrack = styled.div`
  width: 100%;
  height: 8px;
  background: #f3f6f9;
  border-radius: 8px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<{ percent: number }>`
  height: 100%;
  width: ${({ percent }) => Math.min(100, Math.max(0, percent))}%;
  background: linear-gradient(90deg, var(--color-primary) 0%, #82d2c1 100%);
  border-radius: 8px;
  transition: width 0.3s ease;
`;

export const StakingMetaText = styled.p`
  font-size: 16px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.2;
`;

export const NextRewardRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  color: var(--color-text-muted);
  line-height: normal;
  flex-shrink: 0;
  margin-top: 2px;

  svg {
    color: #8a9ab0;
    flex-shrink: 0;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 30px;
`;

export const SectionTitleWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  h3 {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    line-height: 30px;
  }
`;

export const FilterTabs = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f9f9f9;
  border-radius: 8px;
  height: 38px;
`;

export const FilterTab = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: normal;
  height: 100%;
  background: ${({ active }) => (active ? "var(--color-white)" : "transparent")};
  color: ${({ active }) => (active ? "var(--color-primary)" : "var(--color-text-muted)")};
  box-shadow: ${({ active }) =>
    active ? "2px 2px 8px 0 rgba(0, 5, 48, 0.08)" : "none"};
  transition: all 0.15s;

  &:hover {
    color: ${({ active }) => (active ? "var(--color-primary)" : "var(--color-text-primary)")};
  }
`;

export const NFTGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
`;

export const NFTCard = styled.div`
  background: #f5fbfd;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  max-width: 295px;
  width: 100%;
  height: 380px;
  position: relative;
  
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    box-shadow: 2px 4px 16px 0 rgba(0, 5, 48, 0.14);
  }

  @media (max-width: 500px) {
    max-width: 100%;
  }
`;

export const CardImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 200px;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const CardTopBadges = styled.div`
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const CardNumberBadge = styled.div`
  position: absolute;
  top: 155px;
  left: 20px;
`;

export const CardBottomBadges = styled.div`
  position: absolute;
  top: 155px;
  left: 0;
  width: 100%;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HiddenBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-info);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 14px;
  color: var(--color-white);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const SingularityBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(90deg, #F90 0%, #FF2B3A 100%);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 14px;
  color: var(--color-white);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const CardInfo = styled.div`
  position: absolute;
  top: 220px;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const CardNameRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .name {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    
    text-overflow: ellipsis;
  }

  .views {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;

    span {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }
`;

export const CardStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 20px;

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;

    .label {
      color: var(--color-text-muted);
    }

    .value {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);

      &.green { color: var(--color-primary); }
      &.red   { color: var(--color-danger); }
    }
  }
`;

export const CardPriceRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 20px;

  .price-block {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .eth {
      font-size: 16px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .usd {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }

  .arrow {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
`;

export const CrossButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: ${({ active }) => (active ? "var(--color-primary)" : "#82d2c1")};
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  height: 36px;
  cursor: ${({ active }) => (active ? "pointer" : "default")};
  color: var(--color-white);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  transition: background 0.2s;

  &:hover {
    background: ${({ active }) => (active ? "var(--color-primary)" : "#82d2c1")};
  }
`;

export const ShardsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
  align-items: flex-end;
`;

export const ShardCard = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  box-shadow: ${({ selected }) =>
    selected
      ? "2px 4px 30px 0 rgba(5, 165, 132, 0.4)"
      : "2px 2px 8px 0 rgba(0, 5, 48, 0.08)"};
  max-width: 232px;
  width: 100%;
  flex-shrink: 0;
  position: relative;

  .shard-image {
    width: 100%;
    height: 200px;
    
    border-radius: 12px 12px 0 0;
    border-top: ${({ selected }) => (selected ? "2px solid var(--color-primary)" : "none")};
    border-left: ${({ selected }) => (selected ? "2px solid var(--color-primary)" : "none")};
    border-right: ${({ selected }) =>
    selected ? "2px solid var(--color-primary)" : "none"};

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px 12px 0 0;
    }
  }

  .shard-name {
    background: #f5fbfd;
    padding: 20px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    border-radius: 0 0 12px 12px;
    border-bottom: ${({ selected }) =>
    selected ? "2px solid var(--color-primary)" : "none"};
    border-left: ${({ selected }) => (selected ? "2px solid var(--color-primary)" : "none")};
    border-right: ${({ selected }) =>
    selected ? "2px solid var(--color-primary)" : "none"};
  }

  @media (max-width: 600px) {
    max-width: 100%;
  }
`;

export const ShardTopBadges = styled.div`
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const CheckCircle = styled.div<{ checked?: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid ${({ checked }) => (checked ? "var(--color-primary)" : "#b0bec9")};
  background: ${({ checked }) => (checked ? "var(--color-primary)" : "transparent")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    display: ${({ checked }) => (checked ? "block" : "none")};
  }
`;

export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const HistoryRow = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
`;

export const HistoryItems = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  min-width: 0;

  .shard-name {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  .separator {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .arrow {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }
`;

export const HistoryTime = styled.span`
  font-size: 14px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  white-space: nowrap;
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(7, 11, 53, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
`;

export const ModalContainer = styled.div`
  background: var(--color-white);
  border-radius: 16px;
  overflow: auto;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 2px 4px 40px 0 rgba(0, 5, 48, 0.18);
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40px 40px 20px;
  background: var(--color-white);
  flex-shrink: 0;

  .title {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const ModalCloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;

  &:hover {
    background: #f0f2f5;
    color: var(--color-text-primary);
  }
`;

export const ModalBody = styled.div`
  display: flex;
  gap: 20px;
  padding: 20px 40px 40px 40px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const ModalImageCol = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 0;
  min-width: 0;

  img {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  }
`;

export const ModalInfoCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
`;

export const DetailCard = styled.div`
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const DetailCardTitle = styled.p`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 20px;
`;

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

export const DetailField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .label {
    font-size: 14px;
    color: var(--color-text-muted);
    line-height: 18px;
  }

  .value {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 20px;
  }

  .floor-value {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: var(--color-text-muted);
  }
`;

export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #F9F9F9;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  width: fit-content;
`;

export const PropertyBox = styled.div`
  background: #f9f9f9;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .prop-label {
    font-size: 14px;
    color: #728094;
    line-height: 18px;
  }

  .prop-value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 18px;
  }
`;

export const TabBar = styled.div`
  display: flex;
  border-bottom: 2px solid #f0f2f5;
  width: 100%;
`;

export const HistoryTab = styled.button<{ active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 10px;
  padding: 0 20px 10px;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  background: transparent;
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? "var(--color-primary)" : "transparent")};
  margin-bottom: -2px;
  color: ${({ active }) => (active ? "var(--color-text-primary)" : "var(--color-text-muted)")};
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: var(--color-text-primary);
  }
`;

export const HistoryEventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export const HistoryEventRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;

  .event-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    .event-name {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      line-height: 18px;
    }

    .event-date {
      font-size: 14px;
      color: #728094;
      line-height: 18px;
    }
  }
`;

export const XPBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #E9F8F8;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 14px;
  color: var(--color-primary);
  white-space: nowrap;
  flex-shrink: 0;

  &.xp-loss {
    color: #728094;
    background: #F9F9F9;
  }
`;

export const RewardStatusBadge = styled.span<{ status: "Claimed" | "Pending" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
  background: ${({ status }) => (status === "Claimed" ? "#E9F8F8" : "#F9F9F9")};
  color: ${({ status }) => (status === "Claimed" ? "var(--color-primary)" : "var(--color-text-muted)")};
`;

export const HiddenModalImageCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  align-self: flex-start;
`;

export const HiddenBadgeOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(75, 107, 251, 0.05);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: #4b6bfb;
`;

export const SingularityNotice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fefcf3;
  border: 1px solid #ffc704;
  border-radius: 12px;
  padding: 20px;
  width: 100%;

  span {
    font-size: 14px;
    color: #ffc704;
    line-height: 18px;
    flex: 1;
  }
`;

export const RequirementsBlock = styled.div`
  background: #f5fbfd;
  border: 1px solid #e9f8f8;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const RequirementRow = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .req-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .req-title {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 18px;
  }

  .req-desc {
    font-size: 14px;
    color: #728094;
    line-height: 18px;
  }

  .req-progress {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: auto;
  }
`;

export const BenefitsBlock = styled.div`
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  width: 100%;

  .benefits-inner {
    display: flex;
    align-items: flex-start;
    gap: 20px;

    .icon {
      width: 40px;
      height: 40px;
      background: #E9F8F8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .benefits-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .benefits-title {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 18px;
  }

  .benefits-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 2px;

    li {
      font-size: 14px;
      color: #728094;
      line-height: 18px;
      list-style-type: disc;
    }
  }
`;

export const TradingRestrictionBlock = styled.div`
  background: #fefcf3;
  border: 1px solid #ffc704;
  border-radius: 12px;
  padding: 20px;
  font-size: 14px;
  color: #728094;
  line-height: 18px;
  width: 100%;
`;

export const AchievementsBlock = styled.div`
  background: #f5fbfd;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const AchievementRow = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .achievement-emoji {
    font-size: 20px;
    line-height: 1;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }

  .achievement-label {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 18px;
    flex: 1;
  }
`;

export const TradingRestrictionsBlock = styled.div`
  background: #fefcf3;
  border: 1px solid #ffc704;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .restrictions-title {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #ffc704;
    line-height: 18px;
  }

  .restrictions-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 2px;

    li {
      font-size: 14px;
      color: #728094;
      line-height: 18px;
      list-style-type: disc;
    }
  }
`;

export const CrossingModalContainer = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  width: 100%;
  max-width: 580px;
  box-shadow: 2px 4px 40px 0 rgba(0, 5, 48, 0.18);
`;

export const CrossingProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  width: 100%;

  .title {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    text-align: center;
    line-height: 30px;
    margin: 0;
  }

  .progress-track {
    width: 100%;
    height: 8px;
    background: #f9f9f9;
    border-radius: 8px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 8px;
    background: linear-gradient(90deg, var(--color-primary) 0%, #82d2c1 100%);
    transition: width 0.1s linear;
  }

  .subtitle {
    font-size: 14px;
    color: #728094;
    text-align: center;
    margin: 0;
    line-height: 18px;
  }
`;

export const CrossedResultContainer = styled.div`
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding-bottom: 40px;
  width: 100%;
  max-width: 500px;

  .close-row {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    padding: 20px 20px 0;
  }
`;

export const CrossedImageWrapper = styled.div`
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: 12px;
  box-shadow: 0 0 50px 0 rgba(205, 110, 252, 0.8);
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
  }

  .rarity-badge {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 100%;
  }
`;

export const CrossedInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  width: 100%;

  .name {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 30px;
    margin: 0;
    text-align: center;
  }

  .meta {
    font-size: 14px;
    color: var(--color-text-muted);
    line-height: 18px;
    margin: 0;
    text-align: center;
  }
`;

export const ViewCollectionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--color-white);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #04937a;
  }
`;
