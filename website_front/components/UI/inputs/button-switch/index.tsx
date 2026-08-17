/* eslint-disable */
import React from "react";
import styled from "styled-components";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: any;
  rightIcon?: any;
  className?: string | "bg-switch";
  disableLeft?: boolean;
  disableRight?: boolean;
}

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;

  &.bg-switch {
    max-width: fit-content;
    margin-left: auto;
    background: #f9f9f9;
    border-radius: 8px;
    padding: 4px;
  }

  &.crypto-switch {
    min-width: 250px;

    div {
      width: 50%;
      text-align: center;
    }
  }

  @media (max-width: 767px) {
    &.bg-switch {
      margin-left: 0;
      width: 100%;
      justify-content: space-between;
      padding: 4px 6px;
    }

    &.crypto-switch {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: -4px;
      min-width: 180px;

      & > div {
        padding: 4px 0;
      }
    }
  }

  @media (max-width: 480px) {
    &.crypto-switch {
      position: absolute;
      left: 80px;
      transform: translateX(0);
      top: -4px;
      min-width: 140px;
    }
  }
`;

const Label = styled.div<{ checked: boolean; disabled?: boolean }>`
  color: ${({ checked }) => (checked ? "#04A584" : "#738094")};
  font-weight: ${({ checked }) => (checked ? 600 : 600)};
  padding: 6px 20px;
  box-shadow: ${({ checked }) => (checked ? "2px 2px 8px 0px #00053014" : "")};
  border-radius: 8px;

  background: ${({ checked }) => (checked ? "white" : "#F9F9F9")};
  transition: opacity 0.3s ease;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  
  &:hover{
    opacity: ${({ disabled }) => (disabled ? 0.4 : 0.6)};
  }

  &:active{
    opacity: ${({ disabled }) => (disabled ? 0.4 : 0.4)};
  }


`;

const LabelWrapper = styled.div<{ checked: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${({ checked }) => (checked ? "#04A584" : "#738094")};
  font-weight: ${({ checked }) => (checked ? 600 : 500)};
  padding: 4px 14px;
  box-shadow: ${({ checked }) => (checked ? "2px 2px 8px 0px #00053014" : "")};
  border-radius: 4px;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};

  span {
    font-size: 14px;
  }

  path {
    fill: ${({ checked }) => (checked ? "#04A584" : "#738094")};
  }

  @media (max-width: 575px) {
    padding: 4px 10px;
    span {
      font-size: 13px;
    }
  }

  
`;

const ButtonSwitch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  leftLabel,
  rightLabel,
  className,
  leftIcon,
  rightIcon,
  disableLeft = false,
  disableRight = false,
}) => {
  const handleClick = () => {
    if ((!checked && disableRight) || (checked && disableLeft)) {
      return;
    }
    onChange(!checked);
  };

  return (
    <SwitchContainer className={className} onClick={handleClick}>
      {leftIcon && leftLabel ? (
        <LabelWrapper
          checked={!checked}
          disabled={disableLeft}
          className={`left-label ${!checked ? "active" : ""}`}
        >
          {leftIcon}
          <span>{leftLabel}</span>
        </LabelWrapper>
      ) : leftLabel ? (
        <Label checked={!checked} disabled={disableLeft}>{leftLabel}</Label>
      ) : (
        <></>
      )}
      {rightIcon && rightLabel ? (
        <LabelWrapper checked={checked} disabled={disableRight}>
          {rightIcon}
          <span>{rightLabel}</span>
        </LabelWrapper>
      ) : rightLabel ? (
        <Label checked={checked} disabled={disableRight}>{rightLabel}</Label>
      ) : (
        <></>
      )}
    </SwitchContainer>
  );
};

export default ButtonSwitch;
