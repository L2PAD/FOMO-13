import { useContext, useEffect, useMemo, useState } from 'react'
import { BalanceContext, LayoutContext } from '../components/global/Layout'

const STORAGE_KEYS = {
    ethPrice: 'fomo_eth_price',
    ethBalance: 'fomo_eth_balance',
    usdcBalance: 'fomo_usdc_balance',
    total: 'fomo_total_balance',
}

const getCachedNumber = (key: string, fallback = 0) => {
    if (typeof window === 'undefined') return fallback
    const value = localStorage.getItem(key)
    return value !== null ? Number(value) : fallback
}

export const useTotalBalance = () => {
    const { layout } = useContext(LayoutContext)
    const balance = useContext(BalanceContext)

    const isLoading = balance.isLoading

    const liveEthPrice = !isLoading
        ? layout?.header?.data?.ethereumPrice ?? null
        : null

    const liveEthBalance = !isLoading ? balance?.eth ?? null : null
    const liveUsdcBalance = !isLoading ? balance?.usdc ?? null : null
    const escrowBalance = 0

    const [cachedEthPrice, setCachedEthPrice] = useState(() =>
        getCachedNumber(STORAGE_KEYS.ethPrice)
    )
    const [cachedEthBalance, setCachedEthBalance] = useState(() =>
        getCachedNumber(STORAGE_KEYS.ethBalance)
    )
    const [cachedUsdcBalance, setCachedUsdcBalance] = useState(() =>
        getCachedNumber(STORAGE_KEYS.usdcBalance)
    )
    const [cachedTotal, setCachedTotal] = useState(() =>
        getCachedNumber(STORAGE_KEYS.total)
    )

    useEffect(() => {
        if (liveEthPrice !== null) {
            setCachedEthPrice(liveEthPrice)
            localStorage.setItem(STORAGE_KEYS.ethPrice, liveEthPrice.toString())
        }
    }, [liveEthPrice])

    useEffect(() => {
        if (liveEthBalance !== null) {
            setCachedEthBalance(liveEthBalance)
            localStorage.setItem(
                STORAGE_KEYS.ethBalance,
                liveEthBalance.toString()
            )
        }
    }, [liveEthBalance])

    useEffect(() => {
        if (liveUsdcBalance !== null) {
            setCachedUsdcBalance(liveUsdcBalance)
            localStorage.setItem(
                STORAGE_KEYS.usdcBalance,
                liveUsdcBalance.toString()
            )
        }
    }, [liveUsdcBalance])

    const calculatedTotal = useMemo(() => {
        if (
            liveEthPrice === null ||
            liveEthBalance === null ||
            liveUsdcBalance === null
        ) {
            return null
        }

        return liveEthBalance * liveEthPrice + liveUsdcBalance + escrowBalance
    }, [liveEthBalance, liveEthPrice, liveUsdcBalance, escrowBalance])

    useEffect(() => {
        if (calculatedTotal !== null) {
            setCachedTotal(calculatedTotal)
            localStorage.setItem(STORAGE_KEYS.total, calculatedTotal.toString())
        }
    }, [calculatedTotal])

    const displayEthPrice = liveEthPrice ?? cachedEthPrice
    const displayEthBalance = liveEthBalance ?? cachedEthBalance
    const displayUsdcBalance = liveUsdcBalance ?? cachedUsdcBalance
    const displayTotal = calculatedTotal ?? cachedTotal

    return {
        total: displayTotal,
        ethPrice: displayEthPrice,
        ethBalance: displayEthBalance,
        usdcBalance: displayUsdcBalance,
        escrowBalance,
        isCached: isLoading,
    }
}
