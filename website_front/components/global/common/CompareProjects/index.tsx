import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import { Check, Search, X } from "lucide-react";
import {
  ActionButton,
  Actions,
  AssetButton,
  AssetInfo,
  AssetMeta,
  AssetsList,
  ClearButton,
  LimitText,
  ResultsScrollArea,
  SearchField,
  SearchWrapper,
  Section,
  SectionTitle,
  SelectedChip,
  SelectedChips,
  SelectedSummary,
  StateText,
} from "./styles";
import { IProject } from "../../../../types/global_types";
import fetchMarketProjectSearch from "../../../../http/projects/fetchMarketProjectSearch";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../helpers/imageFallbacks";

const MAX_COMPARE_PROJECTS = 3;

interface IProps {
  isVisible: boolean;
  initialProject?: IProject;
  projectsToCompare?: Array<IProject>;
  toggleProjectToCompate?: (items: Array<any>) => void;
  onRequestClose?: () => void;
}

const getAssetSymbol = (item: any): string =>
  String(
    item?.projectData?.symbol ||
      item?.symbol ||
      item?.ticker ||
      item?.projectData?.ticker ||
      ""
  )
    .trim()
    .toUpperCase();

const getAssetName = (item: any): string =>
  String(item?.projectData?.name || item?.name || getAssetSymbol(item) || "Unknown").trim();

const getAssetLogo = (item: any): string =>
  String(item?.projectData?.logo || item?.logo || item?.image || "");

const getNumericValue = (...values: any[]): number | null => {
  for (const value of values) {
    if (value == null) continue;

    if (typeof value === "object") {
      const nestedValue =
        value.USD ?? value.usd ?? value.price ?? value.value ?? value.amount;
      const numberValue = Number(nestedValue);
      if (Number.isFinite(numberValue)) return numberValue;
      continue;
    }

    if (typeof value === "string") {
      const normalizedValue = value
        .replace(/[%,$\s]/g, "")
        .replace(/,/g, "");
      const numberValue = Number(normalizedValue);
      if (Number.isFinite(numberValue)) return numberValue;
      continue;
    }

    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }

  return null;
};

const getAssetPrice = (item: any): number | null => {
  const value = getNumericValue(
    item?.price?.USD,
    item?.price,
    item?.projectData?.price?.USD,
    item?.projectData?.price,
    item?.usdQuote?.price,
    item?.projectData?.usdQuote?.price,
    item?.detailed?.price?.USD
  );
  return value !== null && value > 0 ? value : null;
};

const getAssetChange = (item: any): number | null => {
  return getNumericValue(
    item?.usdQuote?.percent_change_24h,
    item?.usdQuote?.percentChange24h,
    item?.usdQuote?.price_change_percentage_24h,
    item?.quote?.USD?.percent_change_24h,
    item?.quote?.usd?.percent_change_24h,
    item?.percent_change_24h,
    item?.percentChange24h,
    item?.priceChange24h,
    item?.price_change_percentage_24h,
    item?.priceChangePercentage24h,
    item?.priceChangePercent24h,
    item?.changePercent24h,
    item?.change24h,
    item?.priceChange,
    item?.projectData?.usdQuote?.percent_change_24h,
    item?.projectData?.usdQuote?.percentChange24h,
    item?.projectData?.usdQuote?.price_change_percentage_24h,
    item?.projectData?.percent_change_24h,
    item?.projectData?.percentChange24h,
    item?.projectData?.priceChange,
    item?.projectData?.priceChange24h,
    item?.projectData?.price_change_percentage_24h,
    item?.projectData?.priceChangePercentage24h,
    item?.projectData?.priceChangePercent24h,
    item?.performance?.usd?.change24h,
    item?.projectData?.performance?.usd?.change24h,
    item?.customTabValues?.priceChange24h,
    item?.projectData?.customTabValues?.priceChange24h,
    item?.marketData?.price_change_percentage_24h,
    item?.detailed?.usdQuote?.percent_change_24h
  );
};

const getAssetScore = (item: any): number => {
  return (
    getNumericValue(
      item?.marketCap,
      item?.volume24h,
      item?.volume,
      item?.projectData?.marketCap,
      item?.projectData?.volume24h,
      item?.usdQuote?.market_cap,
      item?.usdQuote?.volume_24h
    ) || 0
  );
};

const getAssetIdentity = (item: any): string =>
  String(
    item?.projectData?.coingeckoId ||
      item?.coingeckoId ||
      item?.projectData?.marketAssetId ||
      item?.marketAssetId ||
      item?.projectData?._id ||
      item?._id ||
      item?.id ||
      getAssetSymbol(item)
  ).trim();

const normalizeAsset = (item: any): IProject => {
  const projectData = item?.projectData || {};
  const identity = getAssetIdentity(item);
  const symbol = getAssetSymbol(item);
  const priceChange = getAssetChange(item);

  return {
    ...projectData,
    ...item,
    _id: item?._id || projectData?._id || identity,
    id: item?.id || projectData?.id || identity,
    coingeckoId: projectData?.coingeckoId || item?.coingeckoId,
    marketAssetId: projectData?.marketAssetId || item?.marketAssetId,
    name: getAssetName(item),
    symbol,
    ticker: symbol,
    logo: getAssetLogo(item),
    price: getAssetPrice(item) || 0,
    priceChange,
    priceChange24h: priceChange,
    usdQuote: {
      ...(projectData?.usdQuote || item?.usdQuote || {}),
      percent_change_24h: priceChange,
    },
    projectType: item?.projectType || projectData?.projectType || "market",
    projectData,
  } as IProject;
};

const formatPrice = (value: number | null): string => {
  if (value === null) return "--";
  const maximumFractionDigits = value >= 1 ? 2 : value >= 0.01 ? 4 : 8;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1 ? 2 : 0,
    maximumFractionDigits,
  }).format(value);
};

const formatChange = (value: number | null): string => {
  if (value === null) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const getChangeVariant = (value: number | null): "positive" | "negative" | "neutral" => {
  if (value === null || Math.abs(value) < 0.005) return "neutral";
  return value > 0 ? "positive" : "negative";
};

const highlightMatch = (value: string, query: string) => {
  if (!query.trim()) return value;

  const lowerValue = value.toLowerCase();
  const lowerQuery = query.trim().toLowerCase();
  const matchIndex = lowerValue.indexOf(lowerQuery);

  if (matchIndex === -1) return value;

  return (
    <>
      {value.slice(0, matchIndex)}
      <mark>{value.slice(matchIndex, matchIndex + query.length)}</mark>
      {value.slice(matchIndex + query.length)}
    </>
  );
};

const getSuggestionSeed = (): number => Math.floor(Math.random() * 100000);

const pickSeeded = (items: IProject[], limit: number, seed: number): IProject[] => {
  return [...items]
    .sort((a, b) => {
      const aScore = Math.sin((getAssetIdentity(a).length + seed) * 999);
      const bScore = Math.sin((getAssetIdentity(b).length + seed) * 999);
      return bScore - aScore;
    })
    .slice(0, limit);
};

const CompareProjects: FC<IProps> = ({
  isVisible,
  initialProject,
  projectsToCompare = [],
  toggleProjectToCompate,
  onRequestClose,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stagedSelection, setStagedSelection] = useState<IProject[]>(projectsToCompare);
  const [suggestionSeed, setSuggestionSeed] = useState(getSuggestionSeed);
  const initialIdentity = initialProject ? getAssetIdentity(initialProject) : "";
  const isSearching = debouncedSearch.trim().length > 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    if (!isVisible) return;

    setStagedSelection(projectsToCompare);
    setSearchValue("");
    setDebouncedSearch("");
    setSuggestionSeed(getSuggestionSeed());
  }, [isVisible, projectsToCompare]);

  useEffect(() => {
    if (!isVisible) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (wrapperRef.current?.contains(event.target as Node)) return;

      setStagedSelection(projectsToCompare);
      onRequestClose?.();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isVisible, onRequestClose, projectsToCompare]);

  const suggestionsQuery = useQuery(
    ["compare-assets-suggestions", initialIdentity],
    () => fetchMarketProjectSearch("", 36),
    {
      enabled: isVisible,
      refetchOnWindowFocus: false,
    }
  );

  const searchQuery = useQuery(
    ["compare-assets-search", debouncedSearch],
    () => fetchMarketProjectSearch(debouncedSearch, 20),
    {
      enabled: isVisible && isSearching,
      refetchOnWindowFocus: false,
    }
  );

  const validSuggestions = useMemo(() => {
    const assets = suggestionsQuery.data?.assets || [];
    const seen = new Set<string>();

    return assets
      .map(normalizeAsset)
      .filter((item) => {
        const identity = getAssetIdentity(item);
        const isValid =
          identity &&
          identity !== initialIdentity &&
          getAssetName(item) &&
          getAssetSymbol(item);
        if (!isValid || seen.has(identity)) return false;
        seen.add(identity);
        return true;
      });
  }, [initialIdentity, suggestionsQuery.data?.assets]);

  const topGainers = useMemo(() => {
    const gainers = validSuggestions
      .filter((item) => (getAssetChange(item) || 0) > 0)
      .sort((a, b) => (getAssetChange(b) || 0) - (getAssetChange(a) || 0))
      .slice(0, 12);

    return pickSeeded(gainers.length ? gainers : validSuggestions, 3, suggestionSeed);
  }, [suggestionSeed, validSuggestions]);

  const trending = useMemo(() => {
    const trendingAssets = [...validSuggestions]
      .sort((a, b) => getAssetScore(b) - getAssetScore(a))
      .filter((item) => !topGainers.some((gainer) => getAssetIdentity(gainer) === getAssetIdentity(item)));

    return pickSeeded(trendingAssets.length ? trendingAssets : validSuggestions, 3, suggestionSeed + 7);
  }, [suggestionSeed, topGainers, validSuggestions]);

  const searchResults = useMemo(() => {
    const assets = searchQuery.data?.assets || [];
    const seen = new Set<string>();

    return assets
      .map(normalizeAsset)
      .filter((item) => {
        const identity = getAssetIdentity(item);
        const isValid = identity && identity !== initialIdentity;
        if (!isValid || seen.has(identity)) return false;
        seen.add(identity);
        return true;
      })
      .slice(0, 12);
  }, [initialIdentity, searchQuery.data?.assets]);

  if (!isVisible) return null;

  const toggleAsset = (asset: IProject): void => {
    const identity = getAssetIdentity(asset);
    const isSelected = stagedSelection.some(
      (item) => getAssetIdentity(item) === identity
    );

    if (isSelected) {
      setStagedSelection((items) =>
        items.filter((item) => getAssetIdentity(item) !== identity)
      );
      return;
    }

    if (stagedSelection.length >= MAX_COMPARE_PROJECTS) return;
    setStagedSelection((items) => [...items, asset]);
  };

  const renderAsset = (asset: IProject) => {
    const identity = getAssetIdentity(asset);
    const isSelected = stagedSelection.some(
      (item) => getAssetIdentity(item) === identity
    );
    const isDisabled = !isSelected && stagedSelection.length >= MAX_COMPARE_PROJECTS;
    const price = getAssetPrice(asset);
    const change = getAssetChange(asset);

    return (
      <AssetButton
        key={identity}
        type="button"
        $selected={isSelected}
        $disabled={isDisabled}
        disabled={isDisabled}
        onClick={() => toggleAsset(asset)}
      >
        <img
          src={getProjectImage(getAssetLogo(asset), getAssetName(asset))}
          alt={getAssetName(asset)}
          onError={setProjectImageFallback}
        />
        <AssetInfo>
          <strong>{highlightMatch(getAssetName(asset), debouncedSearch)}</strong>
          <span>{highlightMatch(getAssetSymbol(asset), debouncedSearch)}</span>
        </AssetInfo>
        <AssetMeta $variant={getChangeVariant(change)} $selected={isSelected}>
          {isSelected ? (
            <div className="selected-check">
              <Check />
            </div>
          ) : (
            <>
              <div>{formatPrice(price)}</div>
              <span>{formatChange(change)}</span>
            </>
          )}
        </AssetMeta>
      </AssetButton>
    );
  };

  const hasSearchError = isSearching && searchQuery.isError;
  const isSearchLoading = isSearching && searchQuery.isLoading;

  return (
    <SearchWrapper ref={wrapperRef}>
      <SearchField>
        <Search />
        <input
          autoFocus
          value={searchValue}
          placeholder="Search assets"
          onChange={(event) => setSearchValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setStagedSelection(projectsToCompare);
              onRequestClose?.();
            }
          }}
        />
        {searchValue ? (
          <ClearButton type="button" onClick={() => setSearchValue("")}>
            <X />
          </ClearButton>
        ) : null}
      </SearchField>

      {stagedSelection.length ? (
        <SelectedSummary>
          <SelectedChips>
            {stagedSelection.map((item) => (
              <SelectedChip
                key={getAssetIdentity(item)}
                type="button"
                onClick={() => toggleAsset(item)}
              >
                <img
                  src={getProjectImage(getAssetLogo(item), getAssetName(item))}
                  alt={getAssetName(item)}
                  onError={setProjectImageFallback}
                />
                <span>{getAssetSymbol(item) || getAssetName(item)}</span>
                <X />
              </SelectedChip>
            ))}
          </SelectedChips>
          <LimitText>
            <span>
              {stagedSelection.length}/{MAX_COMPARE_PROJECTS}
            </span>
          </LimitText>
        </SelectedSummary>
      ) : null}

      <ResultsScrollArea>
        {!isSearching ? (
          <>
            <Section>
              <SectionTitle>Top Gainers</SectionTitle>
              <AssetsList>
                {suggestionsQuery.isLoading ? (
                  <StateText>Loading assets...</StateText>
                ) : topGainers.length ? (
                  topGainers.map(renderAsset)
                ) : (
                  <StateText>No assets found</StateText>
                )}
              </AssetsList>
            </Section>
            <Section>
              <SectionTitle>Trending</SectionTitle>
              <AssetsList>
                {suggestionsQuery.isLoading ? (
                  <StateText>Loading assets...</StateText>
                ) : trending.length ? (
                  trending.map(renderAsset)
                ) : (
                  <StateText>No assets found</StateText>
                )}
              </AssetsList>
            </Section>
          </>
        ) : (
          <Section>
            <AssetsList>
              {isSearchLoading ? <StateText>Loading assets...</StateText> : null}
              {hasSearchError ? <StateText>Could not load assets</StateText> : null}
              {!isSearchLoading && !hasSearchError && searchResults.length
                ? searchResults.map(renderAsset)
                : null}
              {!isSearchLoading && !hasSearchError && !searchResults.length ? (
                <StateText>No assets found</StateText>
              ) : null}
            </AssetsList>
          </Section>
        )}
      </ResultsScrollArea>

      <Actions>
        <ActionButton type="button" onClick={() => setStagedSelection([])}>
          Reset
        </ActionButton>
        <ActionButton
          type="button"
          $primary
          onClick={() => {
            toggleProjectToCompate?.(stagedSelection);
            onRequestClose?.();
          }}
        >
          Apply
        </ActionButton>
      </Actions>
    </SearchWrapper>
  );
};

export default CompareProjects;
