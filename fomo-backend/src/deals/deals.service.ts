import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import mongoose, { Model, PipelineStage } from 'mongoose';
import { Deal, DealAction, DealDocument, DealSection, DealStatus, DealType } from './model/deal.model';
import { Appeal, AppealDocument } from './model/appeal.model';
import { PaymentMethod, PaymentMethodDocument } from './model/payment-method.model';
import { User, UserDocument } from 'src/user/user.model';
import { Chat, ChatDocument } from 'src/chat/models/chat.model';
import { Message, MessageDocument } from 'src/message/models/message.model';
import { MessageService } from 'src/message/message.service';
import { InjectModel } from '@nestjs/mongoose';
import { CreateDealDto } from './dto/create-deal.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ResolveAppealDto } from './dto/resolve-appeal.dto';
import { OtcMember, OtcMemberDocument } from './model/otcMember';
import { Review, ReviewDocument } from './model/review.model';
import { ActivityService } from 'src/activity/activity.service';
import { FilesService } from 'src/files/files.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { Portfolio, PortfolioDocument } from 'src/portfolio/model/portfolio.model';
import { CollectionNft, CollectionNftDocument } from 'src/collection-nft/model/collection-nft.model';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FomoV2MarketProjectReadModel } from 'src/fomo-v2/models';
import { FomoV2MarketProjectReadModelService } from 'src/fomo-v2/domains/market/services';
import { UserActionLogsService } from 'src/user-action-logs/user-action-logs.service';

interface MembersFilters {
    completedDealsMin?: number;
    completedDealsMax?: number;
    salesMin?: number;
    salesMax?: number;
    purchasesMin?: number;
    purchasesMax?: number;
    userStatus?: Array<string>;
    risk?: Array<string>
    sortField?: string
    searchValue?: string
    memberId?: string
}

type DealLogSource = Partial<Deal> & {
    _id?: string | mongoose.Types.ObjectId;
};

export interface BazaarActivityResponse {
    rating: {
        percent: number;
        likes: number;
        dislikes: number;
        totalReviews: number;
    };
    sells: number;
    buys: number;
    profit: {
        usd: number;
        completedSellUsd: number;
        completedBuyUsd: number;
        excludedNonUsdDeals: number;
        formula: 'completed_usd_sells_minus_completed_usd_buys';
    };
    deals: {
        total: number;
        completed: number;
        active: number;
        cancelled: number;
    };
    sections: {
        otc: number;
        p2p: number;
    };
}

const escapeRegExp = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class DealsService {
    PROMOTE_INTERVAL_MS = 5 * 60 * 1000
    private readonly FIAT_RATES_CACHE_TTL_MS = 30 * 60 * 1000;
    private fiatUsdRatesCache: {
        expiresAt: number;
        rates: Record<string, number>;
    } | null = null;

    constructor(
        @InjectModel(Deal.name) private dealModel: Model<DealDocument>,
        @InjectModel(Appeal.name) private appealModel: Model<AppealDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(OtcMember.name) private memberModel: Model<OtcMemberDocument>,
        @InjectModel(Review.name) private reviwModel: Model<ReviewDocument>,
        @InjectModel(PaymentMethod.name) private paymentMethodModel: Model<PaymentMethodDocument>,
        @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
        @InjectModel(CollectionNft.name) private collectionNftModel: Model<CollectionNftDocument>,
        @InjectModel(FomoV2MarketProjectReadModel.name)
        private marketReadModel: Model<FomoV2MarketProjectReadModel>,
        private readonly activityService: ActivityService,
        private readonly filesService: FilesService,
        private readonly messagesService: MessageService,
        private readonly chatGateway: ChatGateway,
        private readonly marketProjectReadModelService: FomoV2MarketProjectReadModelService,
        private readonly httpService: HttpService,
        private readonly userActionLogsService: UserActionLogsService
    ) {
        // this.removeAllDeals()
    }

    private getDealParticipantIds(deal: DealLogSource | null | undefined): Array<string | mongoose.Types.ObjectId> {
        if (!deal) return [];

        return [deal.creator, deal.buyer, deal.seller]
            .filter(Boolean)
            .map((id) => id as string | mongoose.Types.ObjectId);
    }

    private async logDealAction(
        deal: DealLogSource | null | undefined,
        input: {
            actorId?: string | mongoose.Types.ObjectId;
            actorType?: 'user' | 'admin' | 'moderator' | 'system';
            action: string;
            title: string;
            severity?: 'info' | 'warning' | 'critical';
            metadata?: Record<string, unknown>;
        }
    ): Promise<void> {
        if (!deal?._id) return;

        const section = deal.section || 'otc';

        await this.userActionLogsService.logForUsers(
            this.getDealParticipantIds(deal),
            {
                actorId: input.actorId,
                actorType: input.actorType || 'user',
                category: section === 'p2p' ? 'p2p' : 'otc',
                action: input.action,
                title: input.title,
                severity: input.severity,
                entityType: 'deal',
                entityId: deal._id as mongoose.Types.ObjectId,
                metadata: {
                    section,
                    status: deal.status,
                    type: deal.type,
                    name: deal.name,
                    dealId: deal.dealId,
                    orderNumber: deal.orderNumber,
                    price: deal.price,
                    amount: deal.amount,
                    ticker: deal.ticker,
                    currency: deal.currency,
                    ...input.metadata,
                },
            }
        );
    }

    private async removeAllDeals(): Promise<void> {
        await this.dealModel.deleteMany({})
        await this.memberModel.deleteMany({})
        await this.reviwModel.deleteMany({})
    }

    async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
        const userIdMatches = this.buildUserIdMatchValues(userId);
        return this.paymentMethodModel
            .find({ userId: { $in: userIdMatches } })
            .sort({ createdAt: -1 })
            .exec();
    }

    async getDealById(dealId: string, userId?: string): Promise<DealDocument> {
        if (!mongoose.Types.ObjectId.isValid(dealId)) {
            throw new NotFoundException('Deal not found');
        }

        await this.dealModel.updateOne(
            {
                _id: new mongoose.Types.ObjectId(dealId),
                section: 'p2p',
                isReservedFunds: true,
                isMakePayment: false,
                isReturnFunds: { $ne: true },
                p2pSaleTimeEnd: { $lte: new Date() },
            },
            {
                $set: {
                    isReturnFunds: true,
                    lastStatusUpdate: new Date(),
                },
            }
        );

        const pipeline = this.buildDealPipeline(
            'all',
            1,
            0,
            {
                dealId,
                userId
            },
            false
        );

        const result = await this.dealModel.aggregate(pipeline);
        const deal = result?.[0]?.deals?.[0];

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        return deal;
    }

    async getDealByIdForStaff(dealId: string): Promise<DealDocument> {
        if (!mongoose.Types.ObjectId.isValid(dealId)) {
            throw new NotFoundException('Deal not found');
        }

        const pipeline = this.buildDealPipeline(
            'all',
            1,
            0,
            {
                dealId
            },
            false
        );

        const result = await this.dealModel.aggregate(pipeline);
        const deal = result?.[0]?.deals?.[0];

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        return deal;
    }

    async getDealsStatuses(ids: string[]): Promise<{
        deals: Array<{
            _id: string;
            status: DealStatus;
            isAppeal?: boolean;
            isReservedFunds?: boolean;
            isMakePayment?: boolean;
            isCompleteByAdmin?: boolean;
            lastStatusUpdate?: Date;
        }>
    }> {
        if (!Array.isArray(ids) || ids.length === 0) {
            return { deals: [] };
        }

        const objectIds = Array.from(new Set(ids))
            .filter((id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))
            .slice(0, 50)
            .map((id) => new mongoose.Types.ObjectId(id));

        if (objectIds.length === 0) {
            return { deals: [] };
        }

        const deals = await this.dealModel.find(
            { _id: { $in: objectIds } },
            {
                _id: 1,
                status: 1,
                isAppeal: 1,
                isReservedFunds: 1,
                isMakePayment: 1,
                isCompleteByAdmin: 1,
                lastStatusUpdate: 1,
            }
        ).lean();

        return {
            deals: deals.map((deal) => ({
                _id: String(deal._id),
                status: deal.status,
                isAppeal: deal.isAppeal,
                isReservedFunds: deal.isReservedFunds,
                isMakePayment: deal.isMakePayment,
                isCompleteByAdmin: deal.isCompleteByAdmin,
                lastStatusUpdate: deal.lastStatusUpdate,
            })),
        };
    }

    async getMemberById(memberId: string): Promise<any> {
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            throw new NotFoundException('Member not found');
        }

        const { members } = await this.getAllMembers(
            1,
            0,
            { memberId },
            'all'
        );

        const member = members?.[0];

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        return member;
    }

    async createPaymentMethod(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
        if (dto.cardLast4 && !/^\d{4}$/.test(dto.cardLast4)) {
            throw new HttpException('Invalid cardLast4', HttpStatus.BAD_REQUEST);
        }

        if (dto.cardNumber && !/^\d{12,19}$/.test(dto.cardNumber.replace(/\s+/g, ''))) {
            throw new HttpException('Invalid card number', HttpStatus.BAD_REQUEST);
        }

        if (dto.meta?.iban && typeof dto.meta.iban === 'string') {
            const iban = dto.meta.iban.replace(/\s+/g, '').toUpperCase();
            if (iban.length < 15 || iban.length > 34) {
                throw new HttpException('Invalid IBAN', HttpStatus.BAD_REQUEST);
            }
            dto.meta.iban = iban;
        }

        const userIdMatches = this.buildUserIdMatchValues(userId);

        if (dto?.isDefault) {
            await this.paymentMethodModel.updateMany(
                { userId: { $in: userIdMatches } },
                { $set: { isDefault: false } }
            );
        }

        const method = new this.paymentMethodModel({
            ...dto,
            userId: this.normalizeUserId(userId),
        });

        const saved = await method.save();

        await this.userActionLogsService.log({
            userId,
            actorId: userId,
            actorType: 'user',
            category: 'p2p',
            action: 'p2p.payment_method_created',
            title: 'Payment method created',
            entityType: 'payment_method',
            entityId: saved._id,
            metadata: {
                type: saved.type,
                bankName: saved.bankName,
                cardLast4: saved.cardLast4,
                isDefault: saved.isDefault,
            },
        });

        return saved;
    }

    async deletePaymentMethod(userId: string, methodId: string): Promise<{ isSuccess: boolean }> {
        const userIdMatches = this.buildUserIdMatchValues(userId);

        const deleted = await this.paymentMethodModel.findOneAndDelete({
            _id: methodId,
            userId: { $in: userIdMatches },
        });

        if (!deleted) {
            throw new NotFoundException('Payment method not found');
        }

        await this.userActionLogsService.log({
            userId,
            actorId: userId,
            actorType: 'user',
            category: 'p2p',
            action: 'p2p.payment_method_deleted',
            title: 'Payment method deleted',
            entityType: 'payment_method',
            entityId: deleted._id,
            metadata: {
                type: deleted.type,
                bankName: deleted.bankName,
                cardLast4: deleted.cardLast4,
            },
        });

        return { isSuccess: true };
    }

    private normalizeUserId(userId: string): mongoose.Types.ObjectId | string {
        return mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;
    }

    private buildUserIdMatchValues(userId: string): Array<string | mongoose.Types.ObjectId> {
        const matches: Array<string | mongoose.Types.ObjectId> = [userId];
        if (mongoose.Types.ObjectId.isValid(userId)) {
            matches.push(new mongoose.Types.ObjectId(userId));
        }
        return matches;
    }

    private generateOrderNumber(): number {
        return Math.floor(100000 + Math.random() * 900000);
    }

    private calculateP2PSaleEndTime(p2pSaleTime?: string): Date | null {
        if (!p2pSaleTime) {
            return null;
        }

        const parts = p2pSaleTime.split(':').map((part) => part.trim());
        const hours = parts.length > 1 ? Number(parts[0] || 0) : 0;
        const minutes = Number(parts.length > 1 ? parts[1] || 0 : parts[0] || 0);

        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
            return null;
        }

        const durationMinutes = hours * 60 + minutes;
        if (durationMinutes <= 0) {
            return null;
        }

        return new Date(Date.now() + durationMinutes * 60 * 1000);
    }

    private ensureP2PSaleTimeActive(deal: DealDocument): void {
        if (deal.section !== 'p2p') {
            return;
        }

        const saleTimeEnd = deal.p2pSaleTimeEnd ? new Date(deal.p2pSaleTimeEnd) : null;
        if (saleTimeEnd && saleTimeEnd.getTime() <= Date.now()) {
            throw new HttpException('P2P sale time expired', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get or create a chat between two users and link it to a deal
     */
    private async getOrCreateDealChat(
        buyerId: mongoose.Types.ObjectId,
        sellerId: mongoose.Types.ObjectId,
        dealId: mongoose.Types.ObjectId
    ): Promise<ChatDocument> {
        const participants = [String(buyerId), String(sellerId)].sort();
        const participantsHash = participants.join('_');

        let chat = await this.chatModel.findOne({ participantsHash }).exec();

        if (!chat) {
            chat = new this.chatModel({
                participants: participants.map(id => new mongoose.Types.ObjectId(id)),
                owner: buyerId,
                created: new Date(),
                participantsHash
            });
            await chat.save();
        }

        // Link chat to deal if not already linked
        await this.dealModel.updateOne(
            { _id: dealId, chatId: { $exists: false } },
            { $set: { chatId: chat._id } }
        );

        return chat;
    }

    /**
     * Send a system message to the deal chat
     */
    private async sendDealSystemMessage(
        dealId: mongoose.Types.ObjectId,
        chatId: mongoose.Types.ObjectId,
        systemType: 'funds_reserved' | 'payment_marked' | 'appeal_created' | 'deal_completed',
        fromUserId: mongoose.Types.ObjectId,
        toUserId: mongoose.Types.ObjectId
    ): Promise<void> {
        const systemMessages = {
            funds_reserved: 'Buyer has reserved funds for this deal. Payment window is now active.',
            payment_marked: 'Buyer has marked the payment as sent. Please verify and release the funds.',
            appeal_created: 'An appeal has been created for this deal. Our support team will review it shortly.',
            deal_completed: 'The deal has been completed successfully. Thank you for using our platform!'
        };

        const message = new this.messageModel({
            date: new Date(),
            from: fromUserId,
            to: toUserId,
            message: systemMessages[systemType],
            isNew: true,
            isSystem: true,
            systemType,
            chatId,
            dealId,
            attachments: []
        });

        const savedMessage = await message.save();

        if (this.chatGateway?.server) {
            try {
                const enrichedMessage = await this.messagesService.getMessageById(String(savedMessage._id));
                // Keep chat participants in sync with system events
                this.chatGateway.server
                    .to(String(chatId))
                    .emit('receiveMessage', enrichedMessage || savedMessage.toObject());
            } catch (error) {
                console.error('Failed to emit system message for deal chat:', error);
            }
        }
    }

    private getSortConditions(sortValue: string) {
        let sortConditions: any = {};

        if (sortValue === 'price-asc') {
            sortConditions['price'] = 1;
        }

        if (sortValue === 'price-desc') {
            sortConditions['price'] = -1;
        }

        if (sortValue === 'amount-asc') {
            sortConditions['amount'] = 1;
        }

        if (sortValue === 'amount-desc') {
            sortConditions['amount'] = -1;
        }

        if (sortValue === 'Low') {
            sortConditions['likesCount'] = 1;
            sortConditions['dislikesCount'] = 1;
        }

        if (sortValue === 'High') {
            sortConditions['likesCount'] = -1;
            sortConditions['dislikesCount'] = -1;
        }

        if (sortValue === 'New') {
            sortConditions['createDate'] = -1;
        }

        if (sortValue === 'Old') {
            sortConditions['createDate'] = 1;
        }

        if (sortValue === 'reactions-desc' || sortValue === 'reactions-high') {
            sortConditions['totalReactions'] = -1;
        }

        if (sortValue === 'reactions-asc' || sortValue === 'reactions-low') {
            sortConditions['totalReactions'] = 1;
        }

        if (sortValue === 'newest' || sortValue === 'date-desc') {
            sortConditions['createDate'] = -1;
        }

        if (sortValue === 'oldest' || sortValue === 'date-asc') {
            sortConditions['createDate'] = 1;
        }

        if (sortValue === 'deal-date-desc') {
            sortConditions['date'] = -1;
        }

        if (sortValue === 'deal-date-asc') {
            sortConditions['date'] = 1;
        }

        return sortConditions;
    }

    private generateAppealId(): string {
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        return `APL-${Date.now()}-${randomPart}`;
    }

    async getAppealsForStaff(
        limit: number,
        offset: number,
        status?: 'open' | 'in_review' | 'resolved' | 'all'
    ): Promise<{ appeals: any[]; total: number }> {
        const matchStage: Record<string, any> = {};

        if (status && status !== 'all') {
            matchStage.status = status;
        }

        const [result] = await this.appealModel.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    appeals: [
                        { $sort: { createdAt: -1 } },
                        { $skip: offset },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: this.dealModel.collection.name,
                                localField: 'dealId',
                                foreignField: '_id',
                                as: 'deal'
                            }
                        },
                        {
                            $unwind: {
                                path: '$deal',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: this.userModel.collection.name,
                                localField: 'creator',
                                foreignField: '_id',
                                as: 'creator'
                            }
                        },
                        {
                            $unwind: {
                                path: '$creator',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: this.userModel.collection.name,
                                localField: 'assignedTo',
                                foreignField: '_id',
                                as: 'assignedTo'
                            }
                        },
                        {
                            $lookup: {
                                from: this.userModel.collection.name,
                                localField: 'deal.creator',
                                foreignField: '_id',
                                as: 'dealCreator'
                            }
                        },
                        {
                            $unwind: {
                                path: '$dealCreator',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: this.userModel.collection.name,
                                localField: 'deal.buyer',
                                foreignField: '_id',
                                as: 'dealBuyer'
                            }
                        },
                        {
                            $unwind: {
                                path: '$dealBuyer',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: this.userModel.collection.name,
                                localField: 'deal.seller',
                                foreignField: '_id',
                                as: 'dealSeller'
                            }
                        },
                        {
                            $unwind: {
                                path: '$dealSeller',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $unwind: {
                                path: '$assignedTo',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                appealId: 1,
                                dealId: 1,
                                status: 1,
                                role: 1,
                                reason: 1,
                                description: 1,
                                email: 1,
                                attachments: 1,
                                supportChatId: 1,
                                resolution: 1,
                                txHash: 1,
                                resolvedBy: 1,
                                resolvedAt: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                creator: {
                                    _id: '$creator._id',
                                    username: '$creator.username',
                                    wallet: '$creator.wallet',
                                    photo: '$creator.photo',
                                    role: '$creator.role'
                                },
                                assignedTo: {
                                    _id: '$assignedTo._id',
                                    username: '$assignedTo.username',
                                    wallet: '$assignedTo.wallet',
                                    photo: '$assignedTo.photo',
                                    role: '$assignedTo.role'
                                },
                                deal: {
                                    _id: '$deal._id',
                                    dealId: '$deal.dealId',
                                    type: '$deal.type',
                                    section: '$deal.section',
                                    status: '$deal.status',
                                    isAppeal: '$deal.isAppeal',
                                    isReservedFunds: '$deal.isReservedFunds',
                                    isMakePayment: '$deal.isMakePayment',
                                    creator: {
                                        _id: '$dealCreator._id',
                                        username: '$dealCreator.username',
                                        wallet: '$dealCreator.wallet',
                                        photo: '$dealCreator.photo',
                                        role: '$dealCreator.role'
                                    },
                                    buyer: {
                                        _id: '$dealBuyer._id',
                                        username: '$dealBuyer.username',
                                        wallet: '$dealBuyer.wallet',
                                        photo: '$dealBuyer.photo',
                                        role: '$dealBuyer.role'
                                    },
                                    seller: {
                                        _id: '$dealSeller._id',
                                        username: '$dealSeller.username',
                                        wallet: '$dealSeller.wallet',
                                        photo: '$dealSeller.photo',
                                        role: '$dealSeller.role'
                                    },
                                    ticker: '$deal.ticker',
                                    price: '$deal.price',
                                    amount: '$deal.amount',
                                    date: '$deal.date',
                                }
                            }
                        }
                    ],
                    total: [
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        return {
            appeals: result?.appeals || [],
            total: result?.total?.[0]?.count || 0
        };
    }

    /* ─────────── DEMO TRADE DISPUTES (source='demo-seed') ───────────
       Creates isolated demo OTC/P2P deals + appeals for the Support &
       Trust Center. Everything is tagged source='demo-seed' and can be
       reset without touching real data. */
    async resetDemoDisputes(): Promise<{ deals: number; appeals: number; users: number }> {
        const appeals = await this.appealModel.deleteMany({ source: 'demo-seed' });
        const deals = await this.dealModel.deleteMany({ source: 'demo-seed' });
        const users = await this.userModel.deleteMany({ username: { $regex: '^demo_seed_' } });
        return {
            deals: deals.deletedCount || 0,
            appeals: appeals.deletedCount || 0,
            users: users.deletedCount || 0,
        };
    }

    async seedDemoDisputes(): Promise<{ deals: number; appeals: number; users: number }> {
        await this.resetDemoDisputes();

        // 1) Two isolated demo users
        const alice = await this.userModel.create({
            username: 'demo_seed_alice',
            wallet: 'demo-seed-alice',
            role: ['user'],
        } as any);
        const bob = await this.userModel.create({
            username: 'demo_seed_bob',
            wallet: 'demo-seed-bob',
            role: ['user'],
        } as any);

        const now = new Date();
        const base = 900000 + Math.floor(Math.random() * 1000);

        // 2) Demo deals (OTC x2, P2P x1)
        const otcOpen = await this.dealModel.create({
            type: 'sell', section: 'otc', status: 'started', name: 'OTC: 5,000 USDC for ETH',
            amount: 5000, price: 1, ticker: 'usd', serviceType: 'Services',
            creator: alice._id, seller: alice._id, buyer: bob._id,
            isReservedFunds: true, isMakePayment: true, isAppeal: true, dealId: base + 1,
            source: 'demo-seed', date: now,
        } as any);
        const otcReview = await this.dealModel.create({
            type: 'sell', section: 'otc', status: 'started', name: 'OTC: NFT bundle sale',
            amount: 3, price: 2.5, ticker: 'eth', serviceType: 'NFT',
            creator: bob._id, seller: bob._id, buyer: alice._id,
            isReservedFunds: true, isMakePayment: true, isAppeal: true, dealId: base + 2,
            source: 'demo-seed', date: now,
        } as any);
        const p2pResolved = await this.dealModel.create({
            type: 'buy', section: 'p2p', status: 'forced-termination', name: 'P2P: Buy 1,200 USDT (SEPA)',
            amount: 1200, price: 1, ticker: 'usd', serviceType: 'Services',
            creator: alice._id, seller: alice._id, buyer: bob._id,
            isCompleteByAdmin: true, dealId: base + 3,
            source: 'demo-seed', date: now,
        } as any);

        // 3) Demo appeals across lifecycle
        await this.appealModel.create({
            appealId: `DEMO-${base + 1}`, dealId: otcOpen._id, creator: bob._id, role: 'buyer',
            reason: 'Deal stuck', description: 'Seller reserved funds but is not releasing after payment was made.',
            email: 'bob@demo.fomo', attachments: ['https://demo-seed/evidence/payment-proof.png'],
            status: 'open', source: 'demo-seed',
        } as any);
        await this.appealModel.create({
            appealId: `DEMO-${base + 2}`, dealId: otcReview._id, creator: alice._id, role: 'buyer',
            reason: 'Counterparty', description: 'Received a different NFT bundle than advertised.',
            email: 'alice@demo.fomo', attachments: ['https://demo-seed/evidence/nft-mismatch.png'],
            status: 'in_review', assignedTo: null, source: 'demo-seed',
        } as any);
        await this.appealModel.create({
            appealId: `DEMO-${base + 3}`, dealId: p2pResolved._id, creator: bob._id, role: 'buyer',
            reason: 'Payment', description: 'SEPA transfer never arrived within the payment window.',
            email: 'bob@demo.fomo', attachments: [],
            status: 'resolved', resolution: 'Deal force-closed in favour of escrow funder after review.',
            resolvedAt: now, source: 'demo-seed',
        } as any);

        return { deals: 3, appeals: 3, users: 2 };
    }


    async createAppealSupportChat(appealMongoId: string, staffUserId: string): Promise<{ appeal: Appeal; chat: Chat }> {
        if (!mongoose.Types.ObjectId.isValid(appealMongoId)) {
            throw new NotFoundException('Appeal not found');
        }

        const appeal = await this.appealModel.findById(appealMongoId);
        if (!appeal) {
            throw new NotFoundException('Appeal not found');
        }

        if (appeal.status === 'resolved') {
            throw new HttpException('Appeal already resolved', HttpStatus.BAD_REQUEST);
        }

        const deal = await this.dealModel.findById(appeal.dealId);
        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        const buyerId = deal.type === 'sell' ? deal.buyer : deal.creator;
        const sellerId = deal.type === 'sell' ? deal.creator : deal.seller || deal.buyer;

        if (!buyerId || !sellerId) {
            throw new HttpException('Deal does not have complete participants data', HttpStatus.BAD_REQUEST);
        }

        const appealCreatorId = String(appeal.creator);
        const counterpartId = String(buyerId) === appealCreatorId ? String(sellerId) : String(buyerId);

        const participants = Array.from(new Set([
            staffUserId,
            appealCreatorId,
            counterpartId,
        ])).sort();

        if (participants.length < 3) {
            throw new HttpException('Failed to create support chat participants', HttpStatus.BAD_REQUEST);
        }

        const participantsHash = participants.join('_');
        let chat = await this.chatModel.findOne({ participantsHash }).exec();

        if (!chat) {
            chat = await this.chatModel.create({
                participants: participants.map((id) => new mongoose.Types.ObjectId(id)),
                owner: new mongoose.Types.ObjectId(staffUserId),
                created: new Date(),
                participantsHash,
            });
        }

        const updatedAppeal = await this.appealModel.findByIdAndUpdate(
            appeal._id,
            {
                $set: {
                    supportChatId: chat._id,
                    assignedTo: new mongoose.Types.ObjectId(staffUserId),
                    status: 'in_review',
                }
            },
            { new: true }
        );

        if (!updatedAppeal) {
            throw new NotFoundException('Appeal not found');
        }

        await this.messageModel.create({
            date: new Date(),
            from: new mongoose.Types.ObjectId(staffUserId),
            to: new mongoose.Types.ObjectId(appealCreatorId),
            message: 'Appeal support chat has been created. Moderator joined the conversation.',
            isNew: true,
            isSystem: true,
            systemType: 'appeal_created',
            chatId: chat._id,
            dealId: new mongoose.Types.ObjectId(deal._id),
            attachments: []
        });

        await this.logDealAction(deal, {
            actorId: staffUserId,
            actorType: 'moderator',
            action: `${deal.section || 'otc'}.appeal_support_chat_created`,
            title: 'Appeal support chat created',
            severity: 'warning',
            metadata: {
                appealId: updatedAppeal.appealId,
                appealMongoId: updatedAppeal._id,
                chatId: chat._id,
                assignedTo: staffUserId,
            },
        });

        return {
            appeal: updatedAppeal,
            chat
        };
    }

    async resolveAppeal(
        appealMongoId: string,
        staffUserId: string,
        dto: ResolveAppealDto
    ): Promise<{ appeal: Appeal; deal: Deal | null }> {
        if (!mongoose.Types.ObjectId.isValid(appealMongoId)) {
            throw new NotFoundException('Appeal not found');
        }

        const appeal = await this.appealModel.findById(appealMongoId);
        if (!appeal) {
            throw new NotFoundException('Appeal not found');
        }

        if (appeal.status === 'resolved') {
            throw new HttpException('Appeal already resolved', HttpStatus.BAD_REQUEST);
        }

        const deal = await this.dealModel.findById(appeal.dealId);
        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        const recipientText = dto?.recipient === 'buyer' ? 'buyer' : 'escrow_funder';
        const feeText = dto?.feeMode === 'without_fee' ? 'without_fee' : 'with_fee';
        const txHash = typeof dto?.txHash === 'string' ? dto.txHash.trim() : '';
        const resolutionText = dto?.resolution || `Resolved by staff (recipient: ${recipientText}, fee: ${feeText})`;

        const resolvedAt = new Date();
        const resolvedAppeal = await this.appealModel.findByIdAndUpdate(
            appeal._id,
            {
                $set: {
                    status: 'resolved',
                    resolution: resolutionText,
                    txHash,
                    resolvedBy: new mongoose.Types.ObjectId(staffUserId),
                    resolvedAt,
                    assignedTo: appeal.assignedTo || new mongoose.Types.ObjectId(staffUserId),
                }
            },
            { new: true }
        );

        let updatedDeal: Deal | null = null;
        if (dto?.forceCloseDeal) {
            updatedDeal = await this.dealModel.findByIdAndUpdate(
                deal._id,
                {
                    $set: {
                        status: 'forced-termination',
                        isActive: false,
                        isCompleteByAdmin: true,
                        isAppeal: false,
                        ...(txHash ? { transaction: txHash } : {}),
                        lastStatusUpdate: resolvedAt,
                    }
                },
                { new: true }
            );
        } else {
            updatedDeal = await this.dealModel.findByIdAndUpdate(
                deal._id,
                {
                    $set: {
                        isAppeal: false,
                        lastStatusUpdate: resolvedAt,
                    }
                },
                { new: true }
            );
        }

        if (resolvedAppeal?.supportChatId) {
            const buyerParticipantId =
                deal.type === 'sell'
                    ? deal.buyer
                    : deal.creator;

            const escrowFunderId =
                deal.type === 'sell'
                    ? deal.creator
                    : deal.buyer || buyerParticipantId;

            const recipientUserId =
                dto?.recipient === 'buyer'
                    ? buyerParticipantId
                    : escrowFunderId;

            const recipientUser = recipientUserId
                ? await this.userModel.findById(recipientUserId).select('wallet username twitterData')
                : null;

            const recipientLabel =
                dto?.recipient === 'buyer'
                    ? 'buyer'
                    : deal.type === 'sell'
                        ? 'escrow_funder (creator)'
                        : 'escrow_funder (buyer)';

            const amountText = `${deal.amount ?? 0} ${String(deal.ticker || '').toUpperCase()}`;
            const recipientWallet = recipientUser?.wallet || 'N/A';
            const hashText = txHash || 'N/A';
            const resolvedAtText = resolvedAt.toISOString();

            const detailedMessage =
                `Appeal resolved by staff.\n\n` +
                `Recipient: ${recipientLabel}\n\n` +
                `Recipient wallet: ${recipientWallet}\n\n` +
                `Amount: ${amountText}\n\n` +
                `Tx hash: ${hashText}\n\n` +
                `Resolved at: ${resolvedAtText}\n\n` +
                `Resolution: ${resolutionText}`;

            await this.messageModel.create({
                date: new Date(),
                from: new mongoose.Types.ObjectId(staffUserId),
                to: new mongoose.Types.ObjectId(appeal.creator),
                message: detailedMessage,
                isNew: true,
                isSystem: true,
                chatId: new mongoose.Types.ObjectId(resolvedAppeal.supportChatId),
                dealId: new mongoose.Types.ObjectId(deal._id),
                attachments: []
            });
        }

        if (!resolvedAppeal) {
            throw new NotFoundException('Appeal not found');
        }

        await this.logDealAction(updatedDeal || deal, {
            actorId: staffUserId,
            actorType: 'moderator',
            action: `${deal.section || 'otc'}.appeal_resolved`,
            title: 'Appeal resolved',
            severity: 'warning',
            metadata: {
                appealId: resolvedAppeal.appealId,
                appealMongoId: resolvedAppeal._id,
                recipient: dto?.recipient,
                feeMode: dto?.feeMode,
                forceCloseDeal: Boolean(dto?.forceCloseDeal),
                txHash,
            },
        });

        return {
            appeal: resolvedAppeal,
            deal: updatedDeal
        };
    }

    private async updateMemberStats(userId: mongoose.Types.ObjectId, deal: DealDocument, type: 'sale' | 'purchase') {
        const isUsdc = deal.ticker.toLowerCase() === 'usdc';
        const isEth = deal.ticker.toLowerCase() === 'eth';
        const lastDealDate = deal.lastStatusUpdate || deal.createDate || new Date();

        const updateFields: any = {
            $inc: {
                totalSales: type === 'sale' ? 1 : 0,
                totalPurchases: type === 'purchase' ? 1 : 0,
                totalUsdcSales: isUsdc && type === 'sale' ? deal.price : 0,
                totalEthSales: isEth && type === 'sale' ? deal.price : 0,
                totalUsdcPurchases: isUsdc && type === 'purchase' ? deal.price : 0,
                totalEthPurchases: isEth && type === 'purchase' ? deal.price : 0,
            },
            $addToSet: { deals: deal._id },
            $max: { lastDeal: lastDealDate },
        };

        await this.activityService.createActivity({
            title: ``,
            text: `You ${String(deal.buyer) === String(userId) ? 'bought' : 'sold'} <button data-path="${deal.section === 'otc' ? '/utility' : '/utility/p2p'}" class="inline-button">${deal.name}</button> for ${deal.ticker === 'eth' ? 'ETH ' : '$'}${deal.price}`,
            type: "deals",
            createdAt: new Date(),
            userId,
            link: `${deal.section === 'otc' ? '/utility' : '/utility/p2p'}`
        })

        await this.userModel.findByIdAndUpdate(userId, { $inc: { numberOfDeals: 1 } })

        return this.memberModel.findOneAndUpdate(
            { userId },
            updateFields,
            { upsert: true, new: true },
        );
    }

    private buildParticipantLookupStages(includeSeller: boolean = false): any[] {
        const stages: any[] = [
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: 'creator',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            { $unwind: '$creator' },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: 'buyer',
                    foreignField: '_id',
                    as: 'buyer'
                }
            },
            { $unwind: { path: '$buyer', preserveNullAndEmptyArrays: true } }
        ];

        if (includeSeller) {
            stages.push(
                {
                    $lookup: {
                        from: this.userModel.collection.name,
                        localField: 'seller',
                        foreignField: '_id',
                        as: 'seller'
                    }
                },
                { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } }
            );
        }

        return stages;
    }

    private buildPaymentMethodIdsStage(): any {
        return {
            $addFields: {
                paymentMethodIds: '$paymentMethods'
            }
        };
    }

    private buildPaymentMethodsLookupStage(): any {
        return {
            $lookup: {
                from: this.paymentMethodModel.collection.name,
                localField: 'paymentMethods',
                foreignField: '_id',
                as: 'paymentMethods'
            }
        };
    }

    private buildPaymentMethodsFallbackStage(): any {
        return {
            $addFields: {
                paymentMethods: {
                    $cond: [
                        { $gt: [{ $size: '$paymentMethods' }, 0] },
                        '$paymentMethods',
                        '$paymentMethodIds'
                    ]
                }
            }
        };
    }

    private buildOffersWithParticipantsStages(): any[] {
        return [
            {
                $lookup: {
                    from: this.dealModel.collection.name,
                    localField: 'offers',
                    foreignField: '_id',
                    as: 'offersList'
                }
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    let: { offerCreators: '$offersList.creator' },
                    pipeline: [
                        { $match: { $expr: { $in: ['$_id', '$$offerCreators'] } } }
                    ],
                    as: 'offerCreators'
                }
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    let: { offerBuyers: '$offersList.buyer' },
                    pipeline: [
                        { $match: { $expr: { $in: ['$_id', '$$offerBuyers'] } } }
                    ],
                    as: 'offerBuyers'
                }
            },
            {
                $addFields: {
                    offersList: {
                        $map: {
                            input: { $reverseArray: '$offersList' },
                            as: 'offer',
                            in: {
                                $mergeObjects: [
                                    '$$offer',
                                    {
                                        creator: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$offerCreators',
                                                        as: 'offerCreator',
                                                        cond: { $eq: ['$$offerCreator._id', '$$offer.creator'] }
                                                    }
                                                },
                                                0
                                            ]
                                        },
                                        buyer: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$offerBuyers',
                                                        as: 'offerBuyer',
                                                        cond: { $eq: ['$$offerBuyer._id', '$$offer.buyer'] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ];
    }

    private buildReactionStatsStage(): any {
        return {
            $addFields: {
                likesCount: { $size: { $ifNull: ['$likes', []] } },
                dislikesCount: { $size: { $ifNull: ['$dislikes', []] } },
                totalReactions: {
                    $add: [
                        { $size: { $ifNull: ['$likes', []] } },
                        { $size: { $ifNull: ['$dislikes', []] } }
                    ]
                }
            }
        };
    }

    private buildOfferPaymentMethodsStages(): any[] {
        return [
            {
                $addFields: {
                    offerPaymentMethodIds: {
                        $reduce: {
                            input: {
                                $map: {
                                    input: '$offersList',
                                    as: 'offer',
                                    in: { $ifNull: ['$$offer.paymentMethods', []] }
                                }
                            },
                            initialValue: [],
                            in: { $setUnion: ['$$value', '$$this'] }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: this.paymentMethodModel.collection.name,
                    localField: 'offerPaymentMethodIds',
                    foreignField: '_id',
                    as: 'offerPaymentMethods'
                }
            },
            {
                $addFields: {
                    offersList: {
                        $map: {
                            input: '$offersList',
                            as: 'offer',
                            in: {
                                $mergeObjects: [
                                    '$$offer',
                                    {
                                        paymentMethods: {
                                            $let: {
                                                vars: {
                                                    matchedMethods: {
                                                        $filter: {
                                                            input: '$offerPaymentMethods',
                                                            as: 'method',
                                                            cond: {
                                                                $in: [
                                                                    '$$method._id',
                                                                    { $ifNull: ['$$offer.paymentMethods', []] }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                },
                                                in: {
                                                    $cond: [
                                                        { $gt: [{ $size: '$$matchedMethods' }, 0] },
                                                        '$$matchedMethods',
                                                        { $ifNull: ['$$offer.paymentMethods', []] }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ];
    }

    private buildAppealStages(includeCreatorDetails: boolean = false): any[] {
        const stages: any[] = [
            {
                $lookup: {
                    from: this.appealModel.collection.name,
                    let: { dealId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$dealId', '$$dealId'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'appeal'
                }
            },
            {
                $addFields: {
                    appeal: { $arrayElemAt: ['$appeal', 0] }
                }
            }
        ];

        if (includeCreatorDetails) {
            stages.push(
                {
                    $lookup: {
                        from: this.userModel.collection.name,
                        localField: 'appeal.creator',
                        foreignField: '_id',
                        as: 'appealCreator'
                    }
                },
                {
                    $addFields: {
                        appeal: {
                            $cond: [
                                { $ifNull: ['$appeal', false] },
                                {
                                    $mergeObjects: [
                                        '$appeal',
                                        { creator: { $arrayElemAt: ['$appealCreator', 0] } }
                                    ]
                                },
                                null
                            ]
                        }
                    }
                }
            );
        }

        return stages;
    }

    private buildPinnedStages(userId?: string, allowLookupWithoutUserId: boolean = true): any[] {
        if (!allowLookupWithoutUserId && !userId) {
            return [
                {
                    $addFields: {
                        isPinned: false
                    }
                }
            ];
        }

        return [
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    let: { dealId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                _id: userId ? new mongoose.Types.ObjectId(userId) : null
                            }
                        },
                        {
                            $project: {
                                isPinned: {
                                    $cond: {
                                        if: { $in: ['$$dealId', '$pinnedDeals'] },
                                        then: true,
                                        else: false
                                    }
                                }
                            }
                        }
                    ],
                    as: 'pinnedInfo'
                }
            },
            {
                $addFields: {
                    isPinned: {
                        $cond: {
                            if: { $gt: [{ $size: '$pinnedInfo' }, 0] },
                            then: { $arrayElemAt: ['$pinnedInfo.isPinned', 0] },
                            else: false
                        }
                    }
                }
            }
        ];
    }

    private buildPromotedPipeline(offset: number, limit: number, filters?: any): any[] {
        const pipeline: any[] = [
            {
                $match: {
                    isSponsored: true,
                    isActive: true,
                    status: { $in: ['waiting'] }
                }
            },
            ...this.buildParticipantLookupStages(),
            this.buildPaymentMethodIdsStage(),
            this.buildPaymentMethodsLookupStage(),
            this.buildPaymentMethodsFallbackStage(),
            ...this.buildOffersWithParticipantsStages(),
            this.buildReactionStatsStage(),
            ...this.buildOfferPaymentMethodsStages(),
            ...this.buildAppealStages(true),
            ...this.buildPinnedStages(filters?.userId, true),
            {
                $addFields: {
                    'creator.reviewLikesLength': { $size: { $ifNull: ['$creator.reviewLikes', []] } },
                    'creator.reviewDislikesLength': { $size: { $ifNull: ['$creator.reviewDislikes', []] } }
                }
            },
            {
                $project: {
                    type: 1,
                    isActive: 1,
                    status: 1,
                    name: 1,
                    amount: 1,
                    price: 1,
                    ticker: 1,
                    date: 1,
                    description: 1,
                    dealId: 1,
                    movingTokens: 1,
                    offersList: 1,
                    isReservedFunds: 1,
                    serviceType: 1,
                    createDate: 1,
                    lastStatusUpdate: 1,
                    lastPromotedDate: 1,
                    likes: 1,
                    dislikes: 1,
                    totalReactions: 1,
                    tokenAddress: 1,
                    section: 1,
                    smartContract: 1,
                    isRealAsset: 1,
                    isPinned: 1,
                    decimals: 1,
                    paymentMethods: 1,
                    currency: 1,
                    isSponsored: 1,
                    isMakePayment: 1,
                    transaction: 1,
                    subsection: 1,
                    chatId: 1,
                    p2pSaleTime: 1,
                    p2pSaleTimeEnd: 1,
                    isReturnFunds: 1,

                    'creator._id': 1,
                    'creator.wallet': 1,
                    'creator.discordData': 1,
                    'creator.telegramData': 1,
                    'creator.twitterData': 1,
                    'creator.photo': 1,
                    'creator.username': 1,
                    'creator.fomoId': 1,
                    'creator.rating': 1,
                    'creator.redFlags': 1,
                    'creator.reviewLikes': 1,
                    'creator.reviewDislikes': 1,
                    'creator.email': 1,
                    'creator.risk': 1,
                    'creator.verificationStatus': 1,
                    'creator.reviewLikesLength': 1,
                    'creator.reviewDislikesLength': 1,

                    'buyer._id': 1,
                    'buyer.wallet': 1,
                    'buyer.discordData': 1,
                    'buyer.telegramData': 1,
                    'buyer.twitterData': 1,
                    'buyer.photo': 1,
                    'buyer.username': 1,
                    'buyer.fomoId': 1,
                    'buyer.rating': 1,
                    'buyer.redFlags': 1,
                    'buyer.reviewLikes': 1,
                    'buyer.reviewDislikes': 1,
                    'buyer.email': 1,
                    'buyer.risk': 1,
                    'buyer.verificationStatus': 1,

                    likesCount: 1,
                    dislikesCount: 1,
                    isCompleteByAdmin: 1,
                    isRefund: 1,
                    isAppeal: 1,
                    appeal: 1
                }
            }
        ];

        if (filters?.userId && mongoose.Types.ObjectId.isValid(filters.userId)) {
            const userId = new mongoose.Types.ObjectId(filters.userId);
            pipeline.splice(1, 0, {
                $match: {
                    $or: [
                        { isAppeal: { $ne: true } },
                        { creator: userId },
                        { buyer: userId },
                        { seller: userId }
                    ]
                }
            });
        }

        if (filters?.type && filters.type !== 'all') {
            pipeline[0].$match.type = filters.type;
        }

        if (filters?.section) {
            if (filters.section === 'otc') {
                pipeline[0].$match.$or = [
                    { section: { $exists: false } },
                    { section: 'otc' }
                ];
            } else if (filters.section === 'p2p') {
                pipeline[0].$match.section = 'p2p';
            }
        }

        if (filters?.serviceType && filters.serviceType.length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            isRealAsset: true
                        },
                        {
                            isRealAsset: false,
                            serviceType: { $in: filters.serviceType }
                        }
                    ]
                }
            });
        }

        if (filters?.isRealAsset?.length > 0) {
            const assetsTypeFilter: boolean[] = [];

            if (filters.isRealAsset.includes('Real Assets')) {
                assetsTypeFilter.push(true);
            }
            if (filters.isRealAsset.includes('Other')) {
                assetsTypeFilter.push(false);
            }

            if (assetsTypeFilter.length > 0) {
                pipeline.push({
                    $match: {
                        isRealAsset: { $in: assetsTypeFilter }
                    }
                });
            }
        }

        if (filters?.searchValue) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: filters.searchValue, $options: 'i' } },
                        { description: { $regex: filters.searchValue, $options: 'i' } },
                    ]
                }
            });
        }

        if (filters?.startDate && filters?.endDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);

            pipeline.push({
                $match: {
                    createDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            });
        }

        if (filters?.dealStatus?.length > 0) {
            const matchConditions: any = {
                status: { $in: filters.dealStatus },
            };

            if (!filters.dealStatus.includes("ended")) {
                matchConditions.date = { $gte: new Date() };
            }

            pipeline.push({
                $match: matchConditions,
            });
        }

        if (filters?.tickers?.length > 0) {
            const tickers: string[] = filters.tickers.map((item: 'ETH' | 'USDC') => {
                return item.toLowerCase() === 'eth' ? 'eth' : 'usd';
            });

            pipeline.push({
                $match: {
                    ticker: { $in: tickers },
                },
            });
        }

        if (filters?.minAmount !== undefined && filters?.maxAmount !== undefined) {
            pipeline.push({
                $match: {
                    amount: {
                        $gte: filters.minAmount,
                        $lte: filters.maxAmount
                    }
                }
            });
        }

        if (filters?.minPrice !== undefined && filters?.maxPrice !== undefined) {
            pipeline.push({
                $match: {
                    price: {
                        $gte: filters.minPrice,
                        $lte: filters.maxPrice
                    }
                }
            });
        }

        const sortConditions: any = { isPinned: -1 };

        if (filters?.sortField) {
            Object.assign(sortConditions, this.getSortConditions(filters.sortField));
        } else {
            sortConditions.lastPromotedDate = -1;
            sortConditions.createDate = -1;
        }

        pipeline.push({ $sort: sortConditions });

        pipeline.push({
            $facet: {
                totalCount: [{ $count: "count" }],
                deals: [
                    { $skip: offset },
                    { $limit: limit }
                ]
            }
        });

        return pipeline;
    }

    private buildPromotedDealPipeline(userId?: string): any[] {
        return [
            ...this.buildParticipantLookupStages(),
            this.buildPaymentMethodIdsStage(),
            this.buildPaymentMethodsLookupStage(),
            this.buildPaymentMethodsFallbackStage(),
            this.buildReactionStatsStage(),
            ...this.buildPinnedStages(userId, false),

            {
                $project: {
                    type: 1,
                    isActive: 1,
                    status: 1,
                    name: 1,
                    amount: 1,
                    price: 1,
                    ticker: 1,
                    date: 1,
                    description: 1,
                    dealId: 1,
                    movingTokens: 1,
                    isReservedFunds: 1,
                    serviceType: 1,
                    createDate: 1,
                    lastStatusUpdate: 1,
                    likesCount: 1,
                    dislikesCount: 1,
                    totalReactions: 1,
                    tokenAddress: 1,
                    section: 1,
                    smartContract: 1,
                    isRealAsset: 1,
                    decimals: 1,
                    paymentMethods: 1,
                    currency: 1,
                    isSponsored: 1,
                    isMakePayment: 1,
                    p2pSaleTimeEnd: 1,
                    isReturnFunds: 1,
                    isPinned: 1,
                    nextPromotedDate: 1,
                    promoteDateEnd: 1,
                    'creator._id': 1,
                    'creator.wallet': 1,
                    'creator.username': 1,
                    'creator.photo': 1,
                    'creator.rating': 1,
                    'creator.redFlags': 1,
                    'creator.reviewLikes': 1,
                    'creator.reviewDislikes': 1,
                    'creator.verificationStatus': 1,
                    'creator.twitterData': 1,

                    'buyer._id': 1,
                    'buyer.wallet': 1,
                    'buyer.username': 1,
                    'buyer.photo': 1,
                    'buyer.rating': 1,
                },
            },
        ];
    }

    private buildDealPipeline(
        type: DealType | 'all',
        limit: number,
        offset: number,
        filters?: any,
        isUserDeals: boolean = false
    ): any[] {
        const searchConfig: any = {};
        const assetsTypeFilter: boolean[] = [];

        let riskMatch = {};

        if (type !== 'all') searchConfig.type = type;

        if (filters?.dealId && mongoose.Types.ObjectId.isValid(filters.dealId)) {
            searchConfig._id = new mongoose.Types.ObjectId(filters.dealId);
        }

        if (isUserDeals && filters?.userId) {
            searchConfig.$or = [
                { creator: new mongoose.Types.ObjectId(filters.userId) },
                { buyer: new mongoose.Types.ObjectId(filters.userId) },
                { seller: new mongoose.Types.ObjectId(filters.userId) }
            ];
        }

        if (filters?.isRealAsset?.includes('Real Assets')) {
            assetsTypeFilter.push(true);
        }
        if (filters?.isRealAsset?.includes('Other')) {
            assetsTypeFilter.push(false);
        }

        if (filters?.transactionAmount) {
            searchConfig.price = { $lte: Number(filters.transactionAmount) };
        }

        const pipeline: any = [
            {
                $match: searchConfig
            },
            this.buildPaymentMethodIdsStage(),
            ...this.buildParticipantLookupStages(true),
            this.buildPaymentMethodsLookupStage(),
            ...this.buildOffersWithParticipantsStages(),
            this.buildReactionStatsStage(),
            ...this.buildAppealStages(false),
            ...this.buildPinnedStages(filters?.userId, true),
            {
                $lookup: {
                    from: this.memberModel.collection.name,
                    localField: 'creator._id',
                    foreignField: 'userId',
                    as: 'creatorMemberStats'
                }
            },
            {
                $lookup: {
                    from: this.memberModel.collection.name,
                    localField: 'buyer._id',
                    foreignField: 'userId',
                    as: 'buyerMemberStats'
                }
            },
            {
                $lookup: {
                    from: this.memberModel.collection.name,
                    localField: 'seller._id',
                    foreignField: 'userId',
                    as: 'sellerMemberStats'
                }
            },
            {
                $addFields: {
                    creatorMemberStats: { $arrayElemAt: ['$creatorMemberStats', 0] },
                    buyerMemberStats: { $arrayElemAt: ['$buyerMemberStats', 0] },
                    sellerMemberStats: { $arrayElemAt: ['$sellerMemberStats', 0] }
                }
            },
            {
                $addFields: {
                    creator: {
                        $mergeObjects: [
                            '$creator',
                            {
                                memberStats: {
                                    completedDeals: { $size: { $ifNull: ['$creatorMemberStats.deals', []] } },
                                    totalSales: { $ifNull: ['$creatorMemberStats.totalSales', 0] },
                                    totalPurchases: { $ifNull: ['$creatorMemberStats.totalPurchases', 0] },
                                    lastDeal: { $ifNull: ['$creatorMemberStats.lastDeal', null] }
                                }
                            }
                        ]
                    },
                    buyer: {
                        $cond: [
                            { $ifNull: ['$buyer._id', false] },
                            {
                                $mergeObjects: [
                                    '$buyer',
                                    {
                                        memberStats: {
                                            completedDeals: { $size: { $ifNull: ['$buyerMemberStats.deals', []] } },
                                            totalSales: { $ifNull: ['$buyerMemberStats.totalSales', 0] },
                                            totalPurchases: { $ifNull: ['$buyerMemberStats.totalPurchases', 0] },
                                            lastDeal: { $ifNull: ['$buyerMemberStats.lastDeal', null] }
                                        }
                                    }
                                ]
                            },
                            '$buyer'
                        ]
                    },
                    seller: {
                        $cond: [
                            { $ifNull: ['$seller._id', false] },
                            {
                                $mergeObjects: [
                                    '$seller',
                                    {
                                        memberStats: {
                                            completedDeals: { $size: { $ifNull: ['$sellerMemberStats.deals', []] } },
                                            totalSales: { $ifNull: ['$sellerMemberStats.totalSales', 0] },
                                            totalPurchases: { $ifNull: ['$sellerMemberStats.totalPurchases', 0] },
                                            lastDeal: { $ifNull: ['$sellerMemberStats.lastDeal', null] }
                                        }
                                    }
                                ]
                            },
                            '$seller'
                        ]
                    }
                }
            },
            {
                $project: {
                    type: 1,
                    isActive: 1,
                    status: 1,
                    name: 1,
                    amount: 1,
                    price: 1,
                    ticker: 1,
                    date: 1,
                    description: 1,
                    dealId: 1,
                    movingTokens: 1,
                    offersList: 1,
                    isReservedFunds: 1,
                    serviceType: 1,
                    createDate: 1,
                    lastStatusUpdate: 1,
                    likes: 1,
                    dislikes: 1,
                    totalReactions: 1,
                    tokenAddress: 1,
                    section: 1,
                    smartContract: 1,
                    isRealAsset: 1,
                    isPinned: 1,
                    decimals: 1,
                    paymentMethods: 1,
                    currency: 1,
                    isSponsored: 1,
                    isMakePayment: 1,
                    isAppeal: 1,
                    appeal: 1,
                    'creator._id': 1,
                    'creator.wallet': 1,
                    'creator.discordData': 1,
                    'creator.telegramData': 1,
                    'creator.twitterData': 1,
                    'creator.photo': 1,
                    'creator.username': 1,
                    'creator.fomoId': 1,
                    'creator.rating': 1,
                    'creator.redFlags': 1,
                    'creator.reviewLikes': 1,
                    'creator.reviewDislikes': 1,
                    'creator.email': 1,
                    'creator.risk': 1,
                    'creator.verificationStatus': 1,
                    'creator.memberStats': 1,

                    'buyer._id': 1,
                    'buyer.wallet': 1,
                    'buyer.discordData': 1,
                    'buyer.telegramData': 1,
                    'buyer.twitterData': 1,
                    'buyer.photo': 1,
                    'buyer.username': 1,
                    'buyer.fomoId': 1,
                    'buyer.rating': 1,
                    'buyer.redFlags': 1,
                    'buyer.reviewLikes': 1,
                    'buyer.reviewDislikes': 1,
                    'buyer.email': 1,
                    'buyer.risk': 1,
                    'buyer.verificationStatus': 1,
                    'buyer.memberStats': 1,

                    'seller._id': 1,
                    'seller.wallet': 1,
                    'seller.discordData': 1,
                    'seller.telegramData': 1,
                    'seller.twitterData': 1,
                    'seller.photo': 1,
                    'seller.username': 1,
                    'seller.fomoId': 1,
                    'seller.rating': 1,
                    'seller.redFlags': 1,
                    'seller.reviewLikes': 1,
                    'seller.reviewDislikes': 1,
                    'seller.email': 1,
                    'seller.risk': 1,
                    'seller.verificationStatus': 1,
                    'seller.memberStats': 1,
                    orderNumber: 1,
                    expectPaymentDate: 1,
                    p2pSaleTime: 1,
                    p2pSaleTimeEnd: 1,
                    isReturnFunds: 1,
                    likesCount: 1,
                    dislikesCount: 1,
                    isCompleteByAdmin: 1,
                }
            },
            {
                $addFields: {
                    'creator.reviewLikesLength': { $size: { $ifNull: ['$creator.reviewLikes', []] } },
                    'creator.reviewDislikesLength': { $size: { $ifNull: ['$creator.reviewDislikes', []] } }
                }
            }
        ];

        if (filters?.userId && mongoose.Types.ObjectId.isValid(filters.userId)) {
            const userId = new mongoose.Types.ObjectId(filters.userId);
            pipeline.splice(1, 0, {
                $match: {
                    $or: [
                        { isAppeal: { $ne: true } },
                        { creator: userId },
                        { buyer: userId },
                        { seller: userId }
                    ]
                }
            });
        }

        if (assetsTypeFilter.length > 0) {
            pipeline.push({
                $match: {
                    isRealAsset: { $in: assetsTypeFilter }
                }
            });
        }

        if (filters?.section) {
            if (filters.section === 'otc') {
                pipeline.push({
                    $match: {
                        $or: [{ section: { $exists: false } }, { section: 'otc' }]
                    }
                });
            } else if (filters.section === 'p2p') {
                pipeline.push({
                    $match: {
                        section: 'p2p'
                    }
                });
            }
        }

        if (filters?.currency && filters?.transactionAmount) {
            pipeline.push({
                $match: {
                    currency: filters.currency
                }
            });
        }

        if (filters.searchValue) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: filters.searchValue, $options: 'i' } },
                        { description: { $regex: filters.searchValue, $options: 'i' } },
                        { 'creator.wallet': { $regex: filters.searchValue, $options: 'i' } },
                    ]
                }
            });
        }

        if (filters.startDate && filters.endDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            pipeline.push({
                $match: {
                    createDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            });
        }

        if (filters.minAmount && filters.maxAmount) {
            const amountFilter: any = {};
            amountFilter.$gte = filters.minAmount;
            amountFilter.$lte = filters.maxAmount;
            pipeline.push({ $match: { amount: amountFilter } });
        }

        if (filters.serviceType) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            isRealAsset: true
                        },
                        {
                            isRealAsset: false,
                            serviceType: { $in: filters.serviceType }
                        }
                    ]
                }
            });
        }

        if (filters?.userStatus?.length > 0) {
            const userStatusMatch: any = { $and: [] };

            if (!filters.userStatus.includes('Red flag')) {
                userStatusMatch['$and'].push({
                    $or: [
                        { 'creator.redFlags': { $eq: 0 } },
                        { 'creator.redFlags': { $exists: false } }
                    ]
                });
            }

            if (filters.userStatus.includes('Verifed') && !filters.userStatus.includes('Not verified')) {
                userStatusMatch['$and'].push({
                    $or: [
                        { 'creator.verificationStatus': true }
                    ]
                });
            }

            if (filters.userStatus.includes('Not verified') && !filters.userStatus.includes('Verifed')) {
                userStatusMatch['$and'].push({
                    $or: [
                        { 'creator.verificationStatus': false },
                        { 'creator.verificationStatus': { $exists: false } }
                    ]
                });
            }
            if (userStatusMatch['$and'].length > 0) {
                pipeline.push({ $match: userStatusMatch });
            }
        }

        if (filters?.risk?.length > 0 && filters.risk.length < 3) {
            riskMatch = {
                $or: [
                    { 'creator.risk': { $in: filters.risk } },
                    { 'creator.risk': { $exists: false } }
                ]
            };
        }

        if (riskMatch && Object.keys(riskMatch).length > 0) {
            pipeline.push({ $match: riskMatch });
        }

        if (filters?.dealStatus?.length > 0) {
            const matchConditions: any = {
                status: { $in: filters.dealStatus },
            };

            if (!filters.dealStatus.includes("ended")) {
                matchConditions.date = { $gte: new Date() };
            }

            pipeline.push({
                $match: matchConditions,
            });
        }

        if (
            (filters.minPriceEth !== undefined && filters.maxPriceEth !== undefined) ||
            (filters.minPriceUsdc !== undefined && filters.maxPriceUsdc !== undefined)
        ) {
            const priceFilter: any = { $or: [] };

            if (filters?.minPriceUsdc !== undefined && filters?.maxPriceUsdc !== undefined) {
                priceFilter.$or.push({
                    ticker: 'usd',
                    price: { $gte: filters.minPriceUsdc, $lte: filters.maxPriceUsdc },
                });
            }

            if (filters?.minPriceEth !== undefined && filters?.maxPriceEth !== undefined) {
                priceFilter.$or.push({
                    ticker: 'eth',
                    price: { $gte: filters.minPriceEth, $lte: filters.maxPriceEth },
                });
            }

            if (priceFilter.$or.length > 0) {
                pipeline.push({ $match: priceFilter });
            }
        }

        if (filters?.sortField) {
            const sortConditions = this.getSortConditions(filters.sortField);

            pipeline.push({
                $sort: {
                    isPinned: -1,
                    ...sortConditions
                }
            });
        } else {
            pipeline.push({
                $sort: {
                    isPinned: -1,
                    createDate: -1
                }
            });
        }

        if (filters?.tickers?.length > 0) {
            const tickers: Array<string> = filters?.tickers.map((item: 'ETH' | 'USDC') => {
                return item.toLowerCase() === 'eth' ? 'eth' : 'usd'
            })

            pipeline.push({
                $match: {
                    ticker: { $in: tickers },
                },
            });
        }

        if (filters?.paymentMethods?.length > 0) {
            const paymentMethodIds = filters.paymentMethods
                .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
                .map((id: string) => new mongoose.Types.ObjectId(id));
            const paymentMethodKeys = filters.paymentMethods.filter(
                (value: string) => !mongoose.Types.ObjectId.isValid(value)
            );

            const paymentMatches: any[] = [];
            if (paymentMethodIds.length > 0) {
                paymentMatches.push({ "paymentMethods._id": { $in: paymentMethodIds } });
                paymentMatches.push({ paymentMethodIds: { $in: paymentMethodIds } });
            }
            if (paymentMethodKeys.length > 0) {
                paymentMatches.push({ "paymentMethods.meta.bankKey": { $in: paymentMethodKeys } });
                paymentMatches.push({ "paymentMethods.label": { $in: paymentMethodKeys } });
                paymentMatches.push({ paymentMethodIds: { $in: paymentMethodKeys } });
            }

            if (paymentMatches.length > 0) {
                pipeline.push({
                    $match: paymentMatches.length === 1 ? paymentMatches[0] : { $or: paymentMatches },
                });
            }
        }

        pipeline.push({
            $facet: {
                totalCount: [{ $count: "count" }],
                deals: [
                    { $skip: offset },
                    { $limit: limit }
                ]
            }
        });

        return pipeline;
    }

    async getPromotedDeals(offset: number, limit: number, filters?: any): Promise<{ deals: DealDocument[], total: number }> {
        try {
            const pipeline = this.buildPromotedPipeline(offset, limit, filters);

            const result = await this.dealModel.aggregate(pipeline).exec();

            if (result.length === 0) {
                return { deals: [], total: 0 };
            }

            const deals = result[0].deals;
            const total = result[0].totalCount[0]?.count || 0;

            return { deals, total };
        } catch (error) {
            console.error('Error getting promoted deals:', error);
            throw new HttpException(
                'Failed to get promoted deals',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getDealList(
        type: DealType | 'all',
        limit: number = 10,
        offset: number = 0,
        filters?: any,
    ): Promise<{ deals: Array<Deal>, total: number }> {
        const pipeline = this.buildDealPipeline(type, limit, offset, filters, false);
        const results = await this.dealModel.aggregate(pipeline);

        const total = results[0]?.totalCount[0]?.count || 0;
        let deals = results[0]?.deals || [];

        return { deals: deals, total };
    }

    async getUserDealList(
        type: DealType | 'all',
        userId: string,
        limit: number = 10,
        offset: number = 0,
        filters?: any,
    ): Promise<{ deals: Array<Deal>, total: number }> {
        const userFilters = {
            ...filters,
            userId: userId,
            userDeals: true
        };

        const pipeline = this.buildDealPipeline(type, limit, offset, userFilters, true);
        const results = await this.dealModel.aggregate(pipeline);

        const total = results[0]?.totalCount[0]?.count || 0;
        let deals = results[0]?.deals || [];

        return { deals: deals, total };
    }

    /**
     * Aggregated OTC/P2P market analytics for the admin "Обзор" dashboard.
     * Everything is derived from real collections (deals / otcmembers / users);
     * the 5% commission mirrors the on-chain feePermille (50) of the custody contract.
     */
    /**
     * P2P fiat market analytics for the admin Bazaar → P2P dashboard.
     * Treats P2P deals as fiat ads: rate = price / amount (fiat per unit).
     * "waiting" = open ad, "started" = active exchange (escrow), "ended" = settled.
     * On-chain money is derived from real escrow state on deals.
     */
    async getP2PStats(): Promise<any> {
        const P2P: any = { section: 'p2p' };
        const rateExpr = { $cond: [{ $gt: ['$amount', 0] }, { $divide: ['$price', '$amount'] }, '$price'] };
        // fiat USDC ads trade around parity; exclude non-fiat/service outliers from rate math
        const FIAT_BAND = { rate: { $gte: 0.5, $lte: 2 } };

        const [openAds, exchanges, lockedAgg, releasedAgg, tradersAgg, topSell, topBuy, payAgg] = await Promise.all([
            // open ads grouped by side with avg rate (fiat band only)
            this.dealModel.aggregate([
                { $match: { ...P2P, status: 'waiting' } },
                { $project: { type: 1, price: 1, amount: 1, rate: rateExpr } },
                { $match: FIAT_BAND },
                { $group: { _id: '$type', count: { $sum: 1 }, avgRate: { $avg: '$rate' }, volume: { $sum: { $ifNull: ['$price', 0] } }, minRate: { $min: '$rate' }, maxRate: { $max: '$rate' } } },
            ]),
            // exchange lifecycle
            this.dealModel.aggregate([
                { $match: P2P },
                { $group: { _id: '$status', count: { $sum: 1 }, volume: { $sum: { $ifNull: ['$price', 0] } } } },
            ]),
            // locked in escrow (money on contract) for p2p
            this.dealModel.aggregate([
                { $match: { ...P2P, isReservedFunds: true, isRefund: { $ne: true }, isReturnFunds: { $ne: true }, status: { $in: ['started', 'waiting'] } } },
                { $group: { _id: null, amount: { $sum: { $ifNull: ['$price', 0] } }, count: { $sum: 1 } } },
            ]),
            // released / settled (unlocked to sellers) for p2p
            this.dealModel.aggregate([
                { $match: { ...P2P, status: 'ended' } },
                { $group: { _id: null, amount: { $sum: { $ifNull: ['$price', 0] } }, count: { $sum: 1 } } },
            ]),
            // distinct traders
            this.dealModel.aggregate([
                { $match: P2P },
                { $project: { participants: { $setDifference: [['$creator', '$buyer', '$seller'], [null]] } } },
                { $unwind: '$participants' },
                { $group: { _id: '$participants' } },
                { $count: 'n' },
            ]),
            // best sell ads (lowest rate first)
            this.dealModel.aggregate([
                { $match: { ...P2P, status: 'waiting', type: 'sell' } },
                { $project: { name: 1, price: 1, amount: 1, currency: 1, createDate: 1, creator: 1, rate: rateExpr } },
                { $match: FIAT_BAND },
                { $sort: { rate: 1 } }, { $limit: 6 },
                { $lookup: { from: this.userModel.collection.name, localField: 'creator', foreignField: '_id', as: 'u' } },
                { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
                { $project: { name: 1, price: 1, amount: 1, currency: 1, createDate: 1, rate: 1, username: '$u.username', wallet: '$u.wallet', fomoId: '$u.fomoId', creator: 1 } },
            ]),
            // best buy ads (highest rate first)
            this.dealModel.aggregate([
                { $match: { ...P2P, status: 'waiting', type: 'buy' } },
                { $project: { name: 1, price: 1, amount: 1, currency: 1, createDate: 1, creator: 1, rate: rateExpr } },
                { $match: FIAT_BAND },
                { $sort: { rate: -1 } }, { $limit: 6 },
                { $lookup: { from: this.userModel.collection.name, localField: 'creator', foreignField: '_id', as: 'u' } },
                { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
                { $project: { name: 1, price: 1, amount: 1, currency: 1, createDate: 1, rate: 1, username: '$u.username', wallet: '$u.wallet', fomoId: '$u.fomoId', creator: 1 } },
            ]),
            // service/currency breakdown of ads (fiat band)
            this.dealModel.aggregate([
                { $match: { ...P2P, status: 'waiting' } },
                { $project: { serviceType: 1, rate: rateExpr } },
                { $match: FIAT_BAND },
                { $group: { _id: '$serviceType', count: { $sum: 1 } } },
                { $sort: { count: -1 } }, { $limit: 6 },
            ]),
        ]);

        const sell = openAds.find((a) => a._id === 'sell') || { count: 0, avgRate: 0, volume: 0 };
        const buy = openAds.find((a) => a._id === 'buy') || { count: 0, avgRate: 0, volume: 0 };
        const exMap: Record<string, { count: number; volume: number }> = {};
        for (const e of exchanges) exMap[e._id || 'unknown'] = { count: e.count, volume: e.volume };
        const spread = (sell.avgRate || 0) - (buy.avgRate || 0);
        const mid = ((sell.avgRate || 0) + (buy.avgRate || 0)) / 2 || 0;

        return {
            ads: {
                total: sell.count + buy.count,
                sell: sell.count,
                buy: buy.count,
                sellVolume: sell.volume,
                buyVolume: buy.volume,
            },
            avgSellRate: Math.round((sell.avgRate || 0) * 10000) / 10000,
            avgBuyRate: Math.round((buy.avgRate || 0) * 10000) / 10000,
            spread: Math.round(spread * 10000) / 10000,
            spreadPercent: mid ? Math.round((spread / mid) * 10000) / 100 : 0,
            exchanges: {
                active: (exMap['started']?.count || 0) + (exMap['waiting']?.count || 0),
                inProgress: exMap['started']?.count || 0,
                completed: exMap['ended']?.count || 0,
                blocked: exMap['blocked']?.count || 0,
            },
            volumeUsd: exMap['ended']?.volume || 0,
            lockedOnContractUsd: lockedAgg[0]?.amount || 0,
            lockedDeals: lockedAgg[0]?.count || 0,
            releasedUsd: releasedAgg[0]?.amount || 0,
            traders: tradersAgg[0]?.n || 0,
            topSellAds: topSell,
            topBuyAds: topBuy,
            adsByService: payAgg.map((p) => ({ serviceType: p._id || '—', count: p.count })),
        };
    }


    /** Demo records are tagged with a `source` marker by the seed scripts. */
    static readonly DEMO_SOURCES = ['c360-demo', 'p2p-demo', 'nft-demo'];

    /**
     * Contract Control + backend↔chain reconciliation for the Bazaar "Смарт-контракт" tab.
     * Two independent contracts (Custody/OTC-P2P and NFT Marketplace). Reconciliation
     * status is DERIVED from on-chain references we already persist (txHash, smartContract
     * lot id, escrow flags) — a live RPC reader is the next step and is reported as such.
     * `dataMode`: 'demo' includes seeded demo rows; 'production' excludes them from turnover/fees.
     */
    async getContractsHealth(dataMode: 'demo' | 'production' = 'demo'): Promise<any> {
        const demoEx: any = dataMode === 'production' ? { source: { $nin: DealsService.DEMO_SOURCES } } : {};

        const [dealDocs, prodAgg, demoCount, nftListed, nftDemo] = await Promise.all([
            this.dealModel.find({ ...demoEx }).select('status txHash smartContract transaction isReservedFunds isRefund isReturnFunds section price source').lean(),
            this.dealModel.aggregate([
                { $match: { ...demoEx, status: 'ended' } },
                { $group: { _id: null, volume: { $sum: { $ifNull: ['$price', 0] } }, count: { $sum: 1 } } },
            ]),
            this.dealModel.countDocuments({ source: { $in: DealsService.DEMO_SOURCES } }),
            this.collectionNftModel ? this.collectionNftModel.countDocuments({ ...(dataMode === 'production' ? { source: { $nin: DealsService.DEMO_SOURCES } } : {}) }).catch(() => 0) : Promise.resolve(0),
            this.collectionNftModel ? this.collectionNftModel.countDocuments({ source: { $in: DealsService.DEMO_SOURCES } }).catch(() => 0) : Promise.resolve(0),
        ]);

        // Derive reconciliation buckets for deals from persisted on-chain refs.
        const recon: Record<string, number> = { IN_SYNC: 0, CHAIN_AHEAD: 0, BACKEND_AHEAD: 0, MISMATCH: 0, UNKNOWN: 0 };
        for (const d of dealDocs as any[]) {
            const hasTx = !!(d.txHash || d.transaction || d.smartContract);
            if (d.status === 'ended') recon[hasTx ? 'IN_SYNC' : 'BACKEND_AHEAD']++;
            else if (d.status === 'started' || (d.isReservedFunds && !d.isRefund && !d.isReturnFunds)) recon[hasTx ? 'IN_SYNC' : 'BACKEND_AHEAD']++;
            else if (d.status === 'waiting') recon[!d.isReservedFunds ? 'IN_SYNC' : 'MISMATCH']++;
            else if (d.status === 'blocked' || d.isRefund || d.isReturnFunds) recon[hasTx ? 'IN_SYNC' : 'UNKNOWN']++;
            else recon.UNKNOWN++;
        }
        const endedVol = prodAgg[0]?.volume || 0;

        const custody = {
            key: 'custody', title: 'FOMO Custody · OTC/P2P', network: 'zkSync Era Mainnet', chainId: 324,
            address: '0xc6b848CA645603521C81D439aC0C856dbDAaeD2F',
            owner: '0xD128f1E3b2938eB005Bc5c750A66b82173f62857', feePercent: 5,
            configured: true, liveReader: false,
            status: 'DEGRADED', // configured but no live RPC reconciler yet
            statusReason: 'Адрес/owner заданы; live on-chain reader ещё не подключён (reconciliation derived).',
            reconciliation: recon,
            adminMethods: ['adminResolveUSD', 'setFeePermille', 'withdrawUSD', 'depositUSD'],
        };
        const nft = {
            key: 'nft-marketplace', title: 'NFT Marketplace (Pool)', network: 'zkSync Era Mainnet', chainId: 324,
            address: '0xd88Bf310CB04d9415C5Ad689d3d07b2CcD582525',
            nftContract: '0xaC5cf2161f0914f3d2DCcB3c8B83fbdA48126576',
            owner: null, feeModel: 'per-collection (change_fee / change_creator_fee)',
            configured: true, liveReader: false,
            status: 'DEGRADED',
            statusReason: 'Адрес пула/NFT заданы в интеграции; live reader не подключён.',
            listings: nftListed,
            adminMethods: ['add_collection', 'change_fee', 'change_creator_fee', 'change_creator', 'delete_collection'],
        };

        return {
            dataMode,
            production: { endedVolumeUsd: endedVol, feesUsd: Math.round(endedVol * 0.05 * 100) / 100 },
            demo: { dealRecords: demoCount, nftRecords: nftDemo },
            contracts: [custody, nft],
        };
    }

    async getMarketStats(): Promise<any> {
        const FEE_RATE = 0.05; // feePermille 50 => 5%

        const [byStatus, bySection, reservedAgg, popularAgg, tradersAgg, topTraders, rankDist] = await Promise.all([
            // deals grouped by status (counts + volume)
            this.dealModel.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 }, volume: { $sum: { $ifNull: ['$price', 0] } } } },
            ]),
            // volume by section for ended deals
            this.dealModel.aggregate([
                { $match: { status: 'ended' } },
                { $group: { _id: '$section', count: { $sum: 1 }, volume: { $sum: { $ifNull: ['$price', 0] } } } },
            ]),
            // funds currently locked in escrow on the contract
            this.dealModel.aggregate([
                { $match: { isReservedFunds: true, isRefund: { $ne: true }, isReturnFunds: { $ne: true }, status: { $in: ['started', 'waiting'] } } },
                { $group: { _id: null, amount: { $sum: { $ifNull: ['$price', 0] } }, count: { $sum: 1 } } },
            ]),
            // most popular positions by service type
            this.dealModel.aggregate([
                { $group: { _id: '$serviceType', count: { $sum: 1 }, volume: { $sum: { $ifNull: ['$price', 0] } } } },
                { $sort: { count: -1 } },
                { $limit: 6 },
            ]),
            // distinct traders (creator/buyer/seller) & how many completed >=1 deal
            this.dealModel.aggregate([
                { $project: { participants: { $setDifference: [['$creator', '$buyer', '$seller'], [null]] }, isEnded: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] } } },
                { $unwind: '$participants' },
                { $group: { _id: '$participants', ended: { $sum: '$isEnded' }, deals: { $sum: 1 } } },
                { $group: { _id: null, traders: { $sum: 1 }, activeTraders: { $sum: { $cond: [{ $gt: ['$ended', 0] }, 1, 0] } } } },
            ]),
            // top traders derived from real deals (participant activity) + user rating
            this.dealModel.aggregate([
                { $project: { participants: { $setDifference: [['$creator', '$buyer', '$seller'], [null]] }, price: { $ifNull: ['$price', 0] }, ended: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] } } },
                { $unwind: '$participants' },
                { $group: { _id: '$participants', dealsCount: { $sum: 1 }, endedCount: { $sum: '$ended' }, volume: { $sum: '$price' } } },
                { $sort: { dealsCount: -1, volume: -1 } },
                { $limit: 8 },
                { $lookup: { from: this.userModel.collection.name, localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                { $project: {
                    _id: 1, dealsCount: 1, endedCount: 1, volume: 1,
                    username: '$user.username', wallet: '$user.wallet', fomoId: '$user.fomoId',
                    rating: '$user.rating', rank: '$user.rank', activityXP: '$user.activityXP', verificationStatus: '$user.verificationStatus',
                } },
            ]),
            // rank (rating tier) distribution among traders
            this.dealModel.aggregate([
                { $project: { participants: { $setDifference: [['$creator', '$buyer', '$seller'], [null]] } } },
                { $unwind: '$participants' },
                { $group: { _id: '$participants' } },
                { $lookup: { from: this.userModel.collection.name, localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                { $group: { _id: { $ifNull: ['$user.rank', 'Без ранга'] }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        const statusMap: Record<string, { count: number; volume: number }> = {};
        for (const r of byStatus) statusMap[r._id || 'unknown'] = { count: r.count, volume: r.volume };
        const endedVolume = statusMap['ended']?.volume || 0;
        const activeDeals = (statusMap['started']?.count || 0) + (statusMap['waiting']?.count || 0);

        return {
            deals: {
                total: byStatus.reduce((a, r) => a + r.count, 0),
                active: activeDeals,
                started: statusMap['started']?.count || 0,
                waiting: statusMap['waiting']?.count || 0,
                ended: statusMap['ended']?.count || 0,
                blocked: statusMap['blocked']?.count || 0,
            },
            volumeUsd: endedVolume,
            volumeBySection: bySection.map((s) => ({ section: s._id || 'otc', count: s.count, volume: s.volume })),
            commissionEarnedUsd: Math.round(endedVolume * FEE_RATE * 100) / 100,
            feeRatePercent: FEE_RATE * 100,
            reservedOnContractUsd: reservedAgg[0]?.amount || 0,
            reservedDeals: reservedAgg[0]?.count || 0,
            traders: tradersAgg[0]?.traders || 0,
            activeTraders: tradersAgg[0]?.activeTraders || 0,
            popularPositions: popularAgg.map((p) => ({ serviceType: p._id || '—', count: p.count, volume: p.volume })),
            topTraders,
            rankDistribution: rankDist.map((r) => ({ rank: r._id, count: r.count })),
        };
    }


    async getAllMembers(
        limit: number,
        offset: number,
        filters: MembersFilters = {},
        sortBy: 'deals-desc' | 'purchases-desc' | 'sales-desc' | 'all'
    ): Promise<{ members: any[]; total: number }> {
        let riskMatch: any = {};

        const pipeline: PipelineStage[] = [
            ...(filters?.memberId && mongoose.Types.ObjectId.isValid(filters.memberId)
                ? [{ $match: { _id: new mongoose.Types.ObjectId(filters.memberId) } }]
                : []),
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    totalSales: 1,
                    totalPurchases: 1,
                    totalUsdcSales: 1,
                    totalEthSales: 1,
                    totalUsdcPurchases: 1,
                    totalEthPurchases: 1,
                    deals: 1,
                    lastDeal: 1,
                    'user.wallet': 1,
                    'user.bio': 1,
                    'user.discordData': 1,
                    'user.telegramData': 1,
                    'user.twitterData': 1,
                    'user.photo': 1,
                    'user.username': 1,
                    'user.rating': 1,
                    'user.redFlags': 1,
                    'user.reviewLikes': 1,
                    'user.reviewDislikes': 1,
                    'user.email': 1,
                    'user.fomoId': 1,
                    'user.risk': 1,
                    'user.verificationStatus': 1
                }
            },
            {
                $addFields: {
                    'user.reviewLikesLength': { $size: { $ifNull: ['$user.reviewLikes', []] } },
                    'user.reviewDislikesLength': { $size: { $ifNull: ['$user.reviewDislikes', []] } },
                    dealsCount: { $size: { $ifNull: ['$deals', []] } }
                }
            },
            {
                $lookup: {
                    from: 'deals',
                    let: { memberDealIds: '$deals' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$_id', { $ifNull: ['$$memberDealIds', []] }]
                                }
                            }
                        },
                        { $sort: { lastStatusUpdate: -1, createDate: -1 } },
                        { $limit: 1 },
                        { $project: { _id: 0, lastStatusUpdate: 1, createDate: 1 } }
                    ],
                    as: 'lastDealData'
                }
            },
            {
                $addFields: {
                    lastDeal: {
                        $ifNull: [
                            '$lastDeal',
                            {
                                $ifNull: [
                                    { $arrayElemAt: ['$lastDealData.lastStatusUpdate', 0] },
                                    { $arrayElemAt: ['$lastDealData.createDate', 0] }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $project: {
                    lastDealData: 0
                }
            }
        ];

        if (filters.searchValue) {
            const escapedSearch = escapeRegExp(String(filters.searchValue).trim());
            pipeline.push({
                $match: {
                    $or: [
                        { 'user.username': { $regex: escapedSearch, $options: 'i' } },
                        { 'user.wallet': { $regex: escapedSearch, $options: 'i' } },
                        { 'user.email': { $regex: escapedSearch, $options: 'i' } },
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $toString: { $ifNull: ['$user.fomoId', ''] } },
                                    regex: escapedSearch,
                                    options: 'i'
                                }
                            }
                        }
                    ]
                },
            });
        }

        if (filters?.risk?.length > 0 && filters.risk.length < 3) {
            riskMatch = {
                $or: [
                    { 'user.risk': { $in: filters.risk } },
                    { 'user.risk': { $exists: false } }
                ]
            };
        }

        if (riskMatch && Object.keys(riskMatch).length > 0) {
            pipeline.push({ $match: riskMatch });
        }

        if (filters?.userStatus?.length > 0) {
            const userStatusMatch: any = { $and: [] };

            if (!filters.userStatus.includes('Red flag')) {
                userStatusMatch['$and'].push({
                    $or: [
                        { 'user.redFlags': { $eq: 0 } },
                        { 'user.redFlags': { $exists: false } }
                    ]
                });
            }

            if (filters.userStatus.includes('Verifed') && !filters.userStatus.includes('Not verified')) {
                userStatusMatch['$and'].push({
                    $or: [
                        { 'user.verificationStatus': true }
                    ]
                });
            }

            if (filters.userStatus.includes('Not verified') && !filters.userStatus.includes('Verifed')) {
                userStatusMatch['$and'].push({
                    $or: [
                        { 'user.verificationStatus': false },
                        { 'user.verificationStatus': { $exists: false } }
                    ]
                });
            }

            if (userStatusMatch['$and'].length > 0) {
                pipeline.push({ $match: userStatusMatch });
            }
        }

        const rangeFilters: Record<string, any>[] = [];

        if (filters.completedDealsMin !== undefined || filters.completedDealsMax !== undefined) {
            rangeFilters.push({
                dealsCount: {
                    ...(filters.completedDealsMin !== undefined && { $gte: filters.completedDealsMin }),
                    ...(filters.completedDealsMax !== undefined && { $lte: filters.completedDealsMax })
                }
            });
        }

        if (filters.salesMin !== undefined || filters.salesMax !== undefined) {
            rangeFilters.push({
                totalSales: {
                    ...(filters.salesMin !== undefined && { $gte: filters.salesMin }),
                    ...(filters.salesMax !== undefined && { $lte: filters.salesMax })
                }
            });
        }

        if (filters.purchasesMin !== undefined || filters.purchasesMax !== undefined) {
            rangeFilters.push({
                totalPurchases: {
                    ...(filters.purchasesMin !== undefined && { $gte: filters.purchasesMin }),
                    ...(filters.purchasesMax !== undefined && { $lte: filters.purchasesMax })
                }
            });
        }

        if (rangeFilters.length > 0) {
            pipeline.push({ $match: { $and: rangeFilters } });
        }

        if (sortBy) {
            const sortStage: any = {};
            switch (sortBy) {
                case 'deals-desc':
                    sortStage.dealsCount = -1;
                    break;

                case 'sales-desc':
                    sortStage.totalSales = -1;
                    break;

                case 'purchases-desc':
                    sortStage.totalPurchases = -1;
                    break;
                default:
                    sortStage.dealsCount = -1;
            }

            pipeline.push({ $sort: sortStage });
        }

        pipeline.push(
            { $skip: offset },
            { $limit: limit }
        );

        const countPipeline = [...pipeline];
        const paginationStages = ['$skip', '$limit', '$sort'];
        const filteredCountPipeline = countPipeline.filter(stage => {
            const stageKey = Object.keys(stage)[0];
            return !paginationStages.includes(stageKey);
        });

        filteredCountPipeline.push({ $count: 'total' });

        const [members, totalResult] = await Promise.all([
            this.memberModel.aggregate(pipeline),
            this.memberModel.aggregate(filteredCountPipeline)
        ]);

        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        return { members, total };
    }

    async getAllComments(limit: number, offset: number, filters?: any) {
        const pipeline: any = [
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
                    from: 'deals',
                    localField: 'dealId',
                    foreignField: '_id',
                    as: 'deal',
                },
            },
            {
                $unwind: {
                    path: '$deal',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'deal.creator',
                    foreignField: '_id',
                    as: 'deal.creatorDetails',
                },
            },
            {
                $unwind: {
                    path: '$deal.creatorDetails',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    dealId: 1,
                    review: {
                        _id: '$_id',
                        date: '$date',
                        type: '$type',
                        text: '$text',
                        userId: '$userId',
                    },
                    deal: {
                        _id: '$deal._id',
                        name: '$deal.name',
                        description: '$deal.description',
                        createDate: '$deal.createDate',
                        likes: '$deal.likes',
                        dislikes: '$deal.dislikes',
                        creator: '$deal.creator',
                        creatorDetails: {
                            _id: '$deal.creatorDetails._id',
                            wallet: '$deal.creatorDetails.wallet',
                            bio: '$deal.creatorDetails.bio',
                            discordData: '$deal.creatorDetails.discordData',
                            telegramData: '$deal.creatorDetails.telegramData',
                            twitterData: '$deal.creatorDetails.twitterData',
                            photo: '$deal.creatorDetails.photo',
                            username: '$deal.creatorDetails.username',
                            rating: '$deal.creatorDetails.rating',
                            risk: '$deal.creatorDetails.risk',
                            redFlags: '$deal.creatorDetails.redFlags',
                        },
                    },
                    user: {
                        _id: '$user._id',
                        wallet: '$user.wallet',
                        bio: '$user.bio',
                        discordData: '$user.discordData',
                        telegramData: '$user.telegramData',
                        twitterData: '$user.twitterData',
                        photo: '$user.photo',
                        username: '$user.username',
                        rating: '$user.rating',
                        redFlags: '$user.redFlags',
                        reviewLikes: '$user.reviewLikes',
                        reviewDislikes: '$user.reviewDislikes',
                        email: '$user.email',
                        risk: '$user.risk',
                    },
                },
            },
            {
                $group: {
                    _id: '$dealId',
                    deal: { $first: '$deal' },
                    reviews: { $push: '$review' },
                    users: { $push: '$user' },
                },
            },
        ];

        if (filters?.sortField) {
            const sortValue: number = this.getSortConditions(filters.sortField)?.createDate || 1;
            pipeline.push({ $sort: { 'deal.createDate': sortValue } });
        } else {
            pipeline.push({ $sort: { 'deal.createDate': -1 } });
        }

        if (filters?.searchValue) {
            pipeline.push({
                $match: {
                    'deal.creatorDetails.username': { $regex: filters.searchValue, $options: 'i' },
                },
            });
        }

        pipeline.push({ $skip: offset });
        pipeline.push({ $limit: limit });

        const [comments, total] = await Promise.all([
            this.reviwModel.aggregate(pipeline),
            this.reviwModel.countDocuments(),
        ]);

        return { comments, total };
    }

    async getUserStatistics(userId: string): Promise<{
        totalDeals: number,
        activeDeals: number,
        endedDeals: number,
        investmentPortfolio: {
            totalInvested: number,
            totalValueNow: number,
            totalProfitLoss: number,
            assets: Array<any>,
        }
    }> {
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const [totalDeals, activeDeals, endedDeals, portfolioStats] = await Promise.all([
            this.dealModel.countDocuments({
                $or: [{ creator: userObjectId }, { buyer: userObjectId }, { seller: userObjectId }]
            }),

            this.dealModel.countDocuments({
                $or: [{ creator: userObjectId }, { buyer: userObjectId }, { seller: userObjectId }],
                isActive: true
            }),

            this.dealModel.countDocuments({
                $or: [{ creator: userObjectId }, { buyer: userObjectId }, { seller: userObjectId }],
                status: 'ended'
            }),
            this.getUserInvestmentPortfolioStats(userObjectId),
        ]);

        return {
            totalDeals,
            activeDeals,
            endedDeals,
            investmentPortfolio: portfolioStats,
        };
    }

    private async getUserInvestmentPortfolioStats(userObjectId: mongoose.Types.ObjectId): Promise<{
        totalInvested: number,
        totalValueNow: number,
        totalProfitLoss: number,
        assets: Array<any>,
    }> {
        const [dealSummary, assets] = await Promise.all([
            this.getUserDealInvestmentSummary(userObjectId),
            this.getUserInvestmentPortfolioAssets(userObjectId),
        ]);

        return {
            ...dealSummary,
            assets,
        };
    }

    private async getUserDealInvestmentSummary(userObjectId: mongoose.Types.ObjectId): Promise<{
        totalInvested: number,
        totalValueNow: number,
        totalProfitLoss: number,
    }> {
        const [ethUsdRate, fiatUsdRates] = await Promise.all([
            this.resolveEthUsdRate(),
            this.resolveFiatUsdRates(),
        ]);

        const result = await this.dealModel.aggregate([
            {
                $match: {
                    status: 'ended',
                    isActive: false,
                    isCompleteByAdmin: { $ne: true },
                    isRefund: { $ne: true },
                    isReturnFunds: { $ne: true },
                    $or: [
                        { creator: userObjectId },
                        { buyer: userObjectId },
                        { seller: userObjectId },
                    ],
                },
            },
            {
                $addFields: {
                    normalizedSection: { $ifNull: ['$section', 'otc'] },
                    normalizedTicker: { $toLower: { $ifNull: ['$ticker', ''] } },
                    normalizedCurrency: { $toLower: { $ifNull: ['$currency', ''] } },
                    isSellerRole: {
                        $or: [
                            { $eq: ['$creator', userObjectId] },
                            { $eq: ['$seller', userObjectId] },
                        ],
                    },
                    isBuyerCandidate: { $eq: ['$buyer', userObjectId] },
                },
            },
            {
                $addFields: {
                    // OTC price is paid in ticker (ETH/USDC); P2P price is paid in fiat currency.
                    dealCurrency: {
                        $cond: [
                            { $eq: ['$normalizedSection', 'p2p'] },
                            '$normalizedCurrency',
                            '$normalizedTicker',
                        ],
                    },
                    isBuyerRole: {
                        $and: [
                            '$isBuyerCandidate',
                            { $not: ['$isSellerRole'] },
                        ],
                    },
                },
            },
            {
                $addFields: {
                    dealTotal: { $ifNull: ['$price', 0] },
                },
            },
            {
                $addFields: {
                    dealTotalUsd: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: ['$dealCurrency', 'eth'] },
                                    then: { $multiply: ['$dealTotal', ethUsdRate] },
                                },
                                {
                                    case: { $in: ['$dealCurrency', ['usd', 'usdc']] },
                                    then: '$dealTotal',
                                },
                                {
                                    case: { $eq: ['$dealCurrency', 'eur'] },
                                    then: { $multiply: ['$dealTotal', fiatUsdRates.eur || 0] },
                                },
                                {
                                    case: { $eq: ['$dealCurrency', 'uah'] },
                                    then: { $multiply: ['$dealTotal', fiatUsdRates.uah || 0] },
                                },
                            ],
                            default: 0,
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalInvested: {
                        $sum: {
                            $cond: ['$isBuyerRole', '$dealTotalUsd', 0],
                        },
                    },
                    totalValueNow: {
                        $sum: {
                            $cond: ['$isSellerRole', '$dealTotalUsd', 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalInvested: 1,
                    totalValueNow: 1,
                    totalProfitLoss: { $subtract: ['$totalValueNow', '$totalInvested'] },
                },
            },
        ]);
        const stats = result?.[0] || {};

        return {
            totalInvested: this.toFiniteNumber(stats.totalInvested),
            totalValueNow: this.toFiniteNumber(stats.totalValueNow),
            totalProfitLoss: this.toFiniteNumber(stats.totalProfitLoss),
        };
    }

    private async getUserInvestmentPortfolioAssets(userObjectId: mongoose.Types.ObjectId): Promise<Array<any>> {
        const result = await this.portfolioModel.aggregate([
            {
                $match: {
                    creator: userObjectId,
                },
            },
            {
                $facet: {
                    assets: [
                        { $unwind: '$calculatedAssets' },
                        {
                            $lookup: {
                                from: this.marketReadModel.collection.name,
                                localField: 'calculatedAssets.marketAssetId',
                                foreignField: 'marketAssetId',
                                as: 'project',
                            },
                        },
                        {
                            $unwind: {
                                path: '$project',
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $addFields: {
                                hasCurrentPrice: {
                                    $gt: [{ $ifNull: ['$calculatedAssets.currentPrice', 0] }, 0],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: { $toString: '$calculatedAssets.marketAssetId' },
                                projectId: {
                                    _id: '$calculatedAssets.marketAssetId',
                                    name: { $ifNull: ['$project.name', 'Unknown asset'] },
                                    symbol: { $ifNull: ['$project.symbol', '$calculatedAssets.currency'] },
                                    logo: { $ifNull: ['$project.logo', ''] },
                                    marketAssetId: '$calculatedAssets.marketAssetId',
                                    canonicalProjectId: '$calculatedAssets.canonicalProjectId',
                                },
                                marketAssetId: '$calculatedAssets.marketAssetId',
                                canonicalProjectId: '$calculatedAssets.canonicalProjectId',
                                amount: '$calculatedAssets.quantity',
                                currency: '$calculatedAssets.currency',
                                currentPrice: {
                                    $cond: ['$hasCurrentPrice', '$calculatedAssets.currentPrice', null],
                                },
                                currentValue: {
                                    $cond: ['$hasCurrentPrice', '$calculatedAssets.currentValue', null],
                                },
                                hasCurrentPrice: 1,
                                totalPrice: '$calculatedAssets.invested',
                                invested: '$calculatedAssets.invested',
                                price: '$calculatedAssets.averageBuyPrice',
                                avgBuyPrice: '$calculatedAssets.averageBuyPrice',
                                profit: {
                                    $cond: ['$hasCurrentPrice', '$calculatedAssets.unrealizedProfit', null],
                                },
                                profitPercent: {
                                    $cond: ['$hasCurrentPrice', '$calculatedAssets.profitPercent', null],
                                },
                                realizedProfit: '$calculatedAssets.realizedProfit',
                                totalProfit: {
                                    $cond: ['$hasCurrentPrice', '$calculatedAssets.totalProfit', null],
                                },
                                totalFees: '$calculatedAssets.totalFees',
                                allocationPercent: '$calculatedAssets.allocationPercent',
                                category: '$calculatedAssets.category',
                                index: { $ifNull: ['$calculatedAssets.index', 0] },
                            },
                        },
                        { $sort: { index: -1 } },
                    ],
                },
            },
        ]);

        return result?.[0]?.assets || [];
    }

    async getUserBazaarActivity(userId: string): Promise<BazaarActivityResponse> {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return this.getEmptyBazaarActivity();
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const supportedPnlCurrencies = ['usd', 'usdc', 'eth', 'eur', 'uah'];
        const [ethUsdRate, fiatUsdRates] = await Promise.all([
            this.resolveEthUsdRate(),
            this.resolveFiatUsdRates(),
        ]);

        const [activityResult, user] = await Promise.all([
            this.dealModel.aggregate([
                {
                    $match: {
                        $and: [
                            {
                                $or: [
                                    { section: { $in: ['otc', 'p2p'] } },
                                    { section: { $exists: false } },
                                ],
                            },
                            {
                                $or: [
                                    { creator: userObjectId },
                                    { buyer: userObjectId },
                                    { seller: userObjectId },
                                ],
                            },
                        ],
                    },
                },
                {
                    $addFields: {
                        normalizedSection: { $ifNull: ['$section', 'otc'] },
                        normalizedTicker: { $toLower: { $ifNull: ['$ticker', ''] } },
                        normalizedPaymentCurrency: { $toLower: { $ifNull: ['$currency', ''] } },
                        pnlCurrency: {
                            $toLower: {
                                $cond: [
                                    { $eq: [{ $ifNull: ['$section', 'otc'] }, 'p2p'] },
                                    { $ifNull: ['$currency', 'usd'] },
                                    { $ifNull: ['$ticker', ''] },
                                ],
                            },
                        },
                        isCompleted: { $eq: ['$status', 'ended'] },
                        isActiveDeal: { $in: ['$status', ['waiting', 'started', 'blocked']] },
                        isCancelledDeal: { $eq: ['$status', 'forced-termination'] },
                        isSellerRole: {
                            $or: [
                                { $eq: ['$creator', userObjectId] },
                                { $eq: ['$seller', userObjectId] },
                            ],
                        },
                        isBuyerRole: {
                            $and: [
                                { $eq: ['$buyer', userObjectId] },
                                { $ne: ['$creator', userObjectId] },
                                { $ne: [{ $ifNull: ['$seller', null] }, userObjectId] },
                            ],
                        },
                    },
                },
                {
                    $addFields: {
                        dealTotal: { $ifNull: ['$price', 0] },
                        dealTotalUsd: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $eq: ['$pnlCurrency', 'eth'] },
                                        then: { $multiply: [{ $ifNull: ['$price', 0] }, ethUsdRate] },
                                    },
                                    {
                                        case: { $in: ['$pnlCurrency', ['usd', 'usdc']] },
                                        then: { $ifNull: ['$price', 0] },
                                    },
                                    {
                                        case: { $eq: ['$pnlCurrency', 'eur'] },
                                        then: {
                                            $multiply: [{ $ifNull: ['$price', 0] }, fiatUsdRates.eur || 0],
                                        },
                                    },
                                    {
                                        case: { $eq: ['$pnlCurrency', 'uah'] },
                                        then: {
                                            $multiply: [{ $ifNull: ['$price', 0] }, fiatUsdRates.uah || 0],
                                        },
                                    },
                                ],
                                default: 0,
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalDeals: { $sum: 1 },
                        completedDeals: {
                            $sum: { $cond: ['$isCompleted', 1, 0] },
                        },
                        activeDeals: {
                            $sum: { $cond: ['$isActiveDeal', 1, 0] },
                        },
                        cancelledDeals: {
                            $sum: { $cond: ['$isCancelledDeal', 1, 0] },
                        },
                        otcDeals: {
                            $sum: { $cond: [{ $eq: ['$normalizedSection', 'otc'] }, 1, 0] },
                        },
                        p2pDeals: {
                            $sum: { $cond: [{ $eq: ['$normalizedSection', 'p2p'] }, 1, 0] },
                        },
                        sells: {
                            $sum: {
                                $cond: [
                                    { $and: ['$isCompleted', '$isSellerRole'] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        buys: {
                            $sum: {
                                $cond: [
                                    { $and: ['$isCompleted', '$isBuyerRole'] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        completedSellUsd: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            '$isCompleted',
                                            '$isSellerRole',
                                            { $in: ['$pnlCurrency', supportedPnlCurrencies] },
                                        ],
                                    },
                                    '$dealTotalUsd',
                                    0,
                                ],
                            },
                        },
                        completedBuyUsd: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            '$isCompleted',
                                            '$isBuyerRole',
                                            { $in: ['$pnlCurrency', supportedPnlCurrencies] },
                                        ],
                                    },
                                    '$dealTotalUsd',
                                    0,
                                ],
                            },
                        },
                        excludedNonUsdDeals: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            '$isCompleted',
                                            { $or: ['$isSellerRole', '$isBuyerRole'] },
                                            { $not: [{ $in: ['$pnlCurrency', supportedPnlCurrencies] }] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
            this.userModel
                .findById(userObjectId)
                .select('reviewLikes reviewDislikes')
                .lean(),
        ]);

        const rawActivity = activityResult?.[0] || {};
        const completedSellUsd = Number(rawActivity.completedSellUsd || 0);
        const completedBuyUsd = Number(rawActivity.completedBuyUsd || 0);
        const likes = Array.isArray(user?.reviewLikes) ? user.reviewLikes.length : 0;
        const dislikes = Array.isArray(user?.reviewDislikes) ? user.reviewDislikes.length : 0;
        const totalReviews = likes + dislikes;
        const ratingPercent =
            totalReviews > 0 ? Math.round((likes / totalReviews) * 100) : 0;

        return {
            rating: {
                percent: ratingPercent,
                likes,
                dislikes,
                totalReviews,
            },
            sells: Number(rawActivity.sells || 0),
            buys: Number(rawActivity.buys || 0),
            profit: {
                usd: Number((completedSellUsd - completedBuyUsd).toFixed(8)),
                completedSellUsd,
                completedBuyUsd,
                excludedNonUsdDeals: Number(rawActivity.excludedNonUsdDeals || 0),
                formula: 'completed_usd_sells_minus_completed_usd_buys',
            },
            deals: {
                total: Number(rawActivity.totalDeals || 0),
                completed: Number(rawActivity.completedDeals || 0),
                active: Number(rawActivity.activeDeals || 0),
                cancelled: Number(rawActivity.cancelledDeals || 0),
            },
            sections: {
                otc: Number(rawActivity.otcDeals || 0),
                p2p: Number(rawActivity.p2pDeals || 0),
            },
        };
    }

    private getEmptyBazaarActivity(): BazaarActivityResponse {
        return {
            rating: {
                percent: 0,
                likes: 0,
                dislikes: 0,
                totalReviews: 0,
            },
            sells: 0,
            buys: 0,
            profit: {
                usd: 0,
                completedSellUsd: 0,
                completedBuyUsd: 0,
                excludedNonUsdDeals: 0,
                formula: 'completed_usd_sells_minus_completed_usd_buys',
            },
            deals: {
                total: 0,
                completed: 0,
                active: 0,
                cancelled: 0,
            },
            sections: {
                otc: 0,
                p2p: 0,
            },
        };
    }

    private async resolveEthUsdRate(): Promise<number> {
        const prices = await this.marketProjectReadModelService.getCoreAssetUsdPrices();
        const ethPrice = Number(prices?.ethPrice || 0);

        return Number.isFinite(ethPrice) && ethPrice > 0 ? ethPrice : 0;
    }

    private async resolveFiatUsdRates(): Promise<Record<string, number>> {
        const baseRates = {
            usd: 1,
            usdc: 1,
            eur: 0,
            uah: 0,
        };
        const now = Date.now();

        if (this.fiatUsdRatesCache && this.fiatUsdRatesCache.expiresAt > now) {
            return this.fiatUsdRatesCache.rates;
        }

        try {
            const response = await firstValueFrom(
                this.httpService.get('https://open.er-api.com/v6/latest/USD', {
                    timeout: 3000,
                })
            );
            const rates = response?.data?.rates || {};
            const eurPerUsd = Number(rates.EUR || 0);
            const uahPerUsd = Number(rates.UAH || 0);
            const resolvedRates = {
                ...baseRates,
                eur: Number.isFinite(eurPerUsd) && eurPerUsd > 0 ? 1 / eurPerUsd : 0,
                uah: Number.isFinite(uahPerUsd) && uahPerUsd > 0 ? 1 / uahPerUsd : 0,
            };

            this.fiatUsdRatesCache = {
                expiresAt: now + this.FIAT_RATES_CACHE_TTL_MS,
                rates: resolvedRates,
            };

            return resolvedRates;
        } catch {
            return this.fiatUsdRatesCache?.rates || baseRates;
        }
    }

    private toFiniteNumber(value: unknown): number {
        const numberValue = Number(value);

        return Number.isFinite(numberValue) ? numberValue : 0;
    }

    async getCurrentPromotedDeal(
        section: DealSection,
        userId?: string,
    ): Promise<any | null> {

        const now = new Date();

        let deal = await this.dealModel.findOne({
            isSponsored: true,
            section,
            promoteDateEnd: { $gt: now },
        }).sort({ promoteDateEnd: 1 });

        if (!deal) {
            deal = await this.dealModel.findOne({
                isSponsored: true,
                section,
            }).sort({ nextPromotedDate: 1 });

            if (!deal) return null;

            const start = now;
            const end = new Date(start.getTime() + this.PROMOTE_INTERVAL_MS);

            await this.dealModel.updateOne(
                { _id: deal._id },
                {
                    $set: {
                        lastPromotedDate: start,
                        promoteDateEnd: end,
                        nextPromotedDate: end,
                    },
                }
            );
        }

        const pipeline = [
            { $match: { _id: deal._id } },
            ...this.buildPromotedDealPipeline(userId),
        ];

        const [fullDeal] = await this.dealModel.aggregate(pipeline);
        return fullDeal || null;
    }

    async createDeal(deal: CreateDealDto): Promise<DealDocument> {
        const now = new Date();
        let promoteData = {};
        const rawPaymentMethods = Array.isArray(deal.paymentMethods)
            ? deal.paymentMethods
            : [];
        const paymentMethodIds = rawPaymentMethods
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

        if (deal.isSponsored) {
            const lastDeal = await this.dealModel
                .findOne({
                    isSponsored: true,
                    section: deal.section,
                })
                .sort({ nextPromotedDate: -1 })
                .select('nextPromotedDate')
                .lean();

            const start = lastDeal?.nextPromotedDate && lastDeal.nextPromotedDate > now
                ? new Date(lastDeal.nextPromotedDate)
                : now;

            promoteData = {
                lastPromotedDate: null,
                promoteDateEnd: null,
                nextPromotedDate: new Date(start.getTime() + this.PROMOTE_INTERVAL_MS),
            };
        }

        const createdDeal = await this.dealModel.create({
            ...deal,
            ...promoteData,
            creator: new mongoose.Types.ObjectId(deal.creator),
            paymentMethods: paymentMethodIds,
        });

        await this.logDealAction(createdDeal, {
            actorId: createdDeal.creator,
            action: `${createdDeal.section || 'otc'}.deal_created`,
            title: `${(createdDeal.section || 'OTC').toString().toUpperCase()} deal created`,
            metadata: {
                isSponsored: createdDeal.isSponsored,
                serviceType: createdDeal.serviceType,
                paymentMethodsCount: paymentMethodIds.length,
            },
        });

        return createdDeal;
    }

    async createOffer(dealId: string, dealData: CreateDealDto): Promise<Deal> {
        const newDeal: DealDocument = await this.createDeal({ ...dealData })

        const updatedDeal: DealDocument
            =
            await this.dealModel.findOneAndUpdate(
                {
                    _id: new mongoose.Types.ObjectId(dealId)
                },
                {
                    $push: { offers: new mongoose.Types.ObjectId(newDeal._id) }
                }
            )

        if (!updatedDeal) {
            await this.dealModel.findByIdAndDelete(newDeal._id)

            throw new HttpException('Deal not found', HttpStatus.NOT_FOUND)
        }

        await this.logDealAction(newDeal, {
            actorId: newDeal.creator,
            action: `${newDeal.section || 'otc'}.offer_created`,
            title: `${(newDeal.section || 'OTC').toString().toUpperCase()} offer created`,
            metadata: {
                parentDealId: dealId,
            },
        });

        return newDeal
    }

    async blockDeal(userId: string, dealId: string, dealIdSmart?: number): Promise<Deal> {
        const updateData: Record<string, any> = {
            status: 'blocked',
            buyer: new mongoose.Types.ObjectId(userId),
            lastStatusUpdate: new Date()
        };

        if (typeof dealIdSmart === 'number' && Number.isFinite(dealIdSmart) && dealIdSmart > 0) {
            updateData.dealId = dealIdSmart;
        }

        const updatedDeal = await this.dealModel.findByIdAndUpdate(
            dealId,
            updateData,
            { new: true }
        );

        await this.logDealAction(updatedDeal, {
            actorId: userId,
            action: `${updatedDeal?.section || 'otc'}.deal_blocked`,
            title: `${(updatedDeal?.section || 'OTC').toString().toUpperCase()} deal blocked`,
            severity: 'warning',
            metadata: {
                dealIdSmart,
            },
        });

        return updatedDeal
    }

    async updateBlockedDeal(userId: string, dealId: string, action: DealAction): Promise<Deal> {
        const currentDeal = await this.dealModel.findOne({
            _id: new mongoose.Types.ObjectId(dealId),
            creator: new mongoose.Types.ObjectId(userId),
        });

        if (!currentDeal) {
            throw new HttpException('Deal not found', HttpStatus.NOT_FOUND);
        }

        const updateData: {
            status: 'started' | 'waiting',
            buyer?: null,
            dealId?: null,
            paymentMethods?: mongoose.Types.ObjectId[],
            lastStatusUpdate: Date
        } = { status: 'waiting', lastStatusUpdate: new Date() }

        if (action === 'confirm') updateData.status = 'started'
        if (action === 'reject') {
            updateData.buyer = null
            updateData.paymentMethods = []
            if (currentDeal.type === 'buy') {
                updateData.dealId = null
            }
        }

        const updatedDeal = await this.dealModel.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(dealId),
                creator: new mongoose.Types.ObjectId(userId),
            },
            updateData,
            { new: true }
        )

        await this.logDealAction(updatedDeal, {
            actorId: userId,
            action: `${updatedDeal?.section || 'otc'}.blocked_deal_${action}`,
            title: action === 'confirm' ? 'Blocked deal confirmed' : 'Blocked deal rejected',
            severity: action === 'reject' ? 'warning' : 'info',
        });

        return updatedDeal
    }

    private async resolveOwnedPaymentMethodIds(userId: string, paymentMethods: string[]): Promise<mongoose.Types.ObjectId[]> {
        if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
            return [];
        }

        const validIds = paymentMethods.filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (!validIds.length) {
            return [];
        }

        const userIdMatches = this.buildUserIdMatchValues(userId);
        const methods = await this.paymentMethodModel.find({
            _id: { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) },
            userId: { $in: userIdMatches },
        }).select('_id').lean();

        return methods.map((method) => new mongoose.Types.ObjectId(method._id));
    }

    async startDealP2P(dealId: string, userId: string): Promise<Deal> {
        const deal: DealDocument | null = await this.dealModel.findOne({
            _id: new mongoose.Types.ObjectId(dealId),
            status: 'waiting',
        })

        if (!deal) {
            throw new HttpException('Deal already started by this user', HttpStatus.BAD_REQUEST)
        }

        if (deal.type === 'sell') {
            deal.buyer = new mongoose.Types.ObjectId(userId)
        }

        deal.status = 'started'
        deal.lastStatusUpdate = new Date()
        deal.expectPaymentDate = new Date(Date.now() + 15 * 60 * 1000) // +15 minutes
        deal.orderNumber = this.generateOrderNumber()

        const startedDeal = await deal.save()

        await this.logDealAction(startedDeal, {
            actorId: userId,
            action: 'p2p.deal_started',
            title: 'P2P deal started',
            metadata: {
                expectPaymentDate: startedDeal.expectPaymentDate,
            },
        });

        return startedDeal
    }

    async closeDeal(dealId: string, userId: string): Promise<Deal> {
        const deal = await this.dealModel.findOne({
            _id: new mongoose.Types.ObjectId(dealId),
        });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        const matchCondition: any = {
            _id: new mongoose.Types.ObjectId(dealId),
            $or: [
                { isReservedFunds: true },
                { isRealAsset: true }
            ],
            isCompleteByAdmin: false
        };

        if (deal.section === 'p2p' && deal.type === 'sell') {
            matchCondition.creator = new mongoose.Types.ObjectId(userId);
        } else {
            matchCondition.buyer = new mongoose.Types.ObjectId(userId);
        }

        const updatedDeal = await this.dealModel.findOneAndUpdate(
            matchCondition,
            {
                status: 'ended',
                isActive: false,
                lastStatusUpdate: new Date(),
            },
            { new: true },
        );

        if (!updatedDeal) {
            throw new NotFoundException('Deal not found or not eligible for closing.');
        }

        // Send system message for deal completion (P2P)
        if (deal.section === 'p2p') {
            try {
                const buyerId = deal.type === 'sell' ? deal.buyer : deal.creator;
                const sellerId = deal.type === 'sell' ? deal.creator : deal.seller || deal.buyer;

                if (buyerId && sellerId) {
                    const chat = await this.getOrCreateDealChat(
                        buyerId as mongoose.Types.ObjectId,
                        sellerId as mongoose.Types.ObjectId,
                        deal._id as mongoose.Types.ObjectId
                    );

                    await this.sendDealSystemMessage(
                        deal._id as mongoose.Types.ObjectId,
                        chat._id as mongoose.Types.ObjectId,
                        'deal_completed',
                        new mongoose.Types.ObjectId(userId),
                        buyerId.toString() === userId ? sellerId as mongoose.Types.ObjectId : buyerId as mongoose.Types.ObjectId
                    );
                }
            } catch (error) {
                console.error('Failed to send system message for closeDeal:', error);
            }
        }

        const [buyer, creator] = await Promise.all([
            this.updateMemberStats(updatedDeal.buyer, updatedDeal, 'purchase'),
            this.updateMemberStats(updatedDeal.creator, updatedDeal, 'sale'),
        ]);

        await this.logDealAction(updatedDeal, {
            actorId: userId,
            action: `${updatedDeal.section || 'otc'}.deal_completed`,
            title: `${(updatedDeal.section || 'OTC').toString().toUpperCase()} deal completed`,
        });

        return updatedDeal;
    }

    async completeByAdmin(dealId: string, staffUserId?: string): Promise<Deal> {
        const deal = await this.dealModel.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(dealId),
            },
            {
                status: 'forced-termination',
                isActive: false,
                lastStatusUpdate: new Date(),
                isCompleteByAdmin: true
            },
            { new: true }
        );

        await this.logDealAction(deal, {
            actorId: staffUserId,
            actorType: 'admin',
            action: `${deal?.section || 'otc'}.deal_force_completed`,
            title: `${(deal?.section || 'OTC').toString().toUpperCase()} deal force completed`,
            severity: 'warning',
        });

        return deal;
    }

    async reserveFunds(dealId: string, userId: string): Promise<Deal> {
        const deal = await this.dealModel.findOne({
            _id: new mongoose.Types.ObjectId(dealId),
        });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        const matchCondition: any = {
            _id: new mongoose.Types.ObjectId(dealId),
        };

        if (deal.section === 'p2p' && deal.type === 'sell') {
            matchCondition.creator = new mongoose.Types.ObjectId(userId);
        } else {
            matchCondition.buyer = new mongoose.Types.ObjectId(userId);
        }

        const updateData: Record<string, any> = {
            isReservedFunds: true,
            lastStatusUpdate: new Date()
        };

        if (deal.section === 'p2p') {
            updateData.p2pSaleTimeEnd = this.calculateP2PSaleEndTime(deal.p2pSaleTime);
        }

        const updatedDeal = await this.dealModel.findOneAndUpdate(
            matchCondition,
            updateData,
            { new: true }
        );

        // Send system message for P2P deals
        if (updatedDeal && deal.section === 'p2p') {
            try {
                const buyerId = deal.type === 'sell' ? deal.buyer : deal.creator;
                const sellerId = deal.type === 'sell' ? deal.creator : deal.seller || deal.buyer;

                if (buyerId && sellerId) {
                    const chat = await this.getOrCreateDealChat(
                        buyerId as mongoose.Types.ObjectId,
                        sellerId as mongoose.Types.ObjectId,
                        deal._id as mongoose.Types.ObjectId
                    );

                    await this.sendDealSystemMessage(
                        deal._id as mongoose.Types.ObjectId,
                        chat._id as mongoose.Types.ObjectId,
                        'funds_reserved',
                        new mongoose.Types.ObjectId(userId),
                        buyerId.toString() === userId ? sellerId as mongoose.Types.ObjectId : buyerId as mongoose.Types.ObjectId
                    );
                }
            } catch (error) {
                console.error('Failed to send system message for reserveFunds:', error);
            }
        }

        await this.logDealAction(updatedDeal, {
            actorId: userId,
            action: `${updatedDeal?.section || 'otc'}.funds_reserved`,
            title: `${(updatedDeal?.section || 'OTC').toString().toUpperCase()} funds reserved`,
        });

        return updatedDeal;
    }

    async markPaymentMade(dealId: string, userId: string): Promise<Deal> {
        const deal = await this.dealModel.findOne({
            _id: new mongoose.Types.ObjectId(dealId),
            section: 'p2p',
        });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        this.ensureP2PSaleTimeActive(deal);

        const matchCondition: any = {
            _id: new mongoose.Types.ObjectId(dealId),
            isReservedFunds: true,
        };

        if (deal.type === 'sell') {
            matchCondition.buyer = new mongoose.Types.ObjectId(userId);
        } else {
            matchCondition.creator = new mongoose.Types.ObjectId(userId);

        }

        const updatedDeal = await this.dealModel.findOneAndUpdate(
            matchCondition,
            {
                isMakePayment: true,
                lastStatusUpdate: new Date()
            },
            { new: true }
        );

        // Send system message
        if (updatedDeal) {
            try {
                const buyerId = deal.type === 'sell' ? deal.buyer : deal.creator;
                const sellerId = deal.type === 'sell' ? deal.creator : deal.seller || deal.buyer;

                if (buyerId && sellerId) {
                    const chat = await this.getOrCreateDealChat(
                        buyerId as mongoose.Types.ObjectId,
                        sellerId as mongoose.Types.ObjectId,
                        deal._id as mongoose.Types.ObjectId
                    );

                    await this.sendDealSystemMessage(
                        deal._id as mongoose.Types.ObjectId,
                        chat._id as mongoose.Types.ObjectId,
                        'payment_marked',
                        new mongoose.Types.ObjectId(userId),
                        buyerId.toString() === userId ? sellerId as mongoose.Types.ObjectId : buyerId as mongoose.Types.ObjectId
                    );
                }
            } catch (error) {
                console.error('Failed to send system message for markPaymentMade:', error);
            }
        }

        await this.logDealAction(updatedDeal, {
            actorId: userId,
            action: 'p2p.payment_marked',
            title: 'P2P payment marked',
        });

        return updatedDeal;
    }

    async returnReservedP2PSellFunds(dealId: string, userId: string): Promise<Deal> {
        const updatedDeal = await this.dealModel.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(dealId),
                section: 'p2p',
                type: 'sell',
                creator: new mongoose.Types.ObjectId(userId),
                isReservedFunds: true,
                isMakePayment: false,
            },
            {
                isReturnFunds: true,
                lastStatusUpdate: new Date(),
            },
            { new: true }
        );

        if (!updatedDeal) {
            throw new HttpException('Deal not found or not eligible for return', HttpStatus.BAD_REQUEST);
        }

        await this.logDealAction(updatedDeal, {
            actorId: userId,
            action: 'p2p.reserved_funds_returned',
            title: 'P2P reserved funds returned',
            severity: 'warning',
        });

        return updatedDeal;
    }

    async createAppeal(dealId: string, userId: string, dto: CreateAppealDto): Promise<Appeal> {
        if (!mongoose.Types.ObjectId.isValid(dealId)) {
            throw new NotFoundException('Deal not found');
        }

        const deal = await this.dealModel.findById(dealId);
        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        const isBuyer = deal.buyer && String(deal.buyer) === userId;
        const isSeller = deal.seller && String(deal.seller) === userId;
        const isCreator = String(deal.creator) === userId;

        if (!isBuyer && !isSeller && !isCreator) {
            throw new HttpException('Only deal participants can create appeal', HttpStatus.FORBIDDEN);
        }

        if (!deal.isReservedFunds) {
            throw new HttpException('Deal funds are not reserved', HttpStatus.BAD_REQUEST);
        }

        const existingAppeal = await this.appealModel.findOne({
            dealId: deal._id,
        });

        if (existingAppeal) {
            throw new HttpException('Appeal already exists', HttpStatus.BAD_REQUEST);
        }

        const appeal = await this.appealModel.create({
            appealId: this.generateAppealId(),
            dealId: deal._id,
            creator: new mongoose.Types.ObjectId(userId),
            role: isBuyer ? 'buyer' : isSeller ? 'seller' : 'creator',
            reason: dto?.reason || '',
            description: dto?.description || '',
            email: dto?.email || '',
            attachments: dto?.attachments || [],
            status: 'open',
            assignedTo: null,
            supportChatId: null,
            resolution: '',
            resolvedBy: null,
            resolvedAt: null,
        });

        await this.dealModel.updateOne(
            { _id: deal._id },
            { $set: { isAppeal: true, lastStatusUpdate: new Date() } }
        );

        try {
            const buyerId = deal.type === 'sell' ? deal.buyer : deal.creator;
            const sellerId = deal.type === 'sell' ? deal.creator : deal.seller || deal.buyer;

            if (buyerId && sellerId) {
                const chat = await this.getOrCreateDealChat(
                    buyerId as mongoose.Types.ObjectId,
                    sellerId as mongoose.Types.ObjectId,
                    deal._id as mongoose.Types.ObjectId
                );

                await this.sendDealSystemMessage(
                    deal._id as mongoose.Types.ObjectId,
                    chat._id as mongoose.Types.ObjectId,
                    'appeal_created',
                    new mongoose.Types.ObjectId(userId),
                    buyerId.toString() === userId ? sellerId as mongoose.Types.ObjectId : buyerId as mongoose.Types.ObjectId
                );
            }
        } catch (error) {
            console.error('Failed to send system message for createAppeal:', error);
        }

        await this.logDealAction(deal, {
            actorId: userId,
            action: `${deal.section || 'otc'}.appeal_created`,
            title: `${(deal.section || 'OTC').toString().toUpperCase()} appeal created`,
            severity: 'warning',
            metadata: {
                appealId: appeal.appealId,
                appealMongoId: appeal._id,
                role: appeal.role,
                reason: dto?.reason || '',
            },
        });

        return appeal;
    }

    async addFeedback(dId: string, uId: string, type: 'like' | 'dislike', text: string) {
        const dealId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(dId)
        const userId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(uId)

        const review: Review | null = await this.reviwModel.findOne({
            userId,
            dealId
        })

        if (review) throw new HttpException('Review already exist', HttpStatus.BAD_REQUEST)

        const newReview: ReviewDocument = await this.reviwModel.create({
            type,
            userId,
            dealId,
            text
        })

        const deal: DealDocument = await this.dealModel.findById(dealId)

        const isBuyer: boolean = String(deal.buyer) === uId

        const user = await this.userModel.findOne({
            _id: isBuyer ? new mongoose.Types.ObjectId(deal.creator) : new mongoose.Types.ObjectId(deal.buyer)
        });

        type === 'like'
            ?
            user.reviewLikes.push({
                reviewId: new mongoose.Types.ObjectId(newReview._id),
                userId,
                dealId
            })
            :
            user.reviewDislikes.push({
                reviewId: new mongoose.Types.ObjectId(newReview._id),
                userId,
                dealId
            });

        const savedUser = await user.save();

        await this.logDealAction(deal, {
            actorId: uId,
            action: `${deal.section || 'otc'}.feedback_created`,
            title: 'Deal feedback created',
            metadata: {
                reviewId: newReview._id,
                reviewType: type,
                reviewTargetUserId: user._id,
            },
        });

        return savedUser;
    }

    async updateLikes(dealId: string, userId: string): Promise<Deal> {
        const deal = await this.dealModel.findById(dealId);
        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        const id: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId)

        if (deal.likes.includes(id)) {
            deal.likes = deal.likes.filter(id => id.toString() !== userId);
        } else {
            deal.likes.push(id);
            deal.dislikes = deal.dislikes.filter(id => id.toString() !== userId);
        }

        const savedDeal = await deal.save();

        await this.logDealAction(savedDeal, {
            actorId: userId,
            action: `${savedDeal.section || 'otc'}.like_toggled`,
            title: 'Deal like toggled',
        });

        return savedDeal;
    }

    async updateDislikes(dealId: string, userId: string): Promise<Deal> {
        const deal = await this.dealModel.findById(dealId);
        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        const id: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId)

        if (deal.dislikes.includes(id)) {
            deal.dislikes = deal.dislikes.filter(id => id.toString() !== userId);
        } else {
            deal.dislikes.push(id);
            deal.likes = deal.likes.filter(id => id.toString() !== userId);
        }

        const savedDeal = await deal.save();

        await this.logDealAction(savedDeal, {
            actorId: userId,
            action: `${savedDeal.section || 'otc'}.dislike_toggled`,
            title: 'Deal dislike toggled',
        });

        return savedDeal;
    }

    async pinDeal(userId: string, dealId: string): Promise<{ success: boolean, message: string }> {
        const user = await this.userModel.findById(userId);
        const deal = await this.dealModel.findById(dealId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        if (user.pinnedDeals.includes(new mongoose.Types.ObjectId(dealId))) {
            throw new HttpException('Deal already pinned', HttpStatus.BAD_REQUEST);
        }

        await this.userModel.findByIdAndUpdate(
            userId,
            { $push: { pinnedDeals: new mongoose.Types.ObjectId(dealId) } }
        );

        await this.logDealAction(deal, {
            actorId: userId,
            action: `${deal.section || 'otc'}.deal_pinned`,
            title: 'Deal pinned',
        });

        return { success: true, message: 'Deal pinned' }
    }

    async unpinDeal(userId: string, dealId: string): Promise<{ success: boolean, message: string }> {
        const user = await this.userModel.findById(userId);
        const deal = await this.dealModel.findById(dealId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.userModel.findByIdAndUpdate(
            userId,
            { $pull: { pinnedDeals: new mongoose.Types.ObjectId(dealId) } }
        );

        await this.logDealAction(deal, {
            actorId: userId,
            action: `${deal?.section || 'otc'}.deal_unpinned`,
            title: 'Deal unpinned',
        });

        return { success: true, message: 'Deal pinned' }
    }

    async uploadScreenshotBuffer(buffer: Buffer, originalName: string, userId: string) {
        if (!buffer) {
            throw new Error('Buffer is empty');
        }

        const fileName = await this.filesService.writeFile({
            buffer,
            originalName,
        });

        await this.userModel.findByIdAndUpdate(userId, {
            $inc: {
                shareLimit: -1
            }
        })

        return {
            success: true,
            fileName,
            url: fileName,
        };
    }

    async updateDealSmartID(
        id: string,
        creatorId: string,
        payload: { dealId?: number; paymentMethods?: string[] }
    ): Promise<{ success: boolean, message: string }> {
        const hasPaymentMethodsPayload = Array.isArray(payload.paymentMethods);
        const paymentMethodIds = await this.resolveOwnedPaymentMethodIds(
            creatorId,
            payload.paymentMethods || []
        );

        if (typeof payload.dealId !== 'number' || !Number.isFinite(payload.dealId) || payload.dealId <= 0) {
            const updatedDeal = await this.dealModel.findOneAndUpdate(
                {
                    _id: new mongoose.Types.ObjectId(id),
                    section: 'p2p',
                    $or: [
                        { creator: new mongoose.Types.ObjectId(creatorId) },
                        { buyer: new mongoose.Types.ObjectId(creatorId) },
                    ],
                },
                {
                    $set: {
                        ...(hasPaymentMethodsPayload ? { paymentMethods: paymentMethodIds } : {}),
                        lastStatusUpdate: new Date(),
                    },
                },
                { new: true }
            );

            if (!updatedDeal) {
                throw new HttpException('Deal not found', HttpStatus.BAD_REQUEST);
            }

            await this.logDealAction(updatedDeal, {
                actorId: creatorId,
                action: 'p2p.payment_methods_updated',
                title: 'P2P payment methods updated',
                metadata: {
                    paymentMethodsCount: paymentMethodIds.length,
                },
            });

            return {
                success: true,
                message: 'Payment methods updated',
            };
        }

        const deal: DealDocument | null = await this.dealModel.findOne({
            _id: new mongoose.Types.ObjectId(id),
            dealId: null,
        });

        if (!deal) {
            throw new HttpException('Deal not found or dealId already exists', HttpStatus.BAD_REQUEST);
        }

        const currentCreator = deal.creator;

        const updatedDeal = await this.dealModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    dealId: payload.dealId,
                    buyer: currentCreator,
                    creator: new mongoose.Types.ObjectId(creatorId),
                    ...(hasPaymentMethodsPayload ? { paymentMethods: paymentMethodIds } : {}),
                    updatedAt: new Date(),
                    status: 'started'
                }
            },
            {
                new: true
            }
        );

        await this.logDealAction(updatedDeal, {
            actorId: creatorId,
            action: 'p2p.smart_deal_id_updated',
            title: 'P2P smart deal id updated',
            metadata: {
                smartDealId: payload.dealId,
                paymentMethodsCount: paymentMethodIds.length,
            },
        });

        return {
            success: !!updatedDeal,
            message: `Deal ID updated to ${payload.dealId}`
        };
    }
}
