import styled from "styled-components";
import BaseCard from "../common/BaseCard";
import Typography from "../common/Typography";

export const CardWrapper = styled(BaseCard)`
  width: 100%;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #f5fbfd;
  box-shadow: none;
  border: none;
  min-height: 180px;

  @media (max-width: 768px) {
    padding: 16px 12px;
    min-height: 160px;
  }

  @media (max-width: 480px) {
    padding: 12px 10px;
    min-height: 140px;
  }

  &:hover {
    background: rgb(241, 248, 250);
  }
  &:active {
    opacity: 0.9;
  }
  .buttons {
    display: none;
    width: 100%;
    padding-top: 12px;
    gap: 12px;
    margin-bottom: -10px;

    @media (max-width: 768px) {
      gap: 8px;
      padding-top: 8px;
    }

    button {
      width: 100%;

      &.secondary {
        background-color: var(--color-primary)1a;
        color: var(--color-primary);
      }
    }
  }
`;
export const HeaderWrapper = styled.div`
  display: flex;
  margin-bottom: 6px;
  gap: 20px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 16px;
    margin-bottom: 5px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin-bottom: 4px;
  }
`;

export const HeaderInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: calc(100% - 80px);

  @media (max-width: 768px) {
    flex: 1;
    min-width: 0;
  }
`;

export const HeaderTagWrapper = styled.div`
  margin: 4px 0;
  display: flex;
  gap: 4px;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 14px;

  @media (max-width: 768px) {
    font-size: 13px;
    margin: 3px 0;
    gap: 3px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    margin: 2px 0;
    gap: 2px;
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
  gap: 4px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 3px;
  }

  @media (max-width: 480px) {
    gap: 2px;
  }
`;

export const TitleText = styled(Typography)`
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 29px;
  color: var(--color-text-primary);

  @media (max-width: 768px) {
    font-size: 18px;
    line-height: 26px;
  }

  @media (max-width: 480px) {
    font-size: 16px;
    line-height: 22px;
  }
`;

export const FullTitle = styled(Typography)`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 29px;
  color: var(--color-text-primary);
  width: 139px;

  @media (max-width: 768px) {
    font-size: 22px;
    line-height: 26px;
    width: 120px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
    line-height: 22px;
    width: 100px;
  }
`;

const getScoreColor = (value?: number | null) => {
  if (value === undefined) return "var(--color-primary)";
  if (!value) return "var(--color-text-muted)";
  if (value >= 70) return "var(--color-primary)";
  if (value >= 40) return "var(--color-warning)";
  return "var(--color-danger)";
};

export const PercentText = styled.span<{ $score?: number | null }>`
  margin-left: auto;
  color: ${({ $score }) => getScoreColor($score)} !important;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 20px;

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 18px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    line-height: 16px;
  }
`;

export const DescriptionWrapper = styled.div`
  margin-top: 2px;
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    gap: 4px;
  }

  @media (max-width: 480px) {
    gap: 3px;
    flex-wrap: wrap;
  }
`;

export const DescriptionText = styled(Typography)`
  font-size: 14px;
  line-height: 16px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 15px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    line-height: 14px;
  }
`;

export const BodyWrapper = styled.div`
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  gap: 8px;

  @media (max-width: 768px) {
    margin-bottom: 12px;
    gap: 6px;
  }

  @media (max-width: 480px) {
    margin-bottom: 10px;
    gap: 4px;
    flex-wrap: wrap;
  }
`;

export const InvestorsWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 4px;
  }

  @media (max-width: 480px) {
    gap: 3px;
  }

  span {
    color: var(--color-text-muted);
    font-size: 14px;
    margin-right: 2px;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
`;

export const InvestorsText = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 16px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    line-height: 14px;
  }

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }
`;

export const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 6px;
  }

  @media (max-width: 480px) {
    gap: 4px;
    flex-wrap: wrap;
  }
`;

export const FooterItem = styled(Typography)`
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 15px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    line-height: 14px;
    flex: none;
    min-width: calc(50% - 2px);
  }

  span {
    display: block;
    margin-top: 2px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const Region = styled.div`
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16px;
  text-align: left;

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 15px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    line-height: 14px;
  }
`;

export const RedFlagsWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 4px;

  @media (max-width: 768px) {
    margin-left: 3px;
  }

  @media (max-width: 480px) {
    margin-left: 2px;
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
  padding: 4px 6px;
  width: max-content;
  display: flex;
  flex-direction: column;
  align-items: end;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 3px 5px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
    padding: 2px 4px;
  }
`;
