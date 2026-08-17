import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const SliderContainer = styled.div`
  max-width: 100%;
  overflow-x: auto;
  display: flex;
  gap: 20px;

  /* WebKit (Chrome, Safari) */
  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
`;

export const Wrapper = styled(BaseCard)`
  min-width: 100%;
  max-height: 360px;
  overflow: hidden;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    color: #1e1e1e;
  }
`;

export const Body = styled.div`
  height: 100%;
`;

export const ActivityItem = styled.div`
  display: grid;
  align-items: center;
  gap: 20px;
  grid-template-columns: 2fr 3.6fr 0.7fr 0.8fr;

  padding: 10px 0;

  & .text {
    font-size: 14px;
    color: var(--main-black);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
  }

  & .users {
    & .value {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      color: var(--main-black);
    }
    margin-right: 10px;
  }

  & .tag {
    font-size: 12px;
    color: var(--main-green);
    padding: 5px;
    border-radius: 6px;
    background: #e9f8f8;
    text-align: center;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;

    position: relative;
    z-index: 1;

    &:hover {
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      background: #e9f8f8;
      z-index: 10;
    }
  }
`;
