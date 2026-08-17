import styled from "styled-components";
import Link from "next/link";
import Button from "../../../global/common/Button";
import ViewCard from "../../../global/ViewCard";

export const ProjectCardItem = styled(ViewCard)`
  height: 100% !important;
`;

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
export const PaginationWrapper = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 250px 1fr;
  margin-top: 10px;
  align-items: center;

  p {
    text-align: right;
  }

  div {
    width: max-content;
  }

  .showing {
    @media (max-width: 450px) {
      display: none;
    }
  }
`;

export const ProjectsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 16px;
  gap: 2px;
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

export const GraphicButton = styled(Button)`
  background: rgba(115, 128, 148, 0.05);
  white-space: nowrap;
`;

export const GraphicButtonsWrapper = styled.div`
  display: flex;
  gap: 5px;
  padding-top: 10px;
  justify-content: space-between;
  flex-wrap: wrap;

  & > div {
    display: flex;
    gap: 5px;
    padding-top: 10px;
    flex-wrap: wrap;
  }
`;
export const TopHoldersItem = styled.p`
  display: flex;
  gap: 10px;
`;
