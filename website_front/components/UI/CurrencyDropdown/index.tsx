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

const CurrencyDropdown: FC<Props> = ({ options, value, onChange }) => {
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
    <DropdownWrapper ref={dropdownRef} style={{ width: "max-content" }}>
      <DropdownButton
        onClick={handleToggle}
        isOpen={isOpen}
        style={{
          width: "100%",
          height: "32px",
          justifyContent: "space-between",
          padding: "6px 12px",
          minHeight: "32px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#738094", fontSize: "13px" }}>Sort by:</span>
          <span style={{ fontWeight: "var(--font-weight-semibold)", fontSize: "13px" }}>{value}</span>
        </span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </DropdownButton>

      <DropdownMenu isVisible={isOpen}>
        <OptionsList>
          {options.map((option) => (
            <OptionItem
              key={option}
              onClick={() => handleOptionClick(option)}
              isSelected={value === option}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "4px 0px",
                justifyContent: "space-between",
              }}
            >
              <span>{option}</span>
              {value === option && (
                <span
                  style={{
                    color: "#04A584",
                    fontSize: "16px",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  ✓
                </span>
              )}
            </OptionItem>
          ))}
        </OptionsList>
      </DropdownMenu>
    </DropdownWrapper>
  );
};

export default CurrencyDropdown;
