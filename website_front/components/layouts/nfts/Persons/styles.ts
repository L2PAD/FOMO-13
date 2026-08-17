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
