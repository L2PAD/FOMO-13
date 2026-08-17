import React from "react";
import styled from "styled-components";
import BaseCard from "../BaseCard";

type ScoreProgressProps = {
  score: number;
  maxScore: number;
  change: number;
  isSmall?: boolean;
  lineWeight?: string | number;
};

const ProgressContainer = styled(BaseCard)`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 12px;

  &.small {
    padding: 0;
    background: none;
    border: none;
    box-shadow: none;

    .change {
      margin-left: auto;
      font-size: 10px;
      font-weight: var(--font-weight-regular);
      color: #48bb78;
    }

    .score {
      font-size: 10px;
      font-weight: var(--font-weight-regular);
      color: #48bb78;
    }
  }
`;

const ScoreDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .score {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: #070b35;
  }

  .change {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #48bb78;
  }
`;

const ProgressBarWrapper = styled.div<{ lineWeight: string | number }>`
  position: relative;
  width: 100%;
  height: ${({ lineWeight }) => `${lineWeight}px`};
  background: linear-gradient(90deg, #ff5c56 0%, #fcc705 50%, #03c097 100%);
  border-radius: 8px;
  margin-top: 16px;

  &.small {
    margin-top: 0px;
  }
`;

const ProgressFill = styled.div<{ width: number; lineWeight: string | number }>`
  position: absolute;
  top: -4px;
  left: ${({ width }) => `${width}%`};
  height: ${({ lineWeight }) => `${Number(lineWeight) * 2}px`};
  width: ${({ lineWeight }) => `${Number(lineWeight) * 2}px`};
  border: 2px solid #ffffff;
  border-radius: 8px;
  background: #070b35;
  transition: width 0.3s ease;
  z-index: 1;
`;

const Divisions = styled.div<{ lineWeight: string | number }>`
  width: 100%;
  height: 100%;

  .division {
    position: absolute;
    height: 8px;
    width: 4px;
    background-color: #ffffff;
    border: 1px solid #ecedf0;
    transform: translateY(-3px);
  }
`;

const Markers = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;

  span {
    font-size: 14px;
    color: #738094;
  }
`;

const ScoreProgress: React.FC<ScoreProgressProps> = ({
  score,
  maxScore,
  change,
  isSmall,
  lineWeight = 8,
}) => {
  const progress = Math.min((score / maxScore) * 92, 100);

  return (
    <ProgressContainer variant="main" className={isSmall ? "small" : ""}>
      <ScoreDisplay>
        <span className="score">{score}</span>
        <span className="change">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="8"
            height="4"
            viewBox="0 0 8 4"
            fill="none"
          >
            <path d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z" fill="#04A584" />
          </svg>
          {change >= 0 ? `${change}` : change}
        </span>
      </ScoreDisplay>
      <ProgressBarWrapper
        className={isSmall ? "small" : ""}
        lineWeight={lineWeight}
      >
        <ProgressFill width={progress} lineWeight={lineWeight} />
        <Divisions lineWeight={lineWeight}>
          <div className="division" style={{ left: "23.5%" }} />
          <div className="division" style={{ left: "48%" }} />
          <div className="division" style={{ left: "72%" }} />
        </Divisions>
      </ProgressBarWrapper>
      {!isSmall && (
        <Markers>
          <span>0</span>
          <span>250</span>
          <span>500</span>
          <span>750</span>
          <span>1000</span>
        </Markers>
      )}
    </ProgressContainer>
  );
};

export default ScoreProgress;
