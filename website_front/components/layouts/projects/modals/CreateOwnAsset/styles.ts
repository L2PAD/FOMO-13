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
`;

export const BlockWrapper = styled.div`
  margin-top: 20px;
  width: 100%;
`;

export const BlockDescription = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  margin-bottom: 40px;
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
`;

export const InputLabel = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 100%;
  color: var(--main-black);
`;

export const InputError = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 90%;
  color: var(--main-red);
`;

export const ButtonWrapper = styled.div`
  margin-top: 20px;
  max-width: fit-content;
  margin-left: auto;
  button {
    width: 170px;
  }
`;
