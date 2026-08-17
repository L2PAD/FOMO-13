import styled from "styled-components";

export const ContentRow = styled.div`
  margin-top: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    margin-bottom: 8px;
    color: var(--color-text-muted);
  }
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    margin-bottom: 8px;
    display: block;
  }
  input {
    border: none;
    padding: 8px 12px;
    background: rgba(245, 249, 253, 0.5);
    border-radius: 8px;
    width: 100%;
  }
`;

export const RangeInputsWrapper = styled.div`
  display: flex;
  gap: 12px;
`;

export const RangeWrapper = styled.div`
  margin-bottom: 16px;
  margin-top: 16px;
  position: relative;
`;
