import { useCallback, useEffect, useRef, useState } from "react";
import getDealById from "../../../../../../http/deals/getDealById";
import { IDeal } from "../../../../../../types/global_types";

interface UseDealPollingOptions {
    intervalMs?: number;
    isEnabled?: boolean;
    onBeforeFetch?: () => void | Promise<void>;
}

interface UseDealPollingResult {
    deal: IDeal | null;
    refreshDeal: (force?: boolean) => Promise<IDeal | null>;
}

export const useDealPolling = (
    initialDeal: IDeal | null,
    options: UseDealPollingOptions = {}
): UseDealPollingResult => {
    const { intervalMs = 20000, isEnabled = true, onBeforeFetch } = options;
    const [dealState, setDealState] = useState<IDeal | null>(initialDeal);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastFetchRef = useRef(0);
    const dealIdRef = useRef<string | null>(initialDeal?._id || null);
    const dealStateRef = useRef<IDeal | null>(initialDeal);

    useEffect(() => {
        setDealState(initialDeal);
        dealStateRef.current = initialDeal;
        dealIdRef.current = initialDeal?._id || null;
    }, [initialDeal]);

    const fetchDeal = useCallback(
        async (force = false): Promise<IDeal | null> => {
            const dealId = dealIdRef.current;
            if (!dealId) {
                return null;
            }

            const now = Date.now();
            if (!force && now - lastFetchRef.current < intervalMs) {
                return dealStateRef.current;
            }

            lastFetchRef.current = now;

            try {
                await onBeforeFetch?.();
            } catch (error) {
                console.error("Failed to run pre-fetch callback", error);
            }

            try {
                const response = await getDealById(dealId);
                if (response?.isSuccess && response.deal) {
                    setDealState(response.deal);
                    dealStateRef.current = response.deal;
                    dealIdRef.current = response.deal._id;
                    return response.deal;
                }
            } catch (error) {
                console.error("Failed to poll deal", error);
            }

            return null;
        },
        [intervalMs, onBeforeFetch]
    );

    useEffect(() => {
        if (!isEnabled || !dealIdRef.current) {
            return;
        }

        fetchDeal(true);

        intervalRef.current = setInterval(() => {
            void fetchDeal(true);
        }, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [fetchDeal, intervalMs, isEnabled, initialDeal?._id]);

    const refreshDeal = useCallback(
        (force = true) => fetchDeal(force),
        [fetchDeal]
    );

    return { deal: dealState, refreshDeal };
};
