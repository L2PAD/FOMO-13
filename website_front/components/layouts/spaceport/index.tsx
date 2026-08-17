import { Info, ChevronDown, ChevronUp, Check } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import BreadCrumbs from "../../global/BreadCrumbs";
import { PageWrapper } from "../projects/Connection/styles";
import PromotedDeals from "../projects/OTC/PromotedDeals";
import {
  HeaderWrapper,
  SpaceportPageHeaderWrapper,
  TitleWrapper,
  TabsLeft,
  TabButton,
  PageContentWrapper,
  MobileDropdownWrapper,
  MobileDropdownTrigger,
  MobileDropdownMenu,
  MobileDropdownOption,
} from "./styles";
import SpaceportSearch from "./search";
import { BoxShop } from "./box-shop";
import { MyNFT } from "./my-nft";
import { NFTFusion } from "./nft-fusion";
import { Rewards } from "./rewards";
import { Progression } from "./progression";
import * as spaceportSmart from "../../../smart/contractSpaceport";
import { useTranslation } from "i18n";
import LocalAdBadge from "../../global/LocalAdBadge";

const crumbs = [
  { title: "Core", link: "/core" },
  { title: "Spaceport", link: "/core/spaceport" },
];

type TabsType = "box-shop" | "my-nft" | "nft-fusion" | "rewards" | "progression";

const TAB_LABEL_KEYS: Record<TabsType, string> = {
  "box-shop": "spaceport.tabs.boxShop",
  "my-nft": "spaceport.tabs.myNft",
  "nft-fusion": "spaceport.tabs.nftFusion",
  "rewards": "spaceport.tabs.rewards",
  "progression": "spaceport.tabs.progression",
};

const TAB_LIST: TabsType[] = ["box-shop", "my-nft", "nft-fusion", "rewards", "progression"];

export const SpaceportPage: React.FC = () => {
  const { t } = useTranslation();
  const smartDebugLoadedRef = useRef(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const [isSearch, setIsSearch] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [tab, setTab] = useState<TabsType>("box-shop");

  const handleTabChange = (newTab: TabsType) => {
    setTab(newTab);
    setDropdownOpen(false);
  };

  const getTabLabel = (currentTab: TabsType) => t(TAB_LABEL_KEYS[currentTab]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (smartDebugLoadedRef.current) return;
    smartDebugLoadedRef.current = true;

    const toPrintable = (value: any): any => {
      if (value === null || value === undefined) return value;

      if (Array.isArray(value)) {
        return value.map(toPrintable);
      }

      if (typeof value === "object") {
        if ((value as { _isBigNumber?: boolean })._isBigNumber && typeof (value as { toString?: () => string }).toString === "function") {
          return (value as { toString: () => string }).toString();
        }

        const normalized: Record<string, any> = {};
        Object.entries(value).forEach(([key, current]) => {
          normalized[key] = toPrintable(current);
        });
        return normalized;
      }

      return value;
    };

    const runSmartDebug = async () => {
      const errors: Record<string, string> = {};
      const call = async <T,>(key: string, cb: () => Promise<T>): Promise<T | null> => {
        try {
          return await cb();
        } catch (error: any) {
          errors[key] = String(error?.message || error);
          return null;
        }
      };

      const account = await spaceportSmart.getSpaceportWalletAddress(false);
      const hasAccount = !!account;

      const saleState = await call("sale.state", () => spaceportSmart.getSaleState());
      const saleOwner = await call("sale.owner", () => spaceportSmart.getSaleOwner());
      const salePricePreview = await Promise.all([
        call("sale.basePrice.1", () => spaceportSmart.getSaleBaseTotalPrice(1)),
        call("sale.basePrice.2", () => spaceportSmart.getSaleBaseTotalPrice(2)),
        call("sale.basePrice.3", () => spaceportSmart.getSaleBaseTotalPrice(3)),
        call("sale.basePrice.4", () => spaceportSmart.getSaleBaseTotalPrice(4)),
      ]);

      const nftTotalSupply = await call("nft.totalSupply", () => spaceportSmart.getNftTotalSupply());
      const nftNextTokenId = await call("nft.nextTokenId", () => spaceportSmart.getNftNextTokenId());
      const nftBaseURI = await call("nft.baseURI", () => spaceportSmart.getNftBaseURI());
      const nftActiveTokens = await call("nft.activeTokens", () => spaceportSmart.getNftActiveTokens());
      const nftMergeStartTime = await call("nft.mergeStartTime", () => spaceportSmart.getNftMergeStartTime());

      const firstTokens: any[] = [];
      const supplyNumRaw = nftTotalSupply ? Number(nftTotalSupply.toString()) : 0;
      const supplyNum = Number.isFinite(supplyNumRaw) ? supplyNumRaw : 0;
      const tokensToRead = Math.min(supplyNum, 5);

      if (tokensToRead > 0) {
        for (let i = 0; i < tokensToRead; i += 1) {
          const tokenId = await call(`nft.tokenByIndex.${i}`, () => spaceportSmart.getNftTokenByIndex(i));
          const tokenInfo = tokenId
            ? await call(`nft.tokenInfo.${i}`, () => spaceportSmart.getNftTokenInfo(tokenId))
            : null;
          if (tokenId || tokenInfo) {
            firstTokens.push({ index: i, tokenId, tokenInfo });
          }
        }
      }

      let walletSnapshot: Record<string, any> | null = null;
      if (hasAccount) {
        const balance = await call("wallet.erc20Balance", () => spaceportSmart.getErc20Balance(account));
        const allowance = await call("wallet.erc20Allowance", () => spaceportSmart.getErc20Allowance(account, spaceportSmart.marketAddress));
        const referrer = await call("wallet.referrer", () => spaceportSmart.getSaleReferrerOf(account));
        const purchased = await call("wallet.purchased", () => spaceportSmart.getSalePurchasedBy(account));
        const purchasedByRef = await call("wallet.purchasedByRef", () => spaceportSmart.getSalePurchasedByRef(account));
        const referralDiscount = await call("wallet.referralDiscount", () => spaceportSmart.getSaleReferralDiscount(account));
        const referralLevels = await call("wallet.referralLevels", () => spaceportSmart.getSaleReferralLevels(account));
        const finalPrice3 = await call("wallet.finalPrice.3", () => spaceportSmart.getSaleFinalPrice(account, 3));
        const finalPrice4 = await call("wallet.finalPrice.4", () => spaceportSmart.getSaleFinalPrice(account, 4));
        const referralRewards3 = await call("wallet.referralRewards.3", () => spaceportSmart.getSaleReferralRewards(account, 3));
        const referralRewards4 = await call("wallet.referralRewards.4", () => spaceportSmart.getSaleReferralRewards(account, 4));
        const isAllowedMinter = await call("wallet.allowedMinter", () => spaceportSmart.isNftAllowedMinter(account));
        const nftBalance = await call("wallet.nftBalance", () => spaceportSmart.getNftBalanceOf(account));
        const nftTokenIds = await call("wallet.nftTokenIds", () => spaceportSmart.getNftOwnerTokenIds(account));
        const walletTokenCount = nftTokenIds?.length || 0;
        const walletTokens =
          walletTokenCount > 0 && walletTokenCount <= 40
            ? await call("wallet.nftTokens", () => spaceportSmart.getNftOwnerTokens(account))
            : null;

        walletSnapshot = {
          account,
          erc20: {
            balance,
            allowanceToMarket: allowance,
          },
          sale: {
            referrer,
            purchased,
            purchasedByRef,
            referralDiscount,
            referralLevels,
            finalPrice3,
            finalPrice4,
            referralRewards3,
            referralRewards4,
          },
          nft: {
            isAllowedMinter,
            balance: nftBalance,
            tokenIds: nftTokenIds,
            tokens: walletTokens,
            tokensSkippedReason: walletTokenCount > 40 ? "Too many tokens, skipped full token details (>40)." : null,
          },
        };
      }

      const snapshot = {
        contracts: {
          tokenAddress: spaceportSmart.tokenAddress,
          nftAddress: spaceportSmart.nftAddress,
          marketAddress: spaceportSmart.marketAddress,
        },
        sale: {
          owner: saleOwner,
          state: saleState,
          basePricePreview: {
            amount1: salePricePreview[0],
            amount2: salePricePreview[1],
            amount3: salePricePreview[2],
            amount4: salePricePreview[3],
          },
        },
        nft: {
          totalSupply: nftTotalSupply,
          nextTokenId: nftNextTokenId,
          baseURI: nftBaseURI,
          activeTokens: nftActiveTokens,
          mergeStartTime: nftMergeStartTime,
          firstTokens,
        },
        wallet: walletSnapshot,
        errors,
      };

      console.groupCollapsed("[Spaceport][Smart Debug] Snapshot");
      console.log(toPrintable(snapshot));
      console.groupEnd();
    };

    runSmartDebug();
  }, []);

  return (
    <PageWrapper>
      <SpaceportPageHeaderWrapper>
        <HeaderWrapper>
          <TitleWrapper>
            <button className="tooltip-button">
              <Info size={16} color="#738094" />
              <span
                className="tooltip-text right"
                style={{
                  width: 300,
                  whiteSpace: "wrap",
                }}
              >
                {t("spaceport.tooltip")}
              </span>
            </button>
            <h1>{t("spaceport.title")}</h1>
            <LocalAdBadge placement="SPACEPORT_FEED" placementLabel="Spaceport" />
          </TitleWrapper>
        </HeaderWrapper>

        {isMobile ? (
          <MobileDropdownWrapper>
            <MobileDropdownTrigger onClick={() => setDropdownOpen((o) => !o)}>
              <span>{getTabLabel(tab)}</span>
              {dropdownOpen ? <ChevronUp size={16} color="#070b35" /> : <ChevronDown size={16} color="#070b35" />}
            </MobileDropdownTrigger>
            {dropdownOpen && (
              <MobileDropdownMenu>
                {TAB_LIST.map((t) => (
                  <MobileDropdownOption key={t} active={tab === t} onClick={() => handleTabChange(t)}>
                    <span>{getTabLabel(t)}</span>
                    {tab === t && <Check size={16} />}
                  </MobileDropdownOption>
                ))}
              </MobileDropdownMenu>
            )}
          </MobileDropdownWrapper>
        ) : (
          <TabsLeft>
            {TAB_LIST.map((currentTab, index) => (
              <TabButton
                key={currentTab}
                active={tab === currentTab}
                onClick={() => handleTabChange(currentTab)}
                className={index === 0 ? "tab-fill" : index === 1 ? "tab-stroke" : undefined}
              >
                {getTabLabel(currentTab)}
              </TabButton>
            ))}
          </TabsLeft>
        )}
      </SpaceportPageHeaderWrapper>
      <PageContentWrapper>
        {tab === "box-shop" && <BoxShop />}
        {tab === "my-nft" && <MyNFT />}
        {tab === "nft-fusion" && <NFTFusion />}
        {tab === "rewards" && <Rewards />}
        {tab === "progression" && <Progression />}
      </PageContentWrapper>

    </PageWrapper>
  );
};
