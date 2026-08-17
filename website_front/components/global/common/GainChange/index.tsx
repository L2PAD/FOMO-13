import React, { FC } from "react";
import { NullValue, Wrapper } from "./styles";

interface IProps {
  value: number;
  label?: string;
}

const GainChange: FC<IProps> = ({ value, label }) => {
  return value === 0 ? (
    <NullValue>{value}</NullValue>
  ) : (
    <Wrapper isGrow={value > 0}>
      {value > 0 ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="7"
          height="5"
          viewBox="0 0 7 5"
          fill="none"
        >
          <path
            d="M3.30006 0.8C3.60006 0.4 4.30006 0.4 4.60006 0.8L6.80006 3.5C7.20006 4.1 6.80006 4.8 6.20006 4.8H1.70006C1.00006 4.8 0.700059 4.1 1.10006 3.5L3.30006 0.8Z"
            fill="#04A584"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="7"
          height="5"
          viewBox="0 0 7 5"
          fill="none"
        >
          <path
            d="M3.30006 4.2C3.60006 4.6 4.30006 4.6 4.60006 4.2L6.80006 1.5C7.20006 0.9 6.80006 0.2 6.20006 0.2H1.70006C1.00006 0.2 0.700059 0.9 1.10006 1.5L3.30006 4.2Z"
            fill="#FF5858"
          />
        </svg>
      )}
      <span>
        {String(value).replace("-", "")}
        {label || ""}
      </span>
    </Wrapper>
  );
};

export default GainChange;
