import React from "react";
import * as S from '../styles'

interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <S.StepIndicator>
      <S.Step active={currentStep >= 1} completed={currentStep > 1}>
        <S.StepCircle active={currentStep >= 1} completed={currentStep > 1}>
          1
        </S.StepCircle>
      </S.Step>
      <S.StepLine active={currentStep >= 2} />
      <S.Step active={currentStep >= 2} completed={currentStep > 2}>
        <S.StepCircle active={currentStep >= 2} completed={currentStep > 2}>
          2
        </S.StepCircle>
      </S.Step>
      <S.StepLine active={currentStep >= 3} />
      <S.Step active={currentStep >= 3} completed={currentStep > 3}>
        <S.StepCircle active={currentStep >= 3} completed={currentStep > 3}>
          3
        </S.StepCircle>
      </S.Step>
    </S.StepIndicator>
  );
};