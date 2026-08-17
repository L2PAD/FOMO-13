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

  @media (max-width: 768px) {
    padding: 0 12px;
    margin-top: 10px;
  }

  @media (max-width: 480px) {
    padding: 0 8px;
    margin-top: 8px;
  }
`;

export const ProjectsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 16px;
  gap: 2px;
  justify-content: space-between;

  @media (max-width: 1204px) {
    gap: 12px;
  }

  @media (max-width: 1024px) {
    gap: 16px;
  }

  @media (max-width: 768px) {
    gap: 14px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

export const ProjectCardItem = styled(ViewCard)`
  height: 100% !important;
`;

export const ProjectCardLink = styled(Link)`
  margin: 5px;
  width: 32.4%;

  & > div {
    width: 100% !important;
  }

  @media (max-width: 1204px) {
    width: 32% !important;
    margin: 4px;
  }

  @media (max-width: 932px) {
    width: 48% !important;
    margin: 4px;
  }

  @media (max-width: 631px) {
    width: 100% !important;
    margin: 3px 0;
  }
`;

export const TopsWrapper = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;

  @media (max-width: 768px) {
    gap: 14px;
    margin-top: 14px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin-top: 12px;
  }
`;
