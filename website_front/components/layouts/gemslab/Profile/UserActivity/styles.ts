import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  display: flex;
  gap: 20px;

  h2 {
    margin: 20px 0;
  }
`;

export const LeftColumn = styled.div`
  width: 67%;
  display: flex;
  flex-direction: column;
  gap: 45px;

  @media (max-width: 1100px) {
    width: 100%;
  }

  @media (max-width: 640px) {
    gap: 32px;
  }
`;

export const InfoBlock = styled.div`
  width: 100%;
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    margin: 20px 0;
  }

  & .profile-cards {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
      display: flex;
      flex-direction: row;
      overflow-x: auto;
      gap: 12px;

      & > div {
        width: fit-content;
        min-width: 100%;
      }
    }
  }
`;

export const Columns = styled.div`
  margin-top: 45px;
  width: 100%;
  display: flex;
  gap: 20px;

  @media (max-width: 1100px) {
    flex-direction: column;
  }
`;

export const InfoCard = styled(BaseCard)`
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  padding: 30px;

  & .key {
    font-weight: var(--font-weight-regular);
    font-size: 22px;
    line-height: 100%;
    text-align: center;
  }

  & .value {
    font-weight: var(--font-weight-semibold);
    font-size: 22px;
    line-height: 100%;
    text-align: center;
  }

  & .value.main-red {
    color: var(--main-red);
  }

  & .value.main-green {
    color: var(--main-green);
  }

  @media (max-width: 640px) {
    padding: 20px;
    gap: 16px;
  }
`;

export const RightColumn = styled.div`
  width: 33%;

  h2 {
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 1100px) {
    width: 100%;
    margin-top: 20px;
  }
`;

export const StatisticsCard = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  & .row {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;

    & .key {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 100%;
      color: var(--main-gray);
      font-weight: var(--font-weight-semibold);
    }

    & .value {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--main-black);
    }

    & .description-component {
      position: absolute;
      top: 20px;
      left: -2px;
      z-index: 1;
      width: 300px;
      padding: 10px;

      div {
        font-size: 14px;
        color: var(--main-gray);

        p {
          margin: 8px 0;
        }
      }
    }
  }

  @media (max-width: 640px) {
    padding: 20px;

    .row .description-component {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      top: auto;
      bottom: 12px;
      width: calc(100% - 32px);
      max-width: 360px;
    }
  }
`;
