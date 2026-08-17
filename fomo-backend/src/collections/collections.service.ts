import mongoose, { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Collection, CollectionDocument } from './models/collection.model';
import { Project, ProjectDocument } from 'src/projects/project.model';
import { CollectionDto } from './dto/collection.dto';
import { CollectionNft, CollectionNftDocument } from 'src/collection-nft/model/collection-nft.model';
import {
    CollectionNftSale,
    CollectionNftSaleDocument,
} from 'src/collection-nft/model/collection-nft-sale.model';
import {
    Coinmarketcap,
    CoinmarketcapDocument,
} from 'src/coinmarketcap/models/coinmarketcap.model';
import { User, UserDocument } from 'src/user/user.model';
import axios from 'axios';

type CollectionMarketStatsPeriod = '1m' | '5m' | '1h' | '24h' | '7d' | '1y';

type CollectionListingStatsPoint = {
    minPriceUsd: number
    maxPriceUsd: number
    avgPriceUsd: number
    listingsCount: number
}

type CollectionListingStatsPeriodPoint = CollectionListingStatsPoint & {
    windowStart: Date
    windowEnd: Date
}

type CollectionListingRecord = {
    listedAt: Date
    priceUsd: number
}

type CollectionMarketStats = {
    ethUsdRate: number
    allTime: CollectionListingStatsPoint
    periods: Record<CollectionMarketStatsPeriod, CollectionListingStatsPeriodPoint>
    updatedAt: Date
}

@Injectable()
export class CollectionsService {
    private readonly marketStatsPeriodsMs: Record<CollectionMarketStatsPeriod, number> = {
        '1m': 1 * 60 * 1000,
        '5m': 5 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000,
    }

    constructor(
        @InjectModel(Collection.name) private CollectionModel: Model<CollectionDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(CollectionNft.name) private collectionNftModel: Model<CollectionNftDocument>,
        @InjectModel(CollectionNftSale.name)
        private collectionNftSaleModel: Model<CollectionNftSaleDocument>,
        @InjectModel(Coinmarketcap.name)
        private coinmarketcapModel: Model<CoinmarketcapDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {
        // this.removeCollections()
    }

    private roundUsdValue(value: number): number {
        if (!Number.isFinite(value)) return 0
        return Number(value.toFixed(2))
    }

    private buildEmptyStatsPoint(): CollectionListingStatsPoint {
        return {
            minPriceUsd: 0,
            maxPriceUsd: 0,
            avgPriceUsd: 0,
            listingsCount: 0,
        }
    }

    private buildEmptyPeriodPoint(
        windowStart: Date,
        windowEnd: Date,
    ): CollectionListingStatsPeriodPoint {
        return {
            ...this.buildEmptyStatsPoint(),
            windowStart,
            windowEnd,
        }
    }

    private summarizeListingRecords(
        records: Array<CollectionListingRecord>,
    ): CollectionListingStatsPoint {
        if (!records?.length) {
            return this.buildEmptyStatsPoint()
        }

        const prices = records
            .map((item) => Number(item.priceUsd || 0))
            .filter((value) => Number.isFinite(value) && value > 0)

        if (!prices.length) {
            return this.buildEmptyStatsPoint()
        }

        const total = prices.reduce((acc, value) => acc + value, 0)

        return {
            minPriceUsd: this.roundUsdValue(Math.min(...prices)),
            maxPriceUsd: this.roundUsdValue(Math.max(...prices)),
            avgPriceUsd: this.roundUsdValue(total / prices.length),
            listingsCount: prices.length,
        }
    }

    private getObjectIdTimestamp(value: unknown): Date | null {
        try {
            if (!value) return null

            const objectId =
                value instanceof mongoose.Types.ObjectId
                    ? value
                    : new mongoose.Types.ObjectId(String(value))

            return objectId.getTimestamp()
        } catch {
            return null
        }
    }

    private normalizeListingCurrency(
        isEth?: boolean,
        isUsdc?: boolean,
        currencyRaw?: string,
    ): 'ETH' | 'USDC' | null {
        if (String(currencyRaw || '').toUpperCase() === 'USDC') return 'USDC'
        if (String(currencyRaw || '').toUpperCase() === 'ETH') return 'ETH'
        if (isUsdc) return 'USDC'
        if (isEth) return 'ETH'
        return null
    }

    private toUsdPrice(
        priceRaw: number,
        currency: 'ETH' | 'USDC',
        ethUsdRate: number,
    ): number {
        const price = Number(priceRaw || 0)
        if (!Number.isFinite(price) || price <= 0) return 0

        if (currency === 'ETH') {
            const converted = price * Number(ethUsdRate || 0)
            return Number.isFinite(converted) && converted > 0 ? converted : 0
        }

        return price
    }

    private async resolveEthUsdRate(): Promise<number> {
        const storedRate = await this.coinmarketcapModel
            .findOne({}, { data: 1 })
            .sort({ _id: -1 })
            .lean()
            .exec()

        const ethUsdRate = Number(storedRate?.data?.ethereumPrice || 0)
        if (Number.isFinite(ethUsdRate) && ethUsdRate > 0) {
            return ethUsdRate
        }

        try {
            const { data } = await axios.get(
                'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
                { timeout: 5000 }
            )

            const fallbackRate = Number(data?.ethereum?.usd || 0)
            return Number.isFinite(fallbackRate) && fallbackRate > 0
                ? fallbackRate
                : 0
        } catch {
            return 0
        }
    }

    private async getCollectionMarketStats(collectionId: string): Promise<CollectionMarketStats> {
        const now = new Date()
        const periodKeys = Object.keys(this.marketStatsPeriodsMs) as Array<CollectionMarketStatsPeriod>

        if (!mongoose.Types.ObjectId.isValid(collectionId)) {
            return {
                ethUsdRate: 0,
                allTime: this.buildEmptyStatsPoint(),
                periods: periodKeys.reduce((acc, period) => {
                    const windowStart = new Date(now.getTime() - this.marketStatsPeriodsMs[period])
                    acc[period] = this.buildEmptyPeriodPoint(windowStart, now)
                    return acc
                }, {} as Record<CollectionMarketStatsPeriod, CollectionListingStatsPeriodPoint>),
                updatedAt: now,
            }
        }

        const collectionObjectId = new mongoose.Types.ObjectId(collectionId)
        const ethUsdRate = await this.resolveEthUsdRate()

        const [activeListings, soldListings] = await Promise.all([
            this.collectionNftModel.find(
                {
                    collectionId: collectionObjectId,
                    price: { $gt: 0 },
                    $or: [{ isEth: true }, { isUsdc: true }],
                },
                {
                    _id: 1,
                    price: 1,
                    orderId: 1,
                    isEth: 1,
                    isUsdc: 1,
                }
            ).lean().exec(),
            this.collectionNftSaleModel.find(
                {
                    collectionId: collectionObjectId,
                    price: { $gt: 0 },
                    currency: { $in: ['ETH', 'USDC'] },
                },
                {
                    _id: 1,
                    collectionNftId: 1,
                    price: 1,
                    orderId: 1,
                    currency: 1,
                    createdAt: 1,
                }
            ).lean().exec(),
        ])

        const recordsMap = new Map<string, CollectionListingRecord>()

        for (const item of activeListings || []) {
            const currency = this.normalizeListingCurrency(item?.isEth, item?.isUsdc)
            if (!currency) continue

            const priceUsd = this.toUsdPrice(Number(item?.price || 0), currency, ethUsdRate)
            if (!priceUsd) continue

            const listedAt = this.getObjectIdTimestamp(item?._id) || now
            const orderId = Math.trunc(Number(item?.orderId || 0))
            const key = orderId > 0 ? `${orderId}:${currency}` : `active:${String(item?._id || '')}`

            recordsMap.set(key, {
                listedAt,
                priceUsd,
            })
        }

        for (const item of soldListings || []) {
            const currency = this.normalizeListingCurrency(false, false, String(item?.currency || ''))
            if (!currency) continue

            const priceUsd = this.toUsdPrice(Number(item?.price || 0), currency, ethUsdRate)
            if (!priceUsd) continue

            const listedAt =
                this.getObjectIdTimestamp(item?.collectionNftId) ||
                this.getObjectIdTimestamp(item?._id) ||
                (item?.createdAt ? new Date(item.createdAt) : now)

            const orderId = Math.trunc(Number(item?.orderId || 0))
            const key = orderId > 0 ? `${orderId}:${currency}` : `sale:${String(item?._id || '')}`

            if (recordsMap.has(key)) continue

            recordsMap.set(key, {
                listedAt,
                priceUsd,
            })
        }

        const records = Array.from(recordsMap.values()).filter(
            (item) =>
                item?.listedAt instanceof Date &&
                !Number.isNaN(item.listedAt.getTime()) &&
                Number.isFinite(item.priceUsd) &&
                item.priceUsd > 0
        )

        const periods = periodKeys.reduce((acc, period) => {
            const windowStart = new Date(now.getTime() - this.marketStatsPeriodsMs[period])
            const periodRecords = records.filter((item) => item.listedAt >= windowStart)

            acc[period] = {
                ...this.summarizeListingRecords(periodRecords),
                windowStart,
                windowEnd: now,
            }

            return acc
        }, {} as Record<CollectionMarketStatsPeriod, CollectionListingStatsPeriodPoint>)

        return {
            ethUsdRate: this.roundUsdValue(ethUsdRate),
            allTime: this.summarizeListingRecords(records),
            periods,
            updatedAt: now,
        }
    }


    async removeCollections() {
        await this.CollectionModel.deleteMany({}).exec()
        await this.collectionNftModel.deleteMany({}).exec()
    }

    async getCollections(): Promise<Array<CollectionDocument>> {
        const collections: Array<CollectionDocument>
            =
            await this.CollectionModel.aggregate([
                {
                    $lookup: {
                        from: this.userModel.collection.name,
                        localField: "creator",
                        foreignField: "wallet",
                        as: "owner"
                    }
                },
                {
                    $lookup: {
                        from: this.collectionNftModel.collection.name,
                        let: { nftIds: { $ifNull: ['$nfts', []] } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ['$_id', '$$nftIds'] }
                                }
                            },
                            {
                                $addFields: {
                                    viewsCount: { $ifNull: ['$viewsCount', 0] }
                                }
                            }
                        ],
                        as: "nfts"
                    }
                },
                {
                    $lookup: {
                        from: this.projectModel.collection.name,
                        localField: "project",
                        foreignField: "_id",
                        as: "project"
                    }
                },
                {
                    $unwind: "$project"
                }
            ])

        return collections
    }

    async getCollection(id: string): Promise<any> {
        const collections: Array<CollectionDocument>
            =
            await this.CollectionModel.aggregate([
                {
                    $match: { _id: new mongoose.Types.ObjectId(id) }
                },
                {
                    $lookup: {
                        from: this.userModel.collection.name,
                        localField: "creator",
                        foreignField: "wallet",
                        as: "owner"
                    }
                },
                {
                    $lookup: {
                        from: this.collectionNftModel.collection.name,
                        let: { nftIds: { $ifNull: ['$nfts', []] } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ['$_id', '$$nftIds'] }
                                }
                            },
                            {
                                $addFields: {
                                    viewsCount: { $ifNull: ['$viewsCount', 0] }
                                }
                            }
                        ],
                        as: "nfts"
                    }
                },
                {
                    $lookup: {
                        from: this.projectModel.collection.name,
                        localField: "project",
                        foreignField: "_id",
                        as: "project"
                    }
                },
                {
                    $unwind: "$project"
                }
            ])

        if (!collections?.length) throw new HttpException('Collection not founded', HttpStatus.NOT_FOUND)

        const collection = collections[0]
        const marketStats = await this.getCollectionMarketStats(String(collection?._id || ''))

        return {
            ...collection,
            marketStats,
        }
    }

    async createCollection(data: CollectionDto): Promise<CollectionDocument> {
        const existing = await this.CollectionModel.findOne({ smart: data.smart }).exec()
        if (existing) {
            throw new HttpException('Collection with this address already exists', HttpStatus.CONFLICT)
        }

        return this.CollectionModel.create({
            ...data,
            project: new mongoose.Types.ObjectId(data.project),
        })
    }

    async updateCollection(id: string, data: CollectionDto): Promise<CollectionDocument> {
        delete data._id
        delete data.__v
        return this.CollectionModel.findByIdAndUpdate(id, {
            ...data,
            project: new mongoose.Types.ObjectId(data.project)
        })
    }

    async deleteCollection(id: string): Promise<CollectionDocument> {
        return this.CollectionModel.findByIdAndDelete(id)
    }

    async toggleIsPinned(collectionId: string): Promise<CollectionDocument> {
        const collection = await this.CollectionModel.findById(collectionId).exec();

        if (collection) {
            collection.isPinned = !collection.isPinned;
            return collection.save();
        }
    }

    async addView(collectionId: string, userId: string): Promise<CollectionDocument> {
        const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId)

        const collection = await this.CollectionModel
            .findOneAndUpdate(
                {
                    _id: new mongoose.Types.ObjectId(collectionId),
                    viewedBy: { $ne: uId },
                },
                {
                    $addToSet: { viewedBy: uId },
                    $inc: { viewsCount: 1 },
                },
                { new: true }
            )
            .exec()

        if (collection) {
            return collection
        }

        const existingCollection = await this.CollectionModel.findById(collectionId).exec()
        if (!existingCollection) {
            throw new HttpException('Collection not founded', HttpStatus.NOT_FOUND)
        }

        return existingCollection
    }

    async addLike(collectionId: string, userId: string): Promise<CollectionDocument> {
        const collection = await this.CollectionModel.findById(collectionId).exec();
        const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

        if (!collection) {
            throw new HttpException('Collection not founded', HttpStatus.NOT_FOUND);
        }

        const hasLike = Array.isArray(collection.likes)
            && collection.likes.some((id: mongoose.Types.ObjectId) => String(id) === String(uId));

        if (hasLike) {
            return this.CollectionModel
                .findByIdAndUpdate(
                    collectionId,
                    { $pull: { likes: uId } },
                    { new: true }
                )
                .exec();
        }

        return this.CollectionModel
            .findByIdAndUpdate(
                collectionId,
                {
                    $addToSet: { likes: uId },
                    $pull: { dislikes: uId }
                },
                { new: true }
            )
            .exec();
    }

    async addDislike(collectionId: string, userId: string): Promise<CollectionDocument> {
        const collection = await this.CollectionModel.findById(collectionId).exec();
        const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

        if (!collection) {
            throw new HttpException('Collection not founded', HttpStatus.NOT_FOUND);
        }

        const hasDislike = Array.isArray(collection.dislikes)
            && collection.dislikes.some((id: mongoose.Types.ObjectId) => String(id) === String(uId));

        if (hasDislike) {
            return this.CollectionModel
                .findByIdAndUpdate(
                    collectionId,
                    { $pull: { dislikes: uId } },
                    { new: true }
                )
                .exec();
        }

        return this.CollectionModel
            .findByIdAndUpdate(
                collectionId,
                {
                    $addToSet: { dislikes: uId },
                    $pull: { likes: uId }
                },
                { new: true }
            )
            .exec();
    }

    async toggleFlag(
        collectionId: string,
        userId: string,
        type: 'green' | 'yellow' | 'red'
    ): Promise<CollectionDocument> {
        const collection = await this.CollectionModel.findById(collectionId).exec();
        const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

        if (!collection) {
            throw new HttpException('Collection not founded', HttpStatus.NOT_FOUND);
        }

        const targetField =
            type === 'green'
                ? 'greenFlags'
                : type === 'yellow'
                    ? 'yellowFlags'
                    : 'redFlags';

        const hasCurrentFlag = Array.isArray(collection[targetField])
            && collection[targetField].some(
                (id: mongoose.Types.ObjectId) => String(id) === String(uId)
            );

        if (hasCurrentFlag) {
            return this.CollectionModel
                .findByIdAndUpdate(
                    collectionId,
                    { $pull: { [targetField]: uId } },
                    { new: true }
                )
                .exec();
        }

        return this.CollectionModel
            .findByIdAndUpdate(
                collectionId,
                {
                    $addToSet: { [targetField]: uId },
                    $pull:
                        targetField === 'greenFlags'
                            ? { yellowFlags: uId, redFlags: uId }
                            : targetField === 'yellowFlags'
                                ? { greenFlags: uId, redFlags: uId }
                                : { greenFlags: uId, yellowFlags: uId }
                },
                { new: true }
            )
            .exec();
    }

    async getMarketCollections(query: Record<string, any>): Promise<{
        collections: Array<any>;
        total: number;
        page: number;
        limit: number;
    }> {
        const page = Math.max(1, Number(query?.page || 1));
        const limit = Math.max(1, Math.min(100, Number(query?.limit || 12)));
        const skip = (page - 1) * limit;
        const sortKey = String(query?.sort || 'all').toLowerCase();
        const search = String(query?.search || '').trim();
        const currency = String(query?.currency || '').toLowerCase();

        const matchStage: Record<string, any> = {};

        if (search) {
            matchStage.name = { $regex: search, $options: 'i' };
        }

        if (query?.type && String(query.type).toLowerCase() !== 'all') {
            matchStage.type = query.type;
        }

        if (query?.projectId && mongoose.Types.ObjectId.isValid(query.projectId)) {
            matchStage.project = new mongoose.Types.ObjectId(query.projectId);
        }

        if (String(query?.isPinned || '').toLowerCase() === 'true') {
            matchStage.isPinned = true;
        }

        const nftMatch: Record<string, any> = {};
        if (String(query?.includeInactive || '').toLowerCase() !== 'true') {
            nftMatch.isActive = true;
        }

        if (currency === 'eth') {
            nftMatch.isEth = true;
        }

        if (currency === 'usdc') {
            nftMatch.isUsdc = true;
        }

        const pipeline: Array<any> = [];

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push({
            $lookup: {
                from: this.userModel.collection.name,
                let: { creatorValue: '$creator' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $eq: [{ $toString: '$_id' }, { $toString: '$$creatorValue' }] },
                                    { $eq: ['$wallet', '$$creatorValue'] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            photo: 1,
                            wallet: 1,
                            twitterData: 1,
                        }
                    }
                ],
                as: 'owner'
            }
        });

        pipeline.push({
            $lookup: {
                from: this.collectionNftModel.collection.name,
                let: { nftIds: { $ifNull: ['$nfts', []] } },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ['$_id', '$$nftIds'] },
                            ...nftMatch
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            image: 1,
                            attributes: 1,
                            nftId: 1,
                            price: 1,
                            orderId: 1,
                            isEth: 1,
                            isUsdc: 1,
                            isActive: 1,
                            viewsCount: { $ifNull: ['$viewsCount', 0] },
                        }
                    }
                ],
                as: 'nfts'
            }
        });

        pipeline.push({
            $lookup: {
                from: this.projectModel.collection.name,
                localField: 'project',
                foreignField: '_id',
                as: 'project'
            }
        });

        pipeline.push({
            $addFields: {
                owner: { $arrayElemAt: ['$owner', 0] },
                project: { $arrayElemAt: ['$project', 0] },
                nftsCount: { $size: '$nfts' },
                floorPrice: { $ifNull: [{ $min: '$nfts.price' }, 0] },
                previewImage: {
                    $ifNull: [
                        { $arrayElemAt: ['$nfts.image', 0] },
                        '$project.logo'
                    ]
                },
                chain: { $ifNull: ['$project.blockchain', '-'] },
                round: { $ifNull: ['$project.round', '-'] },
                marketType: { $ifNull: ['$project.niche', '$type'] },
                rarity: {
                    $let: {
                        vars: {
                            firstNftAttrs: { $ifNull: [{ $arrayElemAt: ['$nfts.attributes', 0] }, []] }
                        },
                        in: {
                            $ifNull: [
                                {
                                    $let: {
                                        vars: {
                                            rarityAttr: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: '$$firstNftAttrs',
                                                            as: 'attr',
                                                            cond: {
                                                                $or: [
                                                                    {
                                                                        $eq: [
                                                                            {
                                                                                $toLower: {
                                                                                    $ifNull: [{ $toString: '$$attr.trait_type' }, '']
                                                                                }
                                                                            },
                                                                            'rarity'
                                                                        ]
                                                                    },
                                                                    {
                                                                        $eq: [
                                                                            {
                                                                                $toLower: {
                                                                                    $ifNull: [{ $toString: '$$attr.type' }, '']
                                                                                }
                                                                            },
                                                                            'rarity'
                                                                        ]
                                                                    },
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: '$$rarityAttr.value'
                                    }
                                },
                                'Common'
                            ]
                        }
                    }
                }
            }
        });

        pipeline.push({
            $match: {
                nftsCount: { $gt: 0 }
            }
        });

        let sortStage: Record<string, 1 | -1> = { isPinned: -1, nftsCount: -1, _id: -1 };

        if (sortKey === 'trending') {
            sortStage = { nftsCount: -1, floorPrice: -1, _id: -1 };
        }

        if (sortKey === 'new') {
            sortStage = { _id: -1 };
        }

        if (sortKey === 'favorite') {
            sortStage = { isPinned: -1, nftsCount: -1, _id: -1 };
        }

        if (sortKey === 'tier-1') {
            sortStage = { floorPrice: -1, nftsCount: -1, _id: -1 };
        }

        if (sortKey === 'tier-2') {
            sortStage = { floorPrice: 1, nftsCount: -1, _id: -1 };
        }

        pipeline.push({ $sort: sortStage });

        pipeline.push({
            $facet: {
                totalCount: [{ $count: 'count' }],
                collections: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            type: 1,
                            smart: 1,
                            royalty: 1,
                            mintPrice: 1,
                            isPinned: 1,
                            metadataLink: 1,
                            owner: 1,
                            project: 1,
                            nfts: 1,
                            nftsCount: 1,
                            floorPrice: 1,
                            previewImage: 1,
                            chain: 1,
                            round: 1,
                            marketType: 1,
                            rarity: 1,
                            likes: 1,
                            dislikes: 1,
                            viewsCount: 1,
                            greenFlags: 1,
                            yellowFlags: 1,
                            redFlags: 1,
                        }
                    }
                ]
            }
        });

        const result = await this.CollectionModel.aggregate(pipeline);
        const collections = result?.[0]?.collections || [];
        const total = result?.[0]?.totalCount?.[0]?.count || 0;

        return {
            collections,
            total,
            page,
            limit,
        };
    }
}
