import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 12px;
  position: relative;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  @media (max-width: 575px) {
    gap: 14px;
  }

  /* When slider is active */
  &.slider-active {
    display: block;

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
  }
`;

export const ReverseButton = styled.button`
  margin-top: 44px;
  max-height: fit-content;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

export const ComparisonItem = styled.div`
  width: 48%;

  @media (max-width: 1024px) {
    width: 100%;
    max-width: 500px;
  }

  @media (max-width: 768px) {
    max-width: none;
  }

  &.swiper-slide {
    height: auto; /* Let the slide take the height it needs */
  }

  & .project-page-left {
    margin-right: 20px;

    @media (max-width: 1024px) {
      margin-right: 0;
    }
  }
  & .project-page-right {
    margin-left: 20px;

    @media (max-width: 1024px) {
      margin-left: 0;
    }
  }
`;

export const ProjectData = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;
  min-width: 0;
  border-radius: 16px;
  background: var(--color-white);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;

  @media (max-width: 575px) {
    margin-top: 12px;
    border-radius: 12px;
  }

  &.empty {
    min-height: 456px;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
  }

  & .name {
    margin: 84px 8px 0px 12px;
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    line-height: 29px;
    color: var(--color-text-primary);
    text-align: center;
  }

  &.empty .name {
    margin: 0 0 8px;
  }

  & .description {
    font-size: 16px;
    color: var(--color-text-muted);
    text-align: center;
  }

  @media (max-width: 575px) {
    &.empty {
      min-height: 240px;
      padding: 28px 16px;
    }
  }
`;

export const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  & .name {
    margin: 0px 8px 0px 12px;
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    line-height: 29px;
    color: var(--color-text-primary);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & .niche {
    font-size: 24px;
    line-height: 29px;
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    & .name {
      font-size: 20px;
      line-height: 24px;
    }
    & .niche {
      font-size: 20px;
      line-height: 24px;
    }
  }

  @media (max-width: 575px) {
    width: 100%;

    & .name {
      font-size: 18px;
      line-height: 22px;
    }
    & .niche {
      font-size: 18px;
      line-height: 22px;
    }
    img {
      width: 32px;
      height: 32px;
    }
  }
`;

export const ProjectBody = styled.div`
  margin: 20px 0px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 575px) {
    margin: 16px 0;
    gap: 12px;
  }
`;

export const ProjectRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  & .key {
    min-width: 0;
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 17px;
  }

  & .value {
    display: flex;
    justify-content: flex-end;
    min-width: 0;
    font-size: 15px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    color: var(--color-text-primary);
    text-align: right;
    overflow-wrap: anywhere;
  }

  & .empty-value {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
  }

  & .comparison-placeholder {
    margin-left: 8px;
    font-size: 14px;
  }

  & .investors {
    display: flex;
    gap: 12px;

    img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      object-fit: cover;
    }
  }

  @media (max-width: 767px) {
    & .key,
    & .value {
      font-size: 14px;
    }
  }

  @media (max-width: 575px) {
    & .key,
    & .value {
      font-size: 13px;
    }
    & .investors {
      gap: 8px;
    }
  }
`;

export const ChartWrapper = styled.div`
  max-width: 180px;

  & .title {
    font-size: 10px !important;
    color: var(--color-text-secondary);
  }
  & .value {
    font-size: 16px !important;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }

  & .project-value {
    font-size: 10px !important;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
  }

  @media (max-width: 575px) {
    width: 100%;
    max-width: 220px;
    align-self: center;
  }
`;

export const ProjectBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  &.empty {
    justify-content: center;
    min-height: 210px;
  }

  & .empty-section-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  & .key {
    color: var(--color-text-muted);
    font-size: 16px;
    margin-bottom: 20px;
  }

  @media (max-width: 575px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    & .key {
      font-size: 14px;
      margin-bottom: 8px;
    }
  }
`;

export const PieValuesPercentageWrapper = styled.div`
  margin-top: 26px;

  p {
    justify-content: end;
    font-size: 10px;

    i {
      width: 12px;
      height: 12px;
    }
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const MobileSwapButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--color-surface-subtle);
  color: var(--color-text-secondary);
  border: 1px solid #eef2f6;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  margin: 12px auto 20px;

  svg {
    transform: rotate(90deg);
  }

  @media (max-width: 1024px) {
    display: flex;
  }
`;
