import styled from "styled-components";

export const Wrapper = styled.div`
  margin-top: 40px;
`;

export const CardsWrapper = styled.div`
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

    @media (max-width: 1024px) {
      flex-wrap: wrap;
    }
    @media (max-width: 680px) {
      flex-direction: column;
    }
  }

  & .dataBody {
    margin-top: 20px;
    padding: 30px;
    background: #f5fbfd;
    border-radius: 12px;

    @media (max-width: 640px) {
      padding: 20px;
    }
  }

  & .emptyBig {
    max-width: 530px;
  }

  & .empty {
    max-width: 360px;
  }
  @media (max-width: 768px) {
    & .cards {
      display: flex;
      flex-direction: row;
      overflow-x: auto;
      flex-wrap: nowrap;
      gap: 12px;

      & > div {
        width: fit-content;
        min-width: 100%;
      }
    }
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

  & .card-value.main-red {
    color: var(--main-red);
  }

  & .card-value.main-green {
    color: var(--main-green);
  }

  & .card-value.main-black {
    color: var(--main-black);
  }

  @media (max-width: 900px) {
    padding: 32px 28px;
  }
  @media (max-width: 640px) {
    padding: 24px 20px;

    .card-key {
      font-size: 16px;
    }

    .card-value {
      font-size: 20px;
    }

    svg {
      width: 32px;
      height: 32px;
    }
  }
`;
