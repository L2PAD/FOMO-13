import styled from "styled-components";

export const DatePickerWrapper = styled.div<{ oneDay: boolean }>`
  .react-datepicker {
    border: none;
    box-shadow: 4px 4px 10px #eeeeee;
    border-radius: 16px;
  }

  .react-datepicker-wrapper {
    width: max-content;
  }

  .react-datepicker__month-container {
    padding-bottom: 24px;
  }

  .react-datepicker__header {
    background: none;
    border: none;
    padding: 16px 0 13px;
  }

  .react-datepicker__day-names {
    display: flex;
    justify-content: space-between;
    margin: 0 10px;
  }

  .react-datepicker__day-name {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: rgba(13, 15, 42, 0.5);
    margin-top: 0;
  }

  .react-datepicker__day {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: #0d0f2a;
    width: 40px;
    height: 28px;
    margin: 7px 0 0;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .react-datepicker__day--outside-month {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
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
    color: var(--color-white) !important;
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
    gap: 7px;
    margin: 0;
    padding: 0 10px;
  }

  .react-datepicker__week {
    display: flex;
    align-items: center;
    height: 19px;
    margin-bottom: 7px;
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
  background: var(--color-primary-soft);
  border-radius: 8px;
  padding: 8px 16px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
  max-width: 250px;
  min-width: 205px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;

  span {
    margin-top: 3px;
  }
`;

export const CustomDateHeaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 26px;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
    line-height: 24px;
    color: #0d0f2b;
  }

  button {
    background: rgba(115, 128, 148, 0.1);
    border-radius: 99px;
    border: none;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:first-child {
      transform: rotate(180deg);
    }
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
