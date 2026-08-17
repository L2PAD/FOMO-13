import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"

export enum DepositStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    FAILED = 'failed',
}

export enum CryptoCurrency {
    ETH = 'ETH',
    USDC = 'USDC',
}

export enum BlockchainNetwork {
    ZKSYNC = 'ZKSYNC',
}

export interface Deposit {
    _id: string;
    userId: string;
    currency: CryptoCurrency;
    amount: number;
    status: DepositStatus;
    network: BlockchainNetwork;
    walletAddress: string;
    transactionHash: string;
    gasFee: number;
    serviceFee: number;
    netAmount: number;
    confirmations: number;
    createdAt: string;
    updatedAt: string;
}

export interface DepositsResponse {
    data: Deposit[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface QueryDepositParams {
    page?: number;
    limit?: number;
    status?: DepositStatus;
    currency?: CryptoCurrency;
    network?: BlockchainNetwork;
    userId?: string;
    walletAddress?: string;
    transactionHash?: string;
    startDate?: string;
    endDate?: string;  
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export default async (params: QueryDepositParams): Promise<IReturnData> => {
    try {
        const token: string = getAccessToken()

        if (!token) {
            throw new Error('Not authorized')
        }

        const queryParams = new URLSearchParams()

        if (params.page !== undefined) queryParams.append('page', params.page.toString())
        if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())

        if (params.status) queryParams.append('status', params.status)
        if (params.currency) queryParams.append('currency', params.currency)
        if (params.network) queryParams.append('network', params.network)
        if (params.userId) queryParams.append('userId', params.userId)
        if (params.walletAddress) queryParams.append('walletAddress', params.walletAddress)
        if (params.transactionHash) queryParams.append('transactionHash', params.transactionHash)
        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        if (params.minAmount !== undefined) queryParams.append('minAmount', params.minAmount.toString())
        if (params.maxAmount !== undefined) queryParams.append('maxAmount', params.maxAmount.toString())
        if (params.search) queryParams.append('search', params.search)
        if (params.sortBy) queryParams.append('sortBy', params.sortBy)
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

        const response = await fetch(configureUrl(`deposits${queryString}`), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        return {
            success: true,
            data,
        }

    } catch (error) {
        console.error('Deposits fetch error:', error)
        return {
            success: false,
            data: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}