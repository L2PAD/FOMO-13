import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  height: auto;

  & .chart-body{
    div{
      height: 400px !important;
    }
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  h3 {
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
  }


`;

export const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
  margin-bottom: 10px;
  overflow-x: auto;
  width: 100%;

  @media (max-width: 768px) {
    gap: 16px;
    margin-top: 8px;
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin-top: 6px;
    margin-bottom: 12px;
  }

  & .tab {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: fit-content;
    border: 0;
    background: transparent;
    padding: 0;
    font: inherit;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:focus-visible {
      outline: 2px solid var(--color-info);
      outline-offset: 3px;
      border-radius: 4px;
    }

    & .color {
      max-width: 10px;
      min-width: 10px;
      min-height: 10px;
      max-height: 10px;
      border-radius: 50%;

      @media (max-width: 480px) {
        max-width: 8px;
        min-width: 8px;
        min-height: 8px;
        max-height: 8px;
      }
    }

    span {
      color: var(--color-text-primary);
      font-size: 14px;

      @media (max-width: 768px) {
        font-size: 14px;
      }
    }
  }
`;

export const Body = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  height: 380px;
`;

export const Bottom = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  padding-left: 50px;
  padding-right: 10px;

  @media (max-width: 768px) {
    margin-top: 8px;
  }

  @media (max-width: 480px) {
    margin-top: 6px;
    flex-wrap: nowrap;
    gap: 4px;
  }

  div {
    color: var(--color-text-primary);
    font-size: 14px;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 10px;
      width: 100%;
    }
  }

  span {
    @media (max-width: 480px) {
      display: inline-block;
      width: 40px;
      transform: rotate(-45deg) translateY(-5px) translateX(8px);
    }
  }
`;


export const Labels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 5px;
  margin-top:15px;

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
