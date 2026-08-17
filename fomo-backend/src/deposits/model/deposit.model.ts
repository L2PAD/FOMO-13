import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

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

@Schema({
    timestamps: true,
    collection: 'deposits'
})
export class Deposit extends Document {
    @Prop({
        type: SchemaTypes.ObjectId,
        required: true,
        index: true
    })
    userId: string;

    @Prop({
        type: String,
        enum: CryptoCurrency,
        required: true
    })
    currency: CryptoCurrency;

    @Prop({
        type: Number,
        required: true
    })
    amount: number;

    @Prop({
        type: String,
        enum: DepositStatus,
        default: DepositStatus.PENDING
    })
    status: DepositStatus;

    @Prop({
        type: String,
        enum: BlockchainNetwork,
        required: true
    })
    network: BlockchainNetwork;

    @Prop({
        type: String,
        required: true
    })
    walletAddress: string;

    @Prop({
        type: String,
        required: true,
        unique: true
    })
    transactionHash: string;

    @Prop({
        type: Number,
        default: 0
    })
    gasFee: number;

    @Prop({
        type: Number,
        default: 0
    })
    serviceFee: number;

    @Prop({
        type: Number,
        default: 0
    })
    netAmount: number;

    @Prop({
        type: Number,
        default: 0
    })
    confirmations: number;

    @Prop({
        type: Date
    })
    createdAt: Date;

    @Prop({
        type: Date
    })
    updatedAt: Date;
}

export const DepositSchema = SchemaFactory.createForClass(Deposit);

DepositSchema.index({ userId: 1, status: 1 });
DepositSchema.index({ userId: 1, createdAt: -1 });
DepositSchema.index({ userId: 1, status: 1, createdAt: -1 });
DepositSchema.index({ transactionHash: 1 }, { unique: true });
DepositSchema.index({ createdAt: -1 });

DepositSchema.pre('save', function (next) {
    if (this.isModified('amount') || this.isModified('serviceFee')) {
        this.netAmount = this.amount - this.serviceFee;
    }
    next();
});
