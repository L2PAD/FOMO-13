import React, { FC, useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  DropdownWrapper,
  DropdownButton,
  DropdownMenu,
  OptionsList,
  OptionItem,
} from "../CustomDropdown/styles";

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

const TimeDropdown: FC<Props> = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <DropdownWrapper ref={dropdownRef}>
      <DropdownButton onClick={handleToggle} isOpen={isOpen}>
        {value}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </DropdownButton>

        <DropdownMenu isVisible={isOpen}>
          <OptionsList>
            {options.map((option) => (
              <OptionItem
                key={option}
                onClick={() => handleOptionClick(option)}
                isSelected={value === option}
              >
                {option}
              </OptionItem>
            ))}
          </OptionsList>
        </DropdownMenu>
    </DropdownWrapper>
  );
};

export default TimeDropdown;
