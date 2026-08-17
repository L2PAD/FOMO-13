import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div``;

export const TitleWrapper = styled.div`
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    margin-bottom: 20px;
  }
`;

export const Header = styled.div`
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
  }

  display: flex;
  gap: 20px;
  button {
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
  }
`;

export const Body = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;
`;

export const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  & .activity-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  & .activity-title {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-black);

    button {
      color: var(--main-green);
      font-weight: var(--font-weight-semibold);
    }
  }
  & .activity-date {
    font-size: 14px;
    color: var(--main-gray);
  }
  padding-top: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
  & .router-btn {
    transform: rotate(180deg);
  }
`;
