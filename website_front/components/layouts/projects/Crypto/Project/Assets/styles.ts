import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 32px;
  width: 100%;

  h2 {
    margin: 0 0 16px;
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    line-height: 22px;
  }

  /* Swiper slider styles - only visible on mobile */
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

  @media (max-width: 575px) {
    margin-top: 24px;

    h2 {
      font-size: 20px;
      line-height: 24px;
    }
  }
`;
export const Assets = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  max-width: 100%;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f2f5;
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(115, 128, 148, 0.32);
    border-radius: 999px;
  }
`;

export const Asset = styled(BaseCard)`
  min-width: 260px;
  width: 100%;
  flex: 0 0 calc((100% - 48px) / 4);
  border-radius: 16px;
  scroll-snap-align: start;

  &.clickable {
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    &:hover {
      border-color: rgba(115, 128, 148, 0.18);
      box-shadow: rgba(0, 5, 48, 0.1) 2px 4px 12px 0;
      transform: translateY(-1px);
    }
  }

  @media (max-width: 991px) {
    /* In slider mode we want full width slides */
    .swiper-slide & {
      min-width: 100%;
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    min-width: 100%;
    flex: 0 0 100%;
  }
`;

export const ProjectData = styled.div`
  display: flex;
  gap: 8px;
  min-width: 0;

  & .info {
    min-width: 0;

    div {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      line-height: 17px;
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      display: block;
      margin-top: 3px;
      font-size: 12px;
      font-weight: var(--font-weight-semibold);
      line-height: 14px;
      color: var(--color-text-muted);
    }
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

export const PriceInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  & .value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17px;
    color: var(--color-text-primary);
    overflow-wrap: anywhere;
  }
`;
