import React, { FC, useCallback, useEffect, useState, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AuthContext, CartContext, LeftNavContext } from "../Layout";
import Button from "../common/Button";
import UserDropdown from "./userDropdown";
import LaunchPageIcon from "../Icons/LaunchPageIcon";
import CryptoPageIcon from "../Icons/CryptoPageIcon";
import PublicPageIcon from "../Icons/PublicPageIcon";
import SocialPageIcon from "../Icons/SocialPageIcon";
import AIPageIcon from "../Icons/AIPageIcon";
import FOMOMobileLogo from '../../../assets/icons/fomo-logo/fomo-mobile-logo.png'
import P2PExchangePageIcon from "../Icons/P2PExchangePageIcon";
import MarketPageIcon from "../Icons/MarketPageIcon";
import EarlyRoundsPageIcon from "../Icons/EarlyRoundsPageIcon";
import CartModal from "../modals/CartModal/index";
import {
  FundsPageIcon,
  PersonsPageIcon,
  ProjectPageIcon,
} from "../Icons";
import {
  ActionsButtonsWrapper,
  HeaderWrapper,
  LeftWrapper,
  MobileActions,
  MobileMenuWrapper,
  MobileNavigation,
  MobileUserDropdownWrapper,
  NavigationWrapper,
  RightWrapper,
  TopWrapper,
  Wrapper,
} from "./styles";
import BlogMessageIcon from "../Icons/BlogMessageIcon";
import CalendarIcon from "../Icons/CalendarMainIcon";
import { BurgerMenu } from "./BurgerMenu";
import { useCart } from "../../../contexts/CartContext";
import OtcIcon from "../Icons/otc";
import AllocMarketIcon from "../Icons/AllocMarket";
import EcosystemIcon from "../Icons/ecosystem";
import InfluenceIcon from "../Icons/influence";
import OnChainIcon from "../Icons/OnChain";
import NavDropdowns from "./NavDropdowns";
import GlobalAd from "../GlobalAd";
import WalletConnectModal from "../WalletConnectModal";
import Image from "next/image";
import Placeholder from "../common/Placeholder";
import FomoLogo from "../Icons/FomoLogo";
import { useTranslation } from "i18n";
import GlobalSearch from "./GlobalSearch";
import getAuthToken from "../../../http/getAuthToken";
import { setTokenCookie } from "../../../helpers/cookieToken";

export const getIcon = (name: string) => {
  switch (name) {
    case "projects":
      return <ProjectPageIcon />;
    case "funds":
      return <FundsPageIcon />;
    case "persons":
      return <PersonsPageIcon />;
    case "launch":
      return <LaunchPageIcon />;
    case "crypto":
      return <CryptoPageIcon />;
    case "onchain":
      return <CryptoPageIcon fill="#04A584" />;
    case "public":
      return <PublicPageIcon />;
    case "social":
      return <SocialPageIcon />;
    case "ai":
      return <AIPageIcon />;
    case "otc":
      return <OtcIcon />;
    case "alloc-market":
      return <AllocMarketIcon />;
    case "p2p-exchange":
      return <P2PExchangePageIcon />;
    case "ecosystem-graph":
      return <EcosystemIcon />;
    case "influence":
      return <InfluenceIcon />;
    case "on-chain":
      return <OnChainIcon />;
    case "market":
      return <MarketPageIcon />;
    case "earlyrounds":
      return <EarlyRoundsPageIcon />;
    case "blog":
      return <BlogMessageIcon />;
    case "calendar":
      return <CalendarIcon />;
    case "watchlist":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="13"
          viewBox="0 0 14 13"
          fill="none"
        >
          <path
            d="M6.69897 0.696193C6.82211 0.434602 7.17789 0.434602 7.30103 0.696193L8.89507 4.08252C8.94397 4.1864 9.03849 4.2584 9.14783 4.27506L12.7122 4.81808C12.9876 4.86003 13.0975 5.21479 12.8983 5.41841L10.319 8.0543C10.2399 8.13516 10.2038 8.25166 10.2225 8.36583L10.8314 12.0878C10.8784 12.3753 10.5906 12.5945 10.3443 12.4588L7.15621 10.7015C7.05842 10.6476 6.94158 10.6476 6.84379 10.7015L3.65571 12.4588C3.40943 12.5945 3.12159 12.3753 3.16863 12.0878L3.7775 8.36583C3.79618 8.25166 3.76007 8.13516 3.68095 8.0543L1.10174 5.41841C0.902502 5.21479 1.01245 4.86003 1.28779 4.81808L4.85217 4.27506C4.96151 4.2584 5.05603 4.1864 5.10493 4.08252L6.69897 0.696193Z"
            stroke="#738094"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "fomies":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="17"
          viewBox="0 0 16 17"
          fill="none"
        >
          <path
            d="M10.6832 14.2129L10.6834 12.0704C10.6835 10.8869 9.72417 9.9275 8.54071 9.9275H3.74255C2.55927 9.9275 1.59998 10.8867 1.59985 12.07L1.59961 14.2129M8.32881 4.92786C8.32881 6.11124 7.36949 7.07056 6.1861 7.07056C5.00272 7.07056 4.0434 6.11124 4.0434 4.92786C4.0434 3.74448 5.00272 2.78516 6.1861 2.78516C7.36949 2.78516 8.32881 3.74448 8.32881 4.92786Z"
            stroke="#738094"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.9998 3.16797L12.5664 4.38808L13.9019 4.54993L12.9166 5.46586L13.1753 6.786L11.9998 6.13197L10.8242 6.786L11.083 5.46586L10.0977 4.54993L11.4331 4.38808L11.9998 3.16797Z"
            stroke="#738094"
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return <ProjectPageIcon />;
  }
};

interface Props {
  pagesList: {
    title: string;
    link: string;
    tabs?: { title: string; link: string; desc?: string; icon: string }[];
  }[];
  project: string;
}

const Navigation: FC<Props> = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const cartData = useContext(CartContext);
  const cart = useCart();
  const [isAuthModal, setIsAuthModal] = useState(false);
  const [isTwitterAuth, setIsTwitterAuth] = useState(false);
  const [cartModal, setCartModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuth, userData, isLoading: isAuthLoading } = useContext(AuthContext);
  const { open: openLeftNav } = useContext(LeftNavContext);
  const isUtility = router.pathname.includes("utility");
  const isAuthorized = Boolean(isAuth && userData?.isActive);

  const renderAuthPlaceholder = (width = "160px") => (
    <Placeholder
      width={width}
      height="40px"
      borderRadius="10px"
      marginBottom="0"
    />
  );

  const renderUserActions = () => {
    if (isAuth) {
      return <UserDropdown isOpen={isOpen} setIsOpen={setIsOpen} />;
    }
    if (!isAuth) {
      return (
        <Button className="connect-wallet-button" variant="main" onClick={() => setIsAuthModal(true)}>
          {t("common.actions.connectWallet")}
        </Button>
      );
    }

    return null;
  };

  const getSafeReturnTo = useCallback(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const url = new URL(window.location.href);
    const returnTo = url.searchParams.get("returnTo") || "";

    if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
      return "";
    }

    return returnTo;
  }, []);

  const cleanAuthQuery = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const paramsToClear = ["auth-modal", "auth", "success", "returnTo"];
    let hasChanges = false;

    paramsToClear.forEach((param) => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      return;
    }

    const nextUrl = `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}${url.hash}`;
    router.replace(nextUrl, undefined, { shallow: true });
  }, [router]);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthModal(false);
    setIsTwitterAuth(false);

    const token = getAuthToken();

    if (token) {
      setTokenCookie(token);
    }

    const returnTo = getSafeReturnTo();

    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    cleanAuthQuery();
  }, [cleanAuthQuery, getSafeReturnTo, router]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const isAuthModalOpen = queryParams.get('auth-modal') === 'true';

    if (queryParams.get('success') === 'true' && queryParams.get('auth') === 'twitter') {
      setIsAuthModal(true)
      setIsTwitterAuth(true)
    }

    if (queryParams.get('auth') === 'true' || isAuthModalOpen) {
      setIsAuthModal(true)
    }
  }, [router.asPath])

  useEffect(() => {
    if (!isAuthModal || isAuthLoading || !isAuthorized) {
      return;
    }

    handleAuthSuccess();
  }, [handleAuthSuccess, isAuthLoading, isAuthModal, isAuthorized]);

  const handleAuthModalClose = () => {
    setIsAuthModal(false);
    setIsTwitterAuth(false);
    cleanAuthQuery();
  };

  const handleMobileMenuClick = () => {
    openLeftNav();
  };

  return (
    <>
      <HeaderWrapper>
        <Wrapper isAuthorized={isAuthorized}>
          <TopWrapper>
            <Link href="/">
              <FomoLogo />
            </Link>
            <GlobalSearch placeholder={t("common.placeholders.searchAcrossFomo")} />
            <ActionsButtonsWrapper>
              {isAuthLoading ? (
                renderAuthPlaceholder()
              ) : isAuthorized ? (
                <UserDropdown isOpen={isOpen} setIsOpen={setIsOpen} />
              ) : (
                <Button className="connect-wallet-button" variant="main" onClick={() => setIsAuthModal(true)}>
                  {t("common.actions.connectWallet")}
                </Button>
              )}
            </ActionsButtonsWrapper>
          </TopWrapper>
          <NavigationWrapper isAuthorized={isAuthorized}>
            <LeftWrapper>
              <NavDropdowns />
            </LeftWrapper>
            <RightWrapper>
              <GlobalAd />
            </RightWrapper>
            {cartModal && (
              <CartModal
                initialItems={isUtility ? cart.items : cartData.cart}
                onClose={() => {
                  setCartModal(false);
                }}
              />
            )}
            <BurgerMenu />
          </NavigationWrapper>
        </Wrapper>
      </HeaderWrapper>

      <MobileNavigation>
        <button
          data-left-nav-trigger="true"
          type="button"
          onClick={handleMobileMenuClick}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 13H1M11.5 7H1M17 1H1" stroke="#738094" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <a
          href="/"
        >
          <Image
            width={80}
            height={36}
            src={FOMOMobileLogo}
            alt="FOMO Logo"
          />
        </a>
        <MobileMenuWrapper>
          {isAuthLoading ? (
            <MobileActions>{renderAuthPlaceholder("120px")}</MobileActions>
          ) : !isAuth || !userData?.isActive ? (
            <MobileActions>{renderUserActions()}</MobileActions>
          ) : (
            null
          )}

          <MobileUserDropdownWrapper>
            {isAuth && userData?.isActive ? (
              <UserDropdown isOpen={isOpen} setIsOpen={setIsOpen} />
            ) : (
              null
            )}
          </MobileUserDropdownWrapper>
        </MobileMenuWrapper>
      </MobileNavigation>
      {isAuthModal ? (
        <WalletConnectModal
          isOpen={isAuthModal}
          onClose={handleAuthModalClose}
          onAuthenticated={handleAuthSuccess}
          inviteCodeFromUrl={undefined}
          isTwitterAuth={isTwitterAuth}
        />
      ) : (
        null
      )}
    </>
  );
};

export default Navigation;
