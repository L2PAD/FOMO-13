import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import { DealStatus } from "../../../../../types/global_types";
import { getColorByStatus } from "../DealsList/styles";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  background: linear-gradient(90deg, #d6f4fe 0%, var(--color-white) 100%);
  border-radius: 8px;
  width: 100% !important;
  position: relative !important;
  margin-left: auto;
  padding: 20px;
  box-shadow: 2px 2px 8px 2px #00053014;
  min-width: 700px;
  gap: 20px;


   &.deal-highlighted {
      &::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        pointer-events: none;
      }
      
      z-index: 9999;
      position: relative;
    }

  @media (max-width: 767px) {
    min-width: 0;
    padding: 12px;
    gap: 12px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    column-gap: 12px;
    row-gap: 12px;
    border-radius: 12px;
    background: linear-gradient(120deg, #e9f7fc 0%, #f6fbfd 45%, var(--color-white) 100%);
  }
`;

export const DealColumn = styled.div`
  padding-right: 10px;
  flex: 1 1 40%;

  @media (max-width: 767px) {
    padding-right: 0;
    width: auto;
    min-width: 0;
    grid-column: 1;
    grid-row: 1;
  }
`;

export const DealInfo = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const DealName = styled.div`
  margin: 20px 0 8px;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17.15px;
`;

export const DealActions = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: auto;
  padding-bottom: 35px;

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.14px;
    cursor: default;
  }

  @media (max-width: 767px) {
    padding-bottom: 0;
    margin-top: 10px;
  }
`;

export const DealIconWrapper = styled.div`
  margin: auto 0px;

  @media (max-width: 767px) {
    display: none;
  }
`;

export const DealDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1 1 30%;

  @media (max-width: 767px) {
    width: 100%;
    gap: 10px;
    grid-column: 1 / -1;
    grid-row: 2;
  }
`;

export const DealDetailsItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;

  span {
    font-size: 14px;
    color: var(--color-text-muted);
  }
  div {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }

  & .rank {
    font-size: 18px;
  }
`;

export const DealStatusWrapper = styled.div<{ status: DealStatus }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  span {
    color: ${({ status }) => getColorByStatus(status)};
  }

  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17.14px;
`;

export const DealRightColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  margin-left: auto;

  @media (max-width: 767px) {
    margin-left: 0;
    width: auto;
    align-self: start;
    justify-self: end;
    grid-column: 2;
    grid-row: 1;
  }

  .contact {
    font-weight: var(--font-weight-regular);
    border: 1px solid var(--color-primary);
    padding: 8px 16px;
    font-size: 12px;
    width: 100%;
    max-width: 113px;
    margin-left: auto;
  }
`;

export const DealRightHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  width: fit-content;

  .member-status {
    font-size: 12px;
    line-height: 1;
    font-weight: var(--font-weight-semibold);
    padding: 6px 10px;
    border-radius: 999px;
  }

  .member-status.verified {
    color: var(--color-primary);
    background: rgba(4, 165, 132, 0.12);
  }

  .member-status.not-verified {
    color: var(--color-text-muted);
    background: rgba(115, 128, 148, 0.12);
  }

  .links {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-direction: row;
    justify-content: flex-end;

    a {
      width: 24px;
      height: 24px;
      padding: 0;

      svg {
        width: 24px;
        height: 24px;

        path {
          fill: var(--color-text-muted);
        }
      }
    }
  }

  @media (max-width: 767px) {
    gap: 8px;
  }
`;

export const DealButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;

  button {
    min-width: 80px;
  }
`;

export const CommentText = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  text-align: left;

  span {
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 767px) {
    font-size: 13px;
  }
`;

export const StartDeal = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  & > span {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const StartOrReject = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;

export const RejectButton = styled.button`
  padding: 6px;
  color: var(--color-danger);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s;

  &:hover {
    opacity: 0.7;
  }

  &:active {
    opacity: 0.6;
  }
`;

export const DescriptionStatus = styled.div`
  position: absolute;
  top: 25px;
  left: 0;
  z-index: 1;
`;

export const DealReviewMessage = styled.div`
  margin-top: 12px;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-danger);
`;
