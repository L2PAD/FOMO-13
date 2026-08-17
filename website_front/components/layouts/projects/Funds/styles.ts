import styled from "styled-components";
import Link from "next/link";
import PersonCard from "../../../global/PersonCard";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 0 auto;
  margin-top: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }

  .chart {
    display: block;
    width: 100%;
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
`;

export const NewsWrapepr = styled.div``;

export const NewsTitle = styled.div`
  font-size: 24px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin: 0px 0 20px;

  @media (max-width: 768px) {
    font-size: 22px;
    margin: 0px 0 16px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
    margin: 0px 0 12px;
  }
`;

export const ChartsWrapper = styled.div`
  max-width: 100%;
  margin: 40px 0px;

  @media (max-width: 768px) {
    margin: 30px 0px;
  }

  @media (max-width: 480px) {
    margin: 20px 0px;
  }
`;

export const HeaderCharts = styled.div`
  max-width: 100%;
  display: flex;
  flex-direction: row;
  gap: 20px;

  & > div {
    flex: 1;
    width: calc(100% / 2 - 10px);
  }

  @media (max-width: 1024px) {
    gap: 16px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;

    & > div {
      width: 100%;
    }
  }
`;

export const MapWrapper = styled.div`
  margin-top: 40px;
  margin-bottom: 40px;
  height: 100%;

  @media (max-width: 768px) {
    margin-top: 30px;
    margin-bottom: 30px;
  }

  @media (max-width: 480px) {
    margin-top: 20px;
    margin-bottom: 20px;
  }
`;
