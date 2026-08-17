import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";
import { toast } from "react-toastify";
import UnlockCountdown from "../../UnlockCountdown";
import {
  getUnlockActionSourceId,
  getUnlockEventDate,
  getUnlockPriceData,
  getUnlockPrimaryEvent,
} from "../../../../../helpers/unlockingDisplay";
import {
  addTokenUnlockToCalendar,
  enableTokenUnlockReminder,
} from "../../../../../http/unlocks/fetchTokenUnlocks";
import {
  Actions,
  clarifyAmount,
  HighlightedText,
  imageLoader,
  PricePercentChange,
  PriceWrapper,
  ProjectData,
  simplifyAmount,
  type UniversalTableCaseProps,
  UnlockingActionButton,
  UnlockProgressBar,
  UnlockProgressWrapper,
  UserAvatar,
} from "./shared";

const trimTrailingZeros = (value: string): string => {
  return value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
};

const countLeadingFractionZeros = (value: number): number => {
  const decimalPart = String(value).split(".")[1] || "";
  const firstNonZeroIndex = decimalPart.search(/[1-9]/);

  return firstNonZeroIndex === -1 ? 0 : firstNonZeroIndex;
};

const formatUnlockPrice = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "--";
  }

  if (value >= 1) {
    return `$${simplifyAmount(value, 4)}`;
  }

  const leadingFractionZeros = countLeadingFractionZeros(value);
  const maximumFractionDigits = Math.min(
    Math.max(4, leadingFractionZeros + 3),
    6
  );

  return `$${trimTrailingZeros(
    value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    })
  )}`;
};

const formatUnlockPriceChange = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value) || value === 0) {
    return "--";
  }

  const maximumFractionDigits = Math.abs(value) < 0.01 ? 4 : 2;

  return `(${trimTrailingZeros(
    value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    })
  )})%`;
};

const normalizeProgress = (value: unknown): number => {
  const progress = Number(value);

  if (!Number.isFinite(progress)) return 0;

  return Math.min(Math.max(progress, 0), 100);
};

const toNumericValue = (value: unknown): number => {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    return Number(value.replace(/[^0-9.-]/g, ""));
  }

  return 0;
};

const toPositiveNumericValue = (value: unknown): number | null => {
  const numericValue = toNumericValue(value);

  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : null;
};

const getFirstPositiveNumericValue = (...values: unknown[]): number | null => {
  for (const value of values) {
    const numericValue = toPositiveNumericValue(value);

    if (numericValue !== null) return numericValue;
  }

  return null;
};

const clampPercent = (value: number): number => {
  return Math.min(Math.max(value, 0), 100);
};

const formatCompactValue = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "--";
  }

  if (value < 1000) {
    return trimTrailingZeros(
      value.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    );
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/([0-9])([A-Z])/g, "$1 $2");
};

const formatUsdValue = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "--";
  }

  return value.toLocaleString("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  });
};

const UnlockingRowContent = ({
  item,
  searchValue = "",
  userData,
}: UniversalTableCaseProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const unlockActionSourceId = useMemo(
    () => getUnlockActionSourceId(item),
    [item]
  );
  const [loadingAction, setLoadingAction] = useState<
    "calendar" | "reminder" | null
  >(null);
  const [userActionState, setUserActionState] = useState({
    inCalendar: Boolean(item?.userActions?.inCalendar),
    reminderEnabled: Boolean(item?.userActions?.reminderEnabled),
  });
  const primaryUnlockEvent = getUnlockPrimaryEvent(item);
  const primaryUnlockEventWithRawAliases =
    primaryUnlockEvent as typeof primaryUnlockEvent & {
      tokenAmount?: number | string | null;
      tokensAmount?: number | string | null;
      unlockValueUsd?: number | string | null;
      valueUsd?: number | string | null;
      totalTokensLockedAmount?: number | string | null;
      total_locked_amount?: number | string | null;
    };
  const primaryUnlockEventRaw = primaryUnlockEvent?.raw || {};
  const primaryUnlockRawData =
    primaryUnlockEventRaw?.rawUnlockData || primaryUnlockEventRaw?.raw || {};
  const intelSourceSnapshot = item?.intelSourceSnapshot || {};
  const intelSourceSnapshotRaw = intelSourceSnapshot?.raw || {};
  const detailed = item?.detailed || {};
  const { priceChange24h, priceUsd } = getUnlockPriceData(item);
  const currentPriceUsd = toPositiveNumericValue(priceUsd) ?? 0;
  const displayName = String(
    detailed?.name || primaryUnlockEvent?.name || item?.coinSlug || "-"
  );
  const displaySymbol = String(
    item?.coinSymbol ||
      detailed?.coinSymbol ||
      primaryUnlockEvent?.symbol ||
      detailed?.symbol ||
      detailed?.niche ||
      item?.coinSlug ||
      "-"
  )
    .trim()
    .toUpperCase();
  const displayLogo =
    detailed?.image || item?.logo || item?.image || primaryUnlockEvent?.logo;
  const projectName =
    displayName.length > 20 ? `${displayName.slice(0, 15)}...` : displayName;
  const circulatingSupply =
    item?.circulatingSupply ??
    detailed?.circulatingSupply ??
    primaryUnlockEvent?.raw?.circulatingSupply ??
    primaryUnlockEvent?.raw?.circulating_supply ??
    0;
  const circulatingSupplyValue = toNumericValue(circulatingSupply);
  const unlockProgress = normalizeProgress(item?.totalTokensUnlockedPercent);
  const marketCap = item?.marketCap ?? primaryUnlockEvent?.marketCap ?? 0;
  const nextUnlockTokensAmount = toNumericValue(
    item?.nextUnlockTokensAmount ??
      item?.nextUnlockEvent?.tokensAmount ??
      item?.nextUnlockEvent?.tokenAmount ??
      primaryUnlockEvent?.raw?.tokensAmount ??
      primaryUnlockEvent?.raw?.tokenAmount ??
      primaryUnlockEventWithRawAliases?.tokensAmount ??
      primaryUnlockEventWithRawAliases?.tokenAmount ??
      0
  );
  const nextUnlockValueUsd = toNumericValue(
    item?.nextUnlockValueUsd ??
      item?.nextUnlockEvent?.unlockValueUsd ??
      item?.nextUnlockEvent?.valueUsd ??
      primaryUnlockEvent?.raw?.unlockValueUsd ??
      primaryUnlockEvent?.raw?.valueUsd ??
      primaryUnlockEventWithRawAliases?.unlockValueUsd ??
      primaryUnlockEventWithRawAliases?.valueUsd ??
      0
  );
  const totalTokensLockedAmountFromSource = getFirstPositiveNumericValue(
    primaryUnlockRawData?.tokenLockedAmount,
    primaryUnlockRawData?.token_locked_amount,
    primaryUnlockRawData?.raw?.tokenLockedAmount,
    primaryUnlockRawData?.raw?.token_locked_amount,
    intelSourceSnapshot?.tokenLockedAmount,
    intelSourceSnapshot?.token_locked_amount,
    intelSourceSnapshotRaw?.tokenLockedAmount,
    intelSourceSnapshotRaw?.token_locked_amount
  );
  const storedTotalTokensLockedAmount = getFirstPositiveNumericValue(
    item?.totalTokensLockedAmount,
    detailed?.totalTokensLockedAmount,
    primaryUnlockEventRaw?.totalTokensLockedAmount,
    primaryUnlockEventRaw?.total_locked_amount,
    primaryUnlockEventWithRawAliases?.totalTokensLockedAmount,
    primaryUnlockEventWithRawAliases?.total_locked_amount
  );
  const nextUnlockPercentOfSupply = getFirstPositiveNumericValue(
    item?.nextUnlockPercent,
    item?.publicVestingPercent,
    primaryUnlockEvent?.tokensPercent,
    primaryUnlockEventRaw?.percentOfSupply,
    primaryUnlockEventRaw?.tokensPercent,
    primaryUnlockRawData?.tokenAmountPercentage,
    primaryUnlockRawData?.tokens_percent,
    primaryUnlockRawData?.unlock_percent,
    primaryUnlockRawData?.unlock_pct,
    primaryUnlockRawData?.next_unlocked?.tokenAmountPercentage,
    primaryUnlockRawData?.nextUnlocked?.tokenAmountPercentage,
    primaryUnlockRawData?.raw?.nextUnlocked?.tokenAmountPercentage
  );
  const totalTokensLockedPercent = getFirstPositiveNumericValue(
    item?.totalTokensLockedPercent,
    primaryUnlockRawData?.locked_percent,
    primaryUnlockRawData?.lockedPercent,
    primaryUnlockRawData?.raw?.lockedPercent,
    primaryUnlockRawData?.raw?.locked_percent,
    intelSourceSnapshot?.locked_percent,
    intelSourceSnapshot?.lockedPercent,
    intelSourceSnapshotRaw?.lockedPercent,
    intelSourceSnapshotRaw?.locked_percent
  );
  const nextUnlockDisplayValueUsd =
    nextUnlockTokensAmount > 0 && currentPriceUsd > 0
      ? nextUnlockTokensAmount * currentPriceUsd
      : nextUnlockValueUsd;
  const nextUnlockLockedPercentBySourceAmount =
    nextUnlockTokensAmount > 0 && totalTokensLockedAmountFromSource
      ? clampPercent(
          (nextUnlockTokensAmount / totalTokensLockedAmountFromSource) * 100
        )
      : null;
  const nextUnlockLockedPercentBySupplyPercent =
    nextUnlockPercentOfSupply && totalTokensLockedPercent
      ? clampPercent(
          (nextUnlockPercentOfSupply / totalTokensLockedPercent) * 100
        )
      : null;
  const nextUnlockLockedPercentByStoredAmount =
    nextUnlockTokensAmount > 0 && storedTotalTokensLockedAmount
      ? clampPercent(
          (nextUnlockTokensAmount / storedTotalTokensLockedAmount) * 100
        )
      : null;
  const nextUnlockLockedPercent =
    nextUnlockLockedPercentBySourceAmount ??
    nextUnlockLockedPercentBySupplyPercent ??
    nextUnlockLockedPercentByStoredAmount;
  const nextUnlockDate = getUnlockEventDate(item);
  const isAuthorized = Boolean(userData?.isFullAuth);
  const isActionLoading = Boolean(loadingAction);
  const highlight = (value?: string | number | null) => (
    <HighlightedText
      text={
        value === undefined || value === null || value === ""
          ? "-"
          : String(value)
      }
      searchValue={searchValue}
      highlightAll
    />
  );

  useEffect(() => {
    setUserActionState({
      inCalendar: Boolean(item?.userActions?.inCalendar),
      reminderEnabled: Boolean(item?.userActions?.reminderEnabled),
    });
  }, [item?.userActions?.inCalendar, item?.userActions?.reminderEnabled]);

  const openAuthModal = () => {
    toast.info("Connect wallet to use unlock actions");

    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          "auth-modal": "true",
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const invalidateUnlockActions = () => {
    queryClient.invalidateQueries("token-unlock-user-actions");
  };

  const handleCalendarClick = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (isActionLoading) return;

    if (!isAuthorized) {
      openAuthModal();
      return;
    }

    if (!unlockActionSourceId) {
      toast.error("Unlock event id is missing");
      return;
    }

    setLoadingAction("calendar");

    try {
      const response = await addTokenUnlockToCalendar(unlockActionSourceId);

      if (!response.isSuccess) {
        toast.error(response.message || "Failed to add unlock to calendar");
        return;
      }

      setUserActionState((prev) => ({
        ...prev,
        inCalendar: true,
        reminderEnabled: prev.reminderEnabled || Boolean(response.event?.notifyEnabled),
      }));
      invalidateUnlockActions();
      toast.success(
        response.alreadyExists
          ? "Already in your calendar"
          : "Unlock added to your calendar"
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReminderClick = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (isActionLoading) return;

    if (!isAuthorized) {
      openAuthModal();
      return;
    }

    if (!unlockActionSourceId) {
      toast.error("Unlock event id is missing");
      return;
    }

    setLoadingAction("reminder");

    try {
      const response = await enableTokenUnlockReminder(unlockActionSourceId);

      if (!response.isSuccess) {
        toast.error(response.message || "Failed to enable reminder");
        return;
      }

      setUserActionState({
        inCalendar: true,
        reminderEnabled: true,
      });
      invalidateUnlockActions();
      toast.success("Reminder enabled");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <ProjectData>
        <UserAvatar
          size="small"
          variant="default"
          avatar={imageLoader(displayLogo)}
          name={displayName}
          fallbackType="project"
        />
        <div className="project-row-data">
          <p>{highlight(projectName)}</p>
          <span>{highlight(displaySymbol)}</span>
        </div>
      </ProjectData>
      <PriceWrapper>
        {formatUnlockPrice(priceUsd)}
        <PricePercentChange isLow={(priceChange24h ?? 0) <= 0}>
          {formatUnlockPriceChange(priceChange24h)}
        </PricePercentChange>
      </PriceWrapper>
      <div style={{ fontSize: 14 }}>${clarifyAmount(marketCap, true)}</div>
      <div>
        <p style={{ fontSize: 14, fontWeight: "var(--font-weight-semibold)" }}>
          {circulatingSupplyValue > 0
            ? `${simplifyAmount(circulatingSupply, 0)} ${displaySymbol}`
            : "--"}
        </p>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: "var(--font-weight-semibold)", lineHeight: "18px" }}>
          {nextUnlockTokensAmount > 0
            ? `${formatCompactValue(nextUnlockTokensAmount)} ${displaySymbol}`
            : "--"}
        </p>
        <span
          style={{
            color: "var(--main-gray)",
            display: "block",
            fontSize: 12,
            fontWeight: "var(--font-weight-medium)",
            lineHeight: "18px",
            marginTop: 2,
            whiteSpace: "nowrap",
          }}
        >
          {nextUnlockDisplayValueUsd > 0
            ? `${formatUsdValue(nextUnlockDisplayValueUsd)}${
                nextUnlockLockedPercent !== null
                  ? ` (${nextUnlockLockedPercent.toFixed(2)}% of total lock.)`
                  : ""
              }`
            : "--"}
        </span>
      </div>
      <UnlockProgressWrapper>
        <span>{unlockProgress.toFixed(2)}%</span>
        <UnlockProgressBar progress={unlockProgress}>
          <div />
        </UnlockProgressBar>
      </UnlockProgressWrapper>
      <div style={{ minWidth: 0 }}>
        <UnlockCountdown targetDate={nextUnlockDate} />
      </div>
      <Actions
        style={{
          alignItems: "center",
          flexDirection: "row",
          flexWrap: "nowrap",
          minWidth: 50,
        }}
      >
        <UnlockingActionButton
          aria-label="Add unlock to calendar"
          disabled={isActionLoading}
          isActive={userActionState.inCalendar}
          onClick={handleCalendarClick}
          title={
            userActionState.inCalendar
              ? "Already in your calendar"
              : "Add unlock to calendar"
          }
          type="button"
        >
          {loadingAction === "calendar" ? (
            <span />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6.11428 6.5848H13.825M5.58809 2.03125V3.39748M14.25 2.03125V3.39731M16.8 5.89731C16.8 4.5166 15.7255 3.39731 14.4 3.39731H5.6C4.27451 3.39731 3.2 4.5166 3.2 5.89731V15.4688C3.2 16.8495 4.27451 17.9688 5.6 17.9688H14.4C15.7255 17.9688 16.8 16.8495 16.8 15.4688L16.8 10.683L16.8 5.89731Z"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </UnlockingActionButton>
        <UnlockingActionButton
          aria-label="Enable unlock reminder"
          disabled={isActionLoading}
          isActive={userActionState.reminderEnabled}
          onClick={handleReminderClick}
          title={
            userActionState.reminderEnabled
              ? "Reminder enabled"
              : "Enable reminder"
          }
          type="button"
        >
          {loadingAction === "reminder" ? (
            <span />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M7.77777 16.7424C8.3675 17.2135 9.14627 17.5 9.99999 17.5C10.8537 17.5 11.6325 17.2135 12.2222 16.7424M3.75636 14.3182C3.40501 14.3182 3.20878 13.7662 3.42131 13.4595C3.91446 12.7479 4.39046 11.7043 4.39046 10.4475L4.4108 8.62638C4.4108 5.24288 6.91317 2.5 9.99999 2.5C13.1323 2.5 15.6715 5.28328 15.6715 8.71662L15.6512 10.4475C15.6512 11.7129 16.1108 12.7623 16.5839 13.4742C16.7882 13.7816 16.5914 14.3182 16.2444 14.3182H3.75636Z"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </UnlockingActionButton>
      </Actions>
    </>
  );
};

export default UnlockingRowContent;
