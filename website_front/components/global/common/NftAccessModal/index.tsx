import React, { FC, useMemo, useState } from "react";
import { Check, ChevronDown, Crown, Lock, X } from "lucide-react";
import { useRouter } from "next/router";
import {
  Accent,
  ActionButton,
  AmbientGlow,
  CloseButton,
  Content,
  Description,
  FaqButton,
  FaqText,
  FeatureIcon,
  FeatureItem,
  FeatureList,
  Footer,
  IconWrap,
  ModalCard,
  Overlay,
  Title,
} from "./styles";

export interface NftAccessModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  title?: string;
  description?: string;
  features?: string[];
  faqTitle?: string;
  faqContent?: string;
  showCloseButton?: boolean;
}

const defaultFeatures = [
  "Custom Twitter Parsing",
  "Advanced analytics & insights",
  "Full platform access",
];

const NftAccessModal: FC<NftAccessModalProps> = ({
  isOpen,
  onClose,
  onAction,
  actionLabel = "Get FOMO NFT",
  title = "Unlock with FOMO NFT",
  description = "Access exclusive analytics and custom social parsing by holding the FOMO NFT.",
  features,
  faqTitle = "What is FOMO NFT?",
  faqContent = "FOMO NFT unlocks gated analytics, premium parsing tools, and feature-restricted areas of the platform. Show this modal on protected pages when the connected user has no qualifying NFT.",
  showCloseButton = true,
}) => {
  const router = useRouter();
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const featureItems = useMemo(() => {
    return features?.length ? features : defaultFeatures;
  }, [features]);

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(event) => event.stopPropagation()}>
        <AmbientGlow />
        <Content>
          <IconWrap>
            <svg width="46" height="60" viewBox="0 0 46 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.25 20.6667V18C7.25 9.13651 14.275 2 23 2C31.725 2 38.75 9.13651 38.75 18V20.6667M7.25 20.6667C4.3625 20.6667 2 23.0667 2 26V52.6667C2 55.6 4.3625 58 7.25 58H38.75C41.6375 58 44 55.6 44 52.6667V26C44 23.0667 41.6375 20.6667 38.75 20.6667M7.25 20.6667H38.75" stroke="#8161FF" stroke-width="4" stroke-linecap="round" />
            </svg>
          </IconWrap>

          <Title>
            {title}
          </Title>

          <Description>{description}</Description>

          <FeatureList>
            {featureItems.map((feature) => (
              <FeatureItem key={feature}>
                <FeatureIcon>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.6004 12.0004C21.6004 17.3023 17.3023 21.6004 12.0004 21.6004C6.69846 21.6004 2.40039 17.3023 2.40039 12.0004C2.40039 6.69846 6.69846 2.40039 12.0004 2.40039C17.3023 2.40039 21.6004 6.69846 21.6004 12.0004Z" stroke="#05A584" />
                    <path d="M15.6004 9.59961L10.2308 14.3996L8.40039 12.7634" stroke="#05A584" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </FeatureIcon>
                <span>{feature}</span>
              </FeatureItem>
            ))}
          </FeatureList>

          <ActionButton
            type="button"
            onClick={() => {
              if (onAction) {
                onAction();
                return;
              }

              router.push("/core/spaceport");
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.3446 19.4293C10.0179 19.4293 9.65238 19.1726 9.54349 18.8615L6.32349 9.85483C5.8646 8.56372 6.40127 8.16705 7.50571 8.96038L10.539 11.1304C11.0446 11.4804 11.6202 11.3015 11.8379 10.7337L13.2068 7.08594C13.6424 5.91927 14.3657 5.91927 14.8013 7.08594L16.1702 10.7337C16.3879 11.3015 16.9635 11.4804 17.4613 11.1304L20.3079 9.10038C21.5213 8.22927 22.1046 8.6726 21.6068 10.0804L18.4646 18.877C18.3479 19.1726 17.9824 19.4293 17.6557 19.4293H10.3446Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M9.72168 21.7793H18.2772" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12.0547 15.5547H15.9436" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {actionLabel}
          </ActionButton>

          <Footer>
            <FaqButton
              type="button"
              onClick={() => setIsFaqOpen((prev) => !prev)}
              $expanded={isFaqOpen}
            >
              <span>{faqTitle}</span>
              <ChevronDown size={18} strokeWidth={2.2} />
            </FaqButton>

            {isFaqOpen ? <FaqText>{faqContent}</FaqText> : null}
          </Footer>
        </Content>
      </ModalCard>
    </Overlay>
  );
};

export default NftAccessModal;
