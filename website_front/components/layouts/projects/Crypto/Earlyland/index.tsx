import React, { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../../../../global/Layout";
import { PageWrapper } from "../../Connection/styles";
import LocalAdBadge from "../../../../global/LocalAdBadge";
import { PageHeaderWrapper } from "../../OTC/styles";
import SpaceportSearch from "../../../spaceport/search";
import NftBadgeIcon from "../../../../global/Icons/NftBadgeIcon";
import { SearchIcon } from "../../../../global/Icons";
import PremiumAccessGate from "../../../../global/common/PremiumAccessGate";
import fetchMyPrimeAccess, { PrimeAccess } from "../../../../../http/tasks/fetchMyPrimeAccess";
import {
  TabsLeft,
  TabButton,
  PageContentWrapper,
  LeftSection,
  RightSection,
  NftAccessWrapper,
  NftAccessText,
  NftTooltipBox,
  TabTooltipWrapper,
  TabTooltipBox,
  DesktopOnlyHeader,
  MobileEarlylandHeader,
  MobileTopRow,
  MobileSearchArea,
  MobileAdBtn,
  MobileCrownBtn,
  MobileSegmentedControl,
  MobileSegmentedTab,
} from "./styles";
import { Feed } from "./Feed";
import { Board } from "./Board";
import { Prime } from "./Prime";
import MyTasks from "../../../earlyland/MyTasks";
import { useTranslation } from "i18n";
import { openAuthModal } from "../../../../../helpers/openAuthModal";

type PageTabType = "earlyland" | "prime";
// Right-side views live their own life, independent of the Feed/Prime feed.
type RightTabType = "none" | "board" | "tasks";

const NftAccessButton: React.FC<{ hasNft: boolean; onClick?: () => void }> = ({
  hasNft,
  onClick,
}) => {
  const { translateText } = useTranslation();

  return (
    <NftAccessWrapper onClick={onClick}>
      <NftBadgeIcon isActive={hasNft} />
      <NftAccessText>
        <span className="nft-title">
          {hasNft
            ? translateText("Prime unlocked")
            : translateText("Prime locked")}
        </span>
        <span className="nft-subtitle">
          {hasNft
            ? translateText("Full Prime access")
            : translateText("Membership required")}
        </span>
      </NftAccessText>
      <NftTooltipBox className="nft-tooltip">
        {hasNft
          ? translateText("EarlyLand Prime access is enabled")
          : translateText("Unlock Prime with a FOMO AI membership")}
      </NftTooltipBox>
    </NftAccessWrapper>
  );
};

export const EarlylandPage: React.FC = () => {
  const { t, translateText } = useTranslation();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSearch, setIsSearch] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [pageTab, setPageTab] = useState<PageTabType>("earlyland");
  const [rightTab, setRightTab] = useState<RightTabType>("none");
  const [isNftModalOpen, setIsNftModalOpen] = useState<boolean>(false);
  const isNftLoading = Boolean(
    authContext?.isLoading || authContext?.spaceportAccess?.isLoading
  );
  const userWallet = String(authContext?.userData?.wallet || "")
    .trim()
    .toLowerCase();
  const connectedWallet = String(authContext?.spaceportAccess?.wallet || "")
    .trim()
    .toLowerCase();
  const connectedWalletMatchesUser = Boolean(
    userWallet && connectedWallet && userWallet === connectedWallet
  );
  const persistedNftCount = Number(
    authContext?.userData?.spaceportNftCount || 0
  );
  const clientHasNft = Boolean(
    authContext?.isAuth &&
      (persistedNftCount > 0 ||
        (connectedWalletMatchesUser &&
          (authContext?.hasBoughtSpaceportNft ||
            authContext?.hasSpaceportNft ||
            Number(authContext?.spaceportAccess?.nftBalance || 0) > 0)))
  );

  // Backend-resolved EarlyLand Prime access: honours the CRM-configured mode
  // (PUBLIC / NFT / BACKEND_GRANT / OR / AND) + manual grants. If the backend
  // decision is available we trust it (it also covers server-side NFT checks);
  // otherwise we fall back to the client-side NFT signal.
  const [primeAccess, setPrimeAccess] = useState<PrimeAccess | null>(null);
  useEffect(() => {
    let alive = true;
    if (!authContext?.isAuth) {
      setPrimeAccess(null);
      return;
    }
    fetchMyPrimeAccess().then((res) => {
      if (alive) setPrimeAccess(res);
    });
    return () => {
      alive = false;
    };
  }, [authContext?.isAuth, authContext?.userData?.wallet]);

  const hasNft = !!primeAccess?.hasAccess;

  const openNftModal = useCallback(() => {
    setIsNftModalOpen(true);
  }, []);

  const openFeed = useCallback(() => {
    setPageTab("earlyland");
    setRightTab("none");
  }, []);

  const openBoard = useCallback(() => {
    if (authContext?.isLoading) return;
    if (!authContext?.isAuth) {
      openAuthModal(router);
      return;
    }
    setPageTab("earlyland");
    setRightTab("board");
  }, [authContext?.isAuth, authContext?.isLoading, router]);

  const openTasks = useCallback(() => {
    if (authContext?.isLoading) return;
    if (!authContext?.isAuth) {
      openAuthModal(router);
      return;
    }
    setPageTab("earlyland");
    setRightTab("tasks");
  }, [authContext?.isAuth, authContext?.isLoading, router]);

  const handleNftAction = useCallback(() => {
    setIsNftModalOpen(false);
    router.push("/utility/memberships");
  }, [router]);

  const guardNftAccess = useCallback(
    (onSuccess: () => void) => {
      if (isNftLoading) return;

      if (!hasNft) {
        openNftModal();
        return;
      }

      onSuccess();
    },
    [hasNft, isNftLoading, openNftModal]
  );

  const openPrime = useCallback(() => {
    guardNftAccess(() => {
      setPageTab("prime");
      setRightTab("none");
    });
  }, [guardNftAccess]);

  useEffect(() => {
    if (!router.isReady || authContext?.isLoading) return;

    if (router.query.tab === "board") {
      openBoard();
    } else if (router.query.tab === "tasks") {
      openTasks();
    } else if (router.query.tab === "prime") {
      openPrime();
    }
  }, [authContext?.isLoading, openBoard, openTasks, openPrime, router.isReady, router.query.tab]);

  useEffect(() => {
    if (isNftLoading || hasNft) return;

    if (pageTab === "prime") {
      setPageTab("earlyland");
      openNftModal();
    }
  }, [hasNft, isNftLoading, openNftModal, pageTab]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Feed/Prime highlight lives independently of the Board/Tasks selector —
  // the Feed plaque stays lit even when Board or Tasks is open.
  const feedTabActive = pageTab === "earlyland";

  return (
    <PageWrapper>
      <MobileEarlylandHeader>
        <MobileTopRow>
          <MobileSearchArea onClick={() => setIsSearch((prev) => !prev)}>
            <SearchIcon fill="#b5bcc7" />
            <span>{translateText("Search")}</span>
          </MobileSearchArea>
          <MobileAdBtn>
            <span className="ad-badge">Ad</span>
          </MobileAdBtn>
          <MobileCrownBtn onClick={() => (!hasNft ? openNftModal() : handleNftAction())}>
            <NftBadgeIcon isActive={hasNft} />
          </MobileCrownBtn>
        </MobileTopRow>

        <MobileSegmentedControl>
          <MobileSegmentedTab active={feedTabActive} onClick={openFeed}>
            {t("earlyLand.tabs.feed")}
          </MobileSegmentedTab>
          <MobileSegmentedTab
            active={pageTab === "prime"}
            onClick={openPrime}
          >
            {t("earlyLand.tabs.prime")}
          </MobileSegmentedTab>
        </MobileSegmentedControl>

        <MobileSegmentedControl>
          <MobileSegmentedTab active={rightTab === "tasks"} onClick={openTasks}>
            {t("earlyLand.tabs.tasks")}
          </MobileSegmentedTab>
          <MobileSegmentedTab active={rightTab === "board"} onClick={openBoard}>
            {t("earlyLand.tabs.board")}
          </MobileSegmentedTab>
        </MobileSegmentedControl>
      </MobileEarlylandHeader>

      {/* Desktop header */}
      <DesktopOnlyHeader>
        <PageHeaderWrapper
          style={{
            width: "100%",
            flexWrap: isMobile ? "wrap" : "nowrap",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: isMobile ? "flex-start" : "space-between",
          }}
        >
          <LeftSection>
            <TabsLeft className="earlyland">
              <TabTooltipWrapper>
                <TabButton active={feedTabActive} onClick={openFeed}>
                  {t("earlyLand.tabs.feed")}
                </TabButton>
                <TabTooltipBox>
                  <p>{t("earlyLand.tooltip.feedIntro")}</p>
                  <p>{t("earlyLand.tooltip.feedDetails")}</p>
                  <p>{t("earlyLand.tooltip.feedFlow")}</p>
                </TabTooltipBox>
              </TabTooltipWrapper>
              <TabTooltipWrapper>
                <TabButton active={pageTab === "prime"} onClick={openPrime}>
                  {t("earlyLand.tabs.prime")}
                </TabButton>
                <TabTooltipBox>
                  <p>{t("earlyLand.tooltip.primeIntro")}</p>
                  <p>
                    {t("earlyLand.tooltip.primeAccess")}{" "}
                    <strong>FOMO AI members</strong>.
                  </p>
                </TabTooltipBox>
              </TabTooltipWrapper>
            </TabsLeft>

            <div className="ad">
              <LocalAdBadge placement="EARLYLAND_FEED" placementLabel="EarlyLand" />
            </div>
          </LeftSection>

          <RightSection>
            <SpaceportSearch
              isSearch={isSearch}
              setIsSearch={setIsSearch}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
            />

            <TabsLeft className="earlyland right">
              <TabButton active={rightTab === "tasks"} onClick={openTasks}>
                {t("earlyLand.tabs.tasks")}
              </TabButton>
              <TabButton active={rightTab === "board"} onClick={openBoard}>
                {t("earlyLand.tabs.board")}
              </TabButton>
            </TabsLeft>

            <NftAccessButton
              hasNft={hasNft}
              onClick={() => (!hasNft ? openNftModal() : handleNftAction())}
            />
          </RightSection>
        </PageHeaderWrapper>
      </DesktopOnlyHeader>

      <PageContentWrapper>
        {pageTab === "prime" ? (
          <Prime hasNft={hasNft} searchValue={searchValue} />
        ) : rightTab === "board" ? (
          <Board hasNft={hasNft} />
        ) : rightTab === "tasks" ? (
          <MyTasks embedded />
        ) : (
          <Feed searchValue={searchValue} />
        )}
      </PageContentWrapper>

      <PremiumAccessGate
        isOpen={isNftModalOpen}
        onClose={() => setIsNftModalOpen(false)}
        title="FOMO AI Membership required"
        description="EarlyLand Prime is part of the FOMO AI membership. Unlock Prime activities, the FOMO AI assistant and advanced tools."
      />
    </PageWrapper>
  );
}
