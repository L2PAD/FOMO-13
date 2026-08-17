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

export const FlexWrapper = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  overflow-x: auto;
`;

export const Table = styled(BaseCard)`
  width: 100%;
  padding: 0 !important;
  box-shadow: 4px 4px 10px 0px #eeeeee !important;
  border-radius: 16px !important;
  margin-top: 12px;
  min-height: 200px;

  .header {
    width: 100%;
    display: flex;
    background-color: #f5f9fd;
    color: var(--color-text-muted);
    font-size: 12px;
    padding: 10px;
    border-bottom: 1px solid #f5f9fd;
    border-radius: 16px 16px 0 0;
  }

  .row {
    width: 100%;
    display: flex;
    padding: 15px 10px;
    border-bottom: 1px solid #f5f9fd;
    font-size: 14px;
    align-items: center;
    p {
      font-weight: var(--font-weight-semibold);
    }

    .stats {
      p {
        background: var(--color-info);
        color: white;
        border-radius: 8px;
        font-size: 12px;
        padding: 4px 8px;
        width: max-content;
      }
    }

    @media (max-width: 600px) {
      padding: 10px;
    }
  }

  .header p,
  .row p {
    &:first-child {
      width: 290px;
      padding-left: 15px;
    }
    &:nth-child(2) {
      width: 290px;
    }
    &:nth-child(3) {
      width: 290px;
    }
  }
`;

export const Score = styled.div`
  margin-top: 12px;
  border: 2px solid #f5f9fd;
  border-radius: 16px;
  font-size: 14px;
  padding: 8px;
  margin-right: 20px;

  div {
    display: flex;
    padding: 4px;

    span {
      font-weight: var(--font-weight-regular);
      width: 120px;
      color: var(--color-text-primary);
    }

    p {
      font-weight: var(--font-weight-semibold);
    }

    .success {
      width: 6px;
      height: 6px;
      background: #05c9a1;
      border-radius: 50%;
    }
  }
`;
