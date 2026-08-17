import styled from "styled-components";

export const ModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
  color: var(--color-text-muted);

  .input {
    display: flex;
    align-items: center;
    background: #f8f8f9;
    padding: 8px 12px;
    gap: 8px;
    border-radius: 8px;
    font-size: 14px;
    margin-top: 10px;

    .max {
      cursor: pointer;
      color: var(--color-primary);
    }
  }

  input {
    width: 100%;
    border: none;
    background: #f8f8f9;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }

  button {
    padding: 13px;
    background: var(--color-primary);
    border-radius: 8px;
    border: none;
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
    line-height: 22px;
    text-align: center;
    color: var(--color-white);
    width: 100%;
    margin-top: 10px;

    &:hover {
      background: rgba(4, 165, 132, 0.75);
    }
  }
`;
