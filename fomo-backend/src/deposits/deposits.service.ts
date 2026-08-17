import {
    Injectable,
    BadRequestException,
    ConflictException,
    Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    Deposit,
    DepositStatus,
    CryptoCurrency,
    BlockchainNetwork
} from './model/deposit.model';
import { CreateDepositDto, QueryDepositDto } from './dto/deposit.dto';

@Injectable()
export class DepositsService {
    private readonly logger = new Logger(DepositsService.name);

    constructor(
        @InjectModel(Deposit.name) private depositModel: Model<Deposit>,
    ) { }

    async findAll(query: QueryDepositDto): Promise<{
        data: Deposit[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }> {
        const {
            status,
            currency,
            network,
            userId,
            walletAddress,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        const filter: any = {};
        if (status) filter.status = status;
        if (currency) filter.currency = currency;
        if (network) filter.network = network;
        if (userId) filter.userId = userId;
        if (walletAddress) filter.walletAddress = walletAddress;

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (minAmount !== undefined || maxAmount !== undefined) {
            filter.amount = {};
            if (minAmount !== undefined) filter.amount.$gte = minAmount;
            if (maxAmount !== undefined) filter.amount.$lte = maxAmount;
        }

        const skip = (page - 1) * limit;
        const sortOptions: any = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [data, total] = await Promise.all([
            this.depositModel
                .find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.depositModel.countDocuments(filter).exec(),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    async createDepositFromBlockchain(
        createDepositDto: CreateDepositDto,
        userId: string
    ): Promise<Deposit> {
        try {
            this.validateDepositData(createDepositDto);

            const existingDeposit = await this.depositModel.findOne({
                transactionHash: createDepositDto.transactionHash
            });

            if (existingDeposit) {
                throw new ConflictException('Transaction hash already exists');
            }

            const minAmount = this.getMinimumAmount(createDepositDto.currency);
            if (createDepositDto.amount < minAmount) {
                throw new BadRequestException(
                    `Minimum deposit amount for ${createDepositDto.currency} is ${minAmount}`
                );
            }

            const feePolicy = await this.resolveDepositFeePolicy();
            const serviceFee = this.computeDepositFee(createDepositDto.amount, feePolicy);
            const netAmount = parseFloat((createDepositDto.amount - serviceFee).toFixed(6));

            const depositData = {
                userId,
                currency: createDepositDto.currency,
                amount: createDepositDto.amount,
                network: createDepositDto.network,
                walletAddress: createDepositDto.walletAddress,
                transactionHash: createDepositDto.transactionHash,
                gasFee: createDepositDto.gasFee || 0,
                serviceFee: serviceFee,
                netAmount: netAmount,
                status: DepositStatus.CONFIRMED,
                confirmations: 0,
                fromAddress: createDepositDto.fromAddress || createDepositDto.walletAddress,
                metadata: {
                    ...(createDepositDto.metadata || {}),
                    grossAmount: createDepositDto.amount,
                    feeAmount: serviceFee,
                    netAmount: netAmount,
                    feePolicySnapshot: feePolicy,
                },
            };

            const deposit = new this.depositModel(depositData);
            const savedDeposit = await deposit.save();

            this.logger.log(`Deposit created successfully: ${savedDeposit._id}`);
            this.logger.log(`User: ${userId}, Amount: ${savedDeposit.amount} ${savedDeposit.currency}`);
            this.logger.log(`Transaction Hash: ${savedDeposit.transactionHash}`);


            return savedDeposit;

        } catch (error) {
            this.logger.error(`Failed to create deposit: ${error.message}`, error.stack);
            throw error;
        }
    }

    private validateDepositData(dto: CreateDepositDto): void {
        if (!Object.values(CryptoCurrency).includes(dto.currency)) {
            throw new BadRequestException(`Invalid currency: ${dto.currency}`);
        }

        if (!Object.values(BlockchainNetwork).includes(dto.network)) {
            throw new BadRequestException(`Invalid network: ${dto.network}`);
        }

        if (dto.amount <= 0) {
            throw new BadRequestException('Amount must be greater than 0');
        }

        if (!dto.walletAddress || dto.walletAddress.trim().length === 0) {
            throw new BadRequestException('Wallet address is required');
        }

        if (!dto.transactionHash || dto.transactionHash.trim().length === 0) {
            throw new BadRequestException('Transaction hash is required');
        }
    }

    private getMinimumAmount(currency: CryptoCurrency): number {
        const minAmounts = {
            [CryptoCurrency.ETH]: 0.00005,
            [CryptoCurrency.USDC]: 0.1,
        };

        return minAmounts[currency] || 0.00005;
    }

    /**
     * Deposit fee policy for the general FOMO Balance rail. Read from the money
     * network config (CRM-managed, versioned). DEFAULT = NONE (0) so a deposit
     * credits 1:1. This is intentionally DECOUPLED from any legacy OTC trading
     * fee and from product purchase fees (H4/P0).
     */
    private async resolveDepositFeePolicy(): Promise<{ mode: string; value: number }> {
        try {
            const networkId = process.env.MONEY_ACTIVE_NETWORK || 'ZKSYNC_USDC';
            const doc: any = await this.depositModel.db
                .collection('money_network_configs')
                .findOne({ networkId });
            const mode = String(doc?.depositFeeMode || 'NONE').toUpperCase();
            const value = Number(doc?.depositFeeValue ?? 0) || 0;
            if (mode === 'PERCENT' || mode === 'FIXED') return { mode, value };
            return { mode: 'NONE', value: 0 };
        } catch {
            return { mode: 'NONE', value: 0 };
        }
    }

    /** Compute the deposit fee from an explicit policy. Never exceeds the amount. */
    private computeDepositFee(amount: number, policy: { mode: string; value: number }): number {
        let fee = 0;
        if (policy.mode === 'PERCENT') fee = amount * (policy.value / 100);
        else if (policy.mode === 'FIXED') fee = policy.value;
        fee = Math.max(0, Math.min(fee, amount));
        return parseFloat(fee.toFixed(6));
    }
}
