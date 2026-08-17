import styled from "styled-components";
import BaseCard from "../../common/BaseCard";

export const TableWrapper = styled.div`
  /* overflow-x: auto;
  padding-right: 10px; */
`;
export const CardsWrapper = styled.div`
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 1190px;
`;
export const CardWrapper = styled(BaseCard)`
  width: 1190px;
  align-items: center;
  display: flex;
  padding: 16px;
  cursor: pointer;
`;
export const ProjectWrapper = styled.div`
  width: 205px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const StatusWrapper = styled.div`
  width: 275px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const InvestorsWrapper = styled.div`
  width: 142px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
`;
export const TotalRaisedWrapper = styled.div`
  width: 448px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
`;
export const LastFundingWrapper = styled.div`
  width: auto;

  button {
    background: var(--color-primary-soft);
    border-radius: 8px;
    padding: 8px 10px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    border: none;
    color: var(--color-primary);
  }
`;
