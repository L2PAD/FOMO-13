import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";
export { default as fetchPublicPortfolioMovers } from "./fetchPublicPortfolioMovers";
import {
    ICreatePortfolio,
    IPortfolio,
    IPortfolioAsset,
    IPortfolioPriceData,
    IPortfolioSummary,
    IPublicPortfolioSearchResponse,
} from "../../types/global_types";

export async function createPortfolio(
    dto: ICreatePortfolio
): Promise<{ isSuccess: boolean; portfolio: IPortfolio | null; error?: string }> {
    try {
        const accessToken = getAuthToken();

        const res = await fetch(`${API}/portfolio`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dto),
        });

        const data = await res.json();

        return {
            isSuccess: res.status < 300,
            portfolio: res.status < 300 ? data : null,
            error: res.status < 300 ? "" : data?.message || "Failed to create portfolio",
        };
    } catch (e) {
        return { isSuccess: false, portfolio: null, error: "Failed to create portfolio" };
    }
}

export async function updatePortfolio(
    portfolioId: string,
    dto: ICreatePortfolio
): Promise<{ isSuccess: boolean; portfolio: IPortfolio | null; error?: string }> {
    try {
        const accessToken = getAuthToken();

        const res = await fetch(`${API}/portfolio/${portfolioId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dto),
        });

        const data = await res.json();

        return {
            isSuccess: res.status < 300,
            portfolio: res.status < 300 ? data : null,
            error: res.status < 300 ? "" : data?.message || "Failed to update portfolio",
        };
    } catch (e) {
        return { isSuccess: false, portfolio: null, error: "Failed to update portfolio" };
    }
}

export async function getPortfolioSummaries(): Promise<IPortfolioSummary[]> {
    const accessToken = getAuthToken();

    const res = await fetch(`${API}/portfolio`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch portfolio summaries`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function deletePortfolio(
    portfolioId: string
): Promise<boolean> {
    try {
        const accessToken = getAuthToken();

        const res = await fetch(`${API}/portfolio/${portfolioId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return res.status < 300;
    } catch (e) {
        return false;
    }
}

export async function duplicatePortfolio(id: string) {
    try {
        const token = getAuthToken();

        const res = await fetch(`${API}/portfolio/duplicate/${id}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        return { isSuccess: res.status < 300, portfolio: data };
    } catch (e) {
        return { isSuccess: false, portfolio: null };
    }
}

export async function toggleBattlePortfolio(id: string, state: boolean) {
    try {
        const token = getAuthToken();

        const res = await fetch(`${API}/portfolio/toggle-battle`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                portfolioId: id,
                state,
            }),
        });

        const data = await res.json();

        return {
            isSuccess: res.status < 300,
            portfolio: data,
        };
    } catch (e) {
        return { isSuccess: false, portfolio: null };
    }
}

export async function toggleSharePortfolio(
    id: string,
    isShare: boolean,
    shareType?: 'public' | 'private' | null
): Promise<{ isSuccess: boolean; portfolio: any | null }> {
    try {
        const token = getAuthToken();

        const res = await fetch(`${API}/portfolio/${id}/share`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isShare, shareType }),
        });

        const data = await res.json();

        return {
            isSuccess: res.status < 300,
            portfolio: data,
        };
    } catch (e) {
        return { isSuccess: false, portfolio: null };
    }
}

export async function getSharedPortfolioByCode(code: string) {
    try {
        const res = await fetch(`${API}/portfolio/share/${code}`);

        if (!res.ok) {
            throw new Error(`Failed to fetch shared portfolio`);
        }

        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function searchPublicPortfolios(
    query: string,
    limit = 12,
): Promise<IPublicPortfolioSearchResponse> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
        return {
            query: normalizedQuery,
            items: [],
        };
    }

    const searchParams = new URLSearchParams({
        query: normalizedQuery,
        limit: String(limit),
    });

    const res = await fetch(`${API}/portfolio/public/search?${searchParams.toString()}`);

    if (!res.ok) {
        throw new Error(`Failed to search public portfolios`);
    }

    const data = await res.json();

    return {
        query: typeof data?.query === "string" ? data.query : normalizedQuery,
        items: Array.isArray(data?.items) ? data.items : [],
    };
}

export async function getPublicPortfolioByUserId(
    userId: string
): Promise<IPortfolio | null> {
    if (!userId) return null;

    const res = await fetch(`${API}/portfolio/public/user/${userId}`);

    if (!res.ok) {
        throw new Error(`Failed to fetch public portfolio`);
    }

    const data = await res.json();
    return data?.isSuccess ? data?.data || null : null;
}

export async function fetchPortfolioChart({
    portfolioId,
    chartType = "chart30d",
    isPublic = false,
}: {
    portfolioId: string;
    chartType?: string;
    isPublic?: boolean;
}): Promise<{ isSuccess: boolean; data: IPortfolioPriceData[] }> {
    try {
        const token = getAuthToken();
        const url = isPublic
            ? `${API}/portfolio/public/${portfolioId}/stats/${chartType}`
            : `${API}/portfolio/stats/${portfolioId}/${chartType}`;

        const res = await fetch(url, {
            method: "GET",
            headers: isPublic
                ? undefined
                : {
                    Authorization: `Bearer ${token}`,
                },
        });

        const data = await res.json();

        return {
            isSuccess: res.ok,
            data: Array.isArray(data) ? data : [],
        };
    } catch (err) {
        console.error("Error fetching portfolio chart:", err);
        return {
            isSuccess: false,
            data: [],
        };
    }
}

export async function fetchPortfolioAssets(
    portfolioId: string,
    isPublic = false
): Promise<{ isSuccess: boolean; data: IPortfolioAsset[] }> {
    try {
        const token = getAuthToken();
        const url = isPublic
            ? `${API}/portfolio/public/${portfolioId}/assets`
            : `${API}/portfolio/assets/${portfolioId}`;

        const res = await fetch(url, {
            method: "GET",
            headers: isPublic
                ? undefined
                : {
                    Authorization: `Bearer ${token}`,
                },
        });

        const data = await res.json();

        return {
            isSuccess: res.ok,
            data: Array.isArray(data) ? data : [],
        };
    } catch (err) {
        console.error("Error fetching portfolio assets:", err);
        return {
            isSuccess: false,
            data: [],
        };
    }
}

export const getAllPortfolios = getPortfolioSummaries;

export async function getPortfolioDetails(portfolioId: string): Promise<IPortfolio | null> {
    if (!portfolioId) return null;

    const accessToken = getAuthToken();

    const res = await fetch(`${API}/portfolio/${portfolioId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch portfolio details`);
    }

    return await res.json();
}

export interface PortfolioMoverItem {
    projectId: string;
    name: string;
    symbol: string;
    niche: string;
    logo: string;
    value: number;
    percent: number;
    currentValue: number;
    quantity: number;
}

export async function fetchPortfolioMovers(
    portfolioId: string
): Promise<{ isSuccess: boolean; gainers: PortfolioMoverItem[]; losers: PortfolioMoverItem[] }> {
    try {
        const token = getAuthToken();

        const res = await fetch(`${API}/portfolio/movers/${portfolioId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        return {
            isSuccess: res.ok,
            gainers: Array.isArray(data?.gainers) ? data.gainers : [],
            losers: Array.isArray(data?.losers) ? data.losers : [],
        };
    } catch (err) {
        console.error("Error fetching portfolio movers:", err);
        return {
            isSuccess: false,
            gainers: [],
            losers: [],
        };
    }
}

export async function removePortfolioAssets(
    portfolioId: string,
    projectIds: string[]
): Promise<boolean> {
    try {
        const accessToken = getAuthToken();

        const res = await fetch(`${API}/portfolio/assets/${portfolioId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ projectIds }),
        });

        return res.status < 300;
    } catch (e) {
        return false;
    }
}

export async function updatePortfolioAssetsOrder(
    portfolioId: string,
    assets: Array<{ projectId: string; index: number }>
): Promise<boolean> {
    try {
        const accessToken = getAuthToken();

        const res = await fetch(`${API}/portfolio/assets/reorder`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ portfolioId, assets }),
        });

        return res.status < 300;
    } catch (e) {
        return false;
    }
}

export interface Transaction {
    _id: string;
    portfolioId: string;
    projectId: {
        _id: string;
        name: string;
        symbol: string;
        logo: string;
    };
    type: 'buy' | 'sell';
    quantity: number;
    currency: string;
    price: number;
    priceCurrency: string;
    total: number;
    gainLoss: number;
    gainLossPercent: number;
    date: string;
    note?: string;
    feeType?: 'percent' | 'usd';
    feeAmount: number;
    createdAt: string;
    updatedAt: string;
}

export async function getPortfolioTransactions(
    portfolioId: string,
    isPublic = false
): Promise<Transaction[]> {
    try {
        const accessToken = getAuthToken();
        const url = isPublic
            ? `${API}/portfolio/public/${portfolioId}/transactions`
            : `${API}/portfolio/transactions/${portfolioId}`;

        const res = await fetch(url, {
            method: "GET",
            headers: isPublic
                ? {
                    "Content-Type": "application/json",
                }
                : {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        return data;

    } catch (error) {
        console.error('Error fetching portfolio transactions:', error);
        throw error;
    }
}
