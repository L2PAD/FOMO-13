import React, { FC, useEffect, useState } from "react";
import { CryptoCurrencies } from "../../../staticContent/global";
import Range from "../Range";
import { DropdownCurrency, RangeTitle, RangeTitleWrapper } from "./styles";

interface Props {
  title: string;
  range: number[];
  step: number;
  onChange: (
    value: number[],
    currency: { name: string; value: string }
  ) => void;
}

const CurrencyRangeRow: FC<Props> = ({ title, range, step, onChange }) => {
  const [values, setValues] = useState(range);
  const [currency, setCurrency] = useState(CryptoCurrencies[0]);

  const handleRange = (value: number[]) => {
    setValues(value);
  };

  useEffect(() => {
    onChange(values, currency);
  }, [onChange, values, currency]);

  return (
    <>
      <RangeTitleWrapper>
        {title && <RangeTitle variant="p">{title}</RangeTitle>}
        <DropdownCurrency
          options={CryptoCurrencies}
          onChange={(value) => setCurrency(value)}
          value={currency}
        />
      </RangeTitleWrapper>
      <Range
        min={range[0]}
        max={range[1]}
        values={values}
        step={step}
        onChange={handleRange}
      />
    </>
  );
};

export default CurrencyRangeRow;
