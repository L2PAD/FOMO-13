import styled from "styled-components";
import Link from "next/link";
import ViewCard from "../../../global/ViewCard";

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

export const ProjectsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 16px;
  gap: 2px;
`;

export const ProjectCardItem = styled(ViewCard)`
  height: 100% !important;
`;

export const ProjectCardLink = styled(Link)`
  margin: 5px;
  width: 289px !important;

  & > div {
    width: 100% !important;
  }

  @media (max-width: 1204px) {
    width: 32% !important;
  }

  @media (max-width: 932px) {
    width: 48% !important;
  }

  @media (max-width: 631px) {
    width: 100% !important;
  }
`;

export const TopsWrapper = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;
`;
