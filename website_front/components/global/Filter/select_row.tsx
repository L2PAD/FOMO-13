/* eslint-disable */
import React, { FC, useState } from "react";
import DropdownWithSearch from "../common/DropdownWithSearch";

interface Props {
  title: string;
  placeholder: string;
  items: { name: string; value: string }[];
  onChange: (value: { name: string; value: string }[]) => void;
}

const SelectRow: FC<Props> = ({ title, items, onChange, placeholder }) => {
  const [searchValue, setSearchValue] = useState("");
  const [values, setValues] = useState<{ name: string; value: string }[]>([]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleChange = (value: { name: string; value: string }) => {
    let valueExist = false;
    values.forEach((item) => {
      valueExist = item.value === value.value;
    });
    const currentValues: any = valueExist
      ? values.filter((item) => item.value !== value.value)
      : [...values, value];

    setValues(currentValues);

    onChange(currentValues);
  };

  return (
    <DropdownWithSearch
      label={title}
      placeholder={placeholder}
      options={items}
      values={values}
      onChange={handleChange}
      searchValue={searchValue}
      onSearch={handleSearch}
    />
  );
};

export default SelectRow;
