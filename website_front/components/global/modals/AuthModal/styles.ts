import styled from "styled-components";
import Input from "../../common/Input";

export const ContentWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 16px;
  flex-direction: column;
  align-items: center;
`;

export const EmailInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    margin-top: 7px;
  }
`;

export const PasswordWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
`;

export const PasswordInput = styled(Input)`
  width: 100% !important;
  margin-top: -18px;

  input {
    width: 100%;
    margin-top: 7px;
  }
`;

export const ForgotButton = styled.button<{ main: boolean }>`
  background: none;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: ${({ main }) => (main ? "#E24828" : "var(--color-primary)")};
  z-index: 20;
`;

export const SubmitButton = styled.button<{ main: boolean }>`
  padding: 13px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  background: ${({ main }) => (main ? "#E24828" : "var(--color-primary)")};
  border-radius: 8px;
  border: none;
  width: 100%;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }

  &:disabled {
    opacity: 1;
    background: ${({ main }) => (main ? "#E24828" : "#028a6f")};
    cursor: not-allowed;
  }
`;

export const DontHaveAccount = styled.div<{ main: boolean }>`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);
  display: flex;
  gap: 4px;
  justify-content: center;

  button {
    color: ${({ main }) => (main ? "#E24828" : "var(--color-primary)")};
    background: none;
    border: none;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }
`;

export const LinksWrapper = styled.div<{ main: boolean }>`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  color: var(--color-text-muted);

  a {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: ${({ main }) => (main ? "#E24828" : "var(--color-primary)")};
  }
`;

export const MailIconWrapper = styled.div`
  margin-top: 20px;
`;

export const SentText = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  color: var(--color-text-muted);

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const ErrorText = styled.div`
  position: absolute;
  bottom: -22px;
  left: 5px;
  color: red;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
`;

export const EmailInputWrapper = styled.div<{ isError: boolean }>`
  width: 100%;
  position: relative;
  margin-bottom: ${({ isError }) => (isError ? "18px" : "0px")};
`;

export const PasswordInputWrapper = styled.div`
  width: 100%;
  position: relative;
  & button {
    position: absolute;
    top: 12px;
    right: 10px;

    & img {
      max-width: 22px;
      height: auto;
    }
  }
`;

export const PasswordInfo = styled.div`
  margin-top: 5px;
  font-size: 14px;
`;

export const TwoFACodeWrapper = styled.form`
  width: 100%;

  & .fa-subtitle {
    margin: 12px 0 20px;
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 100%;
    letter-spacing: 0%;
    color: var(--main-gray);
  }
`;
