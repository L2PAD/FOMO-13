import styled from "styled-components";

export const Wrapper = styled.div`
  margin-top: 40px;
`;

export const Header = styled.div`
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    flex-shrink: 0;
  }

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    h2 {
      font-size: 20px;
      line-height: 24px;
    }
  }

  & .buttons {
    display: flex;
    gap: 20px;
    flex-wrap: nowrap;
    overflow-x: auto;
    max-width: 100%;

    @media (max-width: 768px) {
      width: 100%;
      gap: 6px;
    }

    button {
      width: max-content;
      background: none;
      border: none;
      display: flex;
      gap: 6px;
      align-items: center;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      padding: 10px 12px;
      border-radius: 8px;
      background: #f9f9f9;
      transition: all 0.3s ease;
      color: var(--main-gray);

      &.selectedSort {
        color: #29a87c;
        background: #f5fbfd !important;
      }
      &:hover {
        background: var(--input-hover);
      }
      &:active {
        background: var(--input-active);
      }

      span {
        white-space: nowrap;
      }
    }
  }
`;

export const Body = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Item = styled.div`
  position: relative;
  max-width: 100%;
  padding: 20px;
  @media (max-width: 640px) {
    padding: 16px 16px 18px;
    .border {
      height: 100%;
    }
  }
  & .border {
    position: absolute;
    top: 0;
    left: 0;
    height: 120px;
    width: 3px;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }
`;

export const ItemInfo = styled.div`
  & .xp-info {
    font-weight: var(--font-weight-regular);
    font-size: 10px;
    line-height: 12px;
  }

  & .item-description {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 150%;
  }
`;

export const MiddleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 14px;
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    .claim-btn {
      width: 100%;
      font-size: 12px;
      padding: 8px;
    }
  }

  & .claim-btn {
    font-size: 10px;
    border-radius: 4px;
    padding: 6px;
    width: 120px;
  }
`;
