import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Withdraw, WithdrawDocument, WithdrawStatuses } from './model/withdraw.model';
import { CreateWithdrawDto, QueryWithdrawDto } from './dto/withdraw.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class WithdrawsService {
    private readonly logger = new Logger(WithdrawsService.name)
    // timeExpire: number = 24 * 60 * 60 * 1000
    timeExpire: number = 5 * 60 * 1000

    constructor(
        @InjectModel(Withdraw.name) private withdrawModel: Model<WithdrawDocument>,
    ) {
        // this.deleteWithdraws()
    }

    async deleteWithdraws() {
        await this.withdrawModel.deleteMany({})
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async cancelExpiredWithdraws(): Promise<void> {
        this.logger.log('Checking for expired withdraw requests...');

        try {
            const now = new Date();
            const result = await this.withdrawModel.updateMany(
                {
                    status: WithdrawStatuses.PENDING,
                    expireDate: { $lt: now }
                },
                {
                    $set: {
                        status: WithdrawStatuses.CANCELED,
                        reason: 'Your withdrawal request was automatically cancelled because the review time expired.',
                    },
                },
            );

            if (result.modifiedCount > 0) {
                this.logger.log(`Cancelled ${result.modifiedCount} expired withdraw requests`);
            }
        } catch (error) {
            this.logger.error('Error cancelling expired withdraws:', error);
        }
    }

    async createWithdraw(createWithdrawDto: CreateWithdrawDto, userId: string): Promise<Withdraw> {
        if (createWithdrawDto.amount < 0.00001) {
            throw new BadRequestException('Minimum withdraw amount is 0.00001');
        }

        const totalSend = createWithdrawDto.amount;

        if (totalSend <= 0) {
            throw new BadRequestException('Amount must be greater than fee');
        }

        const withdrawData = {
            ...createWithdrawDto,
            userId: new Types.ObjectId(userId),
            status: WithdrawStatuses.PENDING,
            totalSend,
            transactionHash: '',
            expireDate: new Date(Date.now() + this.timeExpire),
        };

        const createdWithdraw = new this.withdrawModel(withdrawData);
        return createdWithdraw.save();
    }

    async findAll(query: QueryWithdrawDto): Promise<{
        data: WithdrawDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { status, currency, search } = query;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const pipeline: any[] = [];

        const matchStage: any = {};

        if (status !== undefined) {
            matchStage.status = status;
        }

        if (currency) {
            matchStage.currency = currency;
        }

        if (search) {
            matchStage.$or = [
                { transactionHash: { $regex: search, $options: 'i' } },
                { userWallet: { $regex: search, $options: 'i' } },
                { network: { $regex: search, $options: 'i' } },
            ];
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push(
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'moderatorId',
                    foreignField: '_id',
                    as: 'moderator',
                },
            },
            {
                $unwind: {
                    path: '$moderator',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    userId: 1,
                    status: 1,
                    type: 1,
                    transactionHash: 1,
                    network: 1,
                    userWallet: 1,
                    amount: 1,
                    fee: 1,
                    totalSend: 1,
                    confirmationDate: 1,
                    moderatorId: 1,
                    reason: 1,
                    currency: 1,
                    expireDate: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    userName: { $ifNull: ['$user.username', 'Unknown'] },
                    userEmail: { $ifNull: ['$user.email', 'Unknown'] },
                    twitterData: { $ifNull: ['$user.twitterData', 'Unknown'] },
                    discordData: { $ifNull: ['$user.discordData', 'Unknown'] },
                    fomoId: { $ifNull: ['$user.fomoId', 'Unknown'] },
                    moderatorName: { $ifNull: ['$moderator.username', null] },
                },
            },
            {
                $sort: { createdAt: -1 },
            },
        );

        const dataPipeline = [...pipeline];
        dataPipeline.push({ $skip: skip }, { $limit: limit });

        const countPipeline = [...pipeline];
        countPipeline.push({ $count: 'total' });

        const [data, countResult] = await Promise.all([
            this.withdrawModel.aggregate(dataPipeline),
            this.withdrawModel.aggregate(countPipeline),
        ]);

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
        };
    }

    async findOne(id: string, userRole: string, userId?: string): Promise<WithdrawDocument> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid ID format');
        }

        const withdraw = await this.withdrawModel.findById(id);

        if (!withdraw || Number(withdraw.status) === WithdrawStatuses.DELETED) {
            throw new NotFoundException('Withdraw not found');
        }

        if (userRole === 'user' && withdraw.userId.toString() !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return withdraw;
    }

    async remove(id: string, userId: string): Promise<{ message: string }> {
        const withdraw = await this.withdrawModel.findById(id);

        if (!withdraw) {
            throw new NotFoundException('Withdraw not found');
        }

        if (withdraw.userId.toString() !== userId) {
            throw new ForbiddenException('You can only delete your own withdraw requests');
        }

        if (Number(withdraw.status) !== WithdrawStatuses.PENDING) {
            throw new BadRequestException('Can only delete pending withdraw requests');
        }

        await this.withdrawModel.findByIdAndUpdate(id, { status: WithdrawStatuses.DELETED });

        return { message: 'Withdraw request deleted successfully' };
    }

    async completeWithdraw(
        id: string,
        userId: string,
        transactionHash: string
    ): Promise<Withdraw> {
        const withdraw = await this.withdrawModel.findById(id);

        if (!withdraw) {
            throw new NotFoundException('Withdraw not found');
        }

        if (withdraw.userId.toString() !== userId) {
            throw new ForbiddenException('You can only complete your own withdraw requests');
        }

        if (Number(withdraw.status) !== WithdrawStatuses.APPROVED) {
            throw new BadRequestException('Can only complete approved withdraw requests');
        }

        const updatedWithdraw = await this.withdrawModel.findByIdAndUpdate(
            id,
            {
                status: WithdrawStatuses.COMPLETED,
                transactionHash,
            },
            { new: true }
        );

        if (!updatedWithdraw) {
            throw new Error('Failed to update withdraw');
        }

        return updatedWithdraw;
    }
    async approveWithdraw(id: string, moderatorId: string): Promise<WithdrawDocument> {
        const withdraw = await this.withdrawModel.findById(id);

        if (!withdraw) {
            throw new NotFoundException('Withdraw not found');
        }

        if (Number(withdraw.status) !== WithdrawStatuses.PENDING) {
            throw new BadRequestException('Only pending withdraws can be approved');
        }

        if (withdraw.expireDate && withdraw.expireDate < new Date()) {
            await this.withdrawModel.findByIdAndUpdate(id, {
                status: WithdrawStatuses.CANCELED,
                reason: 'Your withdrawal request was automatically cancelled because the review time expired.',
            });
            throw new BadRequestException('Withdraw request has expired and was cancelled');
        }

        return this.withdrawModel.findByIdAndUpdate(
            id,
            {
                status: WithdrawStatuses.APPROVED,
                moderatorId: new Types.ObjectId(moderatorId),
                confirmationDate: new Date(),
            },
            { new: true },
        );
    }

    async rejectWithdraw(id: string, moderatorId: string, reason: string): Promise<WithdrawDocument> {
        const withdraw = await this.withdrawModel.findById(id);

        if (!withdraw) {
            throw new NotFoundException('Withdraw not found');
        }

        if (Number(withdraw.status) !== WithdrawStatuses.PENDING) {
            throw new BadRequestException('Only pending withdraws can be rejected');
        }

        return this.withdrawModel.findByIdAndUpdate(
            id,
            {
                status: WithdrawStatuses.REJECTED,
                moderatorId: new Types.ObjectId(moderatorId),
                reason,
            },
            { new: true },
        );
    }

    async getStatistics(): Promise<{
        total: number;
        pending: number;
        completed: number;
        rejected: number;
        totalAmount: number;
    }> {
        const stats = await this.withdrawModel.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    pending: {
                        $sum: {
                            $cond: [{ $eq: ['$status', WithdrawStatuses.PENDING] }, 1, 0],
                        },
                    },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', WithdrawStatuses.COMPLETED] }, 1, 0],
                        },
                    },
                    rejected: {
                        $sum: {
                            $cond: [{ $eq: ['$status', WithdrawStatuses.REJECTED] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        return stats[0] || {
            total: 0,
            pending: 0,
            completed: 0,
            rejected: 0,
            totalAmount: 0,
        };
    }
}