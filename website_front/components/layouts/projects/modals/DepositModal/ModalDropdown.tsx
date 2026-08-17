import React, { FC, useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as S from "./dropdownStyles";
import SuccessIcon from "../../../../global/Icons/Deals/SuccessIcon";

export interface DropdownOption {
  name: string;
  value: string;
  icon?: string | React.ReactNode;
  fee?: number;
}

interface Props {
  isSuccessIcon?:boolean
  options: DropdownOption[];
  value: DropdownOption | null;
  onChange: (value: DropdownOption) => void;
  placeholder?: string;
  showFee?: boolean;
}

const ModalDropdown: FC<Props> = ({
  options,
  value,
  onChange,
  placeholder = "Select",
  showFee = false,
  isSuccessIcon = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const renderIcon = (icon: ReactNode | string | undefined, size: number = 20) => {
    if (!icon) return <span style={{ fontSize: 16 }}>🔹</span>;

    if (typeof icon === 'string') {
      if (icon.startsWith('http') || icon.startsWith('/')) {
        return (
          <S.OptionIcon>
            <img
              src={icon}
              alt=""
              width={size}
              height={size}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </S.OptionIcon>
        );
      }
      return <S.OptionIcon>{icon}</S.OptionIcon>;
    }

    return <S.OptionIcon>{icon}</S.OptionIcon>;
  };

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

  const handleOptionClick = (option: DropdownOption) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <S.DropdownWrapper ref={dropdownRef}>
      <S.DropdownButton className={value ? 'selected' : ''} onClick={handleToggle} isOpen={isOpen}>
        {
          value
            ?
            <S.ButtonContent>
              {renderIcon(value.icon)}
              <S.OptionText>
                {value.name}
              </S.OptionText>
            </S.ButtonContent>
            :
            <S.ButtonContent className="empty">
              Select an option
            </S.ButtonContent>
        }
        {
          value && !isOpen && isSuccessIcon
            ?
            <div className="success-icon">
              <SuccessIcon />
            </div>
            :
            isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />
        }
      </S.DropdownButton>
      <S.DropdownMenu
        isOpen={isOpen}
      >
        <S.OptionsList>
          {options.map((option) => (
            <S.OptionItem
              key={option.value}
              onClick={() => handleOptionClick(option)}
              isSelected={value?.value === option.value}
            >
              {option.icon && (
                <S.OptionIcon>
                  {typeof option.icon === "string" ? (
                    <span>{option.icon}</span>
                  ) : (
                    option.icon
                  )}
                </S.OptionIcon>
              )}
              <S.OptionText>
                {option.name}
              </S.OptionText>
              {value?.value === option.value && <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M7.16667 0.5L2.19478 4.5L0.5 3.13651" stroke="#05A584" stroke-linecap="round" stroke-linejoin="round" />
              </svg>}
            </S.OptionItem>
          ))}
        </S.OptionsList>
      </S.DropdownMenu>
    </S.DropdownWrapper>
  );
};

export default ModalDropdown;
