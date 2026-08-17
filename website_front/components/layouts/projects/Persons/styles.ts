import styled from "styled-components";
import Link from "next/link";
import PersonCard from "../../../global/PersonCard";
import BaseCard from "../../../global/common/BaseCard";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 0 auto;
  margin-top: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const CardsWrapper = styled.div`
  display: grid;
  margin-top: 16px;
  grid-template-columns: repeat(5, 1fr);

  @media (max-width: 1450px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 1180px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 550px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

export const CardWrapper = styled(PersonCard)``;

export const CardLinkWrapper = styled(Link)`
  margin: 5px;
  width: calc(100% / 3 - 12px);
  height: 220px;

  @media (max-width: 768px) {
    height: fit-content;
    margin: 4px;
    width: 100%;
  }

  @media (max-width: 480px) {
    margin: 3px;
  }

  &.project-page {
    margin: 0px;
    width: 48.6%;

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  & > div {
    width: 100%;
    height: 100%;
  }
`;

export const MainInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
  margin-bottom: 20px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 24px;
  }

  @media (max-width: 768px) {
    gap: 20px;
  }
`;

export const MainInfoDescription = styled.div`
  flex: 1;
  max-width: 50%;

  @media (max-width: 1024px) {
    max-width: 100%;
  }

  .main-title {
    font-size: 32px;
    font-weight: var(--font-weight-semibold);
    line-height: 38px;
    color: var(--color-text-primary);
    margin-bottom: 16px;

    @media (max-width: 768px) {
      font-size: 28px;
      line-height: 32px;
      margin-bottom: 12px;
    }

    @media (max-width: 480px) {
      font-size: 24px;
      line-height: 28px;
      margin-bottom: 10px;
    }
  }

  p {
    font-size: 16px;
    line-height: 24px;
    color: var(--color-text-muted);

    @media (max-width: 768px) {
      font-size: 15px;
      line-height: 22px;
    }

    @media (max-width: 480px) {
      font-size: 14px;
      line-height: 20px;
    }
  }
`;

export const ChartsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;

  & > div:first-child {
    flex: 1 1 70%;
  }

  & > div:last-child {
    flex: 1 1 30%;
  }

  @media (max-width: 1155px) {
    & > div:first-child,
    & > div:last-child {
      flex: 1 1 50%;
      max-width: 50%;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    & > div:first-child,
    & > div:last-child {
      flex: 1 1 100%;
      max-width: 100%;
    }

    overflow: visible;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

export const TableGridBtn = styled.button<{ isActive: boolean }>`
  background: transparent !important;
  padding: 8px !important;
  transition: all 0.3s ease;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;

  @media (max-width: 768px) {
    min-width: 36px;
    min-height: 36px;
    padding: 6px !important;
  }

  @media (max-width: 480px) {
    min-width: 36px;
    min-height: 36px;
    padding: 4px !important;
  }

  svg {
    width: 20px;
    height: 20px;

    @media (max-width: 768px) {
      width: 18px;
      height: 18px;
    }

    @media (max-width: 480px) {
      width: 16px;
      height: 16px;
    }

    path {
      stroke: ${({ isActive }) =>
        isActive ? "var(--color-primary)" : "var(--color-text-muted)"};
    }
  }

  &:hover {
    opacity: 0.7;
    background: var(--color-primary-soft) !important;
  }

  &:active {
    opacity: 0.5;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
  color: var(--color-text-primary);
  margin: 40px 0 20px;

  @media (max-width: 768px) {
    font-size: 22px;
    line-height: 26px;
    margin: 32px 0 16px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
    line-height: 24px;
    margin: 24px 0 12px;
  }
`;

export const PieContentWrapper = styled(BaseCard)`
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }

  & h3 {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    align-self: flex-start;
    margin-bottom: 20px;

    @media (max-width: 768px) {
      font-size: 15px;
      margin-bottom: 16px;
    }

    @media (max-width: 480px) {
      font-size: 14px;
      margin-bottom: 12px;
    }
  }
`;
