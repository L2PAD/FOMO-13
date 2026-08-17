import React, { FC } from "react";
import { useRouter } from "next/router";
import NftAccessModal from "../NftAccessModal";

/**
 * Unified public locked UX (Phase F P0.1). It ONLY displays a backend
 * AccessResolver decision — the frontend never decides whether an NFT is
 * required. For monetized capabilities (earlyland.prime, fomo_ai.access,
 * parsing, xrank...) the CTA points at the FOMO AI Membership, NOT at NFT.
 * NFT-native capabilities (launchpad.invest / spaceport.stake) keep their own
 * NFT eligibility flow and must NOT use this gate.
 */
export interface PremiumAccessGateProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  features?: string[];
  membershipHref?: string;
}

const PremiumAccessGate: FC<PremiumAccessGateProps> = ({
  isOpen,
  onClose,
  title,
  description,
  features,
  membershipHref = "/utility/memberships",
}) => {
  const router = useRouter();
  return (
    <NftAccessModal
      isOpen={isOpen}
      onClose={onClose}
      onAction={() => router.push(membershipHref)}
      actionLabel="View membership"
      title={title || "FOMO AI Membership required"}
      description={
        description ||
        "Unlock EarlyLand Prime, premium AI tools and advanced research with a FOMO AI membership."
      }
      features={features || [
        "EarlyLand Prime access",
        "FOMO AI + monthly credits",
        "Advanced Parsing & XRank",
      ]}
      faqTitle="What is FOMO AI Membership?"
      faqContent="FOMO AI Membership is the single paid layer of FOMO. It unlocks EarlyLand Prime, the FOMO AI assistant (with monthly credits), and advanced Parsing/XRank. Individual AI operations cost different amounts of credits. FREE FOMO (market data, Echo, Bakers, Unlocking, Portfolio, OTC/P2P, NFT Market and public project data) stays free."
    />
  );
};

export default PremiumAccessGate;
