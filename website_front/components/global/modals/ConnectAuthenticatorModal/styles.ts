import styled from "styled-components";

export const Text = styled.p`
  color: var(--color-text-muted);
  padding: 5px 0;
`;
export const QRCodeWrapper = styled.div`
  padding: 5px 0;
  display: flex;
  gap: 10px;
  color: var(--color-text-primary);

  span {
    font-size: 12px;
    color: #0e7ce1;
    padding: 5px 0;
    font-weight: var(--font-weight-semibold);
  }

  .refresh {
    cursor: pointer;
  }
`;

export const InputWrapper = styled.div`
  margin: 16px 0;
  max-width: 350px;

  p {
    font-weight: var(--font-weight-medium);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }

  .input {
    display: flex;
    align-items: center;
    background: #f8f8f9;
    padding: 8px 12px;
    gap: 8px;
    border-radius: 8px;
    font-size: 14px;

    .paste {
      cursor: pointer;
    }
  }

  input {
    width: 100%;
    border: none;
    background: #f8f8f9;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }
`;

export const SubmitButton = styled.button`
  padding: 13px;
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  line-height: 22px;
  text-align: center;
  color: var(--color-white);
  width: 100%;
  font-size: 18px;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`;
