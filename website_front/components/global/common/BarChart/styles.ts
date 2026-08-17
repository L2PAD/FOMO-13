import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  position: relative;
  width: 100%;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

export const Title = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 19.6px;
  margin: 0 0 16px 0;

  @media (max-width: 768px) {
    font-size: 15px;
    line-height: 18px;
    margin: 0 0 12px 0;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 16.8px;
    margin: 0 0 10px 0;
  }
`;

export const ChartDescription = styled.div`
  font-size: 16px;
  margin: 20px 0 25px;
  color: var(--color-text-muted);

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
  align-items: center;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (max-width: 480px) {
    margin-bottom: 10px;
    gap: 6px;
  }
`;

export const ChartWrapper = styled.div`
  display: flex;
  margin-top: 20px;
  height: 320px;
  overflow-x: auto;
  min-width: 100%;

  @media (max-width: 768px) {
    height: 280px;
    margin-top: 16px;
  }

  @media (max-width: 480px) {
    height: 240px;
    margin-top: 12px;
  }
`;

export const Labels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 5px;
  min-width: 60px;

  @media (max-width: 768px) {
    min-width: 50px;
  }

  @media (max-width: 480px) {
    min-width: 40px;
  }

  div {
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
  position: relative;

  @media (max-width: 768px) {
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

export const Events = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 10px auto 0;
  max-width: 78%;
  transform: translateX(12px);
  overflow-x: auto;
  gap: 8px;

  @media (max-width: 768px) {
    max-width: 85%;
    transform: translateX(8px);
    gap: 6px;
  }

  @media (max-width: 480px) {
    max-width: 90%;
    transform: translateX(4px);
    gap: 4px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  & .event-name {
    font-size: 14px;
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 11px;
    }
  }
`;
