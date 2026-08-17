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

export const TitleWrapper = styled.div`
  text-align: center;
`;

export const LeaderboardDetails = styled.div`
  margin-bottom: 20px;
  margin-left: 20px;
`;

export const LeaderboardDetailsTitle = styled.div`
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  margin-bottom: 12px;
  color: var(--color-text-primary);
`;

export const LeaderboardDetailsDescription = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  color: #131316;

  & span {
    color: var(--color-primary);
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

  .header {
    width: 100%;
    display: grid;
    grid-template-columns: 0.6fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1fr 1fr;
    background-color: #f5f9fd;
    color: black;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    padding: 12px 20px;
    border-bottom: 1px solid #f5f9fd;
    border-radius: 16px 16px 0 0;
  }

  .row {
    width: 100%;
    display: grid;
    grid-template-columns: 0.6fr 1.1fr 1fr 1fr 1fr 1fr 1.5fr 1fr 1fr;
    padding: 15px 20px;
    border-bottom: 1px solid #f5f9fd;
    font-size: 14px;
    align-items: center;
    p {
      color: #131316;
      font-size: 14px;
    }
    p:first-child {
      color: black;
      font-weight: var(--font-weight-semibold);
      padding-left: 10px;
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
