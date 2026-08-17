import styled from "styled-components";
import BaseCard from "../../../global/common/BaseCard";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 0 auto;
  margin-top: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const DataWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
`;

export const SearchWrapper = styled.div`
  width: 400px;
`;

export const CardsWrapper = styled.div`
  display: flex;
  gap: 72px;
  width: 700px;
  margin-top: 16px;
`;

export const DataCard = styled.div`
  background: var(--color-primary)12;
  border-radius: 10px;
  padding: 20px;
  width: 100%;
  color: #596271;

  & > div {
    display: flex;
    gap: 16px;
    justify-content: space-between;
  }

  p {
    margin-bottom: 8px;
  }
`;

export const Table = styled(BaseCard)`
  width: 100%;

  .table {
    font-size: 12px;
    margin: -16px;
  }

  .header {
    display: flex;
    gap: 16px;
    background: var(--color-text-muted)0d;
    padding: 6px 16px;
    color: var(--color-text-muted);

    p:first-child {
      width: 300px;
    }
  }

  .row {
    display: flex;
    gap: 16px;
    padding: 10px 0;
    margin: 0 16px;
    border-bottom: 1px solid var(--color-text-muted);

    b:first-child {
      width: 300px;
    }

    & > div {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .line {
      width: 800px;
      height: 8px;
      border-radius: 8px;
      background: #277ad21a;

      .fill {
        height: 8px;
        border-radius: 8px;
        background: #277ad2;
      }
    }
  }
`;

export const Card = styled(BaseCard)`
  width: 100%;

  p,
  b {
    font-size: 18px;
  }

  span {
    font-size: 14px;
    color: var(--color-text-muted);
    line-height: 30px;
  }

  .green {
    color: var(--color-primary);
  }

  .b-line {
    width: 100%;
    border-bottom: 2px solid var(--color-text-primary);
    margin: 16px 0;
  }
  .line {
    width: 100%;
    border-bottom: 1px solid var(--color-text-muted);
    margin: 16px 0;
  }

  .flex {
    display: flex;
    gap: 16px;
    justify-content: space-between;
  }

  .button {
    background: var(--color-primary);
    color: var(--color-white);
    width: max-content;
    padding: 6px 16px;
    border-radius: 99px;
    margin-top: 12px;
    cursor: pointer;
  }

  .pagination {
    * {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
  }
`;

export const UpcomingCard = styled(Card)`
  max-width: 780px;
`;
