import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    max-width: 620px;
    margin: 30px auto 40px;
  }

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 0 12px;
    margin: 20px auto 30px;
  }

  & .title {
    font-weight: var(--font-weight-regular);
    font-size: 36px;
    line-height: 43.57px;
    margin-bottom: 16px;

    @media (max-width: 768px) {
      font-size: 30px;
      line-height: 36px;
      margin-bottom: 14px;
    }

    @media (max-width: 480px) {
      font-size: 24px;
      line-height: 30px;
      margin-bottom: 12px;
    }
  }

  & .sub-title {
    font-weight: var(--font-weight-regular);
    font-size: 24px;
    line-height: 29.05px;
    margin-bottom: 40px;
    text-align: center;

    @media (max-width: 768px) {
      font-size: 18px;
      line-height: 24px;
      margin-bottom: 30px;
    }

    @media (max-width: 480px) {
      font-size: 16px;
      line-height: 22px;
      margin-bottom: 24px;
    }
  }

  & .watchlist-button {
    font-size: 14px;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      width: 100%;
    }
  }
`;

export const TrendingWrapper = styled.div`
  width: 100%;
  padding: 0 16px;

  @media (max-width: 768px) {
    padding: 0 12px;
  }

  @media (max-width: 480px) {
    padding: 0 8px;
  }
`;
