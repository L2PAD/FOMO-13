import React, { FC, useState } from "react";
import changeDateType from "../../../../../../helpers/changeDateType";
import { IProject } from "../../../../../../types/global_types";
import { confirmClaim, Claim } from "../../../../../../smart/initialSmartMain";
import {
  ClaimInfo,
  StageDates,
  StageDoneAmount,
  StageDoneButton,
  StageDoneLastText,
  StageDoneWrapper,
  StagePoint,
  StageTitle,
  StageWrapper,
} from "../../styles";
import { IClaimData } from "../../../../../../smart/hooks/useProjectState";
import addProjectToUser from "../../../../../../http/projects/addProjectToUser";

interface IProps {
  project: IProject;
  claimData: IClaimData;
  previewMode?: boolean;
}

const ClaimCard: FC<IProps> = ({
  project,
  claimData,
  previewMode = false,
}) => {
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [isApprove, setIsApprove] = useState<boolean>(false);

  const approveClaim = async () => {
    if (previewMode) {
      setIsApprove(true);
      return;
    }

    await Claim(project.poolId || 0, window.ethereum.selectedAddress);

    setIsApprove(true);
  };

  const finishClaim = async () => {
    if (previewMode) {
      setIsClaimed(true);
      return;
    }

    const { success } = await confirmClaim(
      project.poolId || 0,
      window.ethereum.selectedAddress
    );

    if (success) {
      await addProjectToUser("claimedProjects", project._id || "");
    }

    setIsClaimed(true);
  };

  return (
    <StageWrapper done={claimData.isClaimStart && claimData.isClaimAvailable}>
      <StagePoint>3</StagePoint>
      <StageTitle variant="p">Claim</StageTitle>
      <StageDates variant="h6">
        Starts: {changeDateType(project.distributionStart, 7)}{" "}
        {project?.distributionTimeStart || ""}
      </StageDates>
      {claimData.isAlreadyClaimed || (previewMode && isClaimed) ? (
        <ClaimInfo>You already claim your tokens</ClaimInfo>
      ) : (
        <></>
      )}
      {claimData.isClaimStart && claimData.isClaimAvailable && !isClaimed ? (
        <StageDoneWrapper variant="default">
          <StageDoneLastText variant="p">
            The {project.name} sale has ended
          </StageDoneLastText>
          <StageDoneLastText variant="p">Claimable share</StageDoneLastText>
          <StageDoneAmount variant="p">
            {claimData.claimValue} <span>{project?.ticker || ""}</span>
          </StageDoneAmount>
          <StageDoneButton
            full
            onClick={isApprove ? finishClaim : approveClaim}
          >
            {isApprove ? "Claim" : "Approve claim"}
          </StageDoneButton>
        </StageDoneWrapper>
      ) : (
        <></>
      )}
    </StageWrapper>
  );
};

export default ClaimCard;
