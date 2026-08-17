/* eslint-disable */
import React, { FC, useEffect, useState } from "react";
import { Range as DefaultRange, getTrackBackground } from "react-range";
import Typography from "../common/Typography";
import { InputRangeValue, Label, RangeValues, RangeWrapper } from "./styles";

export interface RangeInterface {
  min: number;
  max: number;
  values: number[];
  onChange: (value: number[]) => void;
  step: number;
  className?: string;
  isValueInput?: boolean;
  label?: string;
  rightLabel?: string;
  formatValue?: (value: number) => string;
}

const Range: FC<RangeInterface> = ({
  min,
  max,
  values,
  onChange,
  className,
  step,
  isValueInput,
  label,
  rightLabel,
  formatValue,
}) => {
  if (!values || !Array.isArray(values) || values.length < 2) {
    values = [min, max];
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const inputValue = e.target.value;

    const isValidNumber = /^-?\d*\.?\d*$/.test(inputValue);

    if (min > Number(inputValue) || max < Number(inputValue)) return;

    if (isValidNumber) {
      const newValues: any = [...values];

      newValues[index] = inputValue === "" ? "" : inputValue;

      onChange(newValues);
    }
  };

  return (
    <RangeWrapper className={className}>
      {isValueInput ? (
        <RangeValues>
          <InputRangeValue
            value={
              formatValue ? formatValue(Number(values[0])) : String(values[0])
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e, 0)
            }
            className="input-range left"
          />
          <InputRangeValue
            value={
              formatValue ? formatValue(Number(values[1])) : String(values[1])
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e, 1)
            }
            className="input-range right"
          />
        </RangeValues>
      ) : (
        <RangeValues>
          <Typography variant="p">
            {label ? label : <></>}
            {values[0]}
            {rightLabel ? rightLabel : <></>}
          </Typography>
          <Typography variant="p">
            {label ? label : <></>}
            {values[1]}
            {rightLabel ? rightLabel : <></>}
          </Typography>
        </RangeValues>
      )}

      <DefaultRange
        onChange={(values) => {
          onChange(values);
        }}
        min={min}
        max={max}
        step={step}
        values={values}
        renderTrack={({ props, children }) => {
          return (
            <div
              {...props}
              style={{
                position: "relative",
                background: getTrackBackground({
                  values: [
                    (values[0] - min) / ((max - min) / 100),
                    (values[1] - min) / ((max - min) / 100),
                  ],
                  colors: [
                    "rgba(4, 165, 132, 0.23)",
                    "#04A584",
                    "rgba(4, 165, 132, 0.23)",
                  ],
                  min: 0,
                  max: 100,
                }),
                height: "4px",
                width: "100%",
                borderRadius: 8,
              }}
            >
              {children}
            </div>
          );
        }}
        renderThumb={({ props }) => {
          return (
            <div
              {...props}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "100%",
                border: "2px solid white",
                background: "#04A584",
                boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                position: "absolute",
                top: 0,
              }}
            />
          );
        }}
      />
    </RangeWrapper>
  );
};

export default Range;
