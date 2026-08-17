import React, { FC, useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import {
  DropdownWrapper,
  DropdownButton,
  DropdownMenu,
  SearchWrapper,
  SearchInput,
  OptionsList,
  OptionItem,
  Checkbox,
  OptionIcon,
  OptionText,
} from "./styles";
import SuccessIcon from "../../global/Icons/Deals/SuccessIcon";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
}

interface Props {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  searchable?: boolean;
  showIcons?: boolean;
  className?: string;
  isShowSuccess?: boolean;
  children?: React.ReactNode;
}

const CustomDropdown: FC<Props> = ({
  options,
  value,
  onChange,
  placeholder = "Select",
  multiSelect = false,
  searchable = true,
  showIcons = false,
  isShowSuccess = true,
  className,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleOptionClick = (optionValue: string) => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const isSelected = (optionValue: string) => {
    if (multiSelect) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  const getSelectedOption = () => {
    if (multiSelect) {
      const selectedOptions = options.filter(
        (opt) => Array.isArray(value) && value.includes(opt.value)
      );

      return selectedOptions[0];
    }

    return options.find((opt) => opt.value === value);
  };

  const getButtonText = () => {
    if (multiSelect) {
      const selectedValues = Array.isArray(value) ? value : [];
      if (selectedValues.length === 0) return placeholder;
      const selectedOptions = options.filter(
        (opt) => selectedValues.includes(opt.value)
      );
      const selectedCount = selectedOptions.length;

      if (selectedCount === 0) return placeholder;
      if (options.length > 0 && selectedCount === options.length) return "All payment methods";

      if (selectedOptions.length === 1) {
        return selectedOptions[0]?.label || placeholder;
      }

      const firstOption = selectedOptions[0];
      const remainingOptions = selectedOptions.slice(1);
      if (!firstOption) return placeholder;

      return (
        <>
          <span>{firstOption.label}</span>
          <button
            className="tooltip-button"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <span style={{ color: "#04A584" }}>+{remainingOptions.length}</span>
            <span className="tooltip-text" style={{ textAlign: "left" }}>
              {remainingOptions.map((opt) => (
                <p key={opt.value}>{opt.label}</p>
              ))}
            </span>
          </button>
        </>
      );
    }
    const selectedOption = getSelectedOption();
    return selectedOption ? selectedOption.label : placeholder;
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const selectedOption = getSelectedOption();

  return (
    <DropdownWrapper ref={dropdownRef} className={className}>
      <DropdownButton
        className={value?.length ? "button selected" : "button"}
        onClick={handleToggle}
        isOpen={isOpen}
      >
        {children}
        {showIcons && selectedOption?.icon && (
          <div className="button-icon">
            <img src={selectedOption.icon} alt={selectedOption.label} />
          </div>
        )}
        {getButtonText()}
        {value?.length && !isOpen && isShowSuccess ? (
          <div className="success-icon">
            <SuccessIcon />
          </div>
        ) : isOpen ? (
          <div className="chevron">
            <ChevronUp size={16} />
          </div>
        ) : (
          <div className="chevron">
            <ChevronDown size={16} />
          </div>
        )}
      </DropdownButton>

      <DropdownMenu className="custom-dropdown-menu" isVisible={isOpen}>
        {searchable && (
          <SearchWrapper>
            <Search size={16} color="#738094" />
            <SearchInput
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
            />
          </SearchWrapper>
        )}

        <OptionsList>
          {filteredOptions.map((option) => (
            <OptionItem
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              isSelected={isSelected(option.value)}
            >
              {multiSelect && (
                <Checkbox isChecked={isSelected(option.value)}>
                  {isSelected(option.value) && (
                    <svg
                      width="12"
                      height="9"
                      viewBox="0 0 12 9"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 4L4.5 7.5L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Checkbox>
              )}
              {showIcons && option.icon && (
                <OptionIcon>
                  <img src={option.icon} alt={option.label} />
                </OptionIcon>
              )}
              <OptionText>{option.label}</OptionText>
            </OptionItem>
          ))}
        </OptionsList>
      </DropdownMenu>
    </DropdownWrapper>
  );
};

export default CustomDropdown;
