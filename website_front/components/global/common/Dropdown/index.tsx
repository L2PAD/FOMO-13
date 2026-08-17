import React, { FC, useState } from "react";
import Typography from "../Typography";
import {
  Arrow,
  DropdownBlock,
  DropdownWrapper,
  LabelWrapper,
  OptionItem,
} from "./styles";

export interface DropdownInterface {
  label?: string;
  placeholder?: string;
  onChange: ({ value, name }: { value: string; name: string }) => void;
  value: { value: string; name: string } | null;
  options: { value: string; name: string }[];
  className?: string;
}

const Dropdown: FC<DropdownInterface> = ({
  label,
  onChange,
  value,
  options,
  className,
  placeholder,
}) => {
  const [active, setActive] = useState(false);

  return (
    <DropdownWrapper
      className={className}
      onClick={() => setActive((state) => !state)}
      onMouseLeave={() => setActive(false)}
    >
      <LabelWrapper active={active} className="label-wrapper">
        <Typography variant="p">
          {value ? (
            <>
              {label && `${label}:`} <span>{value.name}</span>
            </>
          ) : (
            placeholder
          )}
        </Typography>
        <Arrow active={active} />
      </LabelWrapper>
      {active && (
        <DropdownBlock className="dropdown-class-name">
          {options.map((item, i) => {
            return (
              <OptionItem
                key={i}
                onClick={() => {
                  onChange(item);
                }}
              >
                <Typography variant="p">{item.name}</Typography>
              </OptionItem>
            );
          })}
        </DropdownBlock>
      )}
    </DropdownWrapper>
  );
};

export default Dropdown;
