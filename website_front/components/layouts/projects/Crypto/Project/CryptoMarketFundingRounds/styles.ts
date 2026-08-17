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
`;

export const LeftColumn = styled.div`
  min-width: 400px;
  & .header {
    width: 100%;
    display: flex;
    align-items: center;
  }

  & .table {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    & .table-item {
      display: flex;
      align-items: center;
      gap: 8px;

      & .value{
        span{
          color: var(--main-black) !important;
          margin: 0;
        }
      }
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
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  max-width: 65%;
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
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 29.4px;
  color: var(--color-text-primary);
  margin: 0px 20px 0px 8px;
`;

export const Date = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17.15px;
  color: var(--color-text-primary);
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
  margin-top: 30px;
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
