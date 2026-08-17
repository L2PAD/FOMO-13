import React, { FC, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  DropdownList,
  OptionButton,
  SelectButton,
  SelectLabel,
  SelectRoot,
} from "./styles";

export interface FormSelectOption {
  value: string;
  label: string;
}

interface Props {
  options: FormSelectOption[];
  value: string;
  onChange: (value: string) => void;
  labelText?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

const SelectedIcon: FC = () => (
  <svg
    width="12"
    height="9"
    viewBox="0 0 12 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 4L4.5 7.5L11 1"
      stroke="#04a584"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FormSelect: FC<Props> = ({
  options,
  value,
  onChange,
  labelText,
  placeholder = "Select",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLLabelElement>(null);
  const selectedOption = options.find((option) => option.value === value);

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

  const handleSelect = (option: FormSelectOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <SelectRoot ref={selectRef} className={className}>
      {labelText ? <SelectLabel>{labelText}</SelectLabel> : <></>}
      <SelectButton
        type="button"
        isOpen={isOpen}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>{selectedOption?.label || placeholder}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </SelectButton>
      <DropdownList isOpen={isOpen}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <OptionButton
              type="button"
              key={option.value}
              isSelected={isSelected}
              onClick={() => handleSelect(option)}
            >
              <span>{option.label}</span>
              {isSelected ? <SelectedIcon /> : <></>}
            </OptionButton>
          );
        })}
      </DropdownList>
    </SelectRoot>
  );
};

export default FormSelect;
