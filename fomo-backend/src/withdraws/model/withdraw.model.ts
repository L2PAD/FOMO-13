import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export enum WithdrawStatuses {
    'PENDING',
    'COMPLETED',
    'REJECTED',
    'CANCELED',
    'DELETED',
    'APPROVED'
}

export type WithdrawDocument = HydratedDocument<Withdraw>;

@Schema({ timestamps: true })
export class Withdraw {
    @Prop({ required: true })
    userId: mongoose.Types.ObjectId

    @Prop({
        type: String,
        enum: WithdrawStatuses,
        default: WithdrawStatuses.PENDING
    })
    status: WithdrawStatuses;

    @Prop()
    type: string

    @Prop({
        type: String,
    })
    transactionHash: string;

    @Prop()
    network: string

    @Prop()
    userWallet: string

    @Prop()
    amount: number

    @Prop({ default: 0 })
    fee: number

    @Prop()
    totalSend: number

    @Prop()
    confirmationDate: Date

    @Prop()
    moderatorId: mongoose.Types.ObjectId

    @Prop()
    reason: string

    @Prop()
    currency: 'ETH' | 'USDC'

    // Phase H: flags a withdrawal that has reserved funds in the FOMO Money ledger.
    @Prop({ default: false })
    moneyReserved: boolean

    // Phase H (H26/H27): explicit money-withdrawal state machine + executor bookkeeping.
    // Legacy numeric `status` above is intentionally left untouched.
    @Prop()
    walletAddress: string

    @Prop()
    moneyStatus: string // REQUESTED|RESERVED|PROCESSING|ONCHAIN_PENDING|CONFIRMED|FAILED|RELEASED

    @Prop({ default: false })
    executionLock: boolean

    @Prop()
    executionStartedAt: Date

    @Prop()
    lastExecutorError: string

    @Prop()
    lastExecutorAt: Date

    @Prop()
    expireDate: Date
}

export const WithdrawSchema = SchemaFactory.createForClass(Withdraw);

WithdrawSchema.index({ userId: 1, createdAt: -1 });
WithdrawSchema.index({ userId: 1, status: 1, createdAt: -1 });
