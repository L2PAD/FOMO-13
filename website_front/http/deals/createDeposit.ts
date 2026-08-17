import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export enum CryptoCurrency {
    ETH = 'ETH',
    USDC = 'USDC',
}

export enum BlockchainNetwork {
    ZKSYNC = 'ZKSYNC',
}

export interface CreateDepositDto {
    currency: CryptoCurrency;
    amount: number;
    network: BlockchainNetwork;
    walletAddress: string;
    transactionHash: string;
    fromAddress?: string;
    gasFee?: number;
    serviceFee?: number;
    smartContractAddress?: string;
    contractMethod?: string;
    rawTransaction?: any;
    isInternal?: boolean;
    metadata?: Record<string, any>;
}

export interface Deposit {
    _id: string;
    userId: string;
    currency: CryptoCurrency;
    amount: number;
    status: 'pending' | 'confirmed' | 'completed' | 'failed';
    network: BlockchainNetwork;
    walletAddress: string;
    transactionHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateDepositResponse {
    isSuccess: boolean;
    deposit: Deposit | null;
    errorMessage?: string;
}

export default async (
    depositData: CreateDepositDto
): Promise<CreateDepositResponse> => {
    try {
        const accessToken: string | null = getAuthToken();

        if (!accessToken) {
            console.error("No access token available");
            return {
                isSuccess: false,
                deposit: null,
                errorMessage: "No access token available",
            };
        }

        const res = await fetch(`${API}/deposits`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(depositData),
        });

        if (!res.ok) {
            let errorMessage = `HTTP error! status: ${res.status}`;

            try {
                const errorData = await res.json();
                if (Array.isArray(errorData?.message)) {
                    errorMessage = errorData.message.join(", ");
                } else if (typeof errorData?.message === "string") {
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                console.error("Failed to parse createDeposit error response:", parseError);
            }

            console.error(errorMessage);
            return { isSuccess: false, deposit: null, errorMessage };
        }

        const data = await res.json();

        return {
            isSuccess: res.status < 300,
            deposit: data
        };
    } catch (error) {
        console.error("Error creating deposit:", error);
        return {
            isSuccess: false,
            deposit: null,
            errorMessage: error instanceof Error ? error.message : "Failed to create deposit",
        };
    }
};
