import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const ItemsWrapper = styled.div`
  margin-top: 16px;
`;

export const ItemWrapper = styled(BaseCard)`
  width: 100%;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:last-child {
    margin-bottom: 16px;
  }
`;

export const ItemDataWrapper = styled.div`
  display: flex;
  gap: 10px;

  img {
    border-radius: 8px;
  }

  div {
    p {
      width: 150px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
    }
    span {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-muted);
    }
  }
`;

export const ItemPriceWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }

  button {
    border: none;
    background: none;
    padding: 0;
  }
`;

export const ResultWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 2px solid #f8f8f9;
  border-bottom: 2px solid #f8f8f9;
  margin-bottom: 5px;
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);

  & > div:last-child {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;

    p {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      text-align: right;
      color: var(--color-text-primary);
    }
    span {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      text-align: right;
    }
  }
`;
