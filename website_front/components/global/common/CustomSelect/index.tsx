import React, { ReactElement, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import SuccessIcon from "../../Icons/Deals/SuccessIcon";
import { mainGlobalDark } from "../../../../styles/mainGlobalDark";

export interface Option {
  value: string;
  label: string;
  icon?: ReactElement
}

export interface OptionWithSection {
  title: string;
  items: Option[];
}

interface SelectProps {
  isModalOpen?: boolean
  isSuccessIcon?: boolean
  options: Option[];
  optionsWithSection?: OptionWithSection[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string | "small-select";
}

type SelectVariant = "default" | "dark";

const SelectWrapper = styled.div`
  position: relative;
  height: 30px;

  &.currency-select {
    width: 135px;
  }

  &.small-select {
    button {
      font-weight: var(--font-weight-semibold);
    }
    &:not(.market-project-select) path {
      stroke: black;
      stroke-width: 1px;
    }

    &.market-project-select {
      height: 40px;
      min-width: 96px;

      path {
        stroke: currentColor;
        stroke-width: 2px;
      }

      button {
        height: 40px;
        padding: 8px 12px;
      }
    }
  }
`;

const SelectButton = styled.button<{
  isOpen: boolean;
  $variant?: SelectVariant;
}>`
  position: relative;
  width: 100%;
  padding: 7px 12px;
  background-color: ${({ $variant }) =>
    $variant === "dark" ? mainGlobalDark.backgroundHover : "#fff"};
  border: ${({ $variant }) =>
    $variant === "dark"
      ? "1px solid rgba(255, 255, 255, 0.08)"
      : "none"};
  box-shadow: ${({ $variant }) =>
    $variant === "dark" ? "none" : "2px 2px 8px 0px #00053014"};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: ${({ isOpen, $variant }) =>
    $variant === "dark" ? (isOpen ? "8px 8px 0 0" : "8px") : isOpen ? "4px 4px 0 0" : "4px"};
  color: ${({ $variant }) =>
    $variant === "dark" ? mainGlobalDark.text : "#070b35"};
  transition: box-shadow 0.3s ease,opacity 0.3s ease;
  height: 38px;

  & .selected-value{
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: var(--font-weight-medium);
  }
  
  & .selected-icon{
    div{
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: #ffbc00;
    }
  }

  &:focus {
    outline: none;
  }

  &:hover{
    box-shadow: ${({ $variant }) =>
      $variant === "dark"
        ? "0 0 0 3px rgba(0, 221, 115, 0.12)"
        : "4px 4px 6px 0px #00021037"};
    opacity: ${({ $variant }) => ($variant === "dark" ? 1 : 0.8)};
    background-color: ${({ $variant }) =>
      $variant === "dark" ? mainGlobalDark.background : "#fff"};
  }

  .arrow {
    height: 13px;
    transition: transform 0.2s;
    transform: ${(props) => (props.isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  }

  & .success-icon{
    svg{
      width: 24px;
      height: 24px;
    }
  }

  &.selected{
    border: 1px solid
      ${({ $variant }) =>
        $variant === "dark" ? "rgba(0, 221, 115, 0.38)" : "var(--main-green)"};
    border-radius: 8px;
    box-shadow: none;
  }
`;

const Dropdown = styled.div<{
  isOpen: boolean;
  $variant?: SelectVariant;
}>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: ${(props) => (props.isOpen ? "180px" : "0")};
  overflow-y: auto;
  background-color: ${({ $variant }) =>
    $variant === "dark" ? mainGlobalDark.background : "#fff"};
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: ${({ $variant }) =>
    $variant === "dark"
      ? "0 14px 28px rgba(0, 0, 0, 0.22)"
      : "2px 2px 8px 0px #00053014"};
  border: ${({ $variant }) =>
    $variant === "dark"
      ? "1px solid rgba(255, 255, 255, 0.08)"
      : "none"};
  border-top: none;
  border-radius: ${({ $variant }) =>
    $variant === "dark" ? "0 0 8px 8px" : "0 0 4px 4px"};
  gap: 0px !important;

  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 0;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const Option = styled.div<{ $variant?: SelectVariant }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 14.4px;
  color: ${({ $variant }) =>
    $variant === "dark" ? mainGlobalDark.textMuted : "#738094"};
  transition: all 0.3s ease;

  &:first-child {
    padding-top: 12px;
  }

  &:hover {
    color: ${({ $variant }) =>
      $variant === "dark" ? mainGlobalDark.white : "black"};
    background-color: ${({ $variant }) =>
      $variant === "dark" ? mainGlobalDark.backgroundHover : "#ededed"};
  }

  
  & .currency-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #ffbc00;
  }
`;

const OptionWithTitle = styled.div<{ $variant?: SelectVariant }>`
  div {
    width: 100%;
    text-align: left;
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 14.4px;
    transition: all 0.3s ease;
    color: ${({ $variant }) =>
      $variant === "dark" ? mainGlobalDark.textMuted : "var(--main-gray)"};
  }

  & .title {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 100%;
    text-align: left;
    padding: 8px 12px;

    &:first-child {
      padding-top: 12px;
    }
  }

  & .default {
    cursor: pointer;
    padding: 8px 12px 8px 24px;
    &:hover {
      color: ${({ $variant }) =>
        $variant === "dark" ? mainGlobalDark.white : "black"};
      background-color: ${({ $variant }) =>
        $variant === "dark" ? mainGlobalDark.backgroundHover : "#ededed"};
    }
  }

`;

const CustomSelect: React.FC<SelectProps> = ({
  options,
  optionsWithSection,
  placeholder,
  onChange,
  className,
  isSuccessIcon = false,
  isModalOpen
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Option | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectVariant: SelectVariant = String(className || "").includes(
    "market-project-select-dark"
  )
    ? "dark"
    : "default";

  const handleSelect = (option: Option) => {
    setSelected(option);
    onChange(option.value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (!selectRef.current) return;
      if (!selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isModalOpen === false) {
      setSelected(null);
    }
  }, [isModalOpen]);

  return (
    <SelectWrapper ref={selectRef} className={className}>
      <SelectButton
        className={selected && !isOpen ? 'selected' : ''}
        onClick={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
        $variant={selectVariant}
      >
        <div className="selected-value">
          {selected?.icon ?
            <div className="selected-icon">
              {selected.icon}
            </div>
            :
            <></>
          }
          {selected ? selected.label : placeholder || <span style={{ color: 'var(--main-gray)', fontWeight: "var(--font-weight-regular)" }}>Select an option</span>}
        </div>
        {
          selected && !isOpen && isSuccessIcon
            ?
            <div className="success-icon">
              <SuccessIcon />
            </div>
            :
            <span className="arrow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M2 5L7.00081 9.58L12 5"
                  stroke="#738094"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
        }

      </SelectButton>
      <Dropdown isOpen={isOpen} $variant={selectVariant}>
        {optionsWithSection
          ? optionsWithSection.map((option: OptionWithSection, i: number) => (
            <OptionWithTitle key={`${option.title}${i}`} $variant={selectVariant}>
              <div className="title">{option.title}</div>
              <div className="section-list">
                {option.items.map((item, i) => (
                  <div
                    key={i}
                    className="default"
                    onClick={() => handleSelect(item)}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </OptionWithTitle>
          ))
          : options.map((option) => (
            <Option
              key={option.value}
              onClick={() => handleSelect(option)}
              $variant={selectVariant}
            >
              {option.icon && option.icon}
              {option.label}
            </Option>
          ))}
      </Dropdown>
    </SelectWrapper>
  );
};

export default CustomSelect;
