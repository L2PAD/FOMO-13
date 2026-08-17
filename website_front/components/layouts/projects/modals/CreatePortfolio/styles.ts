import styled from "styled-components";

export const Wrapper = styled.div`
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

  @media (max-width: 768px) {
    & .auth-info {
      margin: 60px auto;
      p {
        font-size: 14px;
      }
    }
  }

  & .portfolio-actions {
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;

      button {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  }

  & .ResetButton {
    @media (max-width: 768px) {
      margin-top: 16px;
    }
  }
`;

// Add responsive style for the portfolio title
export const portfolioTitleStyle = `
  .portfolio-title {
    @media (max-width: 768px) {
      font-size: 20px !important;
      line-height: 24px !important;
    }
  }
`;
export const BlockWrapper = styled.div`
  margin-top: 20px;
  width: 100%;

  @media (max-width: 768px) {
    margin-top: 16px;
  }
`;

export const BlockDescription = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 24px;
  }
`;

export const InputWrapper = styled.div`
  margin: 12px 0px;

  input {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    background: #f9f9f9;
    border: none;
    font-size: 14px;

    &::placeholder {
      color: var(--color-text-soft);
      font-size: 14px;
    }
  }

  @media (max-width: 768px) {
    margin: 8px 0;

    input {
      padding: 10px;
      font-size: 13px;

      &::placeholder {
        font-size: 13px;
      }
    }
  }
`;

export const InputLabel = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 100%;
  color: var(--main-black);

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

export const InputError = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 100%;
  color: var(--main-red);

  @media (max-width: 768px) {
    font-size: 12px;
    line-height: 120%;
  }
`;

export const ButtonWrapper = styled.div`
  margin-top: 20px;
  max-width: fit-content;
  margin-left: auto;
  button {
    width: 170px;
  }

  @media (max-width: 768px) {
    margin-top: 16px;
    button {
      width: 140px;
    }
  }
`;
