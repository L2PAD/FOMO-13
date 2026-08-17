import styled, { keyframes } from "styled-components";

export const ContentWrapper = styled.div`
  margin-top: 12px;
  display: flex;
  align-items: center;
  flex-direction: column;
`;
export const ActionsWrapper = styled.div`
  display: flex;
  gap: 7px;
  margin-top: 16px;
  align-items: center;
  width: 100%;
`;

export const CancelButton = styled.button`
  border: none;
  background: none;
  padding: 13px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
  width: 100%;
  border-radius: 8px;
`;

export const ConfirmButton = styled.button`
  border: none;
  background: var(--color-primary);
  padding: 13px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  width: 100%;
  border-radius: 8px;
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

export const ElipsisAnimation = styled.div`
  animation: ${rotate} 2s linear infinite;
  width: max-content;
  margin-bottom: 9px;
`;

export const AnimationTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
`;

export const AnimationDescription = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
  margin-top: 11px;
  display: flex;
  flex-direction: column;
  align-items: center;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-top: 6px;
  }
`;
