import React, { FC, useState } from "react";
import { ArrowDownIcon } from "../../../Icons";
import { DropdownWrapper, InputValue, Label, Wrapper } from "./styles";

interface Props {
  label: string;
  items: string[];
  onChange: (value: string) => void;
  value: string;
}

const ModalSelect: FC<Props> = ({ label, items, onChange, value }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Wrapper>
      <Label>{label}</Label>
      <InputValue active={isOpen} onClick={() => setIsOpen((state) => !state)}>
        {value}
        <ArrowDownIcon />
      </InputValue>
      <DropdownWrapper active={isOpen}>
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => {
              onChange(item);
              setIsOpen(false);
            }}
          >
            {item}
          </div>
        ))}
      </DropdownWrapper>
    </Wrapper>
  );
};

export default ModalSelect;
