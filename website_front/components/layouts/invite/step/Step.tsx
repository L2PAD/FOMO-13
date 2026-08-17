/* eslint-disable */
import React, { FC } from "react";
import Image from "next/image";
import { StepType } from "../../../../types/global_types";
import LockIcon from "../../../../assets/icons/invite-lock.svg";
import LockSuccess from "../../../../assets/icons/invite-success.svg";
import ActiveSvg from "../../../../assets/icons/invite-active.svg";
import InactiveSvg from "../../../../assets/icons/invite-unactive.svg";
import { StepIndex, StepWrapper, StepText, StepIcon } from "./styles";

interface IProps {
  step: StepType;
  onClick: (step: StepType) => any;
}

const Step: FC<IProps> = ({ step, onClick }) => {
  return (
    <StepWrapper
      onClick={() => {
        if (step.isAvailable) {
          onClick(step);
        }
      }}
      isActive={step.isAvailable}
      tabIndex={0}
    >
      {
        <StepIndex>
          {step.isActive ? (
            <Image src={ActiveSvg} alt={`Step ${step.index} active`} />
          ) : (
            <Image src={InactiveSvg} alt={`Step ${step.index} inactive`} />
          )}
          <div>0{step.index}</div>
        </StepIndex>
      }
      <StepText>{step.text}</StepText>
      {step.isAvailable ? (
        <></>
      ) : (
        <StepIcon>
          {step.isActive ? (
            <Image src={LockSuccess} alt="step finished" />
          ) : (
            <Image src={LockIcon} alt="step locked" />
          )}
        </StepIcon>
      )}
    </StepWrapper>
  );
};

export default Step;
