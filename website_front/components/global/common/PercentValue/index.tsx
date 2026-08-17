import React, { FC } from "react";
import Image from "next/image";
import LowIcon from "../../../../assets/icons/low-percent.svg";
import LowIconSmall from "../../../../assets/icons/low-percent-small.svg";
import HighIcon from "../../../../assets/icons/high-percent.svg";
import HighIconSmall from "../../../../assets/icons/high-percent-small.svg";
import styled from "styled-components";
import { formatPercent } from "../UniversalTable/index";

const Wrapper = styled.div``;

export const Value = styled.div<{
  type: "low" | "high" | "neutral";
  size: "big" | "small";
}>`
  span {
    color: ${({ type }) => {
      if (type === "neutral") return "#738094";
      return type === "low" ? "#FF5858" : "#04A584";
    }};
    font-weight: ${({ size }) => (size === "small" ? 500 : 600)};
    margin-left: 8px;
    font-size: 14px;
  }
`;

interface IProps {
  value: number;
  size?: "big" | "small";
  isIcon?: boolean;
  isLabel?: boolean;
  rightLabel?: string;
  lowValue?: number;
  fixedValue?: number;
  className?: string;
  neutralWhenZero?: boolean;
}

const PercentValue: FC<IProps> = ({
  value,
  size = "big",
  isIcon = true,
  isLabel = true,
  rightLabel = "%",
  lowValue,
  fixedValue,
  className,
  neutralWhenZero = false,
}) => {
  const isLow: boolean = value <= (lowValue || 0);
  const isNeutral = neutralWhenZero && Number(value) === 0;
  const type = isNeutral ? "neutral" : isLow ? "low" : "high";

  return (
    <Wrapper className={className}>
      <Value type={type} size={size}>
        {isIcon ? (
          <Image
            src={
              size === "big"
                ? isLow
                  ? LowIcon
                  : HighIcon
                : isLow
                  ? LowIconSmall
                  : HighIconSmall
            }
            alt="percent"
          />
        ) : (
          null
        )}
        <span>
          {!isIcon ? isLabel ? isLow ? "-" : "+" : "" : null}
          {value > 10000
            ? formatPercent(value)
            : `${String(Number(value).toFixed(fixedValue || 2)).replace("-", "")}${rightLabel}`}
        </span>
      </Value>
    </Wrapper>
  );
};

export default PercentValue;
