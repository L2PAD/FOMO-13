import React, { FC } from "react";
import {
  Bar,
  BarWrapper,
  DescriptionTitle,
  DescriptionValue,
  DescriptionWrapper,
  ProgressBarWrapper,
  Title,
} from "./styles";
import { simplifyAmount } from "../../../../helpers/simplifyAmount";
import moment from "moment";
import { useTranslation } from "i18n";

export interface ProgressBarInterface {
  title?: string;
  low: number;
  high: number;
  middle?: number;
  progress: number;
  className?: string;
  leftKey?: string;
  rightKey?: string;
  leftLabel?: string;
  rightLabel?: string;
  middleKey?: string;
  keyColor?: string;
  dateCompleted?: Date;
  showZeroValuesAsPlaceholder?: boolean;
  zeroValuePlaceholder?: string;
}

const ProgressBar: FC<ProgressBarInterface> = ({
  title,
  low,
  high,
  middle,
  progress,
  className,
  leftKey = "Low",
  rightKey = "High",
  leftLabel = "$",
  rightLabel = "$",
  keyColor = "#070B35",
  middleKey,
  dateCompleted,
  showZeroValuesAsPlaceholder = false,
  zeroValuePlaceholder = "--",
}) => {
  const { translateText } = useTranslation();
  const shouldShowPlaceholder = (value?: number) =>
    showZeroValuesAsPlaceholder &&
    (!Number.isFinite(Number(value)) || Number(value) === 0);

  const renderAmount = (value: number, label: string) => {
    if (shouldShowPlaceholder(value)) return zeroValuePlaceholder;

    return (
      <>
        {simplifyAmount(value)}
        {label}
      </>
    );
  };

  const renderMiddle = (value?: number) => {
    if (shouldShowPlaceholder(value)) return zeroValuePlaceholder;

    const numericValue = Number(value || 0);
    const roundedValue = Number.isInteger(numericValue)
      ? numericValue.toString()
      : numericValue.toFixed(2).replace(/\.?0+$/, "");

    return `${roundedValue}%`;
  };

  return (
    <ProgressBarWrapper className={className}>
      {title ? <Title variant="p">{translateText(title)}</Title> : <></>}
      <BarWrapper>
        <Bar progress={progress} />
      </BarWrapper>
      <DescriptionWrapper>
        <DescriptionTitle variant="p">
          {translateText(leftKey)}:{" "}
          <DescriptionValue
            style={{ color: keyColor }}
            className="description-value"
          >
            {renderAmount(low, leftLabel)}
          </DescriptionValue>
        </DescriptionTitle>
        {dateCompleted ? (
          <DescriptionTitle className="bold" variant="p">
            {translateText("Completed on")} {moment(dateCompleted).format("ll")}
          </DescriptionTitle>
        ) : middleKey ? (
          <DescriptionTitle className="bold" variant="p">
            {renderMiddle(middle)} {translateText(middleKey)}
          </DescriptionTitle>
        ) : (
          <></>
        )}
        <DescriptionTitle variant="p">
          {translateText(rightKey)}:{" "}
          <DescriptionValue
            style={{ color: keyColor }}
            className="description-value"
          >
            {renderAmount(high, rightLabel)}
          </DescriptionValue>
        </DescriptionTitle>
      </DescriptionWrapper>
    </ProgressBarWrapper>
  );
};

export default ProgressBar;
