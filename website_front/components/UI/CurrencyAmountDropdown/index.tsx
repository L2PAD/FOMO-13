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
  CurrencyIcon,
  CurrencyCode,
  CheckMark,
  ButtonContent,
  AmountInput,
  SelectedCurrency,
} from "./styles";

export interface CurrencyOption {
  code: string;
  name: string;
  icon: string;
  color: string;
}

interface Props {
  options: CurrencyOption[];
  value: string;
  placeholder?: string;
  amount?: string;
  onChange: (value: string) => void;
  onAmountChange?: (amount: string) => void;
}

const CurrencyAmountDropdown: FC<Props> = ({
  options,
  value,
  placeholder = "Transaction amount",
  amount = "",
  onChange,
  onAmountChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.code === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") {
      return;
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery("");
    }
  };

  const handleOptionClick = (option: CurrencyOption) => {
    onChange(option.code);
    setIsOpen(false);
    setSearchQuery("");
  };

  const filteredOptions = options.filter(
    (option) =>
      option.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DropdownWrapper ref={dropdownRef}>
      <DropdownButton
        className={amount ? 'success' : ''}
        onClick={handleToggle} isOpen={isOpen}>
        <ButtonContent>
          <AmountInput
            type="text"
            placeholder={placeholder}
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onAmountChange?.(e.target.value)
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
          {selectedOption && (
            <SelectedCurrency onClick={handleToggle}>
              <CurrencyIcon color={selectedOption.color}>
                {selectedOption.icon}
              </CurrencyIcon>
              <span>{selectedOption.code}</span>
            </SelectedCurrency>
          )}
        </ButtonContent>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </DropdownButton>

      <DropdownMenu
        className="custom-dropdown-menu"
        isVisible={isOpen}
      >
        <SearchWrapper>
          <Search size={16} />
          <SearchInput
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            autoFocus
          />
        </SearchWrapper>

        <OptionsList>
          {filteredOptions.map((option) => (
            <OptionItem
              key={option.code}
              onClick={() => handleOptionClick(option)}
              isSelected={value === option.code}
            >
              <CurrencyIcon color={option.color}>{option.icon}</CurrencyIcon>
              <CurrencyCode>{option.code}</CurrencyCode>
              {value === option.code && <CheckMark>✓</CheckMark>}
            </OptionItem>
          ))}
        </OptionsList>
      </DropdownMenu>
    </DropdownWrapper>
  );
};

export default CurrencyAmountDropdown;
