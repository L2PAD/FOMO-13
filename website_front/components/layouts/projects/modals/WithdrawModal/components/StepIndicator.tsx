import React from "react";
import * as S from "../styles";
import { WithdrawStep } from "../types";

interface StepIndicatorProps {
    step: WithdrawStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step }) => {
    return (
        <S.StepIndicator>
            <S.Step active={step >= 1} completed={step > 1}>
                <S.StepCircle active={step >= 1} completed={step > 1}>
                    1
                </S.StepCircle>
            </S.Step>
            <S.StepLine active={step >= 2} />
            <S.Step active={step >= 2} completed={step > 2}>
                <S.StepCircle active={step >= 2} completed={step > 2}>
                    2
                </S.StepCircle>
            </S.Step>
            <S.StepLine active={step >= 3} />
            <S.Step active={step >= 3} completed={step > 3}>
                <S.StepCircle active={step >= 3} completed={step > 3}>
                    3
                </S.StepCircle>
            </S.Step>
        </S.StepIndicator>
    );
};

export default StepIndicator;