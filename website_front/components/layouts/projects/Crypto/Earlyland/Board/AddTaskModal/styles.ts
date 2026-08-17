import styled, { createGlobalStyle } from "styled-components";

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
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-height: 90vh;
  overflow-y: auto;

  @media (max-width: 600px) {
    padding: 24px 20px;
    gap: 10px;
    max-height: 95vh;
  }
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

  @media (max-width: 600px) {
    font-size: 20px;
    line-height: 26px;
  }
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

export const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  @media (max-width: 600px) {
    gap: 10px;
  }
`;

export const FormRow = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
  align-items: flex-start;

  @media (max-width: 600px) {
    flex-direction: row;
    gap: 16px;
  }
`;

export const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 0 0;
  min-width: 0;
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

export const FieldTextarea = styled.textarea`
  width: 100%;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  padding: 12px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
  resize: none;
  outline: none;
  min-height: 114px;
  box-sizing: border-box;
  background: var(--color-white);

  &::placeholder {
    color: var(--color-text-soft);
  }

  &:focus {
    border-color: var(--color-primary);
  }
`;

export const DescHint = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
`;

export const FieldError = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-danger);
`;

export const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const SelectTrigger = styled.button<{ hasError?: boolean }>`
  width: 100%;
  background: var(--color-white);
  border: 1px solid ${({ hasError }) => (hasError ? "var(--color-danger)" : "#f0f2f5")};
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);

  &:focus {
    outline: none;
  }
`;

export const SelectPlaceholder = styled.span`
  color: var(--color-text-soft);
`;

export const SelectDropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-white);
  border-radius: 8px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  z-index: 10;
  overflow: hidden;
`;

export const SelectOption = styled.button<{ selected?: boolean }>`
  width: 100%;
  background: none;
  border: none;
  padding: 8px 12px;
  text-align: left;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: ${({ selected }) => (selected ? "var(--color-primary)" : "var(--color-text-primary)")};
  cursor: pointer;

  &:hover {
    background: #f5fbfd;
  }
`;

export const DatePickerTrigger = styled.button<{ hasError?: boolean }>`
  background: #f8f8f9;
  border: 1px solid ${({ hasError }) => (hasError ? "var(--color-danger)" : "transparent")};
  border-radius: 8px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
  white-space: nowrap;

  &:focus {
    outline: none;
    border-color: ${({ hasError }) => (hasError ? "var(--color-danger)" : "var(--color-primary)")};
  }
`;

export const DatePickerGlobalStyles = createGlobalStyle`
  .react-datepicker-popper {
    z-index: 1001 !important;
  }
  .react-datepicker {
    font-family: "Gilroy", sans-serif !important;
    border: 1px solid #f0f2f5 !important;
    border-radius: 12px !important;
    box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08) !important;
    font-size: 13px;
  }
  .react-datepicker__header {
    background: #f5fbfd !important;
    border-bottom: 1px solid #f0f2f5 !important;
    border-radius: 12px 12px 0 0 !important;
    padding: 12px 0 8px !important;
  }
  .react-datepicker__current-month {
    font-family: "Gilroy", sans-serif !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: var(--color-text-primary) !important;
  }
  .react-datepicker__day-name {
    font-family: "Gilroy", sans-serif !important;
    font-size: 12px !important;
    color: #728094 !important;
  }
  .react-datepicker__day {
    font-family: "Gilroy", sans-serif !important;
    font-size: 13px !important;
    color: var(--color-text-primary) !important;
    border-radius: 6px !important;
  }
  .react-datepicker__day:hover {
    background: #f5fbfd !important;
    color: var(--color-primary) !important;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background: var(--color-primary) !important;
    color: var(--color-white) !important;
  }
  .react-datepicker__day--selected:hover {
    background: #038f72 !important;
  }
  .react-datepicker__day--today {
    font-weight: 600 !important;
    color: var(--color-primary) !important;
  }
  .react-datepicker__day--today.react-datepicker__day--selected {
    color: var(--color-white) !important;
  }
  .react-datepicker__day--outside-month {
    color: var(--color-text-soft) !important;
  }
  .react-datepicker__day--disabled {
    color: #d0d4da !important;
    cursor: not-allowed !important;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #728094 !important;
  }
  .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
    border-color: var(--color-primary) !important;
  }
  .react-datepicker__triangle {
    display: none !important;
  }
`;

export const ModalFooter = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  width: 100%;

  @media (max-width: 600px) {
    gap: 12px;
  }
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

export const AddButton = styled.button`
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
