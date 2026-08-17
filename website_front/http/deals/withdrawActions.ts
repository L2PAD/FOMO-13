// api/withdraws.ts
import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";
import { BlockchainNetwork, CryptoCurrency } from "./createDeposit";

export enum WithdrawStatuses {
    'PENDING',
    'COMPLETED',
    'REJECTED',
    'CANCELED',
    'DELETED',
    'APPROVED'
}

export interface CreateWithdrawDto {
    currency: 'USDC' | 'ETH';
    amount: number;
    network: BlockchainNetwork;
    userWallet: string;
    type?: string;
}

export interface Withdraw {
    _id: string;
    userId: string;
    currency: CryptoCurrency;
    amount: number;
    status: WithdrawStatuses;
    network: BlockchainNetwork;
    userWallet: string;
    transactionHash: string;
    fee: number;
    totalSend: number;
    expireDate: string;
    createdAt: string;
    updatedAt: string;
    reason?: string;
    confirmationDate?: string;
    moderatorId?: string;
    userName?: string;
    userEmail?: string;
}

export interface PaginatedWithdrawsResponse {
    data: Withdraw[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface QueryWithdrawParams {
    page?: number;
    limit?: number;
    status?: WithdrawStatuses;
    currency?: CryptoCurrency;
    search?: string;
}


export const createWithdraw = async (
    withdrawData: CreateWithdrawDto
): Promise<{ isSuccess: boolean; withdraw: Withdraw | null; message?: string }> => {
    try {
        const accessToken: string | null = getAuthToken();

        if (!accessToken) {
            console.error("No access token available");
            return {
                isSuccess: false,
                withdraw: null,
                message: "Требуется авторизация"
            };
        }

        const res = await fetch(`${API}/withdraws`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(withdrawData),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`HTTP error! status: ${res.status}`, errorData);

            return {
                isSuccess: false,
                withdraw: null,
                message: errorData.message || `Error ${res.status}: ${res.statusText}`
            };
        }

        const data = await res.json();

        return {
            isSuccess: true,
            withdraw: data
        };
    } catch (error) {
        console.error("Error creating withdraw:", error);
        return {
            isSuccess: false,
            withdraw: null,
            message: "Error"
        };
    }
};

export const getWithdraws = async (
    params: QueryWithdrawParams = {}
): Promise<{ isSuccess: boolean; data: PaginatedWithdrawsResponse | null; message?: string }> => {
    try {
        const accessToken: string | null = getAuthToken();

        if (!accessToken) {
            console.error("No access token available");
            return {
                isSuccess: false,
                data: null,
                message: "Требуется авторизация"
            };
        }

        // Формируем query string
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.status) queryParams.append('status', params.status.toString());
        if (params.currency) queryParams.append('currency', params.currency);
        if (params.search) queryParams.append('search', params.search);

        const url = `${API}/withdraws?${queryParams.toString()}`;

        const res = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`HTTP error! status: ${res.status}`, errorData);

            return {
                isSuccess: false,
                data: null,
                message: errorData.message || `Ошибка ${res.status}`
            };
        }

        const data = await res.json();

        return {
            isSuccess: true,
            data
        };
    } catch (error) {
        console.error("Error fetching withdraws:", error);
        return {
            isSuccess: false,
            data: null,
            message: "Ошибка сети"
        };
    }
};

export const getWithdrawById = async (
    withdrawId: string
): Promise<{ isSuccess: boolean; withdraw: Withdraw | null; message?: string }> => {
    try {
        const accessToken: string | null = getAuthToken();

        if (!accessToken) {
            console.error("No access token available");
            return {
                isSuccess: false,
                withdraw: null,
                message: "Требуется авторизация"
            };
        }

        const res = await fetch(`${API}/withdraws/${withdrawId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`HTTP error! status: ${res.status}`, errorData);

            return {
                isSuccess: false,
                withdraw: null,
                message: errorData.message || `Ошибка ${res.status}`
            };
        }

        const data = await res.json();

        return {
            isSuccess: true,
            withdraw: data
        };
    } catch (error) {
        console.error("Error fetching withdraw:", error);
        return {
            isSuccess: false,
            withdraw: null,
            message: "Ошибка сети"
        };
    }
};

export const deleteWithdraw = async (
    withdrawId: string
): Promise<{ isSuccess: boolean; message?: string }> => {
    try {
        const accessToken: string | null = getAuthToken();

        if (!accessToken) {
            console.error("No access token available");
            return {
                isSuccess: false,
                message: "Требуется авторизация"
            };
        }

        const res = await fetch(`${API}/withdraws/${withdrawId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`HTTP error! status: ${res.status}`, errorData);

            return {
                isSuccess: false,
                message: errorData.message || `Ошибка ${res.status}`
            };
        }

        const data = await res.json();

        return {
            isSuccess: true,
            message: data.message || "Заявка успешно удалена"
        };
    } catch (error) {
        console.error("Error deleting withdraw:", error);
        return {
            isSuccess: false,
            message: "Ошибка сети"
        };
    }
};

export const completeWithdraw = async (
    withdrawId: string,
    transactionHash: string
): Promise<{
    isSuccess: boolean;
    withdraw?: Withdraw;
    message?: string
}> => {
    try {
        const accessToken: string | null = getAuthToken();

        if (!accessToken) {
            console.error("No access token available");
            return {
                isSuccess: false,
                message: ""
            };
        }

        const res = await fetch(`${API}/withdraws/${withdrawId}/complete`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ transactionHash }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`HTTP error! status: ${res.status}`, errorData);

            return {
                isSuccess: false,
                message: errorData.message || `Error ${res.status}: ${res.statusText}`
            };
        }

        const data = await res.json();

        return {
            isSuccess: true,
            withdraw: data
        };
    } catch (error) {
        console.error("Error completing withdraw:", error);
        return {
            isSuccess: false,
            message: ""
        };
    }
};