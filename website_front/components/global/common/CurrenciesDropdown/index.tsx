/* eslint-disable */
import React, { FC, useEffect, useState } from "react";
import Typography from "../Typography";
import { CheckIcon, CloseIcon } from "../../Icons";
import {
  Arrow,
  Dropdown,
  DropdownWrapper,
  InputStyle,
  OptionItem,
  PlaceholderWrapper,
  SearchIconStyle,
  SelectedItemsWrapper,
  Title,
  Wrapper,
} from "./styles";
import { Overlay } from "../../Navigation/styles";
import Checkbox from "../Checkbox";

export interface DropdownWithSearchInterface {
  label: string;
  placeholder: string;
  options: ICurrency[];
  values: ICurrency[];
  onChange: (value: ICurrency) => void;
  className?: string;
  searchValue: string;
  onSearch: (value: string) => void;
  dropdownClassName?: string;
}

export interface ICurrency {
  name: string;
  platform: string;
}

const CurrenciesDropdown: FC<DropdownWithSearchInterface> = ({
  label,
  placeholder,
  options,
  values,
  className,
  searchValue,
  dropdownClassName,
  onSearch,
  onChange,
}) => {
  const [active, setActive] = useState(false);

  const removeItem = (name: string): void => {
    const updatedItem: ICurrency | undefined = values.find(
      (item: ICurrency) => {
        return item.name === name;
      }
    );

    if (!updatedItem) return;

    onChange(updatedItem);
  };

  return (
    <>
      {active ? <Overlay onClick={() => setActive(false)}></Overlay> : <></>}
      <Wrapper className={className}>
        {label && <Title variant="p">{label}</Title>}
        <InputStyle
          className="default-input"
          onFocus={() => setActive(true)}
          type="text"
          placeholder="Search currency or select"
          onChange={onSearch}
          leftIcon={<SearchIconStyle fill="rgba(115, 128, 148, 0.5)" />}
          value={searchValue}
        />
        {active && (
          <DropdownWrapper className={dropdownClassName}>
            <Dropdown>
              {(searchValue !== ""
                ? options.filter((item) =>
                    item.name.toLowerCase().includes(searchValue.toLowerCase())
                  )
                : options
              ).map((item, i) => {
                return (
                  <OptionItem
                    active={
                      !!values.find(
                        (curr: ICurrency) => curr.name === item.name
                      )
                    }
                    key={i}
                  >
                    <Checkbox
                      checked={
                        !!values.find(
                          (curr: ICurrency) => curr.name === item.name
                        )
                      }
                      onChange={() => onChange(item)}
                    />
                    <Typography className="name" variant="p">
                      {item.name}
                    </Typography>
                    <span className="platform">{item.platform}</span>
                  </OptionItem>
                );
              })}
            </Dropdown>
          </DropdownWrapper>
        )}
        <SelectedItemsWrapper>
          {values.map((item: ICurrency) => {
            return (
              <div className="currency-item" key={item.name}>
                <span>{item.name}</span>
                <button
                  onClick={() => removeItem(item.name)}
                  className="remove-btn"
                >
                  <CloseIcon fill="var(--main-gray)" />
                </button>
              </div>
            );
          })}
        </SelectedItemsWrapper>
      </Wrapper>
    </>
  );
};

export default CurrenciesDropdown;
