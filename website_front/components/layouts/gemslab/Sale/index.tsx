import React, { useContext, useEffect, useState } from "react";
import { ProjectSaleContext } from "../../../../pages/gemslab/launch/sale/[id]";
import UserAvatar from "../../../global/common/UserAvatar";
import imageLoader from "../../../../helpers/imageLoader";
import NftStakeCard from "./cards/nftStakeCard";
import PurchaseCard from "./cards/purchaseCard";
import useProjectState, {
  IClaimData,
  INftData,
  IPurchaseData,
} from "../../../../smart/hooks/useProjectState";
import Loader from "../../../global/loader";
import {
  ClaimDoneDataWrapper,
  ClaimDoneWrapper,
  Description,
  HeaderWrapper,
  PageWrapper,
  PreviewButton,
  PreviewButtons,
  PreviewPanel,
  PreviewPanelTitle,
  StagesWrapper,
  Title,
} from "./styles";
import ClaimCard from "./cards/claimCard";
import { RefundWrapper } from "../../../global/ViewCard/styles";
import { IProject } from "../../../../types/global_types";

type PreviewStage = "staking" | "purchase" | "claim" | "ended" | "refunded";

const SALE_PREVIEW_MODE = false;

const PREVIEW_STAGE_OPTIONS: Array<{
  id: PreviewStage;
  label: string;
}> = [
  { id: "staking", label: "Staking" },
  { id: "purchase", label: "Purchase" },
  { id: "claim", label: "Claim" },
  { id: "ended", label: "Ended" },
  { id: "refunded", label: "Refunded" },
];

const PREVIEW_SALE_SUMMARY = {
  participants: 184,
  sumInvest: 92750,
};

const getPreviewProject = (
  project: IProject,
  previewStage: PreviewStage
): IProject => {
  if (previewStage === "ended" || previewStage === "refunded") {
    return {
      ...project,
      poolActive: false,
      status: "Ended",
      isClaimStart: false,
      isRefunded: previewStage === "refunded",
    };
  }

  if (previewStage === "claim") {
    return {
      ...project,
      poolActive: false,
      status: "Ended",
      isClaimStart: true,
      isRefunded: false,
    };
  }

  return {
    ...project,
    poolActive: true,
    status: "Active",
    isClaimStart: false,
    isRefunded: false,
  };
};

const getPreviewNftData = (
  previewStage: PreviewStage,
  stakedNfts: number
): INftData => {
  const defaultData = {
    nftsValue: 5,
    availableNfts: 5,
    stakedNfts,
    totalStaked: 142,
    isStake: stakedNfts > 0,
  };

  if (previewStage === "staking") {
    return {
      ...defaultData,
      isStakeStart: true,
      isStakeEnd: false,
    };
  }

  return {
    ...defaultData,
    isStakeStart: true,
    isStakeEnd: true,
  };
};

const getPreviewPurchaseData = (
  previewStage: PreviewStage,
  investedValue: number
): IPurchaseData => {
  const baseData = {
    dates: {
      startTime: "Mar 02, 2026 12:00",
      endTime: "Mar 03, 2026 12:00",
    },
    investData: investedValue ? { invest: investedValue } : {},
  };

  switch (previewStage) {
    case "purchase":
      return {
        ...baseData,
        isPurchaseStart: true,
        isPurchaseEnd: false,
      };
    case "claim":
      return {
        ...baseData,
        isPurchaseStart: true,
        isPurchaseEnd: true,
      };
    default:
      return {
        ...baseData,
        isPurchaseStart: false,
        isPurchaseEnd: true,
      };
  }
};

const getPreviewClaimData = (
  previewStage: PreviewStage,
  isAlreadyClaimed: boolean
): IClaimData => ({
  participants: PREVIEW_SALE_SUMMARY.participants,
  sumInvest: PREVIEW_SALE_SUMMARY.sumInvest,
  isClaimStart: previewStage === "claim",
  isClaimAvailable: previewStage === "claim" && !isAlreadyClaimed,
  isAlreadyClaimed,
  claimValue: 1250,
});

const Sale = () => {
  const project = useContext(ProjectSaleContext);
  const [previewStage, setPreviewStage] = useState<PreviewStage>("staking");
  const [previewStakedNfts, setPreviewStakedNfts] = useState(1);
  const [previewInvestedValue, setPreviewInvestedValue] = useState(0);
  const {
    nftStakeData,
    purchaseData,
    claimData,
    isLoading,
    updateStakedNftsValue,
  } = useProjectState(project, { enabled: !SALE_PREVIEW_MODE });

  useEffect(() => {
    if (previewStage === "staking") {
      setPreviewStakedNfts(1);
      setPreviewInvestedValue(0);
      return;
    }

    if (previewStage === "purchase") {
      setPreviewStakedNfts(3);
      setPreviewInvestedValue(0);
      return;
    }

    if (previewStage === "claim") {
      setPreviewStakedNfts(3);
      setPreviewInvestedValue(850);
      return;
    }

    setPreviewStakedNfts(3);
    setPreviewInvestedValue(850);
  }, [previewStage]);

  const currentProject = SALE_PREVIEW_MODE
    ? getPreviewProject(project, previewStage)
    : project;
  const currentNftStakeData = SALE_PREVIEW_MODE
    ? getPreviewNftData(previewStage, previewStakedNfts)
    : nftStakeData;
  const currentPurchaseData = SALE_PREVIEW_MODE
    ? getPreviewPurchaseData(previewStage, previewInvestedValue)
    : purchaseData;
  const currentClaimData = SALE_PREVIEW_MODE
    ? getPreviewClaimData(previewStage, false)
    : claimData;
  const isDone =
    !currentProject.poolActive &&
    currentProject.status === "Ended" &&
    !currentProject.isClaimStart;

  if (isLoading) return <Loader isVisible />;

  return (
    <ProjectSaleContext.Provider value={currentProject}>
      <PageWrapper>
        <HeaderWrapper>
          <UserAvatar
            avatar={imageLoader(String(currentProject.logo))}
            name="name"
            variant="default"
            size="big"
          />
          <Title>{currentProject.name}</Title>
          <Description>{currentProject.banner}</Description>
        </HeaderWrapper>

        {SALE_PREVIEW_MODE && (
          <PreviewPanel>
            <PreviewPanelTitle>Sale preview mode</PreviewPanelTitle>
            <PreviewButtons>
              {PREVIEW_STAGE_OPTIONS.map((stage) => (
                <PreviewButton
                  key={stage.id}
                  active={previewStage === stage.id}
                  onClick={() => setPreviewStage(stage.id)}
                >
                  {stage.label}
                </PreviewButton>
              ))}
            </PreviewButtons>
          </PreviewPanel>
        )}

        {!isDone ? (
          <StagesWrapper>
            <NftStakeCard
              key={`staking-${previewStage}`}
              previewMode={SALE_PREVIEW_MODE}
              updateStakedNftsValue={(value) => {
                if (SALE_PREVIEW_MODE) {
                  setPreviewStakedNfts(value);
                  return;
                }

                updateStakedNftsValue(value);
              }}
              nftStakeData={currentNftStakeData}
            />

            <PurchaseCard
              key={`purchase-${previewStage}`}
              previewMode={SALE_PREVIEW_MODE}
              project={currentProject}
              purchaseData={currentPurchaseData}
            />

            <ClaimCard
              key={`claim-${previewStage}`}
              previewMode={SALE_PREVIEW_MODE}
              claimData={currentClaimData}
              project={currentProject}
            />
          </StagesWrapper>
        ) : currentProject.isRefunded ? (
          <ClaimDoneWrapper>
            <ClaimDoneDataWrapper>
              <RefundWrapper>REFUNDED</RefundWrapper>
              <div>
                <span>Participants</span>
                <p>{currentClaimData.participants}</p>
              </div>
              <div>
                <span>Total Sales</span>
                <p>{currentClaimData.sumInvest} USD</p>
              </div>
            </ClaimDoneDataWrapper>
          </ClaimDoneWrapper>
        ) : (
          <ClaimDoneWrapper>
            <ClaimDoneDataWrapper>
              <p>The {currentProject.name} sale has ended</p>

              <div>
                <span>Participants</span>
                <p>{currentClaimData.participants}</p>
              </div>
              <div>
                <span>Total Sales</span>
                <p>{currentClaimData.sumInvest} USD</p>
              </div>
            </ClaimDoneDataWrapper>
          </ClaimDoneWrapper>
        )}
      </PageWrapper>
    </ProjectSaleContext.Provider>
  );
};

export default Sale;
