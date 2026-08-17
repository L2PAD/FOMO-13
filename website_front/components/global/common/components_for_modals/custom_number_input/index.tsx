import React, { FC, useEffect, useState } from "react";
import { InputError } from "../../../../layouts/projects/modals/CreateOwnAsset/styles";
import { ErrorWrapper, Input, Label, Wrapper } from "./styles";
import LottieError from '../../../../../assets/animations/error.json'
import { ErrorContainer } from "../input_with_label";
import SuccessIcon from "../../../Icons/Deals/SuccessIcon";
import dynamic from "next/dynamic";

const Lottie = dynamic(
  () => import("../../../LottieClient/index"),
  { ssr: false }
);


interface Props {
  name?: string;
  type?: string;
  onChange: (value: number, name?: string) => void;
  value?: number;
  label?: string;
  placeholder?: string;
  isError?: boolean;
  errorText?: string;
  icon?: "dollar" | "close" | string;
  isPrice?: boolean;
  isSuccess?: boolean
  maxDecimals?: number;
}

const trimDecimalZeros = (value: string): string => {
  return value.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
};

const formatDecimalPart = (num: number, maxDecimals?: number): string => {
  if (!Number.isFinite(num)) return "";
  if (maxDecimals === undefined) return String(num);

  return trimDecimalZeros(num.toFixed(maxDecimals));
};

const formatFocusedValue = (num: number, maxDecimals?: number): string => {
  if (!Number.isFinite(num) || num === 0) return "";

  const isNegative = num < 0;
  const absoluteNum = Math.abs(num);
  const [rawIntPart, rawDecimalPart = ""] = formatDecimalPart(
    absoluteNum,
    maxDecimals
  ).split(".");
  const intPart = rawIntPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decimalPart = rawDecimalPart ? `.${rawDecimalPart}` : "";

  return `${isNegative ? "-" : ""}${intPart}${decimalPart}`;
};

const formatWithSuffix = (num: number, maxDecimals?: number): string => {
  if (num === 0) return "";

  const absoluteNum = Math.abs(num);
  const isNegative = num < 0;

  if (absoluteNum >= 1_000_000_000) {
    const formatted = `${(absoluteNum / 1_000_000_000).toFixed(2)}B`;
    return isNegative ? `-${formatted}` : formatted;
  }
  if (absoluteNum >= 1_000_000) {
    const formatted = `${(absoluteNum / 1_000_000).toFixed(2)}M`;
    return isNegative ? `-${formatted}` : formatted;
  }

  if (absoluteNum >= 1) {
    const parts = absoluteNum.toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const decimalPart = parts[1];
    const formatted = decimalPart === "00" ? intPart : `${intPart}.${decimalPart}`;
    return isNegative ? `-${formatted}` : formatted;
  }

  const formatted = formatDecimalPart(absoluteNum, maxDecimals);
  return isNegative ? `-${formatted}` : formatted;
};

const parseInputValue = (input: string): number => {
  const cleaned = input.replace(/\s/g, "").replace(",", ".").toUpperCase();
  let multiplier = 1;
  let numericPart = cleaned;

  if (cleaned.endsWith("B")) {
    multiplier = 1_000_000_000;
    numericPart = cleaned.slice(0, -1);
  } else if (cleaned.endsWith("M")) {
    multiplier = 1_000_000;
    numericPart = cleaned.slice(0, -1);
  }

  const parsed = parseFloat(numericPart.replace(/,/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed * multiplier;
};

const CustomNumberInput: FC<Props> = ({
  onChange,
  label,
  value,
  placeholder,
  name,
  type = "text",
  isError,
  errorText,
  icon,
  isPrice = true,
  isSuccess = null,
  maxDecimals,
}) => {
  const [inputValue, setInputValue] = useState<string>(
    isPrice ? formatWithSuffix(value || 0, maxDecimals) : String(value)
  );
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    val = val.replace(",", ".");

    const suffixMatch = val.match(/(M|B)$/i);
    const suffix = suffixMatch ? suffixMatch[0].toUpperCase() : "";
    if (suffix) val = val.slice(0, -1);

    const [rawIntPart, rawDecimalPart] = val.split(".");

    const intPart = rawIntPart.replace(/\D/g, "");

    const isNegative = rawIntPart.includes("-");

    let newFormatted = "";

    const hasDecimalPart = rawDecimalPart !== undefined;
    const startsWithZero = intPart.startsWith("0") && intPart.length > 1;
    const isFractional = intPart === "" && hasDecimalPart;

    if (hasDecimalPart || startsWithZero || isFractional) {
      newFormatted = isNegative ? `-${intPart}` : intPart;
    } else if (isNegative && intPart === "") {
      newFormatted = "-";
    } else if (isNegative && intPart !== "") {
      const numericPart = intPart.replace("-", "");
      const formattedInt = numericPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      newFormatted = `-${formattedInt}`;
    } else {
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      newFormatted = formattedInt;
    }

    if (hasDecimalPart) {
      newFormatted += `.${rawDecimalPart.replace(/[^\d]/g, "")}`;
    }
    newFormatted += suffix;

    setInputValue(newFormatted);

    const parsed = parseInputValue(newFormatted);
    onChange(parsed, name);
  };

  const handleFocus = () => {
    setIsFocused(true);
    const formatted = formatFocusedValue(value || 0, maxDecimals);
    setInputValue(formatted);
  };

  const handleBlur = () => {
    if (!isPrice) return;
    setIsFocused(false);
    const parsed = parseInputValue(inputValue);
    const formatted = formatWithSuffix(parsed, maxDecimals);
    setInputValue(formatted);
  };

  const getIcon = (): React.ReactNode => {
    if (!icon) return null;
    if (icon === "dollar") return <div className="left-icon">$</div>;
    if (icon === "dollar-right") return <div className="right-icon">$</div>;
    if (icon === "close") {
      return (
        <div className="left-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="7"
            height="7"
            viewBox="0 0 7 7"
            fill="none"
          >
            <path
              d="M6.86 7H5.754L3.57 4.116L1.386 7H0.28L3.024 3.374L0.462 0H1.568L3.57 2.646L5.572 0H6.678L4.13 3.374L6.86 7Z"
              fill="#738094"
            />
          </svg>
        </div>
      );
    }
    return <div className="right-icon-text">{icon}</div>;
  };

  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatWithSuffix(value || 0, maxDecimals));
    }
  }, [value, isFocused, maxDecimals]);

  return (
    <ErrorWrapper className="number-input-wrapper">
      <Wrapper isValue={!!inputValue.length} className={icon}>
        {icon && getIcon()}
        {label && <Label>{label}</Label>}
        <Input
          placeholder={placeholder || ""}
          type={type}
          inputMode="decimal"
          value={inputValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={isError ? 'error' : isSuccess ? 'success' : ''}
        />
        {
          isSuccess
            ?
            <div className="success-icon">
              <SuccessIcon />
            </div>
            :
            null
        }
      </Wrapper>
      {isError && errorText && (
        <ErrorContainer>
          <Lottie animationData={LottieError} />
          <InputError>{errorText}</InputError>
        </ErrorContainer>
      )}
    </ErrorWrapper>
  );
};

export default CustomNumberInput;
