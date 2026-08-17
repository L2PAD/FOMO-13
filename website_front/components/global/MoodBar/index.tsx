import React from "react";
import styled, { css } from "styled-components";
import InfoIcon from "../Icons/InfoIcon";

export type IParsingLabels = "Negative" | "Positive" | "Neutral";

interface MoodBarProps {
  score: number; // от 0 до 1
  label: IParsingLabels;
  accuracy?: number; // например 0.78
  isMain?: boolean;
  className?: string
}

const Wrapper = styled.div<{ isDouble?: boolean }>`
  width: 100%;
  max-width: ${({ isDouble }) => (isDouble ? "680px" : "440px")};
`;

const Header = styled.div<{ isDouble?: boolean }>`
  display: flex;
  justify-content: space-between;
  font-size: ${({ isDouble }) => (isDouble ? "16px" : "14px")};
  margin-bottom: ${({ isDouble }) => (isDouble ? "12px" : "6px")};

  & .header-left-wrapper {
    display: flex;
    align-items: center;
    gap: ${({ isDouble }) => (isDouble ? "0px" : "4px")};
  }

  & button {
    width: ${({ isDouble }) => (isDouble ? "28px" : "24px")};
    height: ${({ isDouble }) => (isDouble ? "28px" : "24px")};
  }
`;

const BarWrapper = styled.div<{ isDouble?: boolean }>`
  position: relative;
  height: ${({ isDouble }) => (isDouble ? "10px" : "8px")};
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    #ff5c56 0%,
    #ff932b 24.5%,
    #fcc705 50.5%,
    #78c453 75.5%,
    #03c097 100%
  );
`;

const Divider = styled.div<{ left: string; isDouble?: boolean }>`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: ${({ isDouble }) => (isDouble ? "6px" : "4px")};
  height: ${({ isDouble }) => (isDouble ? "24px" : "16px")};
  background: white;
  border-radius: 1px;
  border: 1px solid #ecedf0;
  left: ${({ left }) => left};
`;

const Indicator = styled.div<{ left: number; isDouble?: boolean }>`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: ${({ isDouble }) => (isDouble ? "22px" : "16px")};
  height: ${({ isDouble }) => (isDouble ? "22px" : "16px")};
  border-radius: 50%;
  background: #070b35;
  border: 2px solid #ffffff;
  left: ${({ left }) => left}%;
`;

const Labels = styled.div<{ isDouble?: boolean }>`
  display: flex;
  justify-content: space-between;
  font-size: ${({ isDouble }) => (isDouble ? "18px" : "14px")};
  margin-top: ${({ isDouble }) => (isDouble ? "12px" : "6px")};
  font-weight: var(--font-weight-regular);
`;

const CurrentLabel = styled.div<{ label: IParsingLabels; isDouble?: boolean }>`
  margin-top: ${({ isDouble }) => (isDouble ? "12px" : "10px")};
  text-align: center;
  font-size: ${({ isDouble }) => (isDouble ? "22px" : "16px")};

  ${({ label }) =>
    label === "Negative" &&
    css`
      color: #ff5c56;
    `}
  ${({ label }) =>
    label === "Neutral" &&
    css`
      color: #fcc705;
    `}
  ${({ label }) =>
    label === "Positive" &&
    css`
      color: #03c097;
    `}
`;

export const LabelNegative = styled.span`
  color: #ff5c56;
`;

export const LabelNeutral = styled.span`
  color: #fcc705;
`;

export const LabelPositive = styled.span`
  color: #03c097;
`;

export const AccuracyText = styled.span<{ label: IParsingLabels }>`
  font-weight: var(--font-weight-regular);

  ${({ label }) =>
    label === "Negative" &&
    css`
      color: #ff5c56;
    `}

  ${({ label }) =>
    label === "Neutral" &&
    css`
      color: #fcc705;
    `}

  ${({ label }) =>
    label === "Positive" &&
    css`
      color: #03c097;
    `}
`;

const MoodBar: React.FC<MoodBarProps> = ({
  score,
  label,
  accuracy,
  isMain,
  className
}) => {
  const percent = Math.min(Math.max(score * 100, 0), 100);

  const isDouble = className === "double";

  return (
    <Wrapper isDouble={isDouble}>
      <Header isDouble={isDouble}>
        <div className="header-left-wrapper">
          <span>Accuracy</span>
          {isMain && <button><InfoIcon /></button>}
        </div>
        {accuracy !== undefined && (
          <AccuracyText label={label}>
            {(accuracy * 100).toFixed(0)}%
          </AccuracyText>
        )}
      </Header>

      <BarWrapper isDouble={isDouble}>
        <Divider left="33%" isDouble={isDouble} />
        <Divider left="75%" isDouble={isDouble} />
        <Indicator left={percent} isDouble={isDouble} />
      </BarWrapper>

      {isMain ? (
        <Labels isDouble={isDouble}>
          <LabelNegative>Negative</LabelNegative>
          <LabelNeutral>Neutral</LabelNeutral>
          <LabelPositive>Positive</LabelPositive>
        </Labels>
      ) : (
        <CurrentLabel className="mood-label" label={label} isDouble={isDouble}>
          {label}
        </CurrentLabel>
      )}
    </Wrapper>
  );
};

export default MoodBar;