/* eslint-disable */
import React, { FC, useEffect, useState } from "react";
import Typography from "../Typography";
import { CheckIcon } from "../../Icons";
import {
  Arrow,
  Dropdown,
  DropdownWrapper,
  InputStyle,
  OptionItem,
  PlaceholderWrapper,
  SearchIconStyle,
  Title,
  Wrapper,
} from "./styles";

export interface DropdownWithSearchInterface {
  label: string;
  placeholder: string;
  options: Value[];
  values: Value[];
  onChange: (value: Value) => void;
  className?: string;
  searchValue: string;
  onSearch: (value: string) => void;
  dropdownClassName?: string;
}

interface Value {
  name: string;
  value: string;
}

const DropdownWithSearch: FC<DropdownWithSearchInterface> = ({
  label,
  placeholder,
  options,
  values,
  onChange,
  className,
  searchValue,
  onSearch,
  dropdownClassName,
}) => {
  const [active, setActive] = useState(false);
  const currentNames: Array<string> = values.map((item: any) => item.name);
  const currentValues: Array<string> = values.map((item: any) => item.value);

  return (
    <Wrapper className={className} onMouseLeave={() => setActive(false)}>
      {label && <Title variant="p">{label}</Title>}
      <PlaceholderWrapper
        withValues={currentNames.length > 0}
        onClick={() => setActive((state) => !state)}
        className="dropdown-placeholder"
      >
        <Typography variant="p">
          {currentNames.length > 0 ? currentNames.join(", ") : placeholder}
        </Typography>
        <Arrow active={active} />
      </PlaceholderWrapper>
      {active && (
        <DropdownWrapper className={dropdownClassName}>
          <Dropdown>
            <InputStyle
              type="text"
              placeholder="Search"
              onChange={onSearch}
              leftIcon={<SearchIconStyle fill="rgba(115, 128, 148, 0.5)" />}
              value={searchValue}
            />
            {(searchValue !== ""
              ? options.filter((item) =>
                  item.name.toLowerCase().includes(searchValue.toLowerCase())
                )
              : options
            ).map((item, i) => {
              return (
                <OptionItem
                  key={i}
                  onClick={() => onChange(item)}
                  active={currentValues.includes(item.value)}
                >
                  <CheckIcon
                    fill={
                      currentValues.includes(item.value)
                        ? "#04A584"
                        : "rgba(4, 165, 132, 0.25)"
                    }
                  />
                  <Typography variant="p">{item.name}</Typography>
                </OptionItem>
              );
            })}
          </Dropdown>
        </DropdownWrapper>
      )}
    </Wrapper>
  );
};

export default DropdownWithSearch;
