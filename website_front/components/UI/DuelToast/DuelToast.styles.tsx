import styled from "styled-components";

export const ToastContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #e6f9f6 0%, #f0fdf9 100%);
  border-radius: 12px;
  border: 1px solid rgba(5, 165, 132, 0.2);
  min-width: 320px;
  max-width: 100%;
  box-shadow: 0 4px 12px rgba(5, 165, 132, 0.08);
`;

export const ToastContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

export const ToastIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  flex-shrink: 0;
`;

export const ToastText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

export const ToastTitle = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

export const ToastDescription = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-primary);
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

export const ToastButton = styled.button`
  padding: 6px 12px;
  background: var(--color-white);
  color: black;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    background: #048f72;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;
