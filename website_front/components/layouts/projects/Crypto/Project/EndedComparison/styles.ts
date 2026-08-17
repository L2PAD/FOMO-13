import styled from "styled-components";
import Link from "next/link";
import Typography from "../../../../../global/common/Typography";
import ViewCard from "../../../../../global/ViewCard";

export const Wrapper = styled.div`
  width: 1204px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    padding: 0 16px;
    width: 100%;
  }
`;

export const TableWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
`;

export const PageDescriptionWrapper = styled.div`
  margin-bottom: 16px;
`;

export const PageDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;

  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
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

export const EditBtnWrapper = styled.div`
  margin-bottom: 6px;
`;
