import React, { useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronDown, Sparkles } from "lucide-react";
import Placeholder from "../../../../global/common/Placeholder";
import Typography from "../../../../global/common/Typography";
import { UserAvatarWrapper } from "../../../nfts/Persons/Person/styles";
import imageLoader from "../../../../../helpers/imageLoader";
import { getServiceByUrl } from "../../../../../helpers/getServiceKeyByUrl";
import { ActionsPopoverTrigger } from "../../../projects/Crypto/Project/crypto-styles";
import ProfileBadges, { type ProfileBadgeItem } from "./ProfileBadges";
import ProfileHeaderActions from "./ProfileHeaderActions";
import fetchUserBadges, { type PublicUserBadge } from "../../../../../http/user/fetchUserBadges";
import { useTranslation } from "i18n";
import {
  HeaderColumn,
  HeaderCompactRow,
  HeaderDetails,
  HeaderIdentityMeta,
  HeaderIdentitySection,
  HeaderIdentitySurface,
  HeaderPersonNameWrapper,
  HeaderPersonTitle,
  HeaderPrimaryCard,
  HeaderSectionCard,
  HeaderSectionTitle,
  HeaderWrapper,
  LeftHeaderColumn,
  LeftHeaderPersonInfoWrapper,
} from "../styles";

interface Props {
  isActionsPopoverOpen: boolean;
  isBadgesPopoverOpen: boolean;
  isHighlightsPopoverOpen: boolean;
  isMobile: boolean;
  isSocialsPopoverOpen: boolean;
  onCloseActionsPopover: () => void;
  onCloseBadgesPopover: () => void;
  onCloseHighlightsPopover: () => void;
  onCloseSocialsPopover: () => void;
  onCopyFomoId: () => void;
  onCopyReferralLink: () => void | Promise<void>;
  onOpenClink: () => void;
  onOpenSupport: () => void;
  onToggleActionsPopover: () => void;
  onToggleBadgesPopover: () => void;
  onToggleHighlightsPopover: () => void;
  onToggleSocialsPopover: () => void;
  userData: any;
}

interface ProfileBadgeSource {
  claimed?: boolean;
  earned?: boolean;
  key?: string;
  name?: string;
}

interface ProfileHighlight {
  isVerified?: boolean;
  key: string;
  label: string;
}

const getSocialLinks = (socialNetworks?: Record<string, string>) => {
  if (!socialNetworks) {
    return [];
  }

  return Object.values(socialNetworks).map((item: any) => ({
    key: getServiceByUrl(item),
    href: item,
  }));
};

const getAvatar = (userData: any) => {
  if (!userData?.photo) {
    if (userData?.twitterData?.photo) {
      return userData?.twitterData?.photo;
    }

    return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU";
  }

  return imageLoader(userData.photo);
};

const ProfileHeader = ({
  isActionsPopoverOpen,
  isBadgesPopoverOpen,
  isHighlightsPopoverOpen,
  isMobile,
  isSocialsPopoverOpen,
  onCloseActionsPopover,
  onCloseBadgesPopover,
  onCloseHighlightsPopover,
  onCloseSocialsPopover,
  onCopyFomoId,
  onCopyReferralLink,
  onOpenClink,
  onOpenSupport,
  onToggleActionsPopover,
  onToggleBadgesPopover,
  onToggleHighlightsPopover,
  onToggleSocialsPopover,
  userData,
}: Props) => {
  const { translateText } = useTranslation();
  const socialLinks = getSocialLinks(userData?.socialNetworks);
  const isLoading = !userData;
  const highlightsCardRef = useRef<HTMLDivElement | null>(null);
  const badgesCardRef = useRef<HTMLDivElement | null>(null);
  const greenFlags = Array.isArray(userData?.greenFlagsList)
    ? userData.greenFlagsList
    : [];
  const profileHighlights: ProfileHighlight[] = [
    ...(userData?.verificationStatus
      ? [
          {
            isVerified: true,
            key: "verified-profile",
            label: translateText("Verified profile"),
          },
        ]
      : []),
    ...greenFlags
      .map((flag: { text?: unknown }, index: number) => ({
        key: `green-flag-${index}`,
        label: String(flag?.text || "").trim(),
      }))
      .filter((highlight: ProfileHighlight) => Boolean(highlight.label)),
  ];
  // Platform Badge Engine is now the single source of truth (legacy fallback removed).
  const [platformBadges, setPlatformBadges] = useState<PublicUserBadge[]>([]);
  useEffect(() => {
    const uid = String((userData as any)?._id || "");
    if (!uid) return;
    let active = true;
    fetchUserBadges(uid).then((list) => {
      if (active) setPlatformBadges(list);
    });
    return () => {
      active = false;
    };
  }, [(userData as any)?._id]);

  const earnedBadges: ProfileBadgeItem[] = platformBadges.map((b) => ({ key: b.code, name: b.name, icon: b.icon }));
  const hasHighlights = profileHighlights.length > 0;
  const hasBadges = earnedBadges.length > 0;

  useEffect(() => {
    if (!isHighlightsPopoverOpen && !isBadgesPopoverOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        isHighlightsPopoverOpen &&
        highlightsCardRef.current &&
        !highlightsCardRef.current.contains(target)
      ) {
        onCloseHighlightsPopover();
      }

      if (
        isBadgesPopoverOpen &&
        badgesCardRef.current &&
        !badgesCardRef.current.contains(target)
      ) {
        onCloseBadgesPopover();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [
    isBadgesPopoverOpen,
    isHighlightsPopoverOpen,
    onCloseBadgesPopover,
    onCloseHighlightsPopover,
  ]);

  if (isLoading || !userData?.email) {
    return (
      <HeaderWrapper aria-busy="true">
        <HeaderColumn>
          <LeftHeaderColumn>
            <HeaderPrimaryCard>
              <HeaderCompactRow>
                <HeaderIdentitySurface className="header-identity-card">
                  <LeftHeaderPersonInfoWrapper>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        flexShrink: 0,
                      }}
                    >
                      <Placeholder
                        width="72px"
                        height="72px"
                        borderRadius="50%"
                        marginBottom="0"
                      />
                    </div>
                    <HeaderIdentityMeta
                      style={{ width: "100%", maxWidth: 240 }}
                    >
                      <Placeholder
                        width="68%"
                        height="24px"
                        borderRadius="10px"
                        marginBottom="0"
                      />
                      <Placeholder
                        width="42%"
                        height="18px"
                        borderRadius="8px"
                        marginBottom="0"
                      />
                    </HeaderIdentityMeta>
                  </LeftHeaderPersonInfoWrapper>
                </HeaderIdentitySurface>

                <HeaderSectionCard className="header-network-card">
                  <div className="followers-data">
                    {[0, 1].map((item) => (
                      <div className="followers-item" key={`network-${item}`}>
                        <Placeholder
                          width="46px"
                          height="22px"
                          borderRadius="8px"
                          marginBottom="0"
                        />
                        <Placeholder
                          width="72px"
                          height="14px"
                          borderRadius="8px"
                          marginBottom="0"
                        />
                      </div>
                    ))}
                  </div>
                </HeaderSectionCard>

                {!isMobile &&
                  ["socials", "actions"].map((item) => (
                    <HeaderSectionCard key={item}>
                      <Placeholder
                        width="100%"
                        height="54px"
                        borderRadius="10px"
                        marginBottom="0"
                      />
                    </HeaderSectionCard>
                  ))}
              </HeaderCompactRow>
            </HeaderPrimaryCard>
          </LeftHeaderColumn>
        </HeaderColumn>

        {isMobile && (
          <HeaderDetails aria-hidden="true">
            <HeaderSectionCard>
              <div className="mobile-actions-row">
                {[0, 1].map((item) => (
                  <Placeholder
                    key={`mobile-action-${item}`}
                    width="100%"
                    height="56px"
                    borderRadius="10px"
                    marginBottom="0"
                  />
                ))}
              </div>
            </HeaderSectionCard>
          </HeaderDetails>
        )}
      </HeaderWrapper>
    );
  }

  return (
    <HeaderWrapper>
      <HeaderColumn>
        <LeftHeaderColumn>
          <HeaderPrimaryCard>
            <HeaderCompactRow>
              <HeaderIdentitySurface className="header-identity-card">
                <HeaderIdentitySection>
                  <LeftHeaderPersonInfoWrapper>
                    <UserAvatarWrapper
                      size="project-page"
                      avatar={getAvatar(userData)}
                      name="name"
                      variant="success"
                      rating={userData?.rating || "0"}
                    />
                    <HeaderIdentityMeta>
                      <HeaderPersonNameWrapper>
                        <HeaderPersonTitle>
                          {userData?.twitterData?.name ||
                            userData?.telegramData?.name}
                        </HeaderPersonTitle>
                      </HeaderPersonNameWrapper>
                      <Typography className="green-color" variant="h3">
                        @{userData?.username || userData?.twitterData?.username}
                      </Typography>
                    </HeaderIdentityMeta>
                  </LeftHeaderPersonInfoWrapper>
                </HeaderIdentitySection>
              </HeaderIdentitySurface>

              <HeaderSectionCard className="header-network-card">
                <div className="followers-data">
                  <div className="followers-item">
                    <div className="followers-value">
                      {userData?.followers?.length || 0}
                    </div>
                    <div className="followers-key">
                      {translateText("followers")}
                    </div>
                  </div>
                  <div className="followers-item">
                    <div className="followers-value">
                      {userData?.following?.length || 0}
                    </div>
                    <div className="followers-key">
                      {translateText("following")}
                    </div>
                  </div>
                </div>
              </HeaderSectionCard>

              <HeaderSectionCard
                ref={highlightsCardRef}
                className="header-highlights-card"
              >
                <ActionsPopoverTrigger
                  aria-expanded={hasHighlights && isHighlightsPopoverOpen}
                  data-popover-trigger
                  disabled={!hasHighlights}
                  onClick={onToggleHighlightsPopover}
                  className={`header-dropdown-trigger header-dropdown-trigger-blue ${
                    isHighlightsPopoverOpen ? "is-open" : ""
                  }`}
                >
                  <div className="header-dropdown-head">
                    <HeaderSectionTitle className="header-section-title-blue">
                      <Sparkles aria-hidden="true" size={18} />
                      <span>{translateText("Highlights")}</span>
                    </HeaderSectionTitle>
                    {hasHighlights ? <ChevronDown size={18} /> : null}
                  </div>
                  <span className="header-dropdown-meta">
                    {hasHighlights
                      ? `${profileHighlights.length} ${translateText("highlights")}`
                      : translateText("No highlights yet")}
                  </span>
                </ActionsPopoverTrigger>
                {hasHighlights && isHighlightsPopoverOpen ? (
                  <div className="header-dropdown-panel" data-popover-trigger>
                    <div className="header-dropdown-list header-highlights-list">
                      {profileHighlights.map((highlight) => (
                        <div key={highlight.key}>
                          {highlight.isVerified ? (
                            <BadgeCheck aria-hidden="true" size={16} />
                          ) : (
                            <Sparkles aria-hidden="true" size={16} />
                          )}
                          <span>{highlight.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </HeaderSectionCard>

              <HeaderSectionCard
                ref={badgesCardRef}
                className="header-badges-card"
              >
                <ActionsPopoverTrigger
                  aria-expanded={hasBadges && isBadgesPopoverOpen}
                  data-popover-trigger
                  disabled={!hasBadges}
                  onClick={onToggleBadgesPopover}
                  className={`header-dropdown-trigger header-dropdown-trigger-blue ${
                    isBadgesPopoverOpen ? "is-open" : ""
                  }`}
                >
                  <div className="header-dropdown-head">
                    <HeaderSectionTitle className="header-section-title-blue">
                      <BadgeCheck aria-hidden="true" size={18} />
                      <span>{translateText("Badges")}</span>
                    </HeaderSectionTitle>
                    {hasBadges ? <ChevronDown size={18} /> : null}
                  </div>
                  <span className="header-dropdown-meta">
                    {hasBadges
                      ? `${earnedBadges.length} ${translateText("badges")}`
                      : translateText("No badges yet")}
                  </span>
                </ActionsPopoverTrigger>
                {hasBadges && isBadgesPopoverOpen ? (
                  <div
                    className="header-dropdown-panel header-badges-panel"
                    data-popover-trigger
                  >
                    <ProfileBadges badges={earnedBadges} />
                  </div>
                ) : null}
              </HeaderSectionCard>

              {!isMobile && (
                <ProfileHeaderActions
                  fomoId={userData?.fomoId}
                  isActionsPopoverOpen={isActionsPopoverOpen}
                  isMobile={isMobile}
                  isSocialsPopoverOpen={isSocialsPopoverOpen}
                  onCloseActionsPopover={onCloseActionsPopover}
                  onCloseSocialsPopover={onCloseSocialsPopover}
                  onCopyFomoId={onCopyFomoId}
                  onCopyReferralLink={onCopyReferralLink}
                  onOpenClink={onOpenClink}
                  onOpenSupport={onOpenSupport}
                  onToggleActionsPopover={onToggleActionsPopover}
                  onToggleSocialsPopover={onToggleSocialsPopover}
                  socialLinks={socialLinks}
                />
              )}
            </HeaderCompactRow>
          </HeaderPrimaryCard>
        </LeftHeaderColumn>
      </HeaderColumn>
      {isMobile && (
        <ProfileHeaderActions
          fomoId={userData?.fomoId}
          isActionsPopoverOpen={isActionsPopoverOpen}
          isMobile={isMobile}
          isSocialsPopoverOpen={isSocialsPopoverOpen}
          onCloseActionsPopover={onCloseActionsPopover}
          onCloseSocialsPopover={onCloseSocialsPopover}
          onCopyFomoId={onCopyFomoId}
          onCopyReferralLink={onCopyReferralLink}
          onOpenClink={onOpenClink}
          onOpenSupport={onOpenSupport}
          onToggleActionsPopover={onToggleActionsPopover}
          onToggleSocialsPopover={onToggleSocialsPopover}
          socialLinks={socialLinks}
        />
      )}
    </HeaderWrapper>
  );
};

export default ProfileHeader;
