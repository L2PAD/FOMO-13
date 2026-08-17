import React, { FC, useEffect, useState } from "react";
import { InputError } from "../../../../layouts/projects/modals/CreateOwnAsset/styles";
import { Input, Label, LinkIconWrapper } from "./styles";
import LottieError from '../../../../../assets/animations/error.json'
import styled from "styled-components";
import dynamic from "next/dynamic";

const Lottie = dynamic(
  () => import("../../../LottieClient/index"),
  { ssr: false }
);

export const INPUT_ERROR_TIME = 5000;

export const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
  animation: fadeOut 5s ease-in-out forwards;
  
  @keyframes fadeOut {
    0% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
`;

interface Props {
  name?: string;
  type?: string;
  onChange: (value: any, name?: string) => void;
  value: any;
  label?: string;
  placeholder?: string;
  isError?: boolean;
  errorText?: string;
  leftIcon?: boolean;
  disabled?: boolean;
}

const InputWithLabel: FC<Props> = ({
  onChange,
  label,
  value,
  placeholder,
  name,
  type,
  isError,
  errorText,
  leftIcon,
  disabled,
}) => {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (isError && errorText) {
      setShowError(true);

      const timer = setTimeout(() => {
        setShowError(false);
      }, INPUT_ERROR_TIME);

      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [isError, errorText]);

  return (
    <div style={{ position: "relative" }}>
      {leftIcon ? (
        <LinkIconWrapper className="link-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="17"
            viewBox="0 0 16 17"
            fill="none"
          >
            <path
              d="M4.91998 7.29253L3.43101 8.7815C2.87492 9.33759 2.55514 10.0942 2.56098 10.8894C2.56683 11.6846 2.87961 12.4459 3.46209 13.0104C4.02655 13.5929 4.78797 13.9057 5.58305 13.9115C6.39626 13.9175 7.135 13.6157 7.69112 13.0596L9.18009 11.5706M11.082 9.70514L12.5709 8.21617C13.127 7.66008 13.4468 6.90344 13.441 6.10823C13.4351 5.31302 13.1223 4.55177 12.5399 3.98728C11.9755 3.42295 11.2142 3.11015 10.419 3.1043C9.62383 3.09846 8.86708 3.40009 8.31096 3.9562L6.82199 5.44517M5.74305 10.7169L10.21 6.25004"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </LinkIconWrapper>
      ) : (
        <></>
      )}
      {label && <Label>{label}</Label>}
      <Input
        disabled={!!disabled}
        className={leftIcon ? "left-icon" : ""}
        placeholder={placeholder || ""}
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value, name)}
      />
      {showError && errorText ? (
        <ErrorContainer>
          <Lottie animationData={LottieError} />
          <InputError>{errorText}</InputError>
        </ErrorContainer>
      ) : (
        <></>
      )}
    </div>
  );
};

export default InputWithLabel;