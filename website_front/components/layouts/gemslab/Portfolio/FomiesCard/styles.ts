import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  padding: 10px;
  background: #f5fbfd;
  border-radius: 12px;
  width: 100%;
  height: 100%;
`;

export const StatisticsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .statistics-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 100%;
    letter-spacing: 0%;
  }
`;

export const AddedInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  & .row-info {
    display: flex;
    justify-content: space-between;
    height: 17px;
  }

  div {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
  }

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-black);
  }

  & .rank {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 120%;
    color: var(--main-black);
  }
`;
