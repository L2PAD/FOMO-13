import styled from "styled-components";

export const Description = styled.div`
  margin-top: 8px;
  margin-bottom: 16px;
`;

export const ThemeWrapper = styled.div`
  margin-bottom: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
  input {
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
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
  font-size: 18px;
  line-height: 22px;
  text-align: center;
  color: var(--color-white);
  width: 100%;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`;

export const FooterWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }

  span {
    font-weight: var(--font-weight-medium);
    font-size: 14px;
    line-height: 16px;
  }
`;
