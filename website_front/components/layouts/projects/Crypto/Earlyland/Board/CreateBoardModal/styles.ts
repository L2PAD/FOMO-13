import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(7, 11, 53, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

export const ModalWrapper = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 40px;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const ModalTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 30px;
  color: var(--color-text-primary);
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #728094;

  &:hover {
    color: var(--color-text-primary);
  }
`;

export const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const FieldLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const FieldInput = styled.input<{ hasError?: boolean }>`
  width: 100%;
  border: 1px solid ${({ hasError }) => (hasError ? "var(--color-danger)" : "#f0f2f5")};
  border-radius: 8px;
  padding: 8px 12px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
  outline: none;
  box-sizing: border-box;
  background: var(--color-white);

  &::placeholder {
    color: var(--color-text-soft);
  }

  &:focus {
    border-color: ${({ hasError }) => (hasError ? "var(--color-danger)" : "var(--color-primary)")};
  }
`;

export const FieldError = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-danger);
`;

export const ModalFooter = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  width: 100%;
`;

export const CancelButton = styled.button`
  flex: 1 0 0;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  padding: 8px 21px;
  background: var(--color-white);
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  cursor: pointer;

  &:hover {
    border-color: #c8cdd5;
  }
`;

export const CreateButton = styled.button`
  flex: 1 0 0;
  border: none;
  border-radius: 8px;
  padding: 8px 21px;
  background: var(--color-primary);
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  cursor: pointer;
  line-height: 20px;

  &:hover {
    background: #038f72;
  }
`;
