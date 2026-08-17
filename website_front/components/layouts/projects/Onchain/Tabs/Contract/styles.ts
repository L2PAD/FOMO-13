import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const CardsWrapper = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 40px;
`;

export const BigCardWrapper = styled(BaseCard)`
  width: 390px;

  @media (max-width: 1200px) {
    width: calc(33% - 8px) !important;
  }

  @media (max-width: 900px) {
    width: calc(50% - 8px) !important;
  }

  @media (max-width: 600px) {
    width: 100% !important;
  }

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
    line-height: 21px;
    margin-bottom: 21px;
  }
  div {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    span {
      font-weight: var(--font-weight-semibold);
      font-size: 56px;
      line-height: 68px;
    }

    i {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      text-align: center;
      color: var(--color-text-muted);
    }
  }
`;

export const RegularCardWrapper = styled(BaseCard)`
  @media (max-width: 1200px) {
    width: calc(33% - 8px) !important;
  }

  @media (max-width: 900px) {
    width: calc(50% - 8px) !important;
  }

  @media (max-width: 600px) {
    width: 100% !important;
  }

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
    line-height: 21px;
    margin-bottom: 21px;
  }
  div {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    span {
      font-weight: var(--font-weight-semibold);
      font-size: 56px;
      line-height: 68px;
    }

    i {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      text-align: center;
      color: var(--color-text-muted);
    }
  }
`;

export const RollupTableHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 1200px;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    &:first-child {
      width: 170px;
    }
    &:nth-child(2) {
      width: 460px;
    }
    &:nth-child(3) {
      width: 210px;
    }
    &:nth-child(4) {
      width: 200px;
    }
  }
`;

export const RollupTableRowWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f8f8f9;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;

    &:first-child {
      width: 170px;
    }
    &:nth-child(2) {
      width: 460px;

      a {
        color: var(--color-info);
      }
    }
    &:nth-child(3) {
      width: 210px;
    }
    &:nth-child(4) {
      width: 200px;
    }
  }
`;
