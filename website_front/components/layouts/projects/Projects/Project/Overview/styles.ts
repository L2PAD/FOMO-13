import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import Typography from "../../../../../global/common/Typography";

export const GraphicWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 22px;
  width: 1204px;
  margin: 32px auto 0;

  @media (max-width: 1024px) {
    width: 100%;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    padding: 0 16px;
    gap: 2px;
  }
`;

export const Wrapper = styled(BaseCard)`
  @media (max-width: 768px) {
    width: 100% !important;
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
`;

export const GraphicRoiDataContentItem = styled(Typography)<{ amount: number }>`
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
