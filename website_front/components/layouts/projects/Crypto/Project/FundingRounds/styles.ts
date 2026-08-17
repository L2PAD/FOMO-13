import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const Round = styled(BaseCard)`
  position: relative;
  width: 100%;
`;

export const RoundProgressWrapper = styled.div`
  position: absolute;
  top: 70px;
  left: 22px;
  width: 95%;
`;

export const RoundInfoWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 32px;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 24px;
  }
`;

export const LeftColumn = styled.div`
  flex: 1 1 560px;
  min-width: 0;
  max-width: 560px;

  & .header {
    width: 100%;
    display: flex;
    align-items: flex-start;
    column-gap: 12px;
    row-gap: 6px;
    flex-wrap: nowrap;

    svg {
      flex: 0 0 auto;
      margin-top: 4px;
    }
  }

  & .table {
    margin-top: 80px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    & .table-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  & .key {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 16.8px;
  }

  & .value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 16.8px;
  }

  & .project {
    display: flex;
    align-items: center;
    gap: 8px;

    img {
      width: 17px;
      height: 17px;
      object-fit: cover;
      border-radius: 50%;
    }

    span {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      line-height: 16.8px;
    }
  }

  @media (max-width: 900px) {
    flex-basis: auto;
    max-width: none;
    width: 100%;
  }
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex: 1 1 420px;
  min-width: 0;
  width: 100%;
  max-width: none;
  & .value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 16.8px;
  }
  & .key {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 16.8px;
  }
  & .table-item {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 38px;
  }
`;

export const Type = styled.div`
  flex: 0 1 auto;
  min-width: 0;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 29.4px;
  color: var(--color-text-primary);
  margin: 0;
  overflow-wrap: anywhere;
`;

export const Date = styled.div`
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17.15px;
  color: var(--color-text-primary);
  margin-top: 6px;
  white-space: nowrap;
`;

export const FundsRaised = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;

  div {
    color: var(--color-text-muted);
    font-size: 14px;
  }

  span {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
  }

  & .remove-btn {
    margin-left: 6px;
    width: 26px;
    height: 26px;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

export const InvestorInfo = styled.div`
  margin-top: 80px;
  span {
    font-size: 14px;
  }
  margin-left: auto;
  & .investor {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 13px;
    img {
      width: 17px;
      height: 17px;
      object-fit: cover;
      border-radius: 50%;
    }
  }
`;

export const StatisticsInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  margin-left: auto;
  gap: 20px;
`;

export const AddButtonWrapper = styled.div``;
