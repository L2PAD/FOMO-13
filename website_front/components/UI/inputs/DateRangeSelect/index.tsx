import React, { FC, useState, useRef, useEffect } from "react";
import * as S from "./styles";

interface DateRangeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
}

const options = [
  { label: "24h", value: "24h" },
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "1h", value: "1h" },
  { label: "7d", value: "7d" },
  { label: "1y", value: "1y" },
];

const DateRangeSelect: FC<DateRangeSelectProps> = ({
  value = "24h",
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    if (onChange) {
      onChange(optionValue);
    }
  };

  return (
    <S.Container ref={dropdownRef}>
      <S.SelectButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        <S.SelectedValue>{selectedOption?.label}</S.SelectedValue>
        <S.Arrow isOpen={isOpen}>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="#738094"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </S.Arrow>
      </S.SelectButton>

      {isOpen && (
        <S.Dropdown>
          {options.map((option) => (
            <S.Option
              key={option.value}
              onClick={() => handleSelect(option.value)}
              isSelected={option.value === selectedValue}
            >
              {option.label}
            </S.Option>
          ))}
        </S.Dropdown>
      )}
    </S.Container>
  );
};

export default DateRangeSelect;
