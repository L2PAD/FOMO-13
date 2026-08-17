import { DepositStatus, CryptoCurrency, BlockchainNetwork } from "../model/deposit.model";

export class CreateDepositDto {
    currency: CryptoCurrency;
    amount: number;
    network: BlockchainNetwork;
    walletAddress: string;
    transactionHash: string;
    fromAddress?: string;
    gasFee?: number = 0;
    serviceFee?: number = 0;
    smartContractAddress?: string;
    contractMethod?: string;
    rawTransaction?: any;
    isInternal?: boolean = false;
    metadata?: Record<string, any>;
}

export class UpdateDepositDto {
    status?: DepositStatus;
    blockNumber?: number;
    confirmations?: number;
    serviceFee?: number;
    gasFee?: number;
    receipt?: any;
    contractLogs?: string[];
    failedReason?: string;
    metadata?: Record<string, any>;
}

export class QueryDepositDto {
    status?: DepositStatus;
    currency?: CryptoCurrency;
    network?: BlockchainNetwork;
    userId?: string;
    walletAddress?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    page?: number = 1;
    limit?: number = 10;
    sortBy?: string = 'createdAt';
    sortOrder?: string = 'desc';
}

export class WebhookDepositDto {
    event: 'deposit_received' | 'deposit_confirmed' | 'deposit_failed';
    data: {
        transactionHash: string;
        walletAddress: string;
        amount: string;
        currency: CryptoCurrency;
        network: BlockchainNetwork;
        blockNumber?: number;
        confirmations?: number;
        fromAddress?: string;
        rawData?: any;
    };
    signature?: string;
}

export class BlockchainScanDto {
    network: BlockchainNetwork;
    walletAddress: string;
    startBlock?: number;
    endBlock?: number;
}

// Интерфейсы ответов
export interface DepositResponse {
    id: string;
    userId: string;
    currency: CryptoCurrency;
    amount: number;
    netAmount: number;
    serviceFee: number;
    gasFee: number;
    status: DepositStatus;
    network: BlockchainNetwork;
    walletAddress: string;
    transactionHash: string;
    blockNumber?: number;
    confirmations: number;
    fromAddress?: string;
    smartContractAddress?: string;
    isInternal: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DepositStatsResponse {
    totalDeposits: number;
    totalAmount: number;
    totalNetAmount: number;
    totalServiceFee: number;
    totalGasFee: number;
    byCurrency: Array<{
        currency: CryptoCurrency;
        count: number;
        totalAmount: number;
    }>;
    byNetwork: Array<{
        network: BlockchainNetwork;
        count: number;
        totalAmount: number;
    }>;
    byStatus: Array<{
        status: DepositStatus;
        count: number;
        totalAmount: number;
    }>;
}