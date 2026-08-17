import React, { FC } from "react";
import styled from "styled-components";

interface Props {
  label: string;
  value: string;
  name: string;
  checked: boolean;
  onChange: () => void;
  className?: string;
}

const RadioButtonWrapper = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16px;
  color: #070b35;
  user-select: none;

  input[type="radio"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  .radio-checkmark {
    position: relative;
    width: 20px;
    height: 20px;
    border: 2px solid #e0e0e0;
    border-radius: 50%;
    margin-right: 12px;
    transition: all 0.3s ease;

    &::after {
      content: "";
      position: absolute;
      display: none;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #04a584;
    }
  }

  input[type="radio"]:checked ~ .radio-checkmark {
    border-color: #04a584;

    &::after {
      display: block;
    }
  }

  &:hover input[type="radio"] ~ .radio-checkmark {
    border-color: #04a584;
  }
`;

const RadioButton: FC<Props> = ({
  label,
  value,
  name,
  checked,
  onChange,
  className,
}) => {
  return (
    <RadioButtonWrapper className={className}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <span className="radio-checkmark"></span>
      {label}
    </RadioButtonWrapper>
  );
};

export default RadioButton;
