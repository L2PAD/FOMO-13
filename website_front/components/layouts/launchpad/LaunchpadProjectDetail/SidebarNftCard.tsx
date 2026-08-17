import React from "react";
import { useRouter } from "next/router";
import {
  AllocationHeader,
  AllocationTitleGroup,
  AllocationTitle,
  AllocationSubtitle,
  AllocationIconCircle,
  NftStakedYellowCard,
  NftStakedYellowIconCircle,
  NftStakedYellowTitle,
  NftStakedRedCard,
  NftStakedRedIconCircle,
  NftStakedRedTitle,
  NftRequiredCard,
  NftRequiredIconCircle,
  NftRequiredTitle,
  NftStakedCard,
  CountdownBox,
  CountdownLabel,
  CountdownValue,
  StakeMoreBtn,
  SpaceportBtn,
} from "./styles";
import { LaunchpadProjectDetailData } from "./types";
import {
  IconLayers,
  IconLockClosed,
  IconClock,
  IconLayersSmall,
  IconLayersSmallWhite,
} from "../../../global/Icons/Launchpad/icons";
import type { LaunchpadZone } from "../../../../types/fomoV2Launchpad";

interface SidebarNftCardProps {
  zone: LaunchpadZone;
  project: LaunchpadProjectDetailData;
  onStake: () => void;
  onUnstake: () => void;
  canStake: boolean;
  canUnstake: boolean;
  hasOwnedNfts: boolean;
  isPending: boolean;
  isConnected: boolean;
}

const SidebarNftCard: React.FC<SidebarNftCardProps> = ({
  zone,
  project,
  onStake,
  onUnstake,
  canStake,
  canUnstake,
  hasOwnedNfts,
  isPending,
  isConnected,
}) => {
  const router = useRouter();

  const stakeButton = (
    <StakeMoreBtn type="button" onClick={onStake} disabled={isPending || !canStake}>
      <IconLayersSmall />
      Stake More NFTs
    </StakeMoreBtn>
  );
  const unstakeButton = (
    <StakeMoreBtn type="button" onClick={onUnstake} disabled={isPending}>
      <IconLayersSmall />
      Unstake NFTs
    </StakeMoreBtn>
  );

  return (
    <>
      {zone === "yellow" && (
        <NftStakedYellowCard>
          <AllocationHeader>
            <NftStakedYellowIconCircle><IconLayers color="#c24c00" /></NftStakedYellowIconCircle>
            <AllocationTitleGroup>
              <NftStakedYellowTitle>NFT Staked</NftStakedYellowTitle>
              <AllocationSubtitle>{project.nftStaked.subtitle}</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          {project.display.showCountdown && <CountdownBox>
            <IconClock />
            <CountdownLabel>{project.nftStaked.countdownLabel}</CountdownLabel>
            <CountdownValue>{project.nftStaked.countdownValue}</CountdownValue>
          </CountdownBox>}
          {canStake && stakeButton}
          {canUnstake && unstakeButton}
        </NftStakedYellowCard>
      )}

      {zone === "red" && (
        <NftStakedRedCard>
          <AllocationHeader>
            <NftStakedRedIconCircle><IconLayers color="#ff5857" /></NftStakedRedIconCircle>
            <AllocationTitleGroup>
              <NftStakedRedTitle>NFT Staked</NftStakedRedTitle>
              <AllocationSubtitle>{project.nftStaked.subtitle}</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          {project.display.showCountdown && <CountdownBox>
            <IconClock />
            <CountdownLabel>{project.nftStaked.countdownLabel}</CountdownLabel>
            <CountdownValue>{project.nftStaked.countdownValue}</CountdownValue>
          </CountdownBox>}
          {canStake && stakeButton}
          {canUnstake && unstakeButton}
        </NftStakedRedCard>
      )}

      {zone === "none" && (
        <NftRequiredCard>
          <AllocationHeader>
            <NftRequiredIconCircle><IconLockClosed /></NftRequiredIconCircle>
            <AllocationTitleGroup>
              <NftRequiredTitle>NFT Required</NftRequiredTitle>
              <AllocationSubtitle>Stake your FOMO NFT to unlock allocation access</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          {project.display.showCountdown && <CountdownBox>
            <IconClock />
            <CountdownLabel>{project.nftStaked.countdownLabel}</CountdownLabel>
            <CountdownValue>{project.nftStaked.countdownValue}</CountdownValue>
          </CountdownBox>}
          {canStake && (
            <SpaceportBtn
              type="button"
              disabled={isPending}
              onClick={() => {
                if (isConnected && hasOwnedNfts) onStake();
                else router.push("/core/spaceport");
              }}
            >
              <IconLayersSmallWhite />
              {isConnected && hasOwnedNfts ? "Stake FOMO NFT" : "Spaceport → Stake NFT"}
            </SpaceportBtn>
          )}
        </NftRequiredCard>
      )}

      {zone === "green" && (
        <NftStakedCard>
          <AllocationHeader>
            <AllocationIconCircle><IconLayers color="#05a584" /></AllocationIconCircle>
            <AllocationTitleGroup>
              <AllocationTitle>NFT Staked</AllocationTitle>
              <AllocationSubtitle>{project.nftStaked.subtitle}</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          {project.display.showCountdown && <CountdownBox>
            <IconClock />
            <CountdownLabel>{project.nftStaked.countdownLabel}</CountdownLabel>
            <CountdownValue>{project.nftStaked.countdownValue}</CountdownValue>
          </CountdownBox>}
          {canStake && stakeButton}
          {canUnstake && unstakeButton}
        </NftStakedCard>
      )}
    </>
  );
};

export default SidebarNftCard;
