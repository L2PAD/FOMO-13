import styled from "styled-components";
import Typography from "../../../../global/common/Typography";

export const PageWrapper = styled.div`
  padding: 40px 36px;
  margin: 0 auto;

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
  }
  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
  }
`;

export const ContentWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export const ImageWrapper = styled.div`
  width: 100%;
  max-width: 440px;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
  position: relative;
  margin: 0 auto;
  position: relative;
  .expand {
    position: absolute;
    bottom: 24px;
    right: 24px;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const PriceCard = styled.div`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;

  .wrapper {
    width: 100%;
    display: flex;
    flex-direction: row;

    & > div {
      width: 100%;
    }
  }
`;

export const PriceLabel = styled.div`
  font-size: 14px;
  margin-bottom: 20px;
  font-weight: var(--font-weight-semibold);
`;

export const PriceValue = styled.div`
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 4px;

  @media (max-width: 767px) {
    font-size: 24px;
  }
`;

export const PriceUSD = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const AuctionTimer = styled.div`
  display: flex;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
`;

export const TimerLabel = styled.div`
  font-size: 14px;
  margin-bottom: 20px;
  font-weight: var(--font-weight-semibold);
`;

export const TimerValues = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
`;

export const TimerItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const TimerNumber = styled.div`
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: 40px;

  @media (max-width: 767px) {
    font-size: 24px;
  }
`;

export const TimerUnit = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;

  button {
    flex: 1;
    height: 48px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: all 0.2s;

    &:first-child {
      background: var(--color-primary);
      color: white;
      border: none;

      &:hover {
        background: #038f72;
      }
    }

    &:last-child {
      color: var(--color-primary);
      border: 1px solid var(--color-primary);

      &:hover {
        background: #f0faf8;
      }
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    &:first-child:disabled {
      background: #b9c2cf;
    }

    &:last-child:disabled {
      color: var(--color-text-muted);
      border-color: #cfd7e3;
      background: var(--color-white);
    }
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
`;

export const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const NFTTitle = styled.h1`
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;

  @media (max-width: 767px) {
    font-size: 24px;
  }
`;

export const NFTMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const NFTId = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-muted);
  background: #f5fbfd;
  padding: 4px 10px;
  border-radius: 6px;
`;

export const RarityBadge = styled.div<{ rarity: string }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  background: ${({ rarity }) => {
    switch (rarity.toLowerCase()) {
      case "epic":
        return "rgba(131, 56, 236, 0.1)";
      case "legendary":
        return "rgba(255, 152, 0, 0.1)";
      case "rare":
        return "rgba(33, 150, 243, 0.1)";
      default:
        return "rgba(0, 192, 153, 0.1)";
    }
  }};
  color: ${({ rarity }) => {
    switch (rarity.toLowerCase()) {
      case "epic":
        return "#8338EC";
      case "legendary":
        return "#FF9800";
      case "rare":
        return "#2196F3";
      default:
        return "var(--color-primary)";
    }
  }};
`;

export const ViewCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--color-text-muted);
  background: #f5fbfd;
  padding: 4px 10px;
  border-radius: 6px;
`;

export const Description = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary);

  a,
  button {
    color: var(--color-primary);
    text-decoration: none;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: inherit;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const CollectionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
`;

export const CreatorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const InfoLabel = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
`;

export const InfoValue = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const TabsContainer = styled.div`
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;
  height: 360px;

  .nft-page {
    border-bottom: 2px solid #f0f2f5;

    .tab {
      font-weight: var(--font-weight-semibold);
    }
  }
`;

export const InfoTable = styled.div``;

export const InfoRow = styled.div`
  display: flex;
  padding-bottom: 20px;

  &:last-child {
    border-bottom: none;
  }
`;

export const InfoRowLabel = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  width: 170px;
`;

export const InfoRowValue = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;

  &.copyable {
    gap: 12px;
  }
`;

export const InfoRowText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const InfoRowCopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  flex-shrink: 0;
  transition: background 0.2s ease;

  &:hover {
    background: var(--color-primary-soft);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const ChartWrapper = styled.div`
  width: 100%;
  height: 270px;

  .recharts-cartesian-axis-tick-value {
    font-size: 12px;
    fill: #000;
  }

  .recharts-cartesian-grid-horizontal line,
  .recharts-cartesian-grid-vertical line {
    stroke: #f0f2f5;
  }
`;

export const OffersList = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 20px);
  overflow-y: auto;
  gap: 20px;
`;

export const OfferItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

export const OfferUser = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

export const OfferUserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const OfferUserName = styled.div`
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const OfferPrice = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);

  span {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
    margin-left: 4px;
  }
`;

export const OfferRight = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 7px;
`;

export const OfferActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

export const OfferTime = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: right;
  white-space: nowrap;
`;

export const OfferStatus = styled.div`
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: right;
  white-space: nowrap;
`;

export const CancelButton = styled.button`
  background: none;
  border: none;
  color: var(--color-info);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: 0;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }

  &:disabled {
    color: #9aa4b5;
    cursor: not-allowed;
    text-decoration: none;
  }
`;

export const ActivitiesWrapper = styled.div`
  margin-top: 40px;
  background: var(--color-white);
  border-radius: 12px;
`;

export const ActivitiesTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 24px;
`;

export const ActivitiesTable = styled.div`
  width: 100%;
  overflow-x: auto;
  background: #f5fbfd;
  padding: 20px;
  border-radius: 12px;

  .sticky {
    position: sticky;
    left: -20px;
    z-index: 1;
    background: #f5fbfd;
  }
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  border-bottom: 1px solid #f0f2f5;
  min-width: 1200px;
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  border-bottom: 1px solid #f0f2f5;
  align-items: center;
  min-width: 1200px;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-surface-subtle);
  }

  & > div {
    padding: 10px;
  }
`;

export const TableCell = styled.div`
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  padding: 10px;
`;

export const ActivityType = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ActivityTypeLabel = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const ActivityTypeStatus = styled.div`
  font-size: 10px;
  color: var(--color-text-muted);
`;

export const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ItemImage = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ItemCollectionName = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const ItemName = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const PriceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const PriceAmount = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const PriceUSDAmount = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
`;

export const AddressLink = styled.div`
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;

  &:hover {
    color: var(--color-info);
    text-decoration: underline;
  }
`;

export const DateCell = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
`;

export const PageButton = styled.button<{ active?: boolean }>`
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid ${(props) => (props.active ? "var(--color-info)" : "#e0e0e0")};
  background: ${(props) => (props.active ? "var(--color-info)" : "var(--color-white)")};
  color: ${(props) => (props.active ? "var(--color-white)" : "var(--color-text-primary)")};
  border-radius: 6px;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-info);
    background: ${(props) => (props.active ? "var(--color-info)" : "#f5f5f5")};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const FooterSection = styled.div`
  margin-top: 60px;
`;

export const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 24px;
`;

export const NFTGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 20px;

  @media (max-width: 1800px) {
    grid-template-columns: repeat(5, 1fr);
  }

  @media (max-width: 1441px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const RelatedEmptyState = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  background: #f5fbfd;
  border-radius: 12px;
`;
