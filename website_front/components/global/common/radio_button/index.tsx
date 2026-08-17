import React, { FC, useState } from "react";
import DescriptionComponent from "../DescriptionComponent";
import DetailsIcon from "../../Icons/DetailsIcon";
import { RadioWrapper, Wrapper } from "./styles";
import OptionIcon from "../../Icons/OptionIcon";

interface Props {
  onChange: (value: string) => void;
  value: string;
  label: string;
  isInfoButton?: boolean;
  infoText?: string;
  descriptionText?: string;
  variant?: "default" | "gray";
  className?: string | "with-description";
}

const RadioButton: FC<Props> = ({
  onChange,
  label,
  value,
  isInfoButton,
  infoText,
  variant,
  descriptionText,
  className,
}) => {
  const [isDetails, setIsDetails] = useState<boolean>(false);

  return (
    <RadioWrapper className={className} style={{ position: "relative" }}>
      <Wrapper checked={value === label}>
        <OptionIcon value={value} label={label} variant={variant || ""} />
        <input
          type="radio"
          checked={value === label}
          onChange={() => onChange(label)}
        />
        <span className={`radio-input ${variant}`}>{label}</span>
        <br />

        {isInfoButton ? (
          <button
            onMouseEnter={() => setIsDetails(true)}
            onMouseLeave={() => setIsDetails(false)}
            className="details-btn"
          >
            <DetailsIcon />
          </button>
        ) : (
          <></>
        )}
      </Wrapper>
      {descriptionText ? (
        <div className="description-text">{descriptionText}</div>
      ) : (
        <></>
      )}
      {infoText ? (
        <DescriptionComponent
          className="radio-modal"
          isVisible={isDetails}
          date={new Date()}
          isDate={false}
          text={infoText}
        />
      ) : (
        <></>
      )}
    </RadioWrapper>
  );
};

export default RadioButton;
