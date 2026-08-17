import styled from "styled-components";
import BaseCard from "../common/BaseCard";
import Typography from "../common/Typography";

export const CardWrapper = styled(BaseCard)<{
  gradientBorderType?: "upcoming" | "active";
}>`
  width: 289px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #f5fbfd;
  box-shadow: none;
  border: none;
  position: relative;

  ${({ gradientBorderType }) =>
    gradientBorderType &&
    `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 8px;
      padding: 1px;
      background: linear-gradient(128deg, 
        ${
          gradientBorderType === "upcoming"
            ? "var(--color-danger), var(--color-white), var(--color-white), var(--color-white), var(--color-white), var(--color-danger)"
            : "var(--color-primary), var(--color-white), var(--color-white), var(--color-white), var(--color-white), var(--color-primary)"
        });
      -webkit-mask: linear-gradient(var(--color-white) 0 0) content-box, linear-gradient(var(--color-white) 0 0);
      -webkit-mask-composite: subtract;
      mask: linear-gradient(var(--color-white) 0 0) content-box, linear-gradient(var(--color-white) 0 0);
      mask-composite: subtract;
      pointer-events: none;
    }
  `}

  &:hover {
    background: rgb(241, 248, 250);
  }
  &:active {
    opacity: 0.9;
  }

  &.market-card {
    width: 100%;
  }
  .buttons {
    width: 100%;
    padding-top: 12px;
    gap: 12px;
    margin-bottom: -10px;

    button {
      width: 100%;
      font-size: 12px;
      font-weight: var(--font-weight-medium);

      &.secondary {
        background-color: transparent;
        color: var(--color-primary);
        font-weight: var(--font-weight-regular);
        border: 1px solid var(--color-primary);
      }
    }
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;
export const HeaderWrapper = styled.div`
  display: flex;
  margin-bottom: 6px;
  gap: 20px;
  align-items: center;

  &.market-card-header {
    margin-bottom: 12px;
  }
`;
export const HeaderInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: calc(100% - 62px);

  &.market-header-info {
    width: fit-content;
    flex: 1;
    min-width: 0;
  }
`;
export const HeaderTagWrapper = styled.div`
  margin: 12px 0;
  display: flex;
  gap: 4px;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 14px;

  &.ico-description-tag {
    flex: 0 1 50%;
    width: 50%;
    max-width: 50%;
    min-width: 0;
  }

  &.ico-description-tag p {
    display: block;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.market-card-tag {
    margin: 0;
  }
`;
export const HeaderPrice = styled(Typography)`
  color: var(--color-text-primary);
  font-size: 12px;
  line-height: 14px;
  font-weight: var(--font-weight-medium);

  span {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-regular);
  }
`;
export const HeaderCircle = styled.div`
  min-width: 20px;
  max-width: 20px;
  min-height: 20px;
  border-radius: 16px;
  background: rgba(115, 128, 148, 0.5);
`;
export const TitleWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;
export const TitleText = styled(Typography)`
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 29px;
  color: var(--color-text-primary);
`;
export const FullTitle = styled(Typography)`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 29px;
  color: var(--color-text-primary);
  width: 139px;
`;
export const PercentText = styled.span`
  margin-left: auto;
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 20px;
`;
export const DescriptionWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: space-between;
`;
export const InvestorsImages = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  .investor-avatar:not(:first-child) {
    margin-left: -8px;
  }
`;
export const DescriptionText = styled(Typography)`
  font-size: 14px;
  line-height: 16px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
`;
export const BodyWrapper = styled.div`
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`;
export const InvestorsWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;

  span {
    color: var(--color-text-muted);
    font-size: 14px;
    margin-right: 2px;
  }
`;
export const InvestorsText = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }

  .badge {
    height: 18px;
    padding: 2px 4px;
    width: fit-content;
    background: #e9f8f8;
    border: 2px solid var(--color-white);
    border-radius: 50px;
    font-size: 12px;
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -10px;
    z-index: 1;
    position: relative;
  }
`;
export const Footer = styled.div`
  display: flex;
  justify-content: space-between;
`;
export const FooterItem = styled(Typography)`
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16px;

  span {
    display: block;
    margin-top: 2px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;
export const ResultWrapper = styled.div`
  margin-top: 13px;
  display: flex;
  gap: 15px;
`;

export const RefundWrapper = styled.div`
  margin-top: 16px;
  text-align: center;
  font-weight: var(--font-weight-semibold);
  color: rgb(206, 3, 3);
  font-size: 16px;
`;

export const ResultItem = styled(Typography)<{ amount?: number }>`
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: 14px;

  span {
    color: ${({ amount }) =>
      amount || 0 < 1
        ? "var(--color-danger)"
        : amount || (0 > 1 && amount) || 0 < 2
          ? "var(--color-text-primary)"
          : "var(--color-primary)"};
    font-weight: var(--font-weight-semibold);
  }
`;

export const AllocSize = styled.div`
  background: rgba(5, 201, 161, 0.05);
  color: rgba(5, 201, 161);
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 14px;
  border-radius: 8px;
  padding: 4px 16px;
  width: max-content;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-width: 113px;
`;

export const RedFlagsWrapper = styled.div`
  margin-left: 20px;
`;
