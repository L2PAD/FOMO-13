import styled from "styled-components";

export const InputRow = styled.div`
  position: relative;
  margin-bottom: 8px;

  input {
    width: 100%;
    background: rgba(245, 249, 253, 0.5);
    border-radius: 8px;
    padding: 9px 43px 9px 12px;
    border: none;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
  }

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);
    position: absolute;
    right: 12px;
    top: 10px;
  }
`;

export const FooterWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;

  div {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);

    &:last-child {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    text-align: right;
    color: #0d0f2b;
  }
`;

export const SubmitButton = styled.button`
  background: var(--color-primary);
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  text-align: center;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-white);
  border: none;
`;

export const RangeWrapper = styled.div`
  margin-bottom: 24px;
  margin-top: 15px;
`;

export const RangeTitleWrapper = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin-bottom: 14px;

  span {
    font-weight: var(--font-weight-semibold);
    color: #0d0f2b;
  }
`;
