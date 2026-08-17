import styled from "styled-components";

export const DatePickerWrapper = styled.div<{
  oneDay: boolean;
  isOpen: boolean;
}>`
  background: ${({ isOpen }) => (isOpen ? "white" : "transparent")};
  box-shadow: ${({ isOpen }) => (isOpen ? "2px 0px 5px #EEEEEE" : "")};
  border-top-left-radius: ${({ isOpen }) => (isOpen ? "4px" : "0px")};
  border-top-right-radius: ${({ isOpen }) => (isOpen ? "4px" : "0px")};
  padding: 4px;
  width: 140px;
  .react-datepicker-popper {
    padding: 0px !important;
    /* position: static !important; */
    transform: translate(-4px, 2px) !important;
    inset: unset !important;
    box-shadow: ${({ isOpen }) => (isOpen ? "2px 4px 5px #EEEEEE" : "")};
  }
  .react-datepicker {
    max-width: 140px;
    border: none;
    border-radius: 0px;
  }

  .react-datepicker-wrapper {
  }

  .react-datepicker__month-container {
    max-width: 140px;
  }

  .react-datepicker__header {
    background: none;
    border: none;
    padding: 16px 0 13px;
  }

  .react-datepicker__day-names {
    display: flex;
    justify-content: space-between;
    padding: 0px 4px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .react-datepicker__day-name {
    font-family: Inter;
    font-size: 10px;
    font-weight: var(--font-weight-semibold);
    line-height: 14px;
  }

  .react-datepicker__day {
    font-weight: var(--font-weight-regular);
    height: 20px;
    width: 20px;
    font-size: 10px;
    line-height: 14px;
    color: #0d0f2a;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0px !important;
  }

  .react-datepicker__day--outside-month {
    font-weight: var(--font-weight-regular);
    font-size: 10px;
    line-height: 14px;
    color: rgba(13, 15, 42, 0.25);
  }

  .react-datepicker__day--range-start span,
  .react-datepicker__day--range-end span {
    background: var(--color-primary);
    border-radius: 99px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 14px;
    color: var(--color-danger) !important;
    width: 28px;
    height: 28px;
  }

  .react-datepicker__day--range-end {
    border-top-right-radius: 100%;
    border-bottom-right-radius: 100%;
    width: 28px;
    margin-right: 6px;
    padding-left: 6px;
    box-sizing: content-box;
  }

  .react-datepicker__day--range-start {
    border-top-left-radius: 100%;
    border-bottom-left-radius: 100%;
    border-bottom-right-radius: ${({ oneDay }) => (oneDay ? "100%" : "")};
    border-top-right-radius: ${({ oneDay }) => (oneDay ? "100%" : "")};
    width: 28px;
    margin-left: 6px;
    padding-right: ${({ oneDay }) => (oneDay ? "" : "6px")};
    margin-right: ${({ oneDay }) => (oneDay ? "6px" : "")};
    box-sizing: content-box;
    background: ${({ oneDay }) => (oneDay ? "100%" : "")};
  }

  .react-datepicker__day--in-selecting-range:not(
    .react-datepicker__day--in-range,
    .react-datepicker__month-text--in-range,
    .react-datepicker__quarter-text--in-range,
    .react-datepicker__year-text--in-range
  ) {
    background: var(--color-primary-soft);
  }

  .react-datepicker__month {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0 4px;
  }

  .react-datepicker__week {
    display: flex;
    align-items: center;
  }

  .react-datepicker__day--in-range,
  .react-datepicker__day--selected {
    background: var(--color-primary-soft);
  }

  .react-datepicker__triangle {
    display: none;
  }
`;

export const CustomDateButton = styled.button`
  font-size: 12px;
  font-family: Inter;
  color: var(--color-text-primary);
  margin-bottom: 2px;
`;

export const CustomDateHeaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  padding: 0px 4px;

  span {
    font-family: Inter;
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 15px;
    color: #000000;
  }
`;

export const SimpleWrapper = styled.div`
  display: flex;
  width: 100%;
  gap: 2px;
  align-items: center;

  span {
    background: #f8f8f9;
    border-radius: 8px;
    padding: 11px 12px;
    font-size: 14px;
    line-height: 14px;
  }
`;

export const CustomDateInputWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #000;
  cursor: pointer;
`;

export const CustomInputField = styled.input`
  font-size: 12px !important;
  border: none;
  text-align: center;
  font-size: 14px;
  outline: none;
  background: transparent;
  padding: 0px;
  font-family: Inter !important;

  &:nth-child(1) {
    width: 14px;
  }

  &:nth-child(2) {
    width: 14px;
  }

  &:nth-child(3) {
    width: 31px;
  }
  &:focus {
    background: var(--color-warning);
    border-radius: 2px;
    outline: none !important;
  }

  &:focus-visible {
    outline: none !important;
  }
`;

export const CalendarHeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  button {
    padding: 2px 3px;

    &:nth-child(2) {
      transform: translateY(-1.5px);
    }
  }
`;
