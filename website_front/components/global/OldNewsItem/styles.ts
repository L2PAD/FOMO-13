import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const ParsingItem = styled(BaseCard)`
  border-bottom: 1px solid #f0f2f5;
  padding: 20px;
  width: 100%;
  position: relative;


  @media (max-width: 768px) {
    padding: 16px;

    &:first-child {
      padding-top: 16px;
    }
  }

  & .tweet-creator {
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    span {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      color: var(--main-gray);
    }

    p {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      color: var(--main-gray);
    }
  }

  & .tweet-title-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
  }

  & .title-right-wrapper {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  & .title-category {
    background: #e9f8f8;
    padding: 4px 10px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    border-radius: 6px;
    color: var(--main-green);
  }

  & .tweet-title {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    margin-bottom: 20px;

    @media (max-width: 768px) {
      margin-bottom: 0;
      width: calc(100% - 30px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  @media (max-width: 768px) {
    & .open-btn {
      position: absolute;
      right: 16px;
      top: 16px;
    }
  }

  & .tweet {
    font-size: 14px;
    color: var(--main-black);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .tweet-wrapper {
    display: grid;
    grid-template-columns: 7.1fr 1.5fr;
    justify-content: space-between;
  }

  & .tweet-date {
    max-width: fit-content;
    margin-left: auto;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-gray);
  }
`;
