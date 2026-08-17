import React, { FC, useEffect, useState } from "react";
import {
  CheckboxWrapper,
  Checkmark,
  InputStyle,
  InputWrapper,
  Label,
} from "./styles";

export interface CheckboxInterface {
  checked: boolean;
  onChange: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const Checkbox: FC<CheckboxInterface> = ({
  checked,
  label,
  onChange,
  className,
  disabled,
}) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(checked);
  }, [checked]);

  return (
    <CheckboxWrapper className={className}>
      <Label active={active}>{label}</Label>
      <InputWrapper>
        <InputStyle
          onChange={() => {
            if (onChange) {
              onChange();
            }
          }}
          checked={active}
          type="checkbox"
          disabled={disabled}
        />
        <Checkmark active={active} />
      </InputWrapper>
    </CheckboxWrapper>
  );
};

export default Checkbox;
