import styled from "styled-components";
import BaseCard from "../../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  width: 100%;
`;

export const Row = styled.div`
  max-width: 100%;
  overflow: auto;
  display: flex;
  gap: 20px;

  /* Hide scrollbar for cleaner look */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  /* For slider mode */
  &.slider-row {
    overflow: visible;
  }
`;

export const Item = styled(BaseCard)`
  padding: 12px;
  min-width: 25%;

  @media (max-width: 1200px) {
    min-width: 33.33%;
  }

  @media (max-width: 991px) {
    min-width: 45%;
  }

  @media (max-width: 767px) {
    min-width: 80%;
  }

  @media (max-width: 575px) {
    min-width: 100%;
    padding: 10px;
  }

  /* For slider mode */
  .swiper-slide & {
    min-width: 100%;
    height: 100%;
  }

  & .header {
    display: flex;
    justify-content: space-between;
  }

  & .project {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  & .info {
    div {
      font-size: 12px;
      font-weight: var(--font-weight-semibold);
      color: var(--main-black);
    }

    span {
      font-size: 12px;
      font-weight: var(--font-weight-semibold);
      color: var(--main-gray);
    }
  }

  & .date {
    color: var(--color-text-secondary);
    background: var(--color-surface-subtle);
    border: 1px solid #eef2f6;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 10px;
    max-height: 17px;
  }

  & .bottom {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  & .bottom-row {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
  }

  & .value {
    font-weight: var(--font-weight-semibold);
  }
`;
