import React, { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "react-query";
import FeedFilterBar, { FeedTypeFilter } from "./FeedFilterBar";
import FeedGrid from "./FeedGrid";
import { EarlylandCardData } from "./FeedCard/types";
import Pagination from "../../../../../global/Pagintaion";
import FeedFilterModal, {
  FeedFilterOption,
  FeedFilters,
  INITIAL_FILTERS,
} from "./FeedFilterModal";
import {
  favoriteCryptoActivity,
  getCryptoActivities,
  getCryptoActivityErrorStatus,
  getCryptoActivityFilters,
  unfavoriteCryptoActivity,
} from "../../../../../../http/cryptoActivities";
import {
  CryptoActivityAccessTier,
  CryptoActivityFilterOption,
} from "../../../../../../types/cryptoActivities";
import {
  mapCryptoActivityToFeedCard,
  mapUiStatusToBackendStatus,
} from "../../../../../../utils/cryptoActivitiesMapper";
import {
  patchOptimisticActivityUserState,
  restoreQuerySnapshots,
  snapshotQueryRoots,
} from "../../../../../../utils/cryptoActivitiesOptimistic";
import { AuthContext } from "../../../../../global/Layout";

interface FeedProps {
  searchValue?: string;
  accessTier?: CryptoActivityAccessTier;
}

const LIMIT = 20;
const FILTER_OPTIONS_LIMIT = 9;
const LEFT_GROUP_TYPE_LIMIT = 5;

const mapSortValue = (value: string) => {
  const normalized = value.toLowerCase().replace(/\s/g, "");
  if (normalized === "popular" || normalized === "mostpopular" || normalized === "highpotential") {
    return "score";
  }
  if (normalized === "new" || normalized === "newest") return "newest";
  if (normalized === "old" || normalized === "oldest") return "oldest";
  if (normalized === "endingsoon") return "endingSoon";
  if (normalized === "default") return undefined;

  return value;
};

const mapFilterOptions = (
  options: CryptoActivityFilterOption[] = []
): FeedFilterOption[] =>
  options.map((option) => ({
    value: option.value || option.key || option.label,
    label: option.label || option.value || option.key,
    count: option.count,
  }));

export const Feed: React.FC<FeedProps> = ({ searchValue = "", accessTier }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authContext = useContext(AuthContext);
  const [typeFilter, setTypeFilter] = useState<FeedTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("default");
  const [cards, setCards] = useState<EarlylandCardData[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FeedFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const viewerAccessVersion = [
    authContext?.isAuth ? "authenticated" : "anonymous",
    String(authContext?.userData?._id || "no-user"),
    String(authContext?.userData?.wallet || "").trim().toLowerCase(),
    Boolean(authContext?.hasSpaceportNft),
    Boolean(authContext?.hasBoughtSpaceportNft),
    Number(authContext?.userData?.spaceportNftCount || 0),
    Number(authContext?.spaceportAccess?.nftBalance || 0),
  ].join(":");

  const { data: filterOptionsData } = useQuery(
    ["crypto-earlyland-filter-options", FILTER_OPTIONS_LIMIT, accessTier, viewerAccessVersion],
    () => getCryptoActivityFilters(FILTER_OPTIONS_LIMIT, { accessTier }),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, queryError) => {
        const status = getCryptoActivityErrorStatus(queryError);
        if (status && status < 500) return false;
        return failureCount < 2;
      },
    }
  );

  const activityTypeOptions = useMemo(
    () => mapFilterOptions(filterOptionsData?.activityTypes),
    [filterOptionsData?.activityTypes]
  );
  const categoryOptions = useMemo(
    () => mapFilterOptions(filterOptionsData?.categories),
    [filterOptionsData?.categories]
  );
  const leftGroupTypeOptions = useMemo(
    () => activityTypeOptions.slice(0, LEFT_GROUP_TYPE_LIMIT),
    [activityTypeOptions]
  );

  const filterActiveCount = Object.values(filters).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  const queryParams = useMemo(() => {
    const modalType = filters.activityTypes.join(",");
    const excludedType = leftGroupTypeOptions.map((option) => option.value).join(",");
    const selectedType =
      typeFilter !== "all" && typeFilter !== "favourites" && typeFilter !== "others"
        ? typeFilter
        : typeFilter === "others"
          ? undefined
          : modalType;
    const modalStatus = filters.status
      .map(mapUiStatusToBackendStatus)
      .filter(Boolean)
      .join(",");

    return {
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
      search: searchValue.trim(),
      type: selectedType || undefined,
      lifecycleStatus:
        statusFilter !== "all"
          ? mapUiStatusToBackendStatus(statusFilter)
          : modalStatus || undefined,
      category: filters.categories.join(",") || undefined,
      difficulty: filters.difficulty.join(",") || undefined,
      sort: mapSortValue(sortFilter) || mapSortValue(filters.sorting[0] || ""),
      favourite: typeFilter === "favourites" ? true : undefined,
      excludeType: typeFilter === "others" ? excludedType : undefined,
      accessTier,
    };
  }, [accessTier, filters, leftGroupTypeOptions, page, searchValue, sortFilter, statusFilter, typeFilter]);

  const { data, isLoading, isFetching, isError, error } = useQuery(
    ["crypto-earlyland-activities", queryParams, viewerAccessVersion],
    () => getCryptoActivities(queryParams),
    {
      refetchOnWindowFocus: false,
      retry: (failureCount, queryError) => {
        const status = getCryptoActivityErrorStatus(queryError);
        if (status && status < 500) return false;
        return failureCount < 2;
      },
    }
  );

  useEffect(() => {
    setCards((data?.items || []).map(mapCryptoActivityToFeedCard));
  }, [data]);

  useEffect(() => {
    setPage(1);
  }, [filters, searchValue, sortFilter, statusFilter, typeFilter]);

  const handleToggleFavourite = async (id: string, interactionId?: string) => {
    if (!authContext?.isAuth || !authContext?.userData?.isActive) {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("auth-modal", "true");
        router.replace(`${url.pathname}${url.search}${url.hash}`, undefined, {
          shallow: true,
        });
      }
      return;
    }

    const previousCards = cards;
    const currentCard = cards.find((card) => card.id === id);
    const nextFavourite = !currentCard?.isFavourite;
    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-earlyland-activity",
      "crypto-earlyland-activities",
    ]);

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavourite: nextFavourite } : c))
    );
    patchOptimisticActivityUserState(queryClient, id, {
      isFavourite: nextFavourite,
    });

    const result = nextFavourite
      ? await favoriteCryptoActivity(interactionId || id)
      : await unfavoriteCryptoActivity(interactionId || id);

    if (!result.isSuccess) {
      setCards(previousCards);
      restoreQuerySnapshots(queryClient, snapshots);
      return;
    }

    queryClient.invalidateQueries("crypto-earlyland-activities");
  };

  const handleDetails = (id: string) => {
    router.push(`/crypto/earlyland/${id}?from=${accessTier === "prime" ? "prime" : "feed"}`);
  };

  const errorStatus = getCryptoActivityErrorStatus(error);
  const errorMessage = errorStatus === 403
    ? "Prime access is required to load these activities."
    : errorStatus === 404
      ? "No activities were found."
      : "Unable to load activities. Please try again.";

  return (
    <div>
      <FeedFilterBar
        totalCount={filterOptionsData?.total ?? data?.total ?? cards.filter((c) => !c.isLocked).length}
        othersCount={filterOptionsData?.otherActivityCount ?? 0}
        favouritesCount={cards.filter((c) => c.isFavourite).length}
        typeOptions={leftGroupTypeOptions}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortFilter={sortFilter}
        onSortFilterChange={setSortFilter}
        onFilterClick={() => setIsFilterOpen(true)}
        filterActiveCount={filterActiveCount}
        onCalendarClick={() => {
          router.push("/crypto/earlyland/calendar");
        }}
      />
      <FeedGrid
        items={cards}
        isLoading={isLoading || isFetching}
        searchValue={searchValue}
        onToggleFavourite={handleToggleFavourite}
        onDetails={handleDetails}
      />
      {isError && (
        <div role="alert" aria-live="polite">
          {errorMessage}
        </div>
      )}
      {!isLoading && !isFetching && Number(data?.total || 0) > 0 && (
        <Pagination
          page={page}
          total={data?.total || 0}
          onChange={setPage}
          totalPage={Math.max(1, Math.ceil(Number(data?.total || 0) / LIMIT))}
          limit={Math.min(page * LIMIT, Number(data?.total || 0))}
          style={{
            marginTop: 20
          }}
        />
      )}
      <FeedFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
        activityTypeOptions={activityTypeOptions}
        categoryOptions={categoryOptions}
      />
    </div>
  );
};
