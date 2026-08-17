import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const Wrapper = styled.div`
  min-width: 100%;
`;

export const SliderContainer = styled.div`
  width: 100%;
  min-width: 0;
  position: relative;

  /* Swiper styles */
  .swiper {
    width: 100%;
    padding-bottom: 40px; /* Space for pagination */
  }

  .swiper-pagination {
    bottom: 0;
  }

  .swiper-pagination-bullet {
    background: var(--color-text-muted);
    opacity: 0.5;
  }

  .swiper-pagination-bullet-active {
    background: var(--color-primary);
    opacity: 1;
  }

  @media (max-width: 768px) {
    .swiper {
      padding-bottom: 30px;
    }

    /* Hide swiper on mobile and stack content instead */
    &.stack-on-mobile .swiper {
      display: none;
    }

    &.stack-on-mobile .mobile-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;

      & > div {
        padding: 0;
      }
    }
  }
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

    @media (max-width: 768px) {
      font-size: 15px;
    }
  }
`;

export const Body = styled.div`
  height: 100%;

  @media (max-width: 768px) {
    margin-top: 6px;
  }
`;

export const ActivityItem = styled.div`
  display: grid;
  align-items: center;
  gap: 20px;
  grid-template-columns: 2fr 3.6fr 0.7fr 0.8fr;
  position: relative;

  padding: 0px 0 10px 0px;

  &.clickable {
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--main-green);
      outline-offset: 2px;
      border-radius: 6px;
    }
  }

  @media (max-width: 1024px) {
    gap: 16px;
    grid-template-columns: 2fr 3fr 0.8fr 1fr;
    padding: 8px 0;
  }

  @media (max-width: 768px) {
    gap: 12px;
    grid-template-columns: 1fr;
    padding: 12px 0;
  }

  & .text {
    font-size: 14px;
    color: var(--main-black);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;

    p {
      margin: 0;
    }

    @media (max-width: 768px) {
      font-size: 14px;
      grid-row: 2;
      grid-column: 1 / -1;
      margin-top: 4px;
    }
  }

  & .users {
    display:flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    @media (max-width: 768px) {
      grid-row: 3;
      grid-column: 1;
      justify-self: start;
    }

    & .value {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      color: var(--main-black);

      @media (max-width: 768px) {
        font-size: 15px;
      }
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

    @media (max-width: 768px) {
      position: absolute;
      top: 16px;
      right: 0;
    }

    &:hover {
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      background: #e9f8f8;
      z-index: 10;
    }
  }
`;
