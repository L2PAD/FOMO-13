import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  position: relative;
  width: 100%;
`;

export const Title = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 19.6px;

  @media (max-width: 768px) {
    font-size: 15px;
    line-height: 18px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 16.8px;
  }
`;

export const ChartDescription = styled.div`
  font-size: 16px;
  margin: 20px 0 25px;

  @media (max-width: 768px) {
    font-size: 15px;
    margin: 16px 0 20px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin: 12px 0 16px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const ChartWrapper = styled.div`
  display: flex;
  margin-top: 20px;

  @media (max-width: 768px) {
    margin-top: 16px;
  }

  @media (max-width: 480px) {
    margin-top: 12px;
  }
`;

export const Labels = styled.div`
  width: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 5px;
  height: 280px;

  & > div {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 16.8px;
    color: var(--color-text-primary);

    @media (max-width: 768px) {
      font-size: 13px;
      line-height: 15.6px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 14.4px;
    }
  }
`;

export const LabelWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }

  & .border {
    background: #f0f2f5;
    width: 100%;
    height: 1px;
  }
`;

export const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  height: 360px;
`;

export const Chart = styled.div`
  width: 100%;
`;

export const Events = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--events-count, 5), minmax(0, 1fr));
  margin: 10px auto 0;
  width: 100%;

  @media (max-width: 768px) {
    gap: 8px;
  }

  @media (max-width: 480px) {
    gap: 6px;
  }

  & .event-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    @media (max-width: 768px) {
      gap: 3px;
    }

    @media (max-width: 480px) {
      gap: 2px;
    }
  }

  & .event-name {
    font-size: 14px;
    max-width: 100%;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
`;
