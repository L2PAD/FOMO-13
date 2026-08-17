import React, { FC } from "react";
import Checkbox from "../common/Checkbox";
import { RangeTitle } from "./styles";
import { Info } from "lucide-react";

interface Props {
  title: string;
  items: string[];
  onChange: (value: string[]) => void;
  className?: string;
  data: any;
  showInfoIcon?: boolean;
  tooltip?: string;
}

const OtcCheckboxRow: FC<Props> = ({
  title,
  items,
  onChange,
  className,
  data,
  showInfoIcon = true,
  tooltip,
}) => {
  const handleCheckbox = (value: string) => {
    const updatedItems: Array<string> = data.includes(value)
      ? data.filter((item: any) => item !== value)
      : [...data, value];

    onChange(updatedItems);
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
                  width: 150,
                  whiteSpace: "wrap",
                }}
              >
                {tooltip}
              </span>
            </button>
          )}
        </div>
      )}
      <div className={`${className} checkboxes`}>
        {items.map((item, i) => {
          return (
            <Checkbox
              key={i}
              label={item}
              checked={!!data?.includes(item)}
              onChange={() => handleCheckbox(item)}
            />
          );
        })}
      </div>
    </>
  );
};

export default OtcCheckboxRow;
