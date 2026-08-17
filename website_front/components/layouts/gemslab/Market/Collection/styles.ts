import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import BaseCard from "../../../../global/common/BaseCard";

export const PageWrapper = styled.div`
  padding: 0px 36px;
  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }

  & .collection-page {
    margin-top: 20px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
  margin-top: 18px;
  position: relative;

  & > div:first-child {
    width: 100%;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
  }


`;

export const NFTsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  @media (max-width: 767px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  @media (max-width: 500px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

export const CollectionEmptyState = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px 20px;
  background: #f5fbfd;
  border-radius: 12px;
`;

export const FillterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;

  @media (max-width: 767px) {
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
  }
`;

export const LeftHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;

  & .mobile-actions{
    position: absolute;
    right: 15px;
    top: 15px;
  }

  & .market {
    top: 40px;
    padding: 10px;

     button {
      padding:  0px;
     }
  }

  @media (max-width: 1024px) {
    width: 100%;
  }

`;

export const LeftHeaderPersonInfoWrapper = styled.div`
  display: flex;
  gap: 16px;

  .buttons {
    margin-left: auto;
    display: flex;
    gap: 8px;
    flex-direction: column;
    align-items: flex-end;

    .actions {
      button {
        width: 24px;
        height: 24px;
        background: none;
      }
    }
  }
  @media (max-width: 767px) {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;

    .buttons {
      flex-direction: row;
      width: 100%;
      order: 3;
      justify-content: flex-end;
    }
  }
`;

export const HeaderPersonTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-text-primary);

  @media (max-width: 767px) {
    font-size: 24px;
    line-height: 29px;
  }
`;
export const SocialsWrapper = styled.div`
  display: flex;
  gap: 12px;
`;

export const HeaderPersonDescription = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 2px;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-muted);

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const PersonPriceWrapper = styled.div`
  display: flex;
  gap: 40px;
  width: 100%;

  .left {
    h2 {
      display: flex;
      align-items: end;
      gap: 4px;
    }
    span {
      padding-bottom: 2px;
      font-size: 12px;
      line-height: 16px;
      color: var(--color-primary);
    }
  }

  &.desktop {
    display: flex;
  }
  &.mobile {
    display: none;
  }

  @media (max-width: 767px) {
    flex-direction: column;
    gap: 26px;

    &.desktop {
      display: none;
    }
    &.mobile {
      display: flex;
    }
  }
`;

export const ProgressWrapper = styled.div`
  width: 100%;
`;
export const RightHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 400px;
  width: 100%;

  .smart {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    margin-top: 20px;
  }

  @media (max-width: 1024px) {
    width: 100%;
    max-width: none;
  }
  @media (max-width: 767px) {
    width: 100%;
    max-width: none;

    .smart {
      flex-wrap: wrap;
      justify-content: flex-start;
    }
  }
`;

export const RightHeaderHead = styled.div`
  display: flex;
  align-items: center;
  gap: 40px;
  justify-content: space-between;

  @media (max-width: 1024px) {
    justify-content: flex-start;
    align-items: center;
    gap: 14px;
  }

  @media (max-width: 767px) {
    justify-content: space-between;
    flex-direction: row;
    align-items: flex-start;
    gap: 14px;
  }
`;

export const HeaderEditButton = styled.button`
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 2px 2px 0 #eeeeee;
  border-radius: 8px;
  padding: 8px;
  width: 32px;
  height: 32px;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const HeaderDataTextWrapper = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

export const HeaderDataText = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  gap: 8px;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 18px;
    line-height: 22px;

    span {
      font-size: 12px;
      line-height: 14px;
    }
  }
`;

export const HeaderActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  button {
    background: none;
    border: none;
    cursor: pointer;
    svg {
      width: 30px;
      height: 30px;
    }
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

export const HeaderDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;

    i {
      font-size: 14px;
      line-height: 16px;
    }
  }

  span {
    color: var(--color-text-muted);
  }

  i {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-primary);
    font-weight: var(--font-weight-regular);
    font-size: 18px;
    line-height: 21px;
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;

    span,
    i {
      font-size: 14px;
      line-height: 16px;
    }
  }
`;

export const HeaderDescriptionItemsTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const HeaderCopyKey = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 9px 16px;
  display: flex;
  gap: 8px;
  cursor: pointer;
  align-items: center;
  font-size: 12px;
  line-height: 1;
  color: var(--color-text-primary);
  white-space: nowrap;

  @media (max-width: 767px) {
    padding: 6px 10px;
    font-size: 11px;
  }
`;

export const ProjectDescriptionDataWrapper = styled.div`
  display: flex;
  gap: 60px;
  padding: 20px 0;
  border-bottom: 2px solid #f8f8f9;

  @media (max-width: 1024px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 40px;
  }
  @media (max-width: 767px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 25px;
  }
`;

export const ProjectDescriptionItem = styled(Typography) <{
  percentage?: number;
}>`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column-reverse;
  gap: 5px;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);
  }

  i {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: ${({ percentage = 0 }) =>
    percentage > 10
      ? "var(--color-primary)"
      : percentage < 10 && percentage > 0
        ? "var(--color-text-muted)"
        : "var(--color-danger)"};
  }
`;

export const GraphicWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 22px;
  margin-top: 26px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 16px;
  }
  @media (max-width: 767px) {
    gap: 12px;
  }
`;

export const GraphicDataWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

export const GraphicRoiDataTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  margin-bottom: 16px !important;
`;

export const GraphicRoiDataContentWrapper = styled.div`
  display: flex;
  gap: 54px;

  @media (max-width: 1024px) {
    flex-wrap: wrap;
    gap: 30px;
  }
  @media (max-width: 767px) {
    gap: 20px;
  }
`;

export const GraphicRoiDataContentItem = styled(Typography) <{ amount: number }>`
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    margin-top: 4px;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    color: ${({ amount }) =>
    amount >= 2
      ? "var(--color-primary)"
      : amount >= 1 && amount < 2
        ? "var(--color-text-primary)"
        : "var(--color-danger)"};
  }
`;

export const GraphicStatisticsItem = styled.div`
  padding: 10px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:not(:last-child) {
    border-bottom: 2px solid #f8f8f9;
    padding: 10px 0;
  }
`;
export const Wrapper = styled(BaseCard)`
  @media (max-width: 1024px) {
    width: 100% !important;
  }
`;
export const GraphicStatisticsItemTitle = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);

  span {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const GraphicStatisticsItemValues = styled.div<{
  variant: "default" | "green" | "red";
}>`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  text-align: right;
  color: ${({ variant }) =>
    variant === "default"
      ? "var(--color-text-primary)"
      : variant === "green"
        ? "var(--color-primary)"
        : "var(--color-danger)"};
`;

export const RatingCircleWrapper = styled.div`
  margin-top: -10px;
`;

export const RangeTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 21px;
  color: var(--color-text-muted);
  display: flex;
  justify-content: space-between;
  height: 28px;

  .select {
    padding: 4px 8px;
  }
  .select,
  select {
    font-weight: var(--font-weight-semibold);
    text-align: center;
    border: none;
    background: #eaf2fb;
    border-radius: 8px;
    font-size: 14px;
    line-height: 16px;
  }
`;

export const RangeWrapper = styled.div`
  position: relative;
  border-radius: 8px;
  height: 8px;
  background: #eaf2fb;
  margin-top: 8px;
  margin-bottom: 13px;
`;

export const RangeValue = styled.div<{ percentage: number }>`
  background: linear-gradient(270deg, #277ad2 0%, #81bcfb 100%);
  border-radius: 8px;
  height: 8px;
  width: ${({ percentage }) => percentage}%;
`;

export const RangeDescriptionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--color-text-muted);

  b {
    color: #0d0f2b;
  }
`;

export const HeaderPersonNameWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

export const CollectionHeaderVisualCard = styled.div`
  background: linear-gradient(180deg, var(--color-white) 0%, #fbfdff 100%);
  border: 1px solid rgba(132, 146, 166, 0.14);
  box-shadow: 2px 2px 8px 0px rgba(17, 24, 39, 0.1);
  border-radius: 24px;
  padding: 24px 24px 18px;
  min-height: 306px;

  @media (max-width: 767px) {
    padding: 18px 16px 16px;
    min-height: auto;
    border-radius: 20px;
  }
`;

export const CollectionHeaderMetricCard = styled.div`
  background: linear-gradient(180deg, var(--color-white) 0%, #f9fbff 100%);
  border: 1px solid rgba(132, 146, 166, 0.14);
  box-shadow: 2px 2px 8px 0px rgba(17, 24, 39, 0.1);
  border-radius: 24px;
  padding: 24px 22px;
  min-width: 320px;

  .mobile-actions {
    display: none;
  }

  @media (max-width: 1100px) {
    min-width: 0;
  }

  @media (max-width: 767px) {
    padding: 18px 16px;
    border-radius: 20px;

    .mobile-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 14px;
    }
  }
`;

export const CollectionHeaderTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 18px;

  .buttons {
    margin-left: auto;
    display: flex;
    align-items: flex-start;
  }

  @media (max-width: 767px) {
    gap: 12px;
    flex-wrap: wrap;

    .buttons {
      width: 100%;
      justify-content: flex-end;
      display: none;
    }
  }
`;

export const CollectionHeaderTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  line-height: 1.08;
  font-weight: var(--font-weight-semibold);
  color: var(--main-black);
  letter-spacing: -0.03em;

  @media (max-width: 767px) {
    font-size: 22px;
  }
`;

export const CollectionHeaderSubtitle = styled.p`
  margin: 8px 0 0;
  font-size: 16px;
  line-height: 1.35;
  color: #7b88a8;

  @media (max-width: 767px) {
    font-size: 14px;
  }
`;

export const CollectionHeaderDesktopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;

  button {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: #8492aa;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.18s ease, color 0.18s ease, background 0.18s ease;
  }

  button:hover {
    transform: translateY(-1px);
    background: rgba(17, 27, 76, 0.04);
  }

  button.active {
    background: rgba(17, 27, 76, 0.05);
  }

  button.green {
    color: #00b894;
  }

  button.red {
    color: #ff6b6b;
  }

  button.amber {
    color: #f5b700;
  }

  button.slate {
    color: #7b88a8;
  }

  @media (max-width: 767px) {
    display: none;
  }
`;

export const CollectionHeaderPriceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 28px;

  .price-group {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }

  .price-group .value {
    font-size: 24px;
    line-height: 1;
    font-weight: var(--font-weight-semibold);
    color: var(--main-black);
    letter-spacing: -0.04em;
  }

  .range-select {
    flex-shrink: 0;
  }

  @media (max-width: 767px) {
    margin-top: 22px;
    align-items: flex-start;
    flex-direction: column;

    .price-group .value {
      font-size: 18px;
    }

    .range-select {
      width: 100%;
      display: flex;
      justify-content: flex-start;
    }
  }
`;

export const CollectionHeaderPriceChange = styled.span<{ isPositive: boolean }>`
  font-size: 14px;
  line-height: 1.2;
  font-weight: var(--font-weight-semibold);
  color: ${({ isPositive }) => (isPositive ? "#00b894" : "#ff6b6b")};
`;

export const CollectionHeaderRange = styled.div`
  margin-top: 4px;
  height: 10px;
  width: 100%;
  border-radius: 999px;
  background: #edf3fb;
  overflow: hidden;
`;

export const CollectionHeaderRangeFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${({ percentage }) => `${Math.max(0, Math.min(100, percentage))}%`};
  border-radius: inherit;
  background: linear-gradient(90deg, #13d0b0 0%, #0dbd8f 100%);
`;

export const CollectionHeaderRangeMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 18px;
  font-size: 14px;
  line-height: 1.4;
  color: #7b88a8;

  strong {
    color: var(--main-black);
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 767px) {
    font-size: 13px;
  }
`;

export const CollectionHeaderSocialsRow = styled.div`
  margin-top: auto;
  padding-top: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  .socials {
    min-height: 24px;
    display: flex;
    align-items: center;
  }

  @media (max-width: 767px) {
    padding-top: 18px;
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const CollectionHeaderContractButton = styled.button`
  border: 1px solid rgba(123, 136, 168, 0.18);
  background: rgba(245, 248, 252, 0.9);
  color: #7081a7;
  border-radius: 14px;
  padding: 10px 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const CollectionHeaderMetricRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
`;

export const CollectionHeaderMetricLabel = styled.span`
  font-size: 15px;
  line-height: 1.35;
  color: #7b88a8;
`;

export const CollectionHeaderMetricValue = styled.span`
  font-size: 16px;
  line-height: 1.35;
  font-weight: var(--font-weight-semibold);
  color: var(--main-black);
  text-align: right;
`;
