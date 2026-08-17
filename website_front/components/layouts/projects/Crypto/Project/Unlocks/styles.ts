import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  width: 100%;

  .unlocks-section-title {
    margin-bottom: 16px;
  }

  @media (max-width: 991px) {
    overflow-x: hidden;
  }

  @media (max-width: 575px) {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .unlocks-section-title {
      width: 100%;
      justify-content: flex-start;
      margin-bottom: 12px;
    }
  }
`;

export const TokenDistribution = styled(BaseCard)`
  display: grid;
  grid-template-columns: 0.5fr 1fr;
  justify-content: space-between;
  gap: 40px;
  width: 100%;
  overflow-x: auto;

  @media (max-width: 991px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  @media (max-width: 575px) {
    gap: 16px;
  }

  @media (max-width: 768px) {
    .table {
      display: none;
    }
  }
`;

export const PieWrapper = styled.div`
  max-width: fit-content;
  margin: 0 auto;

  @media (max-width: 575px) {
    transform: scale(0.9);
    margin-top: -20px;
  }
`;

export const Table = styled.div`
  min-width: 400px;

  .sticky {
    position: sticky;
    left: -1px;
    z-index: 4;
    background: var(--color-white);
    box-shadow: 1px 0 0 #eee;
  }

  .token-distribution {
    overflow: visible !important;
  }
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.9fr 1fr 1fr;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17.15px;
  color: var(--main-gray);
  padding: 15px 10px;

  @media (max-width: 575px) {
    font-size: 13px;
    padding: 12px 8px;
  }
`;

export const SliderWrapper = styled.div`
  .swiper {
    padding-bottom: 40px;
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
`;
