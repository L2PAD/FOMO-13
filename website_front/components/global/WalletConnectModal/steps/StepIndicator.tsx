import React, { FC } from 'react'
import { StepCircle, StepLine, StepWrap } from '../styles'
import { CheckIcon } from '../../Icons'

type StepNumber = 1 | 2 | 3 | 4

interface Step {
    number: StepNumber
    completed: boolean
}

const StepIndicator: FC<{ steps: Step[]; currentStep: StepNumber }> = ({
    steps,
    currentStep,
}) => (
    <StepWrap>
        {steps.map((step, idx) => (
            <React.Fragment key={step.number}>
                <StepCircle
                    completed={step.number < currentStep || step.completed}
                    active={currentStep === step.number}
                >
                    {step.completed ? <CheckIcon fill='white' /> : step.number}
                </StepCircle>
                {idx < steps.length - 1 && (
                    <StepLine completed={step.completed} />
                )}
            </React.Fragment>
        ))}
    </StepWrap>
)

export default StepIndicator
