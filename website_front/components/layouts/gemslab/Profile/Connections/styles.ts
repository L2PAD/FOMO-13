import styled from "styled-components";

export const Wrapper = styled.div`
  margin-top: 20px;
`;

export const CardsWrapper = styled.div`
  margin-top: 20px;
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    letter-spacing: 0%;
    color: var(--main-black);
  }

  & .cards {
    display: flex;
    margin-top: 20px;
    gap: 20px;
  }

  & .dataBody {
    margin-top: 20px;
    padding: 30px;
    background: #f5fbfd;
    border-radius: 12px;
  }

  @media (max-width: 1024px) {
    & .cards {
      flex-direction: column;
    }
  }

  @media (max-width: 768px) {
    & .cards {
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

export const MobileCardSlider = styled.div`
  margin-top: 20px;

  .cards-swiper {
    padding: 5px 0;
    margin: 0 -10px;
    padding: 0 10px;
  }

  .swiper-slide {
    width: 280px;
    height: auto;
  }
`;

export const Card = styled.div`
  width: 100%;
  padding: 40px;
  background: #f5fbfd;
  border-radius: 12px;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;

  & .card-key {
    font-weight: var(--font-weight-regular);
    font-size: 18px;
    line-height: 100%;
    letter-spacing: 0%;
    text-align: center;
  }

  & .card-value {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    letter-spacing: 0%;
    text-align: center;
  }
`;

export const ReferralConnectionsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-top: 20px;
  }

  & .lvls {
    display: flex;
    align-items: center;
    gap: 20px;

    button {
      padding: 8px 10px;
      border-radius: 4px;
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 100%;
      letter-spacing: 0%;
      text-align: center;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.3s ease;
      &.active-btn {
        background: #f5fbfd;
        color: var(--color-primary);
      }

      &:hover {
        opacity: 0.7;
      }
      &:active {
        opacity: 0.5;
      }
    }
  }
`;
