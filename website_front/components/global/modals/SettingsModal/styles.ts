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

export const PasswordInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    margin-top: 7px;
  }
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
`;

export const LinksWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
`;

export const ChangeWrapper = styled.div`
  width: 100%;

  & > p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 6px;
  }

  div {
    display: flex;
    justify-content: space-between;
    align-items: center;

    p {
      font-weight: var(--font-weight-medium);
      font-size: 14px;
      line-height: 16px;
    }

    button {
      background: none;
      border: none;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      color: var(--color-primary);
    }
  }
`;

export const UserAvatarWrapper = styled.div`
  button {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: #e42736;
    border: none;
    background: none;
    margin-top: 10px;
  }
`;
