import styled from "styled-components";

export const SubmitButton = styled.button`
  margin-top: 16px;
  padding: 13px;
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  text-align: center;
  color: var(--color-white);
  width: 100%;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`;

export const Description = styled.div`
  margin-top: 8px;
  margin-bottom: 16px;
`;

export const InputWrapper = styled.div`
  margin-bottom: 12px;
  display: flex;
  gap: 16px;
  align-items: center;

  &:last-child {
    margin-bottom: 0;
  }

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    width: 52px;
  }
  input {
    width: 260px;
    padding: 8px 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }
`;
