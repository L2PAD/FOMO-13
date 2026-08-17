import React, { FC, useState } from "react";
import SquareBtn from "../../../UI/buttons/SquareLightBtn";
import { Claim, confirmClaim } from "../../../../smart/initialSmartMain";
import {
  CardHead,
  CardHeadLeft,
  CardHeadRight,
  CardValue,
  CardWrapper,
} from "./styles";
import { IProject, IUser } from "../../../../types/global_types";
import addProjectToUser from "../../../../http/projects/addProjectToUser";

interface IProps {
  isAlreadyClaimed?: boolean;
  user: IUser | undefined;
  project: IProject | null;
  rewards: number;
}

const ClaimCard: FC<IProps> = ({
  isAlreadyClaimed,
  rewards,
  project,
  user,
}) => {
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [isApprove, setIsApprove] = useState<boolean>(false);

  const approveClaim = async () => {
    await Claim(project?.poolId || 0, String(user?.wallet));

    setIsApprove(true);
  };

  const finishClaim = async () => {
    const { success } = await confirmClaim(
      project?.poolId || 0,
      String(user?.wallet)
    );

    if (success && project) {
      await addProjectToUser("claimedProjects", String(project?._id) || "");
    }

    setIsClaimed(true);
  };

  return (
    <CardWrapper>
      <CardHead>
        <CardHeadLeft>
          <div>Reward</div>
        </CardHeadLeft>
      </CardHead>
      <CardValue className="rewardCard">
        <div>Available rewards {`(${project?.ticker})` || "(tokens)"}</div>
        {isAlreadyClaimed ? 0 : rewards || 0}
      </CardValue>
      <SquareBtn
        handler={isApprove ? finishClaim : approveClaim}
        disabled={isAlreadyClaimed || isClaimed || rewards === 0}
        type="green"
        width="410"
        text={isApprove ? "Claim" : "Approve"}
      />
    </CardWrapper>
  );
};

export default ClaimCard;
