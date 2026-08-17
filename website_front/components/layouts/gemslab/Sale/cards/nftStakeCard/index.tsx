import React, { FC, useContext, useEffect, useState } from "react";
import changeDateType from "../../../../../../helpers/changeDateType";
import { IProject } from "../../../../../../types/global_types";
import { ProjectSaleContext } from "../../../../../../pages/gemslab/launch/sale/[id]";
import {
  PurchaseInputWrapper,
  StageDates,
  StageDoneButton,
  StagePoint,
  StageTitle,
  StageWrapper,
  StakeValue,
} from "../../styles";
import { INftData } from "../../../../../../smart/hooks/useProjectState";
import { LoadingContext } from "../../../../../global/Layout";
import { stackeNFTprePool } from "../../../../../../smart/initialSmartMain";
import { toast } from "react-toastify";

interface IProps {
  nftStakeData: INftData;
  updateStakedNftsValue: (value: number) => void;
  previewMode?: boolean;
}

const NftStakeCard: FC<IProps> = ({
  nftStakeData,
  updateStakedNftsValue,
  previewMode = false,
}) => {
  const [isStake, setIsStake] = useState<boolean>(false);
  const [stakeValue, setStakeValue] = useState<number>(
    nftStakeData.availableNfts - nftStakeData.stakedNfts
  );
  const { loadingStateHandler } = useContext(LoadingContext);
  const project: IProject = useContext(ProjectSaleContext);

  useEffect(() => {
    setStakeValue(nftStakeData.availableNfts - nftStakeData.stakedNfts);
  }, [nftStakeData.availableNfts, nftStakeData.stakedNfts]);

  const confirmNftStake = async () => {
    if (previewMode) {
      const nextStakeValue = Number(stakeValue);

      if (!nextStakeValue) return;

      setIsStake(true);
      updateStakedNftsValue(nftStakeData.stakedNfts + nextStakeValue);
      setStakeValue(0);
      return;
    }

    loadingStateHandler(true);

    const { success } = await stackeNFTprePool(project.poolId || 0, stakeValue);

    if (success) {
      setIsStake(true);
      setStakeValue(stakeValue);
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>{stakeValue} NFT's staked!</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  const stakeInputHandler = (e: any) => {
    const nextValue = Number(e.target.value);

    if (
      nextValue < 0 ||
      nextValue > nftStakeData.availableNfts - nftStakeData.stakedNfts
    )
      return;

    setStakeValue(nextValue);
  };

  return (
    <StageWrapper done={nftStakeData.isStakeStart && !nftStakeData.isStakeEnd}>
      <StagePoint>1</StagePoint>

      <StageTitle variant="p">Staking</StageTitle>

      <StageDates variant="h6">
        {/* Starts: 2022-06-09 16:00 */}
        Starts: {changeDateType(project.stakingDateStart, 7)}{" "}
        {project.stakingTimeStart}
      </StageDates>
      <StageDates variant="h6">
        Ends (Estimated): {changeDateType(project.stakingDateEnd, 7)}{" "}
        {project.stakingTimeEnd}
      </StageDates>
      {nftStakeData.isStakeStart &&
      nftStakeData.availableNfts > 0 &&
      !nftStakeData.isStakeEnd ? (
        <PurchaseInputWrapper>
          <input
            disabled={
              nftStakeData.isStakeEnd ||
              !nftStakeData.isStakeStart ||
              nftStakeData.availableNfts === 0
            }
            type="number"
            placeholder={String(nftStakeData.availableNfts)}
            value={stakeValue}
            onChange={stakeInputHandler}
          />
        </PurchaseInputWrapper>
      ) : (
        <></>
      )}
      {!nftStakeData.isStakeEnd ? (
        <div>
          <StakeValue>
            Availabe nft's to stake:{" "}
            <span>{nftStakeData.availableNfts - nftStakeData.stakedNfts}</span>
          </StakeValue>
          <StakeValue>
            Your staked nft's: <span>{nftStakeData.stakedNfts}</span>
          </StakeValue>
          <StakeValue>
            Total staked in this pool: <span>{nftStakeData.totalStaked}</span>
          </StakeValue>
        </div>
      ) : (
        <></>
      )}
      {!nftStakeData.isStakeEnd ? (
        <StageDoneButton
          disabled={
            nftStakeData.isStakeEnd ||
            !nftStakeData.isStakeStart ||
            nftStakeData.availableNfts === 0
          }
          full
          onClick={confirmNftStake}
        >
          Stake
        </StageDoneButton>
      ) : (
        <></>
      )}
    </StageWrapper>
  );
};

export default NftStakeCard;
