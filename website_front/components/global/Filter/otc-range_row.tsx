import React, { FC } from "react";
import Range from "../Range";
import { RangeTitle } from "./styles";
import { Info } from "lucide-react";

interface Props {
  title: string;
  range: number[];
  data: number[];
  step: number;
  onChange: (value: number[]) => void;
  formatValue?: (value: number) => string;
  showInfoIcon?: boolean;
  tooltip?: string;
}
const OtcRangeRow: FC<Props> = ({
  title,
  range,
  step,
  data,
  onChange,
  formatValue,
  showInfoIcon = true,
  tooltip,
}) => {
  const handleRange = (value: number[]) => {
    onChange(value);
  };

  return (
    <>
      {title && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <RangeTitle variant="p">{title}</RangeTitle>
          {showInfoIcon && tooltip && (
            <button className="tooltip-button">
              <Info size={12} color="#738094" />
              <span
                className="tooltip-text right"
                style={{
                  width: 300,
                  whiteSpace: "wrap",
                }}
              >
                {tooltip}
              </span>
            </button>
          )}
        </div>
      )}
      <Range
        isValueInput={true}
        min={range[0]}
        max={range[1]}
        values={data}
        step={step}
        onChange={handleRange}
        formatValue={formatValue}
      />
    </>
  );
};

export default OtcRangeRow;
