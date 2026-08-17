import styled from "styled-components";
import Link from "next/link";
import Typography from "../../../global/common/Typography";
import ViewCard from "../../../global/ViewCard";
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

export const PageTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  margin-bottom: 40px !important;
  white-space: normal !important;

  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
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
export const DescriptionTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 32px;
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  margin-top: 40px !important;
  white-space: normal !important;
  text-align: center;

  span {
    margin-top: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 18px;
    line-height: 18px;
    color: var(--color-text-primary);
  }

  @media (max-width: 767px) {
    font-size: 24px;
    line-height: 29px;

    span {
      font-size: 14px;
      line-height: 16px;
    }
  }
`;

export const TimerBlockWrapper = styled.div`
  margin-top: 24px;
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;

  img {
    width: 594px;
    height: 330px;
    border-radius: 16px;
  }

  .dots {
    display: flex;
    gap: 6px;
    padding: 8px;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff507d33;
    }

    .active {
      background: #ff507d;
    }
  }
`;

export const TimerWrapper = styled.div`
  position: absolute;
  background: var(--color-white);
  border-radius: 16px;
  padding: 10px;
  left: 27%;
  bottom: 56px;
  width: 264px;

  @media (max-width: 666px) {
    left: 40px;
  }
`;

export const Table = styled(BaseCard)`
  width: 1200px;
  padding: 0 !important;
  box-shadow: 4px 4px 10px 0px #eeeeee !important;
  border-radius: 16px !important;
  overflow-x: auto;

  .header {
    width: 1200px;
    display: flex;
    background-color: #f5f9fd;
    color: var(--color-text-muted);
    font-size: 12px;
    padding: 10px;
    border-bottom: 1px solid #f5f9fd;
    border-radius: 16px 16px 0 0;
  }

  .row {
    width: 1200px;
    display: flex;
    padding: 10px;
    border-bottom: 1px solid #f5f9fd;
    font-size: 14px;
    align-items: center;

    p {
      font-weight: var(--font-weight-semibold);
    }

    .project {
      display: grid;
      grid-template-columns: 70px 1fr;
      align-items: center;

      div {
        padding: 0 !important;
      }

      img {
        width: 32px;
        height: 32px;
        border-radius: 8px;
      }

      span {
        color: var(--color-text-muted);
      }
    }

    .stats {
      p {
        background: var(--color-info);
        color: white;
        border-radius: 8px;
        font-size: 12px;
        padding: 4px 8px;
        width: max-content;
      }
    }
  }

  .header p,
  .row div {
    &:first-child {
      width: 400px;
      padding-left: 15px;
    }
    &:nth-child(2) {
      width: 200px;
    }
    &:nth-child(3) {
      width: 150px;
    }
    &:nth-child(4) {
      width: 200px;
    }
    &:nth-child(5) {
      width: 200px;
    }
  }
`;

export const TimerTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
`;

export const TimerSecondTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 4px !important;
`;

export const TimerValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 12px;
  color: #277ad2;
  margin-bottom: 16px;
`;

export const TimerButton = styled.button`
  background: #ff507d;
  padding: 6px 16px;
  border-radius: 99px;
  font-size: 16px;
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
`;
