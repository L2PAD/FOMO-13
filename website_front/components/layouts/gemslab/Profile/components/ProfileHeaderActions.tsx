import React, { useEffect, useRef } from "react";
import {
  ChevronDown,
  Copy,
  Link,
  Link2,
  LifeBuoy,
  Send,
  Zap,
} from "lucide-react";
import SocialLinks from "../../../../global/common/SocialLinks";
import {
  CopyIcon,
  SupportIcon,
} from "../../../../global/Icons";
import {
  ActionsPopoverTrigger,
  PopoverOverlay,
  ActionsPopover,
  PopoverActionsContainer,
} from "../../../projects/Crypto/Project/crypto-styles";
import {
  HeaderDetails,
  HeaderSectionCard,
  HeaderSectionTitle,
} from "../styles";
import { useTranslation } from "i18n";

interface SocialLinkItem {
  href: string;
  key: string;
}

interface Props {
  fomoId: string | number;
  isActionsPopoverOpen: boolean;
  isMobile: boolean;
  isSocialsPopoverOpen: boolean;
  onCloseActionsPopover: () => void;
  onCloseSocialsPopover: () => void;
  onCopyFomoId: () => void;
  onCopyReferralLink: () => void | Promise<void>;
  onOpenClink: () => void;
  onOpenSupport: () => void;
  onToggleActionsPopover: () => void;
  onToggleSocialsPopover: () => void;
  socialLinks: SocialLinkItem[];
}

const ClinkIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="17"
      viewBox="0 0 19 17"
      fill="none"
    >
      <path
        d="M9.5 6.5V9M9.5 9V11.5M9.5 9H12M9.5 9H7M4.38 14.26L2.14 16.5M16.86 16.5L14.62 14.26M3.5 0.5L1 3M18 3L15.5 0.5M16.54 9.14C16.54 13.0281 13.3881 16.18 9.5 16.18C5.61192 16.18 2.46 13.0281 2.46 9.14C2.46 5.25191 5.61192 2.1 9.5 2.1C13.3881 2.1 16.54 5.25191 16.54 9.14Z"
        stroke="#070B35"
        strokeLinecap="round"
      />
    </svg>
  );
};

const ProfileHeaderActions = ({
  fomoId,
  isActionsPopoverOpen,
  isMobile,
  isSocialsPopoverOpen,
  onCloseActionsPopover,
  onCloseSocialsPopover,
  onCopyFomoId,
  onCopyReferralLink,
  onOpenClink,
  onOpenSupport,
  onToggleActionsPopover,
  onToggleSocialsPopover,
  socialLinks,
}: Props) => {
  const { translateText } = useTranslation();
  const socialCardRef = useRef<HTMLDivElement | null>(null);
  const actionsCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isMobile) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        isSocialsPopoverOpen &&
        socialCardRef.current &&
        !socialCardRef.current.contains(target)
      ) {
        onCloseSocialsPopover();
      }

      if (
        isActionsPopoverOpen &&
        actionsCardRef.current &&
        !actionsCardRef.current.contains(target)
      ) {
        onCloseActionsPopover();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [
    isActionsPopoverOpen,
    isMobile,
    isSocialsPopoverOpen,
    onCloseActionsPopover,
    onCloseSocialsPopover,
  ]);

  if (isMobile) {
    return (
      <HeaderDetails>
        <HeaderSectionCard>
          <HeaderSectionTitle>
            <Zap size={18} />
            <span>{translateText("Quick access")}</span>
          </HeaderSectionTitle>
          <div className="mobile-actions-row">
            <div className="mobile-action-slot">
              <ActionsPopoverTrigger
                data-popover-trigger
                onClick={onToggleActionsPopover}
                className={`mobile-action-trigger mobile-action-card ${
                  isActionsPopoverOpen ? "is-open" : ""
                }`}
              >
                <div className="mobile-action-content">
                  <div className="mobile-action-icon">
                    <Zap size={16} />
                  </div>
                  <div className="mobile-action-labels">
                    <span className="mobile-action-title">
                      {translateText("Quick actions")}
                    </span>
                    <span className="mobile-action-meta">
                      {translateText("4 actions")}
                    </span>
                  </div>
                </div>
                <ChevronDown size={16} />
              </ActionsPopoverTrigger>
              {isActionsPopoverOpen && (
                <>
                  <PopoverOverlay onClick={onCloseActionsPopover} />
                  <ActionsPopover data-popover-trigger>
                    <PopoverActionsContainer>
                      <button onClick={onCopyFomoId}>
                        <CopyIcon />
                      </button>
                      <span>FOMO ID:</span>
                      <span style={{ fontWeight: "var(--font-weight-semibold)" }}>{fomoId}</span>
                      <button onClick={onCopyReferralLink}>
                        <CopyIcon />
                      <span>{translateText("Copy referral link")}</span>
                      </button>
                      <button onClick={onOpenClink} className="support-btn">
                        <ClinkIcon />
                        <span style={{ fontWeight: "var(--font-weight-semibold)" }}>Clink</span>
                      </button>
                      <button onClick={onOpenSupport} className="support-btn">
                        <SupportIcon />
                        <span style={{ fontWeight: "var(--font-weight-semibold)" }}>
                          {translateText("Support")}
                        </span>
                      </button>
                    </PopoverActionsContainer>
                  </ActionsPopover>
                </>
              )}
            </div>

            <div className="mobile-action-slot">
              <ActionsPopoverTrigger
                data-popover-trigger
                onClick={onToggleSocialsPopover}
                className={`socials-trigger mobile-action-trigger mobile-action-card ${
                  isSocialsPopoverOpen ? "is-open" : ""
                }`}
              >
                <div className="mobile-action-content">
                  <div className="mobile-action-icon mobile-action-icon-blue">
                    <Link width={16} height={16} color="var(--main-blue)" />
                  </div>
                  <div className="mobile-action-labels">
                    <span className="mobile-action-title">
                      {translateText("Social links")}
                    </span>
                    <span className="mobile-action-meta">
                      {socialLinks.length} {translateText("links")}
                    </span>
                  </div>
                </div>
                <ChevronDown size={16} />
              </ActionsPopoverTrigger>
              {isSocialsPopoverOpen && (
                <>
                  <PopoverOverlay onClick={onCloseSocialsPopover} />
                  <ActionsPopover data-popover-trigger>
                    <PopoverActionsContainer>
                      <SocialLinks
                        className="projects"
                        links={socialLinks}
                        showLabel
                      />
                    </PopoverActionsContainer>
                  </ActionsPopover>
                </>
              )}
            </div>
          </div>
        </HeaderSectionCard>
      </HeaderDetails>
    );
  }

  return (
    <>
      <HeaderSectionCard ref={socialCardRef} className="social-links-card">
        <ActionsPopoverTrigger
          data-popover-trigger
          onClick={onToggleSocialsPopover}
          className={`header-dropdown-trigger ${
            isSocialsPopoverOpen ? "is-open" : ""
          }`}
        >
          <div className="header-dropdown-head">
            <HeaderSectionTitle className="header-section-title-green">
              <Send size={18} />
              <span>{translateText("Social links")}</span>
            </HeaderSectionTitle>
            <ChevronDown size={18} />
          </div>
          <span className="header-dropdown-meta">
            {socialLinks.length} {translateText("links")}
          </span>
        </ActionsPopoverTrigger>
        {isSocialsPopoverOpen && (
          <div className="header-dropdown-panel" data-popover-trigger>
            {socialLinks.length ? (
              <SocialLinks
                className="header-dropdown-list projects"
                links={socialLinks}
                showLabel
              />
            ) : (
              <div className="header-dropdown-empty">
                {translateText("No social links yet")}
              </div>
            )}
          </div>
        )}
      </HeaderSectionCard>

      <HeaderSectionCard ref={actionsCardRef}>
        <ActionsPopoverTrigger
          data-popover-trigger
          onClick={onToggleActionsPopover}
          className={`header-dropdown-trigger ${
            isActionsPopoverOpen ? "is-open" : ""
          }`}
        >
          <div className="header-dropdown-head">
            <HeaderSectionTitle className="header-section-title-green">
              <Zap size={18} />
              <span>{translateText("Quick actions")}</span>
            </HeaderSectionTitle>
            <ChevronDown size={18} />
          </div>
          <span className="header-dropdown-meta">
            {translateText("4 actions")}
          </span>
        </ActionsPopoverTrigger>
        {isActionsPopoverOpen && (
          <div className="header-dropdown-panel" data-popover-trigger>
            <div className="header-dropdown-list">
              <div className="header-dropdown-info">
                <span>FOMO ID</span>
                <strong>{fomoId || "-"}</strong>
              </div>
              <button onClick={onCopyFomoId} className="header-dropdown-button">
                <Copy size={16} />
                <span>{translateText("Copy FOMO ID")}</span>
              </button>
              <button
                onClick={onCopyReferralLink}
                className="header-dropdown-button"
              >
                <Link2 size={16} />
                <span>{translateText("Copy referral link")}</span>
              </button>
              <button onClick={onOpenClink} className="header-dropdown-button">
                <ClinkIcon />
                <span>{translateText("Open Clink")}</span>
              </button>
              <button
                onClick={onOpenSupport}
                className="header-dropdown-button"
              >
                <LifeBuoy size={16} />
                <span>{translateText("Support")}</span>
              </button>
            </div>
          </div>
        )}
      </HeaderSectionCard>
    </>
  );
};

export default ProfileHeaderActions;
