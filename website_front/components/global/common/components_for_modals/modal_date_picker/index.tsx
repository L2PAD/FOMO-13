import React, {
  FC,
  InputHTMLAttributes,
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import DatePicker, { ReactDatePickerCustomHeaderProps } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { ArrowRightIcon } from "../../../Icons";
import SuccessIcon from "../../../Icons/Deals/SuccessIcon";
import {
  CustomDateHeaderWrapper,
  DateInputField,
  DateInputIcon,
  DateInputShell,
  DatePickerFeedback,
  DatePickerWrapper,
} from "./styles";
import {
  DATE_INPUT_FORMAT,
  DATE_INPUT_PLACEHOLDER,
  DateInputValidation,
  formatDateInputValue,
  getDateInputEventValue,
  normalizeDateInput,
  toValidDate,
  validateDateInput,
} from "./dateInput";

interface Props {
  type?: "small" | "default";
  date?: null | Date | string;
  isSuccessIcon?: boolean;
  onChange: (value: Date | null) => void;
  onValidityChange?: (isValid: boolean) => void;
  minDate?: Date;
  maxDate?: Date;
}

interface EditableDateInputProps extends InputHTMLAttributes<HTMLInputElement> {
  pickerType: "small" | "default";
  hasError: boolean;
  showSuccess: boolean;
}

const CalendarIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    width="16"
    height="17"
    viewBox="0 0 16 17"
    fill="none"
  >
    <path
      d="M3.16667 6.44284H12.5M4.37302 2.5V3.52869M11.1667 2.5V3.52857M13.1667 5.32857V12.7C13.1667 13.6941 12.3707 14.5 11.3889 14.5H4.27778C3.29594 14.5 2.5 13.6941 2.5 12.7V5.32857C2.5 4.33445 3.29594 3.52857 4.27778 3.52857H11.3889C12.3707 3.52857 13.1667 4.33445 13.1667 5.32857Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EditableDateInput = forwardRef<HTMLInputElement, EditableDateInputProps>(
  (
    { pickerType, hasError, showSuccess, className, onClick, ...inputProps },
    ref
  ) => (
    <DateInputShell
      $hasError={hasError}
      $showSuccess={showSuccess}
      $type={pickerType}
      className={className}
    >
      <DateInputField
        {...inputProps}
        ref={ref}
        $type={pickerType}
        type="text"
        inputMode="numeric"
        maxLength={10}
        onClick={onClick}
      />
      <DateInputIcon
        $success={showSuccess}
        $type={pickerType}
        aria-hidden="true"
      >
        {showSuccess ? <SuccessIcon /> : <CalendarIcon />}
      </DateInputIcon>
    </DateInputShell>
  )
);

EditableDateInput.displayName = "EditableDateInput";

const getValidationMessage = (
  validation: DateInputValidation,
  minDate?: Date,
  maxDate?: Date
): string | null => {
  if (validation.status === "valid") return null;

  if (validation.status === "empty" || validation.status === "incomplete") {
    return `Enter the full date as ${DATE_INPUT_PLACEHOLDER}.`;
  }

  if (validation.reason === "before-min") {
    return `Choose ${formatDateInputValue(toValidDate(minDate))} or a later date.`;
  }

  if (validation.reason === "after-max") {
    return `Choose ${formatDateInputValue(toValidDate(maxDate))} or an earlier date.`;
  }

  return validation.reason === "format"
    ? `Use the ${DATE_INPUT_PLACEHOLDER} format.`
    : "Enter a real calendar date.";
};

const ModalDatePicker: FC<Props> = ({
  date,
  onChange,
  onValidityChange,
  type = "default",
  minDate,
  maxDate,
  isSuccessIcon = false,
}) => {
  const inputId = useId().replace(/:/g, "");
  const feedbackId = `${inputId}-feedback`;
  const externalDate = useMemo(() => toValidDate(date), [date]);
  const externalTimestamp = externalDate?.getTime() ?? null;
  const minDateKey = formatDateInputValue(toValidDate(minDate));
  const maxDateKey = formatDateInputValue(toValidDate(maxDate));
  const [calendarDate, setCalendarDate] = useState(externalDate);
  const [inputValue, setInputValue] = useState(() =>
    formatDateInputValue(externalDate)
  );
  const [inputError, setInputError] = useState<string | null>(null);
  const [isInputValid, setIsInputValid] = useState(true);
  const [hasInvalidDraft, setHasInvalidDraft] = useState(false);

  useEffect(() => {
    // Keep the last calendar selection while an invalid manual draft is
    // visible so recovery only takes one calendar click.
    if (hasInvalidDraft && !externalDate) return;

    const formattedDate = formatDateInputValue(externalDate);
    const validation = externalDate
      ? validateDateInput(formattedDate, minDate, maxDate)
      : null;
    const isValid = !validation || validation.status === "valid";

    setCalendarDate(externalDate);
    setInputValue(formattedDate);
    setInputError(
      validation && validation.status !== "valid"
        ? getValidationMessage(validation, minDate, maxDate)
        : null
    );
    setIsInputValid(isValid);
    onValidityChange?.(isValid);
    // Date object identities often change during modal renders. Calendar-day
    // keys keep this sync effect stable while the user is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTimestamp, minDateKey, maxDateKey]);

  const updateValidity = (isValid: boolean) => {
    setIsInputValid(isValid);
    onValidityChange?.(isValid);
  };

  const handleRawChange = (event: React.SyntheticEvent<HTMLElement>) => {
    const eventValue = getDateInputEventValue(
      event.target as { nodeName?: string; value?: unknown }
    );

    // react-datepicker also calls onChangeRaw with the calendar day's mouse
    // event. It must pass through untouched so handleSelect can finish.
    if (eventValue === null) return;

    const nextValue = normalizeDateInput(eventValue);
    const validation = validateDateInput(nextValue, minDate, maxDate);

    setInputValue(nextValue);

    if (validation.status === "valid") {
      const canonicalValue = formatDateInputValue(validation.date);

      setInputValue(canonicalValue);
      setInputError(null);
      setHasInvalidDraft(false);
      updateValidity(true);

      // Continue through react-datepicker's strict parser so its internal
      // preSelection and displayed month stay in sync for keyboard controls.
      (event.target as HTMLInputElement).value = canonicalValue;
      return;
    }

    // Block react-datepicker's fallback parser for malformed/partial values.
    event.preventDefault();
    setHasInvalidDraft(true);
    updateValidity(false);
    if (externalDate) {
      onChange(null);
    }
    setInputError(
      validation.status === "invalid"
        ? getValidationMessage(validation, minDate, maxDate)
        : null
    );
  };

  const handleInputBlur = () => {
    const validation = validateDateInput(inputValue, minDate, maxDate);

    if (validation.status !== "valid") {
      const validationMessage = getValidationMessage(
        validation,
        minDate,
        maxDate
      );

      // Consumers without a validity callback cannot block their submit
      // action. Restore the committed value so their visible field and form
      // value cannot silently diverge after the popper closes.
      if (externalDate && !onValidityChange) {
        setCalendarDate(externalDate);
        setInputValue(formatDateInputValue(externalDate));
        setInputError(
          `${validationMessage ?? "Invalid date."} The previous date was kept.`
        );
        setHasInvalidDraft(false);
        setIsInputValid(true);
        return;
      }

      setInputError(validationMessage);
      updateValidity(false);
      return;
    }

    setInputError(null);
    setHasInvalidDraft(false);
    updateValidity(true);
  };

  const handleCalendarChange = (newDate: Date | null) => {
    const validation = newDate
      ? validateDateInput(formatDateInputValue(newDate), minDate, maxDate)
      : null;

    if (!newDate || !validation || validation.status !== "valid") return;

    setCalendarDate(newDate);
    setInputValue(formatDateInputValue(newDate));
    setInputError(null);
    setHasInvalidDraft(false);
    updateValidity(true);
    onChange(newDate);
  };

  const renderHeader = ({
    date: headerDate,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: ReactDatePickerCustomHeaderProps) => (
    <CustomDateHeaderWrapper>
      <button
        type="button"
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        aria-label="Previous month"
        title="Previous month"
      >
        <ArrowRightIcon fill="currentColor" />
      </button>
      <span aria-live="polite">{moment(headerDate).format("MMMM YYYY")}</span>
      <button
        type="button"
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        aria-label="Next month"
        title="Next month"
      >
        <ArrowRightIcon fill="currentColor" />
      </button>
    </CustomDateHeaderWrapper>
  );

  return (
    <DatePickerWrapper>
      <DatePicker
        id={inputId}
        selected={calendarDate}
        value={inputValue}
        onChange={handleCalendarChange}
        onChangeRaw={handleRawChange}
        onBlur={handleInputBlur}
        onCalendarClose={handleInputBlur}
        customInput={
          <EditableDateInput
            pickerType={type}
            hasError={!isInputValid}
            showSuccess={Boolean(calendarDate) && isSuccessIcon && isInputValid}
            className={
              type === "small" ? "custom-input small-picker" : "custom-input"
            }
            aria-label="Date, day month year"
          />
        }
        renderCustomHeader={renderHeader}
        calendarStartDay={1}
        dateFormat={DATE_INPUT_FORMAT}
        placeholderText={DATE_INPUT_PLACEHOLDER}
        strictParsing
        fixedHeight
        focusSelectedMonth
        minDate={minDate}
        maxDate={maxDate}
        ariaInvalid={String(!isInputValid)}
        ariaDescribedBy={inputError ? feedbackId : undefined}
        autoComplete="off"
        popperClassName="modal-date-picker-popper"
        portalId="modal-date-picker-portal"
        popperPlacement="bottom-start"
        showPopperArrow={false}
        previousMonthAriaLabel="Previous month"
        nextMonthAriaLabel="Next month"
      />
      {inputError && (
        <DatePickerFeedback
          $type={type}
          id={feedbackId}
          role="alert"
          aria-live="polite"
        >
          {inputError}
        </DatePickerFeedback>
      )}
    </DatePickerWrapper>
  );
};

export default ModalDatePicker;
