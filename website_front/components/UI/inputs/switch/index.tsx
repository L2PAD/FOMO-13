/* eslint-disable */
import React from "react";
import styled from "styled-components";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
  variant?: "small" | "default";
  disabled?: boolean;
}

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const Slider = styled.div<{ checked: boolean }>`
  position: relative;
  width: 50px;
  height: 25px;
  background-color: ${({ checked }) => (checked ? "#04A584" : "#ccc")};
  border-radius: 25px;
  transition: background-color 0.3s;

  &:before {
    position: absolute;
    content: "";
    height: 21px;
    width: 21px;
    left: ${({ checked }) => (checked ? "calc(100% - 23px)" : "2px")};
    bottom: 2px;
    background-color: white;
    border-radius: 50%;
    transition: left 0.3s;
  }
  &.small {
    width: 28px;
    height: 17px;
    &:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: ${({ checked }) => (checked ? "calc(100% - 16px)" : "2px")};
      bottom: 2px;
      background-color: white;
      border-radius: 50%;
      transition: left 0.3s;
    }
  }
`;

const Label = styled.div<{ checked: boolean }>`
  color: ${({ checked }) => (checked ? "#04A584" : "#ccc")};
  font-weight: ${({ checked }) => (checked ? 500 : 400)};
`;

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  leftLabel,
  rightLabel,
  disabled,
  variant = "default",
}) => {
  const handleClick = () => {
    if (disabled) return;

    onChange(!checked);
  };

  return (
    <SwitchContainer
      style={disabled ? { cursor: "not-allowed" } : {}}
      onClick={handleClick}
      className={variant}
    >
      {leftLabel ? <Label checked={!checked}>{leftLabel}</Label> : <></>}
      <Slider className={variant} checked={checked} />
      {rightLabel ? (
        <Label className="switch-right-label" checked={checked}>
          {rightLabel}
        </Label>
      ) : (
        <></>
      )}
    </SwitchContainer>
  );
};

export default Switch;
