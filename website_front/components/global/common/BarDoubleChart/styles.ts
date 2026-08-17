import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  max-width: 45vw;

  @media (max-width:480px) {
    max-width:unset;
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

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
    font-weight: var(--font-weight-semibold);
    font-size: 16px;

    @media (max-width: 768px) {
    max-width: 165px;

      font-size: 15px;
      max-width: none;
    }

    @media (max-width: 480px) {
      font-size: 14px;
    }
  }
`;

export const Overflow = styled.div`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;

`;

export const Chart = styled.div`
  margin-top: 48px;
  display: flex;
  gap: 20px;
  height: 380px;

  @media (max-width: 1024px) {
    margin-top: 40px;
    height: 340px;
    gap: 16px;
  }

  @media (max-width: 768px) {
    margin-top: 32px;
    height: 300px;
    gap: 12px;
  }

  @media (max-width: 480px) {
    margin-top: 24px;
    height: 250px;
    gap: 8px;
  }
`;

export const Labels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 5px;

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

export const ButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    width: 100%;
    overflow-x: auto;

    .photo {
      margin-left: auto;
    }

    & .photo-button {
      position: absolute;
      right: 0;
      top: 16px;
      transform: translateY(-50%);
    }
  }
`;
