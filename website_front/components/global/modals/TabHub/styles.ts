import styled from "styled-components";

export const Wrapper = styled.div`
  margin: 40px 0 0px;

  & .auth-info {
    max-width: fit-content;
    margin: 100px auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    p {
      font-size: 16px;
      text-align: center;
      font-weight: var(--font-weight-semibold);
    }
  }

  & .tabhub-actions {
    margin: 30px 0;
  }

  @media (max-width: 768px) {
    margin: 20px 0 0;

    & .auth-info {
      margin: 60px auto;
      p {
        font-size: 14px;
      }
    }

    & .tabhub-actions {
      flex-direction: column;
      gap: 12px;
      margin: 20px 0;

      button {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  }
`;

export const Header = styled.div`
  display: grid;
  grid-template-columns: 3.8fr 3.4fr;
  align-items: center;
  gap: 20px;

  & .tab-search {
    height: 100%;
    width: 100%;
    max-width: 100%;
    input {
    width: 100%;
      height: 45px;
    }

    svg {
      top: 21px;
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;

    & .tab-search {
      input {
        height: 40px;
      }

      svg {
        top: 10px;
      }
    }
  }
`;

export const ButtonWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  justify-content: flex-end;

  button {
    width: 170px;
  }

  @media (max-width: 768px) {
    margin-top: 20px;

    button {
      width: 100%;
    }
  }
`;
