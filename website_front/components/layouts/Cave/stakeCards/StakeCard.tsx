import React, { FC, useContext, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { stackeNFTprePool } from "../../../../smart/initialSmartMain";
import { LoadingContext } from "../../../global/Layout";
import SquareBtn from "../../../UI/buttons/SquareLightBtn";
import {
  AvailableValue,
  CardHead,
  CardHeadLeft,
  CardHeadRight,
  CardValue,
  CardWrapper,
} from "./styles";

interface IProps {
  poolId: number;
  alreadyStake: number;
  availableStake: number;
}

const StakeCard: FC<IProps> = ({ poolId, alreadyStake, availableStake }) => {
  const { loadingStateHandler } = useContext(LoadingContext);
  const [isStake, setIsStake] = useState<boolean>(false);
  const [value, setValue] = useState<number>(0);

  const confirmNftStake = async () => {
    loadingStateHandler(true);

    const { success } = await stackeNFTprePool(poolId || 0, value);

    if (success) {
      setIsStake(true);
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>{value} NFT's staked!</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  return (
    <CardWrapper>
      <CardHead>
        <CardHeadLeft>
          <div>You staked</div>
          <span>
            Enter the desired quantity of NFTs
            <br />
            <AvailableValue>
              Available <span>{availableStake}</span>
            </AvailableValue>
          </span>
        </CardHeadLeft>
        <CardHeadRight>
          <span>{alreadyStake}</span>
          FOMO NFT key
        </CardHeadRight>
      </CardHead>
      <CardValue>
        <input
          max={availableStake}
          min={0}
          type="number"
          value={value}
          onChange={(e: any) => setValue(e.target.value)}
        />
      </CardValue>
      <SquareBtn
        handler={confirmNftStake}
        type="green"
        width="410"
        text="Stake"
      />
    </CardWrapper>
  );
};

export default StakeCard;
