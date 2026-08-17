import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16.5px;

  padding: 10px;
  background: #f5fbfd;
  border-radius: 12px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  position: relative;

  @media (max-width: 1024px) {
    min-width: 260px;
  }

  @media (max-width: 768px) {
    gap: 14px;
    padding: 8px;
    min-width: 240px;
    padding: 24px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    min-width: 210px;
  }
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

  @media (max-width: 768px) {
    width: fit-content;
    position: absolute;
    top: 24px;
    right: 16px;
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
    @media (max-width: 768px) {
      height: 16px;
    }
    @media (max-width: 480px) {
      height: 15px;
    }
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
`;
