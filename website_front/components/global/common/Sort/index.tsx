/* eslint-disable */
import React, { useState } from "react";
import { Arrow, DropdownBlock, DropdownWrapper, LabelWrapper } from "./styles";
import Typography from "../Typography";
import Checkbox from "../Checkbox";
import { AnyAaaaRecord } from "dns";

export interface Option {
  label: string;
  items: string[];
  value: any;
  setValue: (name: any) => void;
}

export interface Props {
  label: string;
  type: string;
  className?: string;
  options: Option[];
}

export const Sort = ({ label, type, className, options }: Props) => {
  const [active, setActive] = useState(false);

  return (
    <DropdownWrapper
      className={className}
      onClick={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <LabelWrapper className="label-wrapper">
        <Typography variant="p">
          {label}: <span>{type}</span>
        </Typography>
        <Arrow active={active} />
      </LabelWrapper>
      {active && (
        <DropdownBlock>
          {options.map((option) => (
            <>
              {option.label}:
              {option.items.map((item) => (
                <Checkbox
                  checked={option.value === item}
                  onChange={() =>
                    option.setValue(option.value === item ? "" : item)
                  }
                  label={item}
                />
              ))}
            </>
          ))}
        </DropdownBlock>
      )}
    </DropdownWrapper>
  );
};
