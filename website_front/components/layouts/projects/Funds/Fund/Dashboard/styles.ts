import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  margin-top: 20px;
  margin-bottom: 40px;
  width: 100%;

  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

export const Row = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  & .values {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  & .value {
    text-align: right;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16.8px;
    color: var(--main-black);

    &.green {
      color: var(--color-primary);
    }

    &.red {
      color: var(--color-danger);
    }
  }
`;

export const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  & .item-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  & .project {
    padding: 10px 0px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  & .project-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    div {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17.15px;
    }

    span {
      font-size: 10px;
      color: var(--main-gray);
    }
  }

  & .values {
    display: flex;
    flex-direction: column;
    gap: 4px;

    text-align: right;
  }
`;

export const InfoWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;

  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17.15px;

  button {
    padding: 0px;
    line-height: 0px;
  }
`;

export const DescriptionWrapper = styled.div`
  position: absolute;
  top: 23px;

  & .small-modal {
    position: relative;
    z-index: 10;
    padding: 10px;
    width: 260px;
    div {
      font-size: 12px;
      line-height: 16.8px;
      color: var(--main-gray);
    }
  }
`;
