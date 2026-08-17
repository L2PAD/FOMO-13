import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { PageWrapper } from "../projects/Connection/styles";
import LaunchpadProjects from "./LaunchpadProjects";
import InfoIcon from "../../global/Icons/InfoIcon";
import NftBadgeIcon from "../../global/Icons/NftBadgeIcon";
import CustomDropdown, { DropdownOption } from "../../UI/CustomDropdown";
import SpaceportSearch from "../spaceport/search";
import AdBannerPopover from "./AdBannerPopover";
import LocalAdBadge from "../../global/LocalAdBadge";
import { fetchFomoV2Launchpads } from "../../../http/fomoV2Launchpad";
import type { FomoV2LaunchpadSummary } from "../../../types/fomoV2Launchpad";
import {
  isLaunchpadAd,
  mapLaunchpadSummaryToCard,
  resolveMediaUrl,
} from "../../../utils/fomoV2Launchpad";
import {
  HeaderCard,
  LeftSection,
  TitleGroup,
  PageTitle,
  AdBannerWrapper,
  AdBanner,
  AdLeft,
  AdBadge,
  AdRight,
  AdProjectInfo,
  AdProjectAvatar,
  AdProjectName,
  AdStatusBadge,
  RightSection,
  FilterDropdownWrapper,
  NftWidget,
  NftInfo,
  NftTitle,
  NftSubtitle,
} from "./styles";

const TYPE_OPTIONS: DropdownOption[] = [
  { value: "ido", label: "IDO" },
  { value: "ino", label: "INO" },
  { value: "ico", label: "ICO" },
  { value: "ieo", label: "IEO" },
  { value: "seed", label: "Seed Round" },
  { value: "private", label: "Private Sale" },
];

const CATEGORY_OPTIONS: DropdownOption[] = [
  { value: "ai", label: "AI" },
  { value: "defi", label: "DeFi" },
  { value: "gaming", label: "Gaming" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "metaverse", label: "Metaverse" },
  { value: "nft", label: "NFT" },
  { value: "layer1", label: "Layer 1" },
  { value: "layer2", label: "Layer 2" },
];

export const LaunchpadPage: React.FC = () => {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [isSearch, setIsSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [items, setItems] = useState<FomoV2LaunchpadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdPopoverOpen, setIsAdPopoverOpen] = useState(false);
  const adBannerRef = useRef<HTMLDivElement>(null);

  const loadLaunchpads = useCallback(async (signal?: AbortSignal, quiet = false) => {
    if (!quiet) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const first = await fetchFomoV2Launchpads({
        limit: 100,
        offset: 0,
        surface: "launchpad",
      }, signal);
      const allItems = [...first.items];
      for (let offset = allItems.length; offset < first.total; offset += 100) {
        const next = await fetchFomoV2Launchpads({
          limit: 100,
          offset,
          surface: "launchpad",
        }, signal);
        allItems.push(...next.items);
        if (next.items.length === 0) break;
      }
      setItems(allItems);
      setError(null);
    } catch (requestError) {
      if (!signal?.aborted && !quiet) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load launch projects.");
      }
    } finally {
      if (!signal?.aborted && !quiet) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadLaunchpads(controller.signal);
    return () => controller.abort();
  }, [loadLaunchpads]);

  useEffect(() => {
    let pollInFlight = false;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible" || pollInFlight) return;
      pollInFlight = true;
      void loadLaunchpads(undefined, true).finally(() => {
        pollInFlight = false;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [loadLaunchpads]);

  useEffect(() => {
    if (!isAdPopoverOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (adBannerRef.current && !adBannerRef.current.contains(event.target as Node)) {
        setIsAdPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isAdPopoverOpen]);

  const adSource = useMemo(() => items.find(isLaunchpadAd), [items]);
  const ad = useMemo(() => adSource ? mapLaunchpadSummaryToCard(adSource) : null, [adSource]);
  const adImage = adSource
    ? resolveMediaUrl(adSource.placement?.banner?.desktopUrl || ad?.logo)
    : "";

  return (
    <PageWrapper>
      <HeaderCard>
        <LeftSection>
          <TitleGroup><InfoIcon /><PageTitle>Launchpad</PageTitle><LocalAdBadge placement="LAUNCHPAD_FEATURED" placementLabel="Launchpad" /></TitleGroup>
          {ad && adSource && (
            <AdBannerWrapper ref={adBannerRef}>
              <AdBanner onClick={() => setIsAdPopoverOpen((value) => !value)}>
                <AdLeft><AdBadge>Ad</AdBadge></AdLeft>
                <AdRight>
                  <AdProjectInfo>
                    {adImage && (
                      <AdProjectAvatar
                        src={adImage}
                        alt={adSource.placement?.banner?.alt || ad.name}
                      />
                    )}
                    <AdProjectName>{ad.name}</AdProjectName>
                  </AdProjectInfo>
                  <AdStatusBadge>{ad.status}</AdStatusBadge>
                </AdRight>
              </AdBanner>
              {isAdPopoverOpen && (
                <AdBannerPopover
                  title={adSource.launch.title || ad.name}
                  status={ad.status || "Launch"}
                  dealType={adSource.launch.saleType || "LAUNCH"}
                  project={ad.name}
                  allocation={ad.allocation || "—"}
                  tokenPrice={adSource.launch.tokenDisplay?.priceLabel || "—"}
                  created="—"
                  promotedUntil="—"
                  fundingPercent={ad.progress || 0}
                  description={adSource.launch.shortDescription || adSource.launch.description || adSource.project.description || ""}
                  projectAvatarSrc={adImage}
                  projectName={ad.name}
                  projectCategories={ad.category}
                  onJoinClick={() => {
                    const href = adSource.placement?.banner?.linkUrl || `/utility/launchpad/${ad.id}`;
                    void router.push(href);
                  }}
                />
              )}
            </AdBannerWrapper>
          )}
        </LeftSection>

        <RightSection>
          <SpaceportSearch isSearch={isSearch} setIsSearch={setIsSearch} searchValue={searchValue} setSearchValue={setSearchValue} />
          <FilterDropdownWrapper>
            <CustomDropdown options={TYPE_OPTIONS} value={selectedTypes} onChange={(value) => setSelectedTypes(value as string[])} placeholder="All Types" multiSelect searchable={false} isShowSuccess={false} />
          </FilterDropdownWrapper>
          <FilterDropdownWrapper>
            <CustomDropdown options={CATEGORY_OPTIONS} value={selectedCategories} onChange={(value) => setSelectedCategories(value as string[])} placeholder="All Categories" multiSelect searchable={false} isShowSuccess={false} />
          </FilterDropdownWrapper>
          <NftWidget>
            <NftBadgeIcon isActive={isConnected} />
            <NftInfo>
              <NftTitle>{isConnected ? "Wallet Connected" : "FOMO NFT Holder"}</NftTitle>
              <NftSubtitle $color={isConnected ? "#05a584" : "#e87000"}>
                {isConnected ? "Zone is pool-specific" : "Connect wallet"}
              </NftSubtitle>
            </NftInfo>
          </NftWidget>
        </RightSection>
      </HeaderCard>

      <LaunchpadProjects
        items={items}
        isLoading={isLoading}
        error={error}
        searchValue={searchValue}
        selectedTypes={selectedTypes}
        selectedCategories={selectedCategories}
      />
    </PageWrapper>
  );
};
