import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import getPromotedDeal from '../http/deals/getPromotedDeal';
import { IDeal } from '../types/global_types';

const PROMOTE_REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const usePromotedDeal = (section: 'otc' | 'p2p') => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [promotedDeal, setPromotedDeal] = useState<IDeal | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    const { data, isLoading, refetch } = useQuery(
        ['promoted-deal', section],
        () => getPromotedDeal(section),
        { 
            refetchOnWindowFocus: false,
            refetchInterval: PROMOTE_REFETCH_INTERVAL_MS, // Automatically refetch every 5 minutes
        }
    );

    const updatePromotedDeal = useCallback((updater: (prev: IDeal) => IDeal) => {
        setPromotedDeal((prev) => {
            if (!prev) return prev;
            return updater(prev);
        });
    }, []);

    useEffect(() => {
        // Clear any existing refetch timeout
        if (refetchTimeoutRef.current) {
            clearTimeout(refetchTimeoutRef.current);
            refetchTimeoutRef.current = null;
        }

        if (!data?.deal) {
            setPromotedDeal(null);
            setTimeLeft(0);
            return;
        }

        const deal = data.deal;
        setPromotedDeal(deal);

        if (timerRef.current) clearInterval(timerRef.current);

        if (!deal.promoteDateEnd) return

        const endTime = new Date(deal.promoteDateEnd).getTime();
        const now = Date.now();
        const initialTimeLeft = Math.max(endTime - now, 0);

        // If timer already ended, refetch immediately
        if (initialTimeLeft <= 0) {
            refetch();
            return;
        }

        setTimeLeft(initialTimeLeft);

        timerRef.current = setInterval(() => {
            const now = Date.now();
            const left = Math.max(endTime - now, 0);
            setTimeLeft(left);

            if (left <= 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                
                // Schedule immediate refetch
                refetch();
                
                // Schedule backup refetch after 2 seconds if no update received
                refetchTimeoutRef.current = setTimeout(() => {
                    refetch();
                }, 2000);
            }
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (refetchTimeoutRef.current) {
                clearTimeout(refetchTimeoutRef.current);
                refetchTimeoutRef.current = null;
            }
        };
    }, [data, refetch]);

    return { promotedDeal, timeLeft, isLoading, refetch, updatePromotedDeal };
};
