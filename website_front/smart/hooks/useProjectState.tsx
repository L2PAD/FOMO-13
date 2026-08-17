import React, { useContext, useEffect, useState } from "react";
import {
  getNoNameNFTBalance,
  getNoNameNFTStakedBalance,
  getTotalStakeInPool,
  getUserCanInvestTime,
  getAllPartnersFromPool,
  getMeInPool,
  getUserClaimValue,
} from "../initialSmartMain";
import { IProject } from "../../types/global_types";
import parseDate from "../../helpers/parseDate";
import addDateAndTime from "../../helpers/addDateAndTime";
import { AuthContext } from "../../components/global/Layout";

export interface INftData {
  nftsValue: number;
  availableNfts: number;
  stakedNfts: number;
  totalStaked: number;
  isStakeStart: boolean;
  isStakeEnd: boolean;
  isStake: boolean;
}

export interface IPurchaseData {
  isPurchaseStart: boolean;
  isPurchaseEnd: boolean;
  dates: any;
  investData: any;
}

export interface IClaimData {
  participants: number;
  sumInvest: number;
  isClaimStart: boolean;
  isClaimAvailable: boolean;
  isAlreadyClaimed: boolean;
  claimValue: number;
}

interface IUseProjectStateOptions {
  enabled?: boolean;
}

const useProjectState = (
  project: IProject,
  options: IUseProjectStateOptions = {}
): {
  nftStakeData: INftData;
  purchaseData: IPurchaseData;
  claimData: IClaimData;
  isLoading: boolean;
  updateStakedNftsValue: (value: number) => void;
} => {
  const { enabled = true } = options;
  const { userData } = useContext(AuthContext);
  const [nftsValue, setNftsValue] = useState<number>(0);
  const [availableNfts, setAvailableNfts] = useState<number>(0);
  const [stakedNfts, setStakedNfts] = useState<number>(0);
  const [totalStaked, setTotalStaked] = useState<number>(0);
  const [isStakeStart, setIsStakeStart] = useState<boolean>(true);
  const [isStakeEnd, setIsStakeEnd] = useState<boolean>(true);
  const [isStake, setIsStake] = useState<boolean>(false);

  const [isPurchaseStart, setIsPurchaseStart] = useState<boolean>(false);
  const [isPurchaseEnd, setIsPurchaseEnd] = useState<boolean>(false);
  const [purchaseDates, setPurchaseDates] = useState<any>({});
  const [investData, setInvestData] = useState<any>({});

  const [isClaim, setIsClaim] = useState<boolean>(false);
  const [participants, setParticipants] = useState(0);
  const [sumInvest, setSumInvest] = useState(0);
  const [claimInfo, setClaimInfo] = useState<any>({
    isClaim: false,
    isAlreadyClaimed: false,
    claimValue: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getUserNftsStake = async (address: string) => {
    let isStake = false;
    let stakeCount = 0;

    const { sum, success } = await getNoNameNFTStakedBalance(address);

    if (!success) return { isStake, stakeCount };

    isStake = Number(sum) > 0;
    stakeCount = Number(sum);

    return { isStake, stakeCount };
  };

  const getNftsInfo = async () => {
    setIsLoading(true);
    const address = window.ethereum.selectedAddress;

    const { isStake, stakeCount } = await getUserNftsStake(address);

    if (isStake) {
      setIsStake(isStake);
      setStakedNfts(stakeCount);
    }

    const { sum, success } = await getNoNameNFTBalance(address);

    if (!success) return;

    setAvailableNfts(Number(sum));
    setNftsValue(Number(sum));

    const { totalStaked } = await getTotalStakeInPool(project.poolId || -1);
    setTotalStaked(totalStaked);
    setIsLoading(false);
  };

  const getPurchaseInfo = async () => {
    const { dates } = await getUserCanInvestTime(
      project.poolId || 0,
      window.ethereum.selectedAddress
    );
    const { data } = await getMeInPool(
      project.poolId || 0,
      window.ethereum.selectedAddress
    );

    setInvestData(data);
    setPurchaseDates(dates);
  };

  const updateStakedNftsValue = (value: number): void => {
    setStakedNfts(value);
  };

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    getNftsInfo();

    const isStakeStart =
      new Date().getTime() >
      addDateAndTime(
        new Date(project.stakingDateStart || ""),
        project.stakingTimeStart || "00:00"
      );

    const isStakeEnd =
      new Date().getTime() >
      addDateAndTime(
        new Date(project.stakingDateEnd || ""),
        project.stakingTimeEnd || "00:00"
      );

    const isPurchaseStart =
      new Date().getTime() >
      addDateAndTime(
        new Date(project.purchaseDateStart || ""),
        project.purchaseTimeStart || "00:00"
      );

    const isPurchaseEnd =
      new Date().getTime() >
      addDateAndTime(
        new Date(project.purchaseDateEnd || ""),
        project.purchaseTimeEnd || "00:00"
      );

    const isClaim = !!project.isClaimStart;

    const isAlreadyClaimed = !!userData?.claimedProjects?.includes(project._id);

    if (isAlreadyClaimed) {
      setClaimInfo((prev: any) => {
        return {
          ...prev,
          isAlreadyClaimed: true,
        };
      });
      return;
    }

    if (isPurchaseStart && !isPurchaseEnd) {
      getPurchaseInfo();
    }

    if (isClaim) {
      getUserClaimValue(
        project.poolId || 0,
        window.ethereum.selectedAddress
      ).then((value) => {
        setClaimInfo(value);
      });
    }

    if (
      !project.poolActive &&
      project.status === "Ended" &&
      !project.isClaimStart
    ) {
      getAllPartnersFromPool(project.poolId || 0).then(
        ({ sumInvest, participants }) => {
          setSumInvest(sumInvest || 0);
          setParticipants(participants);
        }
      );
    }

    setIsClaim(isClaim);
    setIsStakeEnd(isStakeEnd);
    setIsStakeStart(isStakeStart);
    setIsPurchaseStart(isPurchaseStart);
    setIsPurchaseEnd(isPurchaseEnd);
    getNftsInfo();
  }, [enabled]);

  return {
    nftStakeData: {
      nftsValue,
      availableNfts,
      stakedNfts,
      totalStaked,
      isStakeStart,
      isStake,
      isStakeEnd,
    },
    purchaseData: {
      isPurchaseStart,
      isPurchaseEnd,
      dates: purchaseDates,
      investData: investData,
    },
    claimData: {
      isClaimStart: isClaim,
      participants,
      sumInvest,
      isClaimAvailable: claimInfo.isClaim,
      claimValue: claimInfo.claimValue,
      isAlreadyClaimed: claimInfo.isAlreadyClaimed,
    },
    updateStakedNftsValue,
    isLoading,
  };
};

export default useProjectState;
