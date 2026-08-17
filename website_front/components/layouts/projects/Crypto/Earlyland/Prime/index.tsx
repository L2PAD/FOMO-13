import React, { FC } from "react";
import { useRouter } from "next/router";
import {
  PrimeWrapper,
  HeroSection,
  LockIconWrap,
  PrimeTitle,
  PrimeSubtitle,
  FeatureCardsRow,
  FeatureCard,
  FeatureIconWrap,
  FeatureTextBlock,
  FeatureTitle,
  FeatureDesc,
  GetNftButton,
} from "./styles";
import { useTranslation } from "i18n";
import { BullishIcon } from "../../../../../global/Icons/Earlyland/icons";
import { Feed } from "../Feed";

const LockIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70" fill="none">
    <path d="M19.25 25.6667V23C19.25 14.1365 26.275 7 35 7C43.725 7 50.75 14.1365 50.75 23V25.6667M19.25 25.6667C16.3625 25.6667 14 28.0667 14 31V57.6667C14 60.6 16.3625 63 19.25 63H50.75C53.6375 63 56 60.6 56 57.6667V31C56 28.0667 53.6375 25.6667 50.75 25.6667M19.25 25.6667H50.75" stroke="#8161FF" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const CircleTargetIcon: FC = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="12" stroke="#8161ff" strokeWidth="2" />
    <circle cx="20" cy="20" r="7" stroke="#8161ff" strokeWidth="2" />
    <circle cx="20" cy="20" r="2.5" fill="#8161ff" />
  </svg>
);
const StarsIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M24.7059 4L27.7563 12.2437L36 15.2941L27.7563 18.3446L24.7059 26.5882L21.6554 18.3446L13.4118 15.2941L21.6554 12.2437L24.7059 4Z" stroke="#8161FF" strokeWidth="2" strokeLinejoin="round" />
    <path d="M10.5882 22.8235L13.2529 26.7471L17.1765 29.4118L13.2529 32.0765L10.5882 36L7.92352 32.0765L4 29.4118L7.92352 26.7471L10.5882 22.8235Z" stroke="#8161FF" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const CrownIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M7.389 13.8792C7.15567 13.8792 6.89456 13.6958 6.81678 13.4736L4.51678 7.04028C4.189 6.11806 4.57233 5.83472 5.36122 6.40139L7.52789 7.95139C7.889 8.20139 8.30011 8.07361 8.45567 7.66806L9.43344 5.0625C9.74456 4.22917 10.2612 4.22917 10.5723 5.0625L11.5501 7.66806C11.7057 8.07361 12.1168 8.20139 12.4723 7.95139L14.5057 6.50139C15.3723 5.87917 15.789 6.19583 15.4334 7.20139L13.189 13.4847C13.1057 13.6958 12.8446 13.8792 12.6112 13.8792H7.389Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.94415 15.5566H13.0553" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.61084 11.1094H11.3886" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FEATURES = [
  {
    icon: <CircleTargetIcon />,
    title: "Step-by-Step Guides",
    desc: (
      <>
        <p>Detailed instructions</p>
        <p>for every activity</p>
      </>
    ),
  },
  {
    icon: <BullishIcon />,
    title: "Progress Tracking",
    desc: <p>Track your completion</p>,
  },
  {
    icon: <StarsIcon />,
    title: "Personal Kanban",
    desc: <p>Organize tasks your way</p>,
  },
];

interface PrimeProps {
  hasNft?: boolean;
  searchValue?: string;
}

export const Prime: FC<PrimeProps> = ({ hasNft = false, searchValue = "" }) => {
  const { translateText } = useTranslation();
  const router = useRouter();

  if (hasNft) {
    return <Feed searchValue={searchValue} accessTier="prime" />;
  }

  return (
    <PrimeWrapper>
      <HeroSection>
        <LockIconWrap>
          <LockIcon />
        </LockIconWrap>

        <PrimeTitle>
          {translateText(hasNft ? "Prime access unlocked" : "Prime is NFT-Gated")}
        </PrimeTitle>

        <PrimeSubtitle>
          <p>{translateText("Prime unlocks step-by-step guides, execution tracking, and personal task boards.")}</p>
          {!hasNft && <p>{translateText("Unlock EarlyLand Prime with a FOMO AI membership.")}</p>}
        </PrimeSubtitle>
      </HeroSection>

      <FeatureCardsRow>
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title}>
            <FeatureIconWrap>{feature.icon}</FeatureIconWrap>
            <FeatureTextBlock>
              <FeatureTitle>{translateText(feature.title)}</FeatureTitle>
              <FeatureDesc>
                {feature.title === "Step-by-Step Guides" ? (
                  <>
                    <p>{translateText("Detailed instructions")}</p>
                    <p>{translateText("for every activity")}</p>
                  </>
                ) : feature.title === "Progress Tracking" ? (
                  <p>{translateText("Track your completion")}</p>
                ) : (
                  <p>{translateText("Organize tasks your way")}</p>
                )}
              </FeatureDesc>
            </FeatureTextBlock>
          </FeatureCard>
        ))}
      </FeatureCardsRow>

      {!hasNft && (
        <GetNftButton onClick={() => router.push("/utility/market")}>
          <CrownIcon />
          <span>{translateText("Get FOMO NFT")}</span>
        </GetNftButton>
      )}
    </PrimeWrapper>
  );
};
