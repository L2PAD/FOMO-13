import React from "react";
import {
  AllocationLockedCard,
  AllocationHeader,
  AllocationLockedIconCircle,
  AllocationTitleGroup,
  AllocationTitle,
  AllocationSubtitle,
  AllocationLockedInfoBox,
  AllocationLockedInfoText,
  ZoneBadgesRow,
  ZoneBadge,
  OverflowCard,
  OverflowIconCircle,
  OverflowTitle,
  AllocationStatsRow,
  OverflowStatBox,
  AllocationStatHeader,
  AllocationStatLabel,
  OverflowStatValue,
  OverflowInfoBox,
  OverflowInfoText,
  WaitingListCard,
  WaitingListIconCircle,
  WaitingListTitle,
  WaitingListStatBox,
  WaitingListStatValue,
  WaitingListInfoBox,
  WaitingListInfoText,
  AllocationCard,
  AllocationIconCircle,
  AllocationStatBox,
  AllocationStatValue,
  AllocationCongratsBox,
  AllocationCongratsText,
  PurchaseCard,
  PurchaseIconCircle,
  PurchaseTitle,
  PurchaseTimeRow,
  PurchaseTimeLabel,
  PurchaseTimeValue,
  InvestSection,
  InvestFormGroup,
  InvestLabel,
  InvestInputRow,
  InvestCurrency,
  InvestAmountVal,
  InvestStepper,
  StepperBtn,
  InvestMinMaxRow,
  QuickAmountsRow,
  QuickAmountBtn,
  ApproveBtn,
  PurchaseWarningBox,
  PurchaseWarningText,
  ClaimCard,
  ClaimIconCircle,
  ClaimTokensBox,
  ClaimTokensLabel,
  ClaimTokensAmount,
  ClaimTokensNumber,
  ClaimTokensTicker,
  ClaimStatsRow,
  ClaimStatBox,
  ClaimStatLabel,
  ClaimStatValue,
  ClaimBtn,
} from "./styles";
import { LaunchpadProjectDetailData } from "./types";
import {
  IconShieldMedium,
  IconClockMedium,
  IconCup,
  IconShield,
  IconCircleCheck,
  IconLockOpen,
  IconClock,
  IconChevronStepUp,
  IconChevronStepDown,
  IconLockSmall,
  IconGift,
} from "../../../global/Icons/Launchpad/icons";
import type { LaunchpadZone } from "../../../../types/fomoV2Launchpad";

interface SidebarAllocationCardProps {
  zone: LaunchpadZone;
  project: LaunchpadProjectDetailData;
  activeTimelineIndex: number;
  investAmount: string;
  setInvestAmount: (value: string) => void;
  onAmountStep: (direction: "up" | "down") => void;
  onQuickAmount: (value: "1" | "10" | "100" | "max") => void;
  onInvest: () => void;
  onClaim: () => void;
  investmentActionLabel: string;
  claimActionLabel: string;
  canInvest: boolean;
  hasClaimReceipts: boolean;
  canClaim: boolean;
  canRefund: boolean;
  isPending: boolean;
  investTokenSymbol: string;
  minInvestment: string;
  maxInvestment: string;
  timeRemaining: string;
  actionMessage?: string;
  isPurchaseWindow: boolean;
  isActiveInvestWindow: boolean;
}

const SidebarAllocationCard: React.FC<SidebarAllocationCardProps> = ({
  zone,
  project,
  activeTimelineIndex,
  investAmount,
  setInvestAmount,
  onAmountStep,
  onQuickAmount,
  onInvest,
  onClaim,
  investmentActionLabel,
  claimActionLabel,
  canInvest,
  hasClaimReceipts,
  canClaim,
  canRefund,
  isPending,
  investTokenSymbol,
  minInvestment,
  maxInvestment,
  timeRemaining,
  actionMessage,
  isPurchaseWindow,
  isActiveInvestWindow,
}) => {
  const showPurchase = isPurchaseWindow && isActiveInvestWindow;
  const showClaim = activeTimelineIndex === 2 && hasClaimReceipts && (canClaim || canRefund);
  const showZoneStatus = !showPurchase && !showClaim;

  return (
    <>
      {zone === "none" && showZoneStatus && (
        <AllocationLockedCard>
          <AllocationHeader>
            <AllocationLockedIconCircle>
              <IconShieldMedium />
            </AllocationLockedIconCircle>
            <AllocationTitleGroup>
              <AllocationTitle className="locked">Allocation Locked</AllocationTitle>
              <AllocationSubtitle>Stake NFT to unlock</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          <AllocationLockedInfoBox>
            <AllocationLockedInfoText>
              Stake your FOMO NFT to unlock allocation access and secure your position in the queue.
            </AllocationLockedInfoText>
            <ZoneBadgesRow>
              <ZoneBadge variant="greenPassive">Green</ZoneBadge>
              <ZoneBadge variant="yellow">Yellow</ZoneBadge>
              <ZoneBadge variant="red">Red</ZoneBadge>
            </ZoneBadgesRow>
          </AllocationLockedInfoBox>
        </AllocationLockedCard>
      )}

      {zone === "yellow" && showZoneStatus && (
        <OverflowCard>
          <AllocationHeader>
            <OverflowIconCircle>
              <IconClockMedium color="#C24C00" size={20} />
            </OverflowIconCircle>
            <AllocationTitleGroup>
              <OverflowTitle>Overflow Round</OverflowTitle>
              <AllocationSubtitle>Waiting for your purchase slot</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          <AllocationStatsRow>
            <OverflowStatBox>
              <AllocationStatHeader><IconCup /><AllocationStatLabel>Position</AllocationStatLabel></AllocationStatHeader>
              <OverflowStatValue>{project.allocation.position}</OverflowStatValue>
            </OverflowStatBox>
            <OverflowStatBox>
              <AllocationStatHeader><IconShield /><AllocationStatLabel>Allocation</AllocationStatLabel></AllocationStatHeader>
              <OverflowStatValue>{project.allocation.amount}</OverflowStatValue>
            </OverflowStatBox>
          </AllocationStatsRow>
          <ZoneBadgesRow>
            <ZoneBadge variant="greenPassive">Green</ZoneBadge>
            <ZoneBadge variant="yellowFilled">Yellow</ZoneBadge>
            <ZoneBadge variant="red">Red</ZoneBadge>
          </ZoneBadgesRow>
          <OverflowInfoBox>
            <OverflowInfoText>
              <span className="bold">Almost there! </span>
              <span className="regular">Stake more NFTs to improve your allocation position.</span>
            </OverflowInfoText>
          </OverflowInfoBox>
        </OverflowCard>
      )}

      {zone === "red" && showZoneStatus && (
        <WaitingListCard>
          <AllocationHeader>
            <WaitingListIconCircle><IconClockMedium /></WaitingListIconCircle>
            <AllocationTitleGroup>
              <WaitingListTitle>Waiting List</WaitingListTitle>
              <AllocationSubtitle>Move up to secure allocation</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          <AllocationStatsRow>
            <WaitingListStatBox>
              <AllocationStatHeader><IconCup /><AllocationStatLabel>Position</AllocationStatLabel></AllocationStatHeader>
              <WaitingListStatValue>{project.allocation.position}</WaitingListStatValue>
            </WaitingListStatBox>
            <WaitingListStatBox>
              <AllocationStatHeader><IconShield /><AllocationStatLabel>Allocation</AllocationStatLabel></AllocationStatHeader>
              <WaitingListStatValue>{project.allocation.amount}</WaitingListStatValue>
            </WaitingListStatBox>
          </AllocationStatsRow>
          <ZoneBadgesRow>
            <ZoneBadge variant="greenPassive">Green</ZoneBadge>
            <ZoneBadge variant="yellow">Yellow</ZoneBadge>
            <ZoneBadge variant="redFilled">Red</ZoneBadge>
          </ZoneBadgesRow>
          <WaitingListInfoBox>
            <WaitingListInfoText>
              <span className="bold">Currently in waiting list. </span>
              <span className="regular">Stake more NFTs to improve your position and secure allocation.</span>
            </WaitingListInfoText>
          </WaitingListInfoBox>
        </WaitingListCard>
      )}

      {zone === "green" && showZoneStatus && (
        <AllocationCard>
          <AllocationHeader>
            <AllocationIconCircle><IconCircleCheck /></AllocationIconCircle>
            <AllocationTitleGroup>
              <AllocationTitle>Guaranteed Allocation</AllocationTitle>
              <AllocationSubtitle>Your allocation is secured</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          <AllocationStatsRow>
            <AllocationStatBox>
              <AllocationStatHeader><IconCup /><AllocationStatLabel>Position</AllocationStatLabel></AllocationStatHeader>
              <AllocationStatValue>{project.allocation.position}</AllocationStatValue>
            </AllocationStatBox>
            <AllocationStatBox>
              <AllocationStatHeader><IconShield /><AllocationStatLabel>Allocation</AllocationStatLabel></AllocationStatHeader>
              <AllocationStatValue>{project.allocation.amount}</AllocationStatValue>
            </AllocationStatBox>
          </AllocationStatsRow>
          <ZoneBadgesRow>
            <ZoneBadge variant="green">Green</ZoneBadge>
            <ZoneBadge variant="yellow">Yellow</ZoneBadge>
            <ZoneBadge variant="red">Red</ZoneBadge>
          </ZoneBadgesRow>
          <AllocationCongratsBox>
            <AllocationCongratsText>
              <span className="bold">Congratulations! </span>
              <span className="regular">{project.allocation.congratsMessage}</span>
            </AllocationCongratsText>
          </AllocationCongratsBox>
        </AllocationCard>
      )}

      {showPurchase && (
        <PurchaseCard>
          <AllocationHeader>
            <PurchaseIconCircle><IconLockOpen /></PurchaseIconCircle>
            <AllocationTitleGroup>
              <PurchaseTitle>Purchase Window</PurchaseTitle>
              <AllocationSubtitle>Your current invest: {project.claimDisplay.investment}</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          {project.display.showCountdown && (
            <PurchaseTimeRow>
              <IconClock />
              <PurchaseTimeLabel>Time Remaining</PurchaseTimeLabel>
              <PurchaseTimeValue>{timeRemaining}</PurchaseTimeValue>
            </PurchaseTimeRow>
          )}
          <InvestSection>
            <InvestFormGroup>
              <InvestLabel>Investment Amount</InvestLabel>
              <InvestInputRow>
                <InvestCurrency>{investTokenSymbol}</InvestCurrency>
                <InvestAmountVal
                  as="input"
                  value={investAmount}
                  onChange={(event) => setInvestAmount(event.target.value)}
                  inputMode="decimal"
                  aria-label="Investment amount"
                  style={{
                    flex: "0 1 140px",
                    minWidth: 0,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    textAlign: "right",
                  }}
                />
                <InvestStepper>
                  <StepperBtn type="button" onClick={() => onAmountStep("up")}><IconChevronStepUp /></StepperBtn>
                  <StepperBtn type="button" onClick={() => onAmountStep("down")}><IconChevronStepDown /></StepperBtn>
                </InvestStepper>
              </InvestInputRow>
              <InvestMinMaxRow>
                <span>Min: {minInvestment}</span>
                <span>Current allocation: {maxInvestment}</span>
              </InvestMinMaxRow>
            </InvestFormGroup>
            <QuickAmountsRow>
              {(["1", "10", "100", "max"] as const).map((value) => (
                <QuickAmountBtn type="button" key={value} onClick={() => onQuickAmount(value)}>
                  {value === "max" ? "Max" : `+${value}`}
                </QuickAmountBtn>
              ))}
            </QuickAmountsRow>
          </InvestSection>
          <ApproveBtn type="button" onClick={onInvest} disabled={isPending || !canInvest}>
            {investmentActionLabel}
          </ApproveBtn>
          <PurchaseWarningBox>
            <IconLockSmall />
            <PurchaseWarningText>
              {actionMessage || "Your NFT remains locked until the pool enables unstaking."}
            </PurchaseWarningText>
          </PurchaseWarningBox>
        </PurchaseCard>
      )}

      {showClaim && (
        <ClaimCard>
          <AllocationHeader>
            <ClaimIconCircle><IconGift color="#a02af3" /></ClaimIconCircle>
            <AllocationTitleGroup>
              <AllocationTitle style={{ color: "#070b35" }}>
                {canRefund ? "Refund Ready to Claim" : "Tokens Ready to Claim"}
              </AllocationTitle>
              <AllocationSubtitle>Your claim is available from the launchpad contract</AllocationSubtitle>
            </AllocationTitleGroup>
          </AllocationHeader>
          <ClaimTokensBox>
            <ClaimTokensLabel>{canRefund ? "Refund Amount" : "Claimable Tokens"}</ClaimTokensLabel>
            <ClaimTokensAmount>
              <ClaimTokensNumber>{project.claimDisplay.amount}</ClaimTokensNumber>
              <ClaimTokensTicker>{project.claimDisplay.symbol}</ClaimTokensTicker>
            </ClaimTokensAmount>
          </ClaimTokensBox>
          <ClaimStatsRow>
            <ClaimStatBox><ClaimStatLabel>Investment</ClaimStatLabel><ClaimStatValue>{project.claimDisplay.investment}</ClaimStatValue></ClaimStatBox>
            <ClaimStatBox><ClaimStatLabel>Token Price</ClaimStatLabel><ClaimStatValue>{project.tokenPrice}</ClaimStatValue></ClaimStatBox>
          </ClaimStatsRow>
          <ClaimBtn type="button" onClick={onClaim} disabled={isPending || (!canClaim && !canRefund)}>
            <IconGift color="white" />
            {claimActionLabel}
          </ClaimBtn>
        </ClaimCard>
      )}
    </>
  );
};

export default SidebarAllocationCard;
