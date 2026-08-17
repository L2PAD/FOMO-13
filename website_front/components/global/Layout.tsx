import React, {
  FC,
  ReactNode,
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import Head from "next/head";
import { useGlobalState } from "../../hooks/useGlobalState";
import getUserWatchlist from "../../http/watchlist/getUserWatchlist";
import fetchLayoutData from "../../http/layout/fetchLayoutData";
import Loader from "./loader";
import logOut from "../../http/auth/logOut";
import getUserByToken from "../../http/user/getUserByToken";
import NavBar from "./NavBar";
import Footer from "./Footer";
import FloatingAd from "./FloatingAd";
import FomoAiWidget from "./FomoAiWidget";
import JoinWrapper from "./JoinWrapper";
import Banner from "./Banner";
import styled from "styled-components";
import fetchCart from "../../http/cart/fetchCart";
import { IMessage } from "../../types/global_types";
import getMessages from "../../http/messages/getMessages";
import LeftNav from "./LeftNav";
import { MINUTE, SECOND } from "../../staticContent/global";
import { getUserTotalBalance } from "../../smart/smartOTCP2P";
import {
  getNftBalanceOf,
  getSalePurchasedBy,
} from "../../smart/contractSpaceport";
import { UserDealsBalance } from "./DealsBalanceComponent";
import { FomoMoneyProvider } from "./money";
import {
  JsonLd,
  resolveSeoImageUrl,
  serializeJsonLd,
  SITE_NAME,
  toAbsoluteUrl,
} from "../../helpers/seo";
import { resolvePageTitle } from "../../helpers/pageTitles";
import { initAnalytics, trackPageView, identifyUser } from "../../helpers/analytics";

interface Props {
  children?: ReactNode;
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: string;
  noIndex?: boolean;
  structuredData?: JsonLd;
}

const DETAIL_PAGE_TOP_SCROLL_ROUTES = new Set([
  "/legal",
  "/market/[coingeckoId]",
  "/crypto/funds/[id]",
  "/crypto/persons/[id]",
  "/crypto/fomies/[id]",
  "/crypto/project/[id]",
  "/crypto/projects/[id]",
  "/echo/[slug]",
]);

interface SpaceportAccessState {
  wallet: string;
  hasBoughtNft: boolean;
  purchasedCount: number;
  hasNft: boolean;
  nftBalance: number;
  isLoading: boolean;
}

const Wrapper = styled.div<{ isMenu: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 64px;
  height: 100%;
  margin-left: ${({ isMenu }) => (isMenu ? "64px" : "0px")};

  .fomoland-container {
    padding-bottom: 72px;
  }
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

export const BalanceContext = createContext<UserDealsBalance>({ eth: 0, usdc: 0, isLoading: true, refetchBalance: async () => { } });
export const AuthContext = createContext<any>(null);
export const LoadingContext = createContext<any>({
  loadingState: false,
  loadingStateHandler: () => { },
});
export const LocationContext = createContext<{ path: string }>({ path: "" });
export const WatchlistContext = createContext<any>({
  watchlist: [],
  refetch: () => { },
});
export const LayoutContext = createContext<any>({ layout: {}, isLoading: false });
export const CartContext = createContext<any>(null);
export const MessagesContext = createContext<{ messages: Array<IMessage> }>(
  {
    messages: [],
  }
);

interface LeftNavContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const LeftNavContext = createContext<LeftNavContextValue>({
  isOpen: false,
  open: () => { },
  close: () => { },
  toggle: () => { },
});

const DEFAULT_AUTH_USER = {
  _id: "",
  email: "",
  wallet: "",
  photo: "",
  fomoId: "",
  name: "",
  username: "",
  bio: "",
  isAuth: false,
  isActive: false,
  isFullAuth: false,
  isMenuDisplay: false,
  userMenu: [],
  claimedProjects: [],
  claimedTasks: [],
  invites: [],
  socialNetworks: {},
  spaceportProgression: {
    stakingRewards: 0,
  },
};

const DEFAULT_SPACEPORT_ACCESS: SpaceportAccessState = {
  wallet: "",
  hasBoughtNft: false,
  purchasedCount: 0,
  hasNft: false,
  nftBalance: 0,
  isLoading: true,
};

const Layout: FC<Props> = ({
  children,
  title,
  description,
  canonical,
  image,
  type,
  noIndex,
  structuredData,
}) => {
  const router = useRouter();
  const messagesData = useQuery("messages", () => getMessages("new"), { refetchOnWindowFocus: false, refetchInterval: MINUTE * 2 });
  const cartData = useQuery("cart", () => fetchCart(), { refetchOnWindowFocus: false });
  const watchlist = useQuery("watchlist", () =>
    getUserWatchlist(router.pathname?.split("/")[1])
    , { refetchOnWindowFocus: false });
  const layoutData = useQuery("layout", fetchLayoutData, { refetchOnWindowFocus: false, refetchInterval: MINUTE });
  const { data, refetch, isLoading: isAuthLoading } = useQuery("auth", getUserByToken, { refetchOnWindowFocus: false, refetchInterval: 30 * SECOND });
  const [isBanner, setIsBanner] = useGlobalState("banner");
  const [loading, setLoading] = useState<boolean>(false);
  const path = router.pathname?.split("/")[1];
  const [isOpenLeftNav, setIsOpenLeftNav] = useState<boolean>(false);
  const [balance, setBalance] = useState<{ eth: number; usdc: number, isLoading: boolean }>({ eth: 0, usdc: 0, isLoading: true });
  const [spaceportAccess, setSpaceportAccess] = useState<SpaceportAccessState>(DEFAULT_SPACEPORT_ACCESS);
  const isAbout = router.asPath.includes("about");

  const refetchBalance = async () => {
    if (!data?.wallet) return;
    const balance = await getUserTotalBalance(data.wallet);
    setBalance({ eth: balance.eth, usdc: balance.usdc, isLoading: false });
  }

  const closeBanner = (): void => {
    setIsBanner(false);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("banner", "false");
    }
  };

  const changeAuthState = (value: boolean): void => {
    logOut();
    router.push("/");
  };

  const authUserData = useMemo(() => {
    if (data && typeof data === "object") {
      return { ...DEFAULT_AUTH_USER, ...data };
    }

    return DEFAULT_AUTH_USER;
  }, [data]);

  const { isAuth, isLeftMenu } = useMemo((): { isAuth: boolean, isLeftMenu: boolean } => {
    return { isAuth: !!data?.email, isLeftMenu: !!data?.email ? !!data?.isMenuDisplay : false };
  }, [data]);

  const refetchSpaceportAccess = async (): Promise<void> => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.ethereum?.request) {
      setSpaceportAccess({
        ...DEFAULT_SPACEPORT_ACCESS,
        isLoading: false,
      });
      return;
    }

    setSpaceportAccess((prev) => ({
      ...prev,
      wallet: prev.wallet,
      isLoading: true,
    }));

    try {
      const connectedAccounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      const connectedWallet =
        Array.isArray(connectedAccounts) && connectedAccounts[0]
          ? String(connectedAccounts[0]).trim()
          : "";
      const walletAddress = connectedWallet;

      if (!walletAddress) {
        setSpaceportAccess({
          ...DEFAULT_SPACEPORT_ACCESS,
          isLoading: false,
        });
        return;
      }

      const [purchasedResult, nftBalanceResult] = await Promise.allSettled([
        getSalePurchasedBy(walletAddress),
        getNftBalanceOf(walletAddress),
      ]);
      const purchasedCount =
        purchasedResult.status === "fulfilled"
          ? Number(purchasedResult.value?.toString?.() || 0)
          : 0;
      const nftBalance =
        nftBalanceResult.status === "fulfilled"
          ? Number(nftBalanceResult.value?.toString?.() || 0)
          : 0;

      setSpaceportAccess({
        wallet: walletAddress,
        hasBoughtNft: nftBalance > 0,
        purchasedCount,
        hasNft: nftBalance > 0,
        nftBalance,
        isLoading: false,
      });
    } catch (error) {
      console.log(error);
      setSpaceportAccess({
        ...DEFAULT_SPACEPORT_ACCESS,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    if (typeof data === "undefined") return;
    const getUserAddress = async () => {
      try {
        if (typeof window === "undefined" || !window.ethereum?.request) {
          if (data?.banned) {
            router.push("/ban");
          }
          return;
        }

        const connectedAccounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        const address = connectedAccounts[0];

        if (address) {
          getUserTotalBalance(address).then((balance) => {
            setBalance({ eth: balance.eth, usdc: balance.usdc, isLoading: false })
          })
        } else if (data?.wallet) {
          getUserTotalBalance(data.wallet).then((balance) => {
            setBalance({ eth: balance.eth, usdc: balance.usdc, isLoading: false })
          })
        }

        if (data?.banned) {
          router.push("/ban");
        }
      } catch (error) {
        console.log(error);
      }
    };

    getUserAddress();
    refetchSpaceportAccess();
  }, [data]);

  useEffect(() => {
    setIsOpenLeftNav(false);
  }, [router.asPath]);

  // Platform analytics: init tracker once, track page views on route change,
  // and link the anonymous session to the user once authenticated.
  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(router.asPath);
  }, [router.asPath]);

  useEffect(() => {
    if (data?._id) identifyUser(String(data._id));
  }, [data?._id]);

  useEffect(() => {
    if (!DETAIL_PAGE_TOP_SCROLL_ROUTES.has(router.pathname)) return undefined;

    const scrollToPageTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    };

    scrollToPageTop();

    const animationFrame = window.requestAnimationFrame(scrollToPageTop);
    const timeoutIds = [0, 120, 360].map((delay) =>
      window.setTimeout(scrollToPageTop, delay)
    );

    return () => {
      window.cancelAnimationFrame(animationFrame);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [router.pathname, router.asPath]);

  useEffect(() => {
    const ethereum = (window as any)?.ethereum;
    if (!ethereum || typeof ethereum.on !== "function") {
      return;
    }

    const handleWalletStateChange = () => {
      refetchSpaceportAccess();
    };

    ethereum.on("accountsChanged", handleWalletStateChange);
    ethereum.on("chainChanged", handleWalletStateChange);

    return () => {
      if (typeof ethereum.removeListener === "function") {
        ethereum.removeListener("accountsChanged", handleWalletStateChange);
        ethereum.removeListener("chainChanged", handleWalletStateChange);
      }
    };
  }, [data?.wallet]);

  const leftNavControls = useMemo(() => ({
    isOpen: isOpenLeftNav,
    open: () => setIsOpenLeftNav(true),
    close: () => setIsOpenLeftNav(false),
    toggle: () => setIsOpenLeftNav((prev) => !prev),
  }), [isOpenLeftNav]);
  const normalizedTitle = resolvePageTitle(router.pathname, title);
  const normalizedDescription = description?.trim();
  const canonicalUrl = canonical ? toAbsoluteUrl(canonical) : "";
  const ogImage = image ? resolveSeoImageUrl(image) : "";
  const jsonLd = structuredData ? serializeJsonLd(structuredData) : "";

  // if (isLoading)
  //   return (
  //     <LoadingWrapper>
  //       <Loader isVisible />
  //     </LoadingWrapper>
  //   );

  return (
    <MessagesContext.Provider
      value={{ messages: messagesData.data?.messages || [] }}
    >
      <CartContext.Provider
        value={{ cart: cartData?.data?.cart || [], refetch: cartData.refetch }}
      >
        <LayoutContext.Provider value={{ ...(layoutData.data || { layout: {} }), isLoading: layoutData.isLoading }}>
          <WatchlistContext.Provider
            value={{
              watchlist: watchlist?.data?.watchlist || [],
              refetch: watchlist.refetch,
            }}
          >
            <LocationContext.Provider value={{ path }}>
              <LoadingContext.Provider
                value={{
                  loadingState: loading,
                  loadingStateHandler: setLoading,
                }}
              >
                <AuthContext.Provider
                  value={{
                    isAuth,
                    userData: authUserData,
                    isLoading: isAuthLoading,
                    hasBoughtSpaceportNft: spaceportAccess.hasBoughtNft,
                    hasSpaceportNft: spaceportAccess.hasNft,
                    spaceportAccess,
                    changeAuthState,
                    refetchAuthData: refetch,
                    refetchSpaceportAccess,
                  }}
                >
                  <BalanceContext.Provider value={{ ...balance, refetchBalance }}>
                    {loading ? <Loader isVisible={loading} /> : <></>}
                    <FomoMoneyProvider>
                    <LeftNavContext.Provider value={leftNavControls}>
                      <LeftNav
                        isOpenMenu={isOpenLeftNav}
                        setIsOpenMenu={setIsOpenLeftNav}
                        showOnDesktop={isLeftMenu}
                      />
                      <Wrapper isMenu={isLeftMenu}>
                        <Head>
                          <title>{normalizedTitle}</title>
                          <meta charSet="utf-8" />
                          <meta
                            name="viewport"
                            content="initial-scale=1.0, width=device-width"
                          />
                          {normalizedDescription ? (
                            <meta
                              name="description"
                              content={normalizedDescription}
                            />
                          ) : null}
                          {noIndex ? (
                            <meta name="robots" content="noindex,nofollow" />
                          ) : null}
                          {canonicalUrl ? (
                            <link rel="canonical" href={canonicalUrl} />
                          ) : null}
                          <meta property="og:site_name" content={SITE_NAME} />
                          <meta
                            property="og:title"
                            content={normalizedTitle}
                          />
                          {normalizedDescription ? (
                            <meta
                              property="og:description"
                              content={normalizedDescription}
                            />
                          ) : null}
                          <meta property="og:type" content={type || "website"} />
                          {canonicalUrl ? (
                            <meta property="og:url" content={canonicalUrl} />
                          ) : null}
                          {ogImage ? (
                            <meta property="og:image" content={ogImage} />
                          ) : null}
                          <meta
                            name="twitter:card"
                            content={ogImage ? "summary_large_image" : "summary"}
                          />
                          <meta
                            name="twitter:title"
                            content={normalizedTitle}
                          />
                          {normalizedDescription ? (
                            <meta
                              name="twitter:description"
                              content={normalizedDescription}
                            />
                          ) : null}
                          {ogImage ? (
                            <meta name="twitter:image" content={ogImage} />
                          ) : null}
                          {jsonLd ? (
                            // eslint-disable-next-line react/no-danger
                            <script
                              type="application/ld+json"
                              dangerouslySetInnerHTML={{ __html: jsonLd }}
                            />
                          ) : null}
                          <link
                            href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
                            rel="stylesheet"
                          />
                        </Head>
                        <div>
                          <NavBar
                            statistics={layoutData?.data?.layout?.header?.data}
                            isLoading={layoutData.isLoading}
                          />
                          <div className="fomoland-container">{children}</div>
                        </div>
                        <div>
                          <Footer />
                        </div>
                        <FloatingAd placement="HOME_HERO" position="bottom-right" />
                        <FomoAiWidget />
                      </Wrapper>
                    </LeftNavContext.Provider>
                    </FomoMoneyProvider>
                  </BalanceContext.Provider>
                </AuthContext.Provider>
              </LoadingContext.Provider>
            </LocationContext.Provider>
          </WatchlistContext.Provider>
        </LayoutContext.Provider>
      </CartContext.Provider>
    </MessagesContext.Provider>
  );
};

export default Layout;
