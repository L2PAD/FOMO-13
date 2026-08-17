import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { PROFILE_TABS } from "../constants";
import {
  DEFAULT_DESCRIPTION_MODALS,
  DescriptionModalKey,
  IDescriptionModals,
} from "../types";

export const useProfileViewState = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(PROFILE_TABS[0]);
  const [isMobile, setIsMobile] = useState(false);
  const [isActionsPopoverOpen, setIsActionsPopoverOpen] = useState(false);
  const [isBadgesPopoverOpen, setIsBadgesPopoverOpen] = useState(false);
  const [isHighlightsPopoverOpen, setIsHighlightsPopoverOpen] = useState(false);
  const [isSocialsPopoverOpen, setIsSocialsPopoverOpen] = useState(false);
  const [descriptionModals, setDescriptionModals] =
    useState<IDescriptionModals>(DEFAULT_DESCRIPTION_MODALS);

  const updateActiveTab = (value: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: value.toLowerCase() },
      },
      undefined,
      { shallow: true }
    );
    setActiveTab(value);
  };

  useEffect(() => {
    if (!router.isReady) return;

    const requestedTab = Array.isArray(router.query.tab)
      ? router.query.tab[0]
      : router.query.tab;
    const normalizedRequestedTab = String(requestedTab || "").toLowerCase();
    const matchingTab = PROFILE_TABS.find(
      (tab) => tab.toLowerCase() === normalizedRequestedTab
    );

    if (matchingTab) setActiveTab(matchingTab);
  }, [router.isReady, router.query.tab]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setDescriptionModalVisibility = (
    key: DescriptionModalKey,
    isVisible: boolean
  ) => {
    setDescriptionModals((prev) => ({
      ...prev,
      [key]: isVisible,
    }));
  };

  const closeHeaderDropdowns = () => {
    setIsActionsPopoverOpen(false);
    setIsBadgesPopoverOpen(false);
    setIsHighlightsPopoverOpen(false);
    setIsSocialsPopoverOpen(false);
  };

  return {
    activeTab,
    closeActionsPopover: () => setIsActionsPopoverOpen(false),
    closeBadgesPopover: () => setIsBadgesPopoverOpen(false),
    closeHighlightsPopover: () => setIsHighlightsPopoverOpen(false),
    closeSocialsPopover: () => setIsSocialsPopoverOpen(false),
    descriptionModals,
    isActionsPopoverOpen,
    isBadgesPopoverOpen,
    isHighlightsPopoverOpen,
    isMobile,
    isSocialsPopoverOpen,
    updateActiveTab,
    setDescriptionModalVisibility,
    toggleActionsPopover: () => {
      const nextState = !isActionsPopoverOpen;
      closeHeaderDropdowns();
      setIsActionsPopoverOpen(nextState);
    },
    toggleBadgesPopover: () => {
      const nextState = !isBadgesPopoverOpen;
      closeHeaderDropdowns();
      setIsBadgesPopoverOpen(nextState);
    },
    toggleHighlightsPopover: () => {
      const nextState = !isHighlightsPopoverOpen;
      closeHeaderDropdowns();
      setIsHighlightsPopoverOpen(nextState);
    },
    toggleSocialsPopover: () => {
      const nextState = !isSocialsPopoverOpen;
      closeHeaderDropdowns();
      setIsSocialsPopoverOpen(nextState);
    },
  };
};
