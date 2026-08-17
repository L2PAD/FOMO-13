import styled from "styled-components";

export const TabsWrapper = styled.div`
  max-width: 100%;
  display: flex;
  border-bottom: 2px solid #f8f8f9;
  /* Enable horizontal scroll when tabs overflow */
  overflow-x: auto;
  overflow-y: hidden;
  flex-wrap: nowrap;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  &::-webkit-scrollbar {
    /* Chrome, Safari */
    display: none;
  }

  &.p2p-tabs {
    max-width: 80%;

    @media (max-width: 1024px) {
      max-width: 100%;
    }
  }

  & .description-btn {
    display: flex;
    height: 13px;

    @media (max-width: 768px) {
      height: 12px;
    }
  }
  & .fav-tab {
    padding: 8px 12px 10px;

    @media (max-width: 768px) {
      padding: 8px 10px;
    }
    @media (max-width: 480px) {
      padding: 6px 8px;
    }
  }
  & .fav-tab.active {
    border-bottom: 2px solid var(--color-primary);
  }

  &.project-page div {
    width: 100%;
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    text-align: center;

    @media (max-width: 768px) {
      font-size: 20px;
    }
    @media (max-width: 480px) {
      font-size: 18px;
    }
  }

  &.main {
    border-bottom: 0px;
    padding: 4px;
    border-radius: 8px;
    background: #f9f9f9;
    justify-content: center;
    gap: 4px;

    /* Allow scroll and left align on smaller screens */
    @media (max-width: 1024px) {
      justify-content: flex-start;
      gap: 6px;
    }

    & .tab {
      width: 100%;
      border: none !important;
      padding: 10px 20px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 18px;
      color: var(--main-gray);
      transition: all 0.3s ease;
      width: 182px;
      text-align: center;
      white-space: nowrap;

      @media (max-width: 1024px) {
        width: auto;
        min-width: 160px;
        padding: 10px 16px;
      }
      @media (max-width: 768px) {
        min-width: 140px;
        padding: 8px 14px;
        font-size: 13px;
      }
      @media (max-width: 480px) {
        min-width: 0;
        padding: 8px 12px;
        font-size: 12px;
      }

      &:hover {
        opacity: 0.8;
      }

      &.active {
        background: var(--color-white);
        color: var(--color-primary);
      }
    }
  }
  &.secondary {
    border-bottom: 0px;
    padding: 4px;
    border-radius: 8px;
    background: #f9f9f9;
    justify-content: center;
    gap: 4px;

    @media (max-width: 1024px) {
      justify-content: flex-start;
      gap: 6px;
    }

    & .tab {
      width: 100%;
      border: none !important;
      padding: 10px 20px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 18px;
      color: var(--main-black);
      transition: all 0.3s ease;
      width: 182px;
      text-align: center;
      white-space: nowrap;

      @media (max-width: 1024px) {
        width: auto;
        min-width: 160px;
        padding: 10px 16px;
      }
      @media (max-width: 768px) {
        min-width: 140px;
        padding: 8px 14px;
        font-size: 13px;
      }
      @media (max-width: 480px) {
        min-width: 0;
        padding: 8px 12px;
        font-size: 12px;
      }

      &:hover {
        opacity: 0.8;
      }

      &.active {
        background: #f5fbfd;
        color: var(--main-green);
      }
    }
  }

  &.big {
    & .tab {
      width: 100%;
      padding: 12px 20px;
      font-weight: var(--font-weight-semibold);
      font-size: 24px;
      line-height: 100%;
      color: var(--main-gray);
      transition: color 0.3s ease;
      text-align: center;
      white-space: nowrap;

      @media (max-width: 1024px) {
        font-size: 20px;
        padding: 10px 18px;
      }
      @media (max-width: 768px) {
        font-size: 18px;
        padding: 10px 16px;
      }
      @media (max-width: 480px) {
        font-size: 16px;
        padding: 8px 14px;
      }

      &:hover {
        opacity: 0.8;
      }

      &.active {
        background: var(--color-white);
        color: var(--main-black);
      }
    }
  }
`;
