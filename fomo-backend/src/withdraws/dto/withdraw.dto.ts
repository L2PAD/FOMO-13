import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { WithdrawStatuses } from '../model/withdraw.model';

export enum Currency {
    ETH = 'ETH',
    USDC = 'USDC'
}

export class CreateWithdrawDto {
    currency: Currency;
    amount: number;
    userWallet: string;
    network: string;
    type: string;
    fee: number
}


export class QueryWithdrawDto {

    page?: number = 1;


    limit?: number = 10;


    status?: WithdrawStatuses;

    currency?: string;

    userId?: string;

    search?: string;
}