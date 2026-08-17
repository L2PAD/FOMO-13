import BaseCard from "../../../../global/common/BaseCard";
import PercentValue from "../../../../global/common/PercentValue";
import styled from "styled-components";
import { CardValue } from "../../../projects/Crypto/Project/ProjectPriceStatistics/styles";

export const Wrapper = styled(BaseCard)`
  width: 100%;

  display: flex;
  flex-direction: column;
  gap: 20px;
  height: fit-content;
`;

export const DashboardWrapper = styled.div`
  width: 35%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 1100px) {
    width: 100%;
  }
`;

export const Row = styled.div<{ $isMuted?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  & .values {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  & .value {
    text-align: right;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 16.8px;
    color: ${({ $isMuted }) =>
      $isMuted ? "var(--main-gray)" : "var(--main-black)"};

    &.green {
      color: ${({ $isMuted }) =>
        $isMuted ? "var(--main-gray)" : "var(--color-primary)"};
      font-weight: var(--font-weight-regular);
    }

    &.red {
      color: ${({ $isMuted }) =>
        $isMuted ? "var(--main-gray)" : "var(--color-danger)"};
      font-weight: var(--font-weight-regular);
    }
  }
`;

export const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  & .item-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  & .project {
    padding: 10px 0px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  & .project-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    div {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17.15px;
    }

    span {
      font-size: 10px;
      color: var(--main-gray);
    }
  }

  & .values {
    display: flex;
    flex-direction: column;
    gap: 4px;

    text-align: right;
  }
`;

export const InfoWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;

  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17.15px;
  color: var(--color-text-muted);

  button {
    padding: 0px;
    line-height: 0px;
  }
`;

export const DescriptionWrapper = styled.div`
  position: absolute;
  top: 23px;

  & .small-modal {
    position: relative;
    z-index: 10;
    padding: 10px;
    width: 260px;
    div {
      font-size: 12px;
      line-height: 16.8px;
      color: var(--main-gray);
    }
  }
`;

export const DashboardCardValue = styled(CardValue)<{ $isMuted?: boolean }>`
  && > div {
    color: ${({ $isMuted }) => ($isMuted ? "var(--main-gray)" : "var(--color-text-primary)")};
  }
`;

export const DashboardPercentValue = styled(PercentValue)<{
  $isMuted?: boolean;
  $value?: number;
}>`
  && span {
    color: ${({ $isMuted, $value }) => {
      if ($isMuted) return "var(--main-gray)";
      if (typeof $value === "number" && $value > 0) {
        return "var(--main-green)";
      }
      if (typeof $value === "number" && $value < 0) {
        return "var(--main-red)";
      }

      return "var(--main-black)";
    }};
  }
`;

export const PerformancePlaceholder = styled.span<{ $isMuted?: boolean }>`
  color: ${({ $isMuted }) =>
    $isMuted ? "var(--main-gray)" : "var(--main-black)"};
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 16.8px;
`;
