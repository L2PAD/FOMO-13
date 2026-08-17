import mongoose, { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Collection, CollectionDocument } from 'src/collections/models/collection.model';
import { CollectionNft, CollectionNftDocument } from './model/collection-nft.model';
import { CollectionNftDto } from './dto/collection-nft.dto';
import {
    CompleteCollectionNftCheckoutCurrency,
    CompleteCollectionNftCheckoutDto,
    CompleteCollectionNftCheckoutItemDto,
} from './dto/complete-checkout.dto';
import { User, UserDocument } from 'src/user/user.model';
import { Project, ProjectDocument } from 'src/projects/project.model';
import { CollectionsService } from '../collections/collections.service';
import {
    CollectionNftMarketSnapshot,
    CollectionNftMarketSnapshotDocument,
    CollectionStatsCurrency,
} from './model/collection-nft-market-snapshot.model';
import {
    CollectionNftPeriodStats,
    CollectionNftPeriodStatsDocument,
    CollectionStatsPeriod,
} from './model/collection-nft-period-stats.model';
import {
    CollectionNftSale,
    CollectionNftSaleDocument,
} from './model/collection-nft-sale.model';
import {
    CollectionNftSaleStats,
    CollectionNftSaleStatsDocument,
} from './model/collection-nft-sale-stats.model';
import { Cart, CartDocument } from 'src/cart/model/cart.model';
import { Order, OrderDocument } from 'src/orders/model/order.model';

type CheckoutListingDoc = CollectionNft & {
    _id: mongoose.Types.ObjectId
    collectionId: mongoose.Types.ObjectId
    ownerId: mongoose.Types.ObjectId
}

type FinalizeSoldListingsResult = {
    removedCount: number
    listingIds: Array<string>
}

@Injectable()
export class CollectionNftService {
    private readonly logger = new Logger(CollectionNftService.name)
    private readonly periodDurationsMs: Record<CollectionStatsPeriod, number> = {
        '1m': 1 * 60 * 1000,
        '5m': 5 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000,
    }

    constructor(
        @InjectModel(CollectionNft.name) private collectionNftModel: Model<CollectionNftDocument>,
        @InjectModel(Collection.name) private collectionModel: Model<CollectionDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(CollectionNftMarketSnapshot.name)
        private collectionNftSnapshotModel: Model<CollectionNftMarketSnapshotDocument>,
        @InjectModel(CollectionNftPeriodStats.name)
        private collectionNftPeriodStatsModel: Model<CollectionNftPeriodStatsDocument>,
        @InjectModel(CollectionNftSale.name)
        private collectionNftSaleModel: Model<CollectionNftSaleDocument>,
        @InjectModel(CollectionNftSaleStats.name)
        private collectionNftSaleStatsModel: Model<CollectionNftSaleStatsDocument>,
        @InjectModel(Cart.name)
        private cartModel: Model<CartDocument>,
        @InjectModel(Order.name)
        private orderModel: Model<OrderDocument>,
        private readonly collectionsService: CollectionsService,
    ) { }

    /** Aggregated NFT marketplace analytics for the admin Bazaar → NFT tab. */
    async getAdminNftStats(): Promise<any> {
        const [listedAgg, byCollection, salesAgg, topSellers, recentListings] = await Promise.all([
            this.collectionNftModel.aggregate([
                { $group: { _id: '$isActive', count: { $sum: 1 }, floor: { $min: '$price' }, volume: { $sum: { $ifNull: ['$price', 0] } } } },
            ]),
            this.collectionNftModel.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$collectionId', listed: { $sum: 1 }, floor: { $min: '$price' }, volume: { $sum: { $ifNull: ['$price', 0] } } } },
                { $sort: { listed: -1 } }, { $limit: 8 },
                { $lookup: { from: this.collectionModel.collection.name, localField: '_id', foreignField: '_id', as: 'c' } },
                { $unwind: { path: '$c', preserveNullAndEmptyArrays: true } },
                { $project: { _id: 1, listed: 1, floor: 1, volume: 1, name: { $ifNull: ['$c.name', 'Без названия'] }, image: '$c.image' } },
            ]),
            this.collectionNftSaleModel.aggregate([
                { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: { $ifNull: ['$price', 0] } } } },
            ]),
            this.collectionNftModel.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$ownerId', orders: { $sum: 1 }, volume: { $sum: { $ifNull: ['$price', 0] } } } },
                { $sort: { orders: -1 } }, { $limit: 8 },
                { $lookup: { from: this.userModel.collection.name, localField: '_id', foreignField: '_id', as: 'u' } },
                { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
                { $project: { _id: 1, orders: 1, volume: 1, username: '$u.username', wallet: '$u.wallet', fomoId: '$u.fomoId', rating: '$u.rating', rank: '$u.rank' } },
            ]),
            this.collectionNftModel.find({ isActive: true }).sort({ _id: -1 }).limit(20).lean(),
        ]);

        const listedActive = listedAgg.find((r) => r._id === true) || { count: 0, volume: 0, floor: 0 };
        const collectionsOnSale = byCollection.length;
        // hydrate recent listings with collection + owner names
        const ownerIds = [...new Set(recentListings.map((n: any) => String(n.ownerId)).filter(Boolean))];
        const owners = await this.userModel.find({ _id: { $in: ownerIds } }).select('username wallet fomoId').lean();
        const ownerMap: Record<string, any> = {}; owners.forEach((o: any) => (ownerMap[String(o._id)] = o));
        const colIds = [...new Set(recentListings.map((n: any) => String(n.collectionId)).filter(Boolean))];
        const cols = await this.collectionModel.find({ _id: { $in: colIds } }).select('name').lean();
        const colMap: Record<string, any> = {}; cols.forEach((c: any) => (colMap[String(c._id)] = c));

        return {
            collectionsOnSale,
            listedNfts: listedActive.count,
            listedVolumeUsd: listedActive.volume,
            floorPrice: listedActive.floor || 0,
            salesCount: salesAgg[0]?.count || 0,
            salesVolumeUsd: salesAgg[0]?.volume || 0,
            sellers: topSellers.length,
            topCollections: byCollection,
            topSellers,
            recentListings: recentListings.map((n: any) => ({
                _id: n._id, nftId: n.nftId, name: n.name, image: n.image, price: n.price,
                currency: n.isEth ? 'ETH' : 'USDC', orderId: n.orderId, endDate: n.endDate,
                collectionName: colMap[String(n.collectionId)]?.name || '—',
                owner: ownerMap[String(n.ownerId)] || null,
            })),
        };
    }


    private escapeRegExp(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    private normalizeCollectionAddress(value: string): string {
        return String(value || '').trim().toLowerCase()
    }

    private normalizeCurrency(currencyRaw?: string): CollectionStatsCurrency {
        const normalized = String(currencyRaw || 'ETH').trim().toUpperCase()
        return normalized === 'USDC' ? 'USDC' : 'ETH'
    }

    private normalizeCheckoutCurrency(currencyRaw?: string): CompleteCollectionNftCheckoutCurrency {
        const normalized = String(currencyRaw || 'ETH').trim().toUpperCase()
        return normalized === 'USDC' ? 'USDC' : 'ETH'
    }

    private normalizeMarketListingIds(idsRaw: unknown): Array<string> {
        const values = Array.isArray(idsRaw)
            ? idsRaw
            : String(idsRaw || '')
                .split(',')
                .map((item) => item.trim())

        return Array.from(
            new Set(
                values.filter(
                    (item): item is string =>
                        !!item && mongoose.Types.ObjectId.isValid(item)
                )
            )
        )
    }

    async addView(collectionNftId: string, userId: string): Promise<CollectionNftDocument> {
        if (!mongoose.Types.ObjectId.isValid(collectionNftId)) {
            throw new HttpException('Nft not found', HttpStatus.NOT_FOUND)
        }

        const uId = new mongoose.Types.ObjectId(userId)

        const nft = await this.collectionNftModel
            .findOneAndUpdate(
                {
                    _id: new mongoose.Types.ObjectId(collectionNftId),
                    viewedBy: { $ne: uId },
                },
                {
                    $addToSet: { viewedBy: uId },
                    $inc: { viewsCount: 1 },
                },
                { new: true }
            )
            .exec()

        if (nft) {
            return nft
        }

        const existingNft = await this.collectionNftModel.findById(collectionNftId).exec()
        if (!existingNft) {
            throw new HttpException('Nft not found', HttpStatus.NOT_FOUND)
        }

        return existingNft
    }

    private normalizeMarketFilterValues(raw: unknown): Array<string> {
        const values = Array.isArray(raw)
            ? raw
            : String(raw || '')
                .split(',')

        return Array.from(
            new Set(
                values
                    .map((item) => String(item || '').trim())
                    .filter(Boolean)
            )
        )
    }

    private parseMarketNumericQuery(value: unknown): number | null {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
    }

    private getMarketRange(
        query: Record<string, any>,
        key: string,
    ): { min: number | null; max: number | null } {
        return {
            min: this.parseMarketNumericQuery(query?.[`${key}Min`]),
            max: this.parseMarketNumericQuery(query?.[`${key}Max`]),
        }
    }

    private hasMarketCollectionFilters(query: Record<string, any>): boolean {
        const filterKeys = [
            'status',
            'rarity',
            'sorting',
            'rarityRankMin',
            'rarityRankMax',
            'priceRangeMin',
            'priceRangeMax',
        ]

        return filterKeys.some((key) => {
            const value = query?.[key]
            return value !== undefined && String(value).trim() !== ''
        })
    }

    private buildAttributeValueExpression(attributeNames: Array<string>): Record<string, any> {
        const normalizedNames = attributeNames.map((item) =>
            String(item || '').trim().toLowerCase()
        )

        return {
            $let: {
                vars: {
                    attribute: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: { $ifNull: ['$attributes', []] },
                                    as: 'attr',
                                    cond: {
                                        $in: [
                                            {
                                                $trim: {
                                                    input: {
                                                        $replaceAll: {
                                                            input: {
                                                                $replaceAll: {
                                                                    input: {
                                                                        $toLower: {
                                                                            $ifNull: [
                                                                                {
                                                                                    $toString: {
                                                                                        $ifNull: ['$$attr.trait_type', '$$attr.type']
                                                                                    }
                                                                                },
                                                                                '',
                                                                            ]
                                                                        }
                                                                    },
                                                                    find: '_',
                                                                    replacement: ' ',
                                                                }
                                                            },
                                                            find: '-',
                                                            replacement: ' ',
                                                        }
                                                    }
                                                }
                                            },
                                            normalizedNames,
                                        ]
                                    }
                                }
                            },
                            0,
                        ]
                    }
                },
                in: '$$attribute.value'
            }
        }
    }

    private buildAttributeStringExpression(
        attributeNames: Array<string>,
        fallback: string,
    ): Record<string, any> {
        return {
            $let: {
                vars: {
                    attributeValue: this.buildAttributeValueExpression(attributeNames),
                },
                in: {
                    $let: {
                        vars: {
                            normalizedValue: {
                                $trim: {
                                    input: {
                                        $ifNull: [
                                            { $toString: '$$attributeValue' },
                                            '',
                                        ]
                                    }
                                }
                            }
                        },
                        in: {
                            $cond: [
                                { $eq: ['$$normalizedValue', ''] },
                                fallback,
                                '$$normalizedValue'
                            ]
                        }
                    }
                }
            }
        }
    }

    private buildAttributeNumberExpression(attributeNames: Array<string>): Record<string, any> {
        return {
            $let: {
                vars: {
                    attributeValue: this.buildAttributeValueExpression(attributeNames),
                },
                in: {
                    $let: {
                        vars: {
                            numericMatch: {
                                $regexFind: {
                                    input: {
                                        $ifNull: [
                                            { $toString: '$$attributeValue' },
                                            '',
                                        ]
                                    },
                                    regex: /[0-9]+(?:\.[0-9]+)?/,
                                }
                            }
                        },
                        in: {
                            $convert: {
                                input: '$$numericMatch.match',
                                to: 'double',
                                onError: null,
                                onNull: null,
                            }
                        }
                    }
                }
            }
        }
    }

    private uniqueCheckoutItems(items: Array<CompleteCollectionNftCheckoutItemDto>) {
        const itemsMap = new Map<string, CompleteCollectionNftCheckoutItemDto>()

        for (const item of items || []) {
            const collectionNftId = String(item?.collectionNftId || '').trim()
            const orderId = Math.trunc(Number(item?.orderId || 0))
            const nftId = Math.trunc(Number(item?.nftId || 0))
            const tokenAddress = this.normalizeCollectionAddress(item?.tokenAddress)

            if (
                !collectionNftId ||
                !mongoose.Types.ObjectId.isValid(collectionNftId) ||
                orderId <= 0 ||
                nftId < 0 ||
                !tokenAddress
            ) {
                continue
            }

            const currency = this.normalizeCheckoutCurrency(item?.currency)
            const key = `${collectionNftId}:${orderId}:${currency}`

            itemsMap.set(key, {
                collectionNftId,
                orderId,
                nftId,
                tokenAddress,
                price: Number(item?.price || 0),
                currency,
            })
        }

        return Array.from(itemsMap.values())
    }

    private async finalizeSoldListings(
        items: Array<{ tokenAddress: string; nftId: number }>
    ): Promise<FinalizeSoldListingsResult> {
        const uniquePairs = Array.from(
            new Map(
                items
                    .map((item) => {
                        const tokenAddress = this.normalizeCollectionAddress(item?.tokenAddress)
                        const nftId = Math.trunc(Number(item?.nftId || 0))

                        if (!tokenAddress || !Number.isFinite(nftId)) return null

                        return [`${tokenAddress}:${nftId}`, { tokenAddress, nftId }] as const
                    })
                    .filter(Boolean) as Array<readonly [string, { tokenAddress: string; nftId: number }]>
            ).values()
        )

        if (!uniquePairs.length) {
            return { removedCount: 0, listingIds: [] }
        }

        const listings = await this.collectionNftModel.find(
            {
                $or: uniquePairs.map((item) => ({
                    tokenAddress: new RegExp(`^${this.escapeRegExp(item.tokenAddress)}$`, 'i'),
                    nftId: item.nftId,
                })),
            },
            { _id: 1, collectionId: 1 }
        )

        if (!listings?.length) {
            return { removedCount: 0, listingIds: [] }
        }

        const listingIds = listings.map((item) => new mongoose.Types.ObjectId(item._id))
        const collectionIds = Array.from(
            new Set(
                listings
                    .map((item) => String(item.collectionId || ''))
                    .filter(Boolean)
            )
        ).map((id) => new mongoose.Types.ObjectId(id))

        await this.orderModel.updateMany(
            {
                collectionNftId: { $in: listingIds },
            },
            {
                $set: {
                    isActive: false,
                },
            }
        )

        await this.collectionNftModel.deleteMany({ _id: { $in: listingIds } })

        if (collectionIds.length) {
            await this.collectionModel.updateMany(
                { _id: { $in: collectionIds } },
                {
                    $pull: {
                        nfts: { $in: listingIds }
                    }
                }
            )
        }

        return {
            removedCount: listingIds.length,
            listingIds: listingIds.map((item) => String(item)),
        }
    }

    private async updateCheckoutStats(
        items: Array<{
            collectionId: mongoose.Types.ObjectId
            tokenAddress: string
            currency: CompleteCollectionNftCheckoutCurrency
            price: number
            createdAt: Date
        }>
    ): Promise<void> {
        if (!items.length) return

        const grouped = new Map<string, {
            collectionId: mongoose.Types.ObjectId
            tokenAddress: string
            currency: CompleteCollectionNftCheckoutCurrency
            totalSalesCount: number
            totalItemsSold: number
            totalVolume: number
            lastSalePrice: number
            lastSaleAt: Date
        }>()

        for (const item of items) {
            const tokenAddress = this.normalizeCollectionAddress(item.tokenAddress)
            const key = `${tokenAddress}:${item.currency}`
            const current = grouped.get(key)

            if (!current) {
                grouped.set(key, {
                    collectionId: item.collectionId,
                    tokenAddress,
                    currency: item.currency,
                    totalSalesCount: 1,
                    totalItemsSold: 1,
                    totalVolume: Number(item.price || 0),
                    lastSalePrice: Number(item.price || 0),
                    lastSaleAt: item.createdAt,
                })
                continue
            }

            current.totalSalesCount += 1
            current.totalItemsSold += 1
            current.totalVolume += Number(item.price || 0)

            if (item.createdAt >= current.lastSaleAt) {
                current.lastSaleAt = item.createdAt
                current.lastSalePrice = Number(item.price || 0)
            }
        }

        const now = new Date()

        await this.collectionNftSaleStatsModel.bulkWrite(
            Array.from(grouped.values()).map((item) => ({
                updateOne: {
                    filter: {
                        collectionAddress: item.tokenAddress,
                        currency: item.currency,
                    },
                    update: {
                        $setOnInsert: {
                            collectionId: item.collectionId,
                            collectionAddress: item.tokenAddress,
                            currency: item.currency,
                            createdAt: now,
                        },
                        $set: {
                            updatedAt: now,
                            lastSalePrice: this.toFixedMetric(item.lastSalePrice),
                            lastSaleAt: item.lastSaleAt,
                        },
                        $inc: {
                            totalSalesCount: item.totalSalesCount,
                            totalItemsSold: item.totalItemsSold,
                            totalVolume: this.toFixedMetric(item.totalVolume),
                        },
                    },
                    upsert: true,
                },
            })),
            { ordered: false }
        )
    }

    private toMinuteBucket(now: Date = new Date()): Date {
        const bucketStart = new Date(now)
        bucketStart.setSeconds(0, 0)
        return bucketStart
    }

    private toFixedMetric(value: number): number {
        if (!Number.isFinite(value)) return 0
        return Number(value.toFixed(8))
    }

    private buildDefaultPeriodStat(period: CollectionStatsPeriod, windowStart: Date, windowEnd: Date) {
        return {
            period,
            windowStart,
            windowEnd,
            lowPrice: 0,
            highPrice: 0,
            avgPrice: 0,
            fromAvgPrice: 0,
            toAvgPrice: 0,
            growthAbs: 0,
            growthPercent: 0,
            samplesCount: 0,
            updatedAt: windowEnd,
        }
    }

    private buildPeriodStatFromSnapshots(
        snapshots: Array<{
            lowPrice: number;
            highPrice: number;
            avgPrice: number;
            bucketStart: Date;
        }>,
        period: CollectionStatsPeriod,
        windowStart: Date,
        windowEnd: Date,
    ) {
        if (!snapshots?.length) {
            return this.buildDefaultPeriodStat(period, windowStart, windowEnd)
        }

        const lowPrice = Math.min(...snapshots.map((item) => Number(item.lowPrice || 0)))
        const highPrice = Math.max(...snapshots.map((item) => Number(item.highPrice || 0)))
        const avgPriceRaw =
            snapshots.reduce((acc, item) => acc + Number(item.avgPrice || 0), 0) / snapshots.length
        const fromAvgPrice = Number(snapshots[0]?.avgPrice || 0)
        const toAvgPrice = Number(snapshots[snapshots.length - 1]?.avgPrice || 0)
        const growthAbsRaw = toAvgPrice - fromAvgPrice
        const growthPercentRaw = fromAvgPrice > 0 ? (growthAbsRaw / fromAvgPrice) * 100 : 0

        return {
            period,
            windowStart,
            windowEnd,
            lowPrice: this.toFixedMetric(lowPrice),
            highPrice: this.toFixedMetric(highPrice),
            avgPrice: this.toFixedMetric(avgPriceRaw),
            fromAvgPrice: this.toFixedMetric(fromAvgPrice),
            toAvgPrice: this.toFixedMetric(toAvgPrice),
            growthAbs: this.toFixedMetric(growthAbsRaw),
            growthPercent: this.toFixedMetric(growthPercentRaw),
            samplesCount: snapshots.length,
            updatedAt: windowEnd,
        }
    }

    private async updatePeriodStatsForCollection(
        collectionAddress: string,
        currency: CollectionStatsCurrency,
        collectionId: mongoose.Types.ObjectId | null,
        now: Date,
    ): Promise<void> {
        const periodKeys = Object.keys(this.periodDurationsMs) as Array<CollectionStatsPeriod>
        const upsertOperations: Array<any> = []

        for (const period of periodKeys) {
            const durationMs = this.periodDurationsMs[period]
            const windowStart = new Date(now.getTime() - durationMs)
            const snapshots = await this.collectionNftSnapshotModel
                .find(
                    {
                        collectionAddress,
                        currency,
                        bucketStart: { $gte: windowStart, $lte: now },
                    },
                    {
                        lowPrice: 1,
                        highPrice: 1,
                        avgPrice: 1,
                        bucketStart: 1,
                    }
                )
                .sort({ bucketStart: 1 })
                .lean()
                .exec()

            const periodPayload = this.buildPeriodStatFromSnapshots(
                snapshots as Array<{ lowPrice: number; highPrice: number; avgPrice: number; bucketStart: Date }>,
                period,
                windowStart,
                now
            )

            upsertOperations.push({
                updateOne: {
                    filter: {
                        collectionAddress,
                        currency,
                        period,
                    },
                    update: {
                        $set: {
                            ...periodPayload,
                            collectionId: collectionId || null,
                        },
                    },
                    upsert: true,
                },
            })
        }

        if (upsertOperations.length > 0) {
            await this.collectionNftPeriodStatsModel.bulkWrite(upsertOperations, { ordered: false })
        }
    }

    // @Cron(CronExpression.EVERY_MINUTE)
    async aggregateCollectionMarketStats(): Promise<void> {
        const now = new Date()
        const bucketStart = this.toMinuteBucket(now)

        try {
            const snapshots = await this.collectionNftModel.aggregate([
                {
                    $match: {
                        isActive: true,
                        price: { $gt: 0 },
                        $or: [{ isEth: true }, { isUsdc: true }],
                    },
                },
                {
                    $lookup: {
                        from: this.collectionModel.collection.name,
                        localField: 'collectionId',
                        foreignField: '_id',
                        as: 'collection',
                    },
                },
                {
                    $unwind: {
                        path: '$collection',
                        preserveNullAndEmptyArrays: false,
                    },
                },
                {
                    $project: {
                        price: { $ifNull: ['$price', 0] },
                        collectionId: '$collection._id',
                        collectionAddress: {
                            $toLower: {
                                $trim: {
                                    input: { $ifNull: ['$collection.smart', ''] },
                                },
                            },
                        },
                        currency: {
                            $cond: [{ $eq: ['$isEth', true] }, 'ETH', 'USDC'],
                        },
                    },
                },
                {
                    $match: {
                        collectionAddress: { $ne: '' },
                    },
                },
                {
                    $group: {
                        _id: {
                            collectionAddress: '$collectionAddress',
                            currency: '$currency',
                        },
                        collectionId: { $first: '$collectionId' },
                        lowPrice: { $min: '$price' },
                        highPrice: { $max: '$price' },
                        avgPrice: { $avg: '$price' },
                        listingsCount: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        collectionAddress: '$_id.collectionAddress',
                        currency: '$_id.currency',
                        collectionId: 1,
                        lowPrice: 1,
                        highPrice: 1,
                        avgPrice: 1,
                        listingsCount: 1,
                    },
                },
            ])

            if (!snapshots?.length) return

            const writeOps = snapshots.map((item) => ({
                updateOne: {
                    filter: {
                        collectionAddress: item.collectionAddress,
                        currency: item.currency,
                        bucketStart,
                    },
                    update: {
                        $set: {
                            collectionId: item.collectionId || null,
                            lowPrice: this.toFixedMetric(Number(item.lowPrice || 0)),
                            highPrice: this.toFixedMetric(Number(item.highPrice || 0)),
                            avgPrice: this.toFixedMetric(Number(item.avgPrice || 0)),
                            listingsCount: Number(item.listingsCount || 0),
                            createdAt: new Date(),
                        },
                    },
                    upsert: true,
                },
            }))

            await this.collectionNftSnapshotModel.bulkWrite(writeOps, { ordered: false })

            await Promise.all(
                snapshots.map((item) =>
                    this.updatePeriodStatsForCollection(
                        String(item.collectionAddress),
                        this.normalizeCurrency(String(item.currency)),
                        item.collectionId ? new mongoose.Types.ObjectId(item.collectionId) : null,
                        now
                    )
                )
            )
        } catch (error: any) {
            this.logger.error(
                `Failed to aggregate collection market stats: ${error?.message || error}`
            )
        }
    }

    async getCollectionStatsByAddress(collectionAddressRaw: string, currencyRaw?: string): Promise<any> {
        const collectionAddress = this.normalizeCollectionAddress(collectionAddressRaw)
        const currency = this.normalizeCurrency(currencyRaw)

        if (!collectionAddress) {
            throw new HttpException('Invalid collection address', HttpStatus.BAD_REQUEST)
        }

        const now = new Date()
        const latestSnapshot = await this.collectionNftSnapshotModel
            .findOne({ collectionAddress, currency })
            .sort({ bucketStart: -1 })
            .lean()
            .exec()

        if (latestSnapshot) {
            await this.updatePeriodStatsForCollection(
                collectionAddress,
                currency,
                latestSnapshot.collectionId
                    ? new mongoose.Types.ObjectId(latestSnapshot.collectionId)
                    : null,
                now
            )
        }

        const periodRows = await this.collectionNftPeriodStatsModel
            .find({ collectionAddress, currency })
            .lean()
            .exec()

        const periodKeys = Object.keys(this.periodDurationsMs) as Array<CollectionStatsPeriod>
        const periods = periodKeys.reduce((acc, period) => {
            const row = periodRows.find((item) => item.period === period)
            if (row) {
                acc[period] = row
                return acc
            }

            const windowStart = new Date(now.getTime() - this.periodDurationsMs[period])
            acc[period] = this.buildDefaultPeriodStat(period, windowStart, now)
            return acc
        }, {} as Record<CollectionStatsPeriod, any>)

        const recentSnapshots = await this.collectionNftSnapshotModel
            .find({ collectionAddress, currency })
            .sort({ bucketStart: -1 })
            .limit(120)
            .lean()
            .exec()

        const sales = await this.collectionNftSaleStatsModel
            .findOne({ collectionAddress, currency })
            .lean()
            .exec()

        return {
            collectionAddress,
            currency,
            latestSnapshot: latestSnapshot || null,
            periods,
            history: recentSnapshots.reverse(),
            sales: sales || {
                collectionAddress,
                currency,
                totalSalesCount: 0,
                totalItemsSold: 0,
                totalVolume: 0,
                lastSalePrice: 0,
                lastSaleAt: null,
            },
        }
    }

    async getNftFloorPriceByAddress(
        collectionAddressRaw: string,
        nftIdRaw: string | number,
        currencyRaw?: string
    ): Promise<{
        collectionAddress: string
        nftId: number
        currency: CollectionStatsCurrency
        floorPrice: number | null
        hasFloorPrice: boolean
    }> {
        const collectionAddress = this.normalizeCollectionAddress(collectionAddressRaw)
        const nftId = Math.trunc(Number(nftIdRaw))
        const currency = this.normalizeCurrency(currencyRaw)

        if (!collectionAddress) {
            throw new HttpException('Invalid collection address', HttpStatus.BAD_REQUEST)
        }

        if (!Number.isFinite(nftId) || nftId < 0) {
            throw new HttpException('Invalid nftId', HttpStatus.BAD_REQUEST)
        }

        const currencyMatch = currency === 'USDC' ? { isUsdc: true } : { isEth: true }
        const now = new Date()

        const listing = await this.collectionNftModel
            .findOne(
                {
                    tokenAddress: new RegExp(`^${this.escapeRegExp(collectionAddress)}$`, 'i'),
                    isActive: true,
                    price: { $gt: 0 },
                    orderId: { $gt: 0 },
                    ...currencyMatch,
                    $or: [
                        { endDate: null },
                        { endDate: { $exists: false } },
                        { endDate: { $gte: now } },
                    ],
                },
                {
                    price: 1,
                }
            )
            .sort({ price: 1, _id: -1 })
            .lean()
            .exec()

        let floorPrice = Number(listing?.price || 0)
        let hasFloorPrice = Number.isFinite(floorPrice) && floorPrice > 0

        if (!hasFloorPrice) {
            const lastSale = await this.collectionNftSaleModel
                .findOne(
                    {
                        tokenAddress: new RegExp(`^${this.escapeRegExp(collectionAddress)}$`, 'i'),
                        nftId,
                        currency,
                        price: { $gt: 0 },
                    },
                    {
                        price: 1,
                    }
                )
                .sort({ createdAt: -1, _id: -1 })
                .lean()
                .exec()

            floorPrice = Number(lastSale?.price || 0)
            hasFloorPrice = Number.isFinite(floorPrice) && floorPrice > 0
        }

        return {
            collectionAddress,
            nftId,
            currency,
            floorPrice: hasFloorPrice ? this.toFixedMetric(floorPrice) : null,
            hasFloorPrice,
        }
    }

    private getObjectIdDate(value: unknown): Date | null {
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

    private resolveListingCurrency(isEth?: boolean, isUsdc?: boolean): 'ETH' | 'USDC' {
        return isUsdc ? 'USDC' : 'ETH'
    }

    private toUsdPrice(priceRaw: number, currency: 'ETH' | 'USDC', ethUsdRate: number): number {
        const price = Number(priceRaw || 0)
        if (!Number.isFinite(price) || price <= 0) return 0

        if (currency === 'USDC') {
            return this.toFixedMetric(price)
        }

        return this.toFixedMetric(price * Number(ethUsdRate || 0))
    }

    private extractRarity(attributes?: Array<any>): string {
        const rarityAttr = (attributes || []).find((attribute) => {
            const traitType = String(attribute?.trait_type || attribute?.type || '')
                .trim()
                .toLowerCase()

            return traitType === 'rarity'
        })

        const rarity = String(rarityAttr?.value || '').trim()
        return rarity || 'Common'
    }

    private mapPublicUser(user: any): any {
        if (!user) {
            return {
                _id: '',
                username: '',
                photo: '',
                twitterData: null,
                wallet: '',
            }
        }

        return {
            _id: user?._id ? String(user._id) : '',
            username: String(user?.username || user?.twitterData?.name || user?.name || ''),
            photo: String(user?.photo || ''),
            twitterData: user?.twitterData || null,
            wallet: String(user?.wallet || ''),
        }
    }

    private getUserDisplayName(user: any, fallback?: string): string {
        return String(
            user?.username ||
            user?.twitterData?.name ||
            user?.name ||
            user?.wallet ||
            fallback ||
            'Unknown'
        )
    }

    private getUserAvatar(user: any): string {
        return String(user?.photo || user?.twitterData?.photo || '')
    }

    private resolveNftImage(nft: any): string {
        return String(nft?.image || nft?.external_url || '')
    }

    private buildMetadataLabel(metadataLink?: string): string {
        return metadataLink ? 'External metadata' : 'Not available'
    }

    private buildRelatedNftsPipeline(
        matchStage: Record<string, any>,
        currentNftId: string,
        limit: number,
    ): Array<any> {
        return [
            {
                $match: {
                    ...matchStage,
                    isActive: true,
                    _id: { $ne: new mongoose.Types.ObjectId(currentNftId) },
                },
            },
            {
                $lookup: {
                    from: this.collectionModel.collection.name,
                    localField: 'collectionId',
                    foreignField: '_id',
                    as: 'collection',
                },
            },
            {
                $unwind: {
                    path: '$collection',
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $lookup: {
                    from: this.projectModel.collection.name,
                    localField: 'collection.project',
                    foreignField: '_id',
                    as: 'project',
                },
            },
            {
                $addFields: {
                    project: { $arrayElemAt: ['$project', 0] },
                    rarity: {
                        $let: {
                            vars: {
                                rarityAttr: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: { $ifNull: ['$attributes', []] },
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
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        0
                                    ]
                                }
                            },
                            in: { $ifNull: ['$$rarityAttr.value', 'Common'] }
                        }
                    },
                    chain: { $ifNull: ['$project.blockchain', '-'] },
                },
            },
            { $sort: { _id: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    nftId: 1,
                    name: 1,
                    image: 1,
                    external_url: 1,
                    price: 1,
                    isEth: 1,
                    isUsdc: 1,
                    rarity: 1,
                    chain: 1,
                },
            },
        ]
    }

    private async getRelatedNfts(
        matchStage: Record<string, any>,
        currentNftId: string,
        limit: number,
        ethUsdRate: number,
    ): Promise<Array<any>> {
        const items = await this.collectionNftModel.aggregate(
            this.buildRelatedNftsPipeline(matchStage, currentNftId, limit)
        )

        return items.map((item) => {
            const currency = this.resolveListingCurrency(item?.isEth, item?.isUsdc)
            const price = Number(item?.price || 0)

            return {
                _id: String(item?._id || ''),
                nftId: Number(item?.nftId || 0),
                name: String(item?.name || ''),
                price,
                priceUsd: this.toUsdPrice(price, currency, ethUsdRate),
                currency,
                image: this.resolveNftImage(item),
                chain: String(item?.chain || '-'),
                rarity: String(item?.rarity || 'Common'),
                hiddenRarity: false,
                floorPrice: `${currency} ${this.toFixedMetric(price)}`,
                isEth: currency === 'ETH',
                isUsdc: currency === 'USDC',
            }
        })
    }

    private async getNftOrdersForPage(collectionNftId: string, isActive: boolean): Promise<Array<any>> {
        return this.orderModel.aggregate([
            {
                $match: {
                    collectionNftId: new mongoose.Types.ObjectId(collectionNftId),
                    isActive,
                },
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
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
            { $sort: { created: -1 } },
            {
                $project: {
                    _id: 1,
                    created: 1,
                    endDate: 1,
                    price: 1,
                    belowFloor: 1,
                    isEth: 1,
                    isUsdc: 1,
                    isConfirm: 1,
                    smartOrderId: 1,
                    user: {
                        _id: '$user._id',
                        username: '$user.username',
                        photo: '$user.photo',
                        twitterData: '$user.twitterData',
                        wallet: '$user.wallet',
                    },
                },
            },
        ])
    }

    private async getNftSalesForPage(collectionId: string, nftIdRaw: number, tokenAddressRaw: string): Promise<Array<any>> {
        const collectionIdObject = new mongoose.Types.ObjectId(collectionId)
        const tokenAddress = this.normalizeCollectionAddress(tokenAddressRaw)
        const nftId = Number(nftIdRaw || 0)

        return this.collectionNftSaleModel.aggregate([
            {
                $match: {
                    collectionId: collectionIdObject,
                    nftId,
                    tokenAddress: new RegExp(`^${this.escapeRegExp(tokenAddress)}$`, 'i'),
                },
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: 'buyerId',
                    foreignField: '_id',
                    as: 'buyer',
                },
            },
            {
                $unwind: {
                    path: '$buyer',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: 'sellerId',
                    foreignField: '_id',
                    as: 'seller',
                },
            },
            {
                $unwind: {
                    path: '$seller',
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 1,
                    createdAt: 1,
                    txHash: 1,
                    blockNumber: 1,
                    currency: 1,
                    price: 1,
                    buyer: {
                        _id: '$buyer._id',
                        username: '$buyer.username',
                        photo: '$buyer.photo',
                        twitterData: '$buyer.twitterData',
                        wallet: '$buyer.wallet',
                    },
                    seller: {
                        _id: '$seller._id',
                        username: '$seller.username',
                        photo: '$seller.photo',
                        twitterData: '$seller.twitterData',
                        wallet: '$seller.wallet',
                    },
                },
            },
        ])
    }

    async getUserMarketplaceDeals(
        userIdRaw: string,
        limitRaw: number = 10,
        offsetRaw: number = 0,
    ): Promise<{ deals: Array<any>; total: number }> {
        if (!mongoose.Types.ObjectId.isValid(userIdRaw)) {
            return { deals: [], total: 0 }
        }

        const userId = new mongoose.Types.ObjectId(userIdRaw)
        const limit = Math.max(1, Math.min(100, Number(limitRaw || 10)))
        const offset = Math.max(0, Number(offsetRaw || 0))

        const [result] = await this.collectionNftSaleModel.aggregate([
            {
                $match: {
                    $or: [
                        { buyerId: userId },
                        { sellerId: userId },
                    ],
                },
            },
            {
                $lookup: {
                    from: this.collectionModel.collection.name,
                    localField: 'collectionId',
                    foreignField: '_id',
                    as: 'collection',
                },
            },
            {
                $unwind: {
                    path: '$collection',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: 'buyerId',
                    foreignField: '_id',
                    as: 'buyer',
                },
            },
            {
                $unwind: {
                    path: '$buyer',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: 'sellerId',
                    foreignField: '_id',
                    as: 'seller',
                },
            },
            {
                $unwind: {
                    path: '$seller',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    isBuyerDeal: { $eq: ['$buyerId', userId] },
                    normalizedCurrency: { $toUpper: { $ifNull: ['$currency', 'ETH'] } },
                },
            },
            {
                $addFields: {
                    counterparty: {
                        $cond: ['$isBuyerDeal', '$seller', '$buyer'],
                    },
                },
            },
            { $sort: { createdAt: -1, _id: -1 } },
            {
                $facet: {
                    totalCount: [{ $count: 'count' }],
                    deals: [
                        { $skip: offset },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 1,
                                type: {
                                    $cond: ['$isBuyerDeal', 'buy', 'sell'],
                                },
                                isActive: { $literal: false },
                                status: { $literal: 'ended' },
                                name: {
                                    $cond: [
                                        { $gt: [{ $strLenCP: { $ifNull: ['$name', ''] } }, 0] },
                                        '$name',
                                        {
                                            $concat: [
                                                { $ifNull: ['$collection.name', 'NFT'] },
                                                ' #',
                                                { $toString: '$nftId' },
                                            ],
                                        },
                                    ],
                                },
                                amount: { $literal: 1 },
                                price: { $ifNull: ['$price', 0] },
                                ticker: {
                                    $cond: [
                                        { $eq: ['$normalizedCurrency', 'ETH'] },
                                        'eth',
                                        'usd',
                                    ],
                                },
                                currency: '$normalizedCurrency',
                                date: '$createdAt',
                                createDate: '$createdAt',
                                lastStatusUpdate: '$createdAt',
                                description: {
                                    $concat: [
                                        { $ifNull: ['$collection.name', 'NFT Marketplace'] },
                                        ' marketplace sale',
                                    ],
                                },
                                dealId: '$orderId',
                                movingTokens: { $literal: false },
                                serviceType: { $literal: 'NFT' },
                                section: { $literal: 'nft-market' },
                                tokenAddress: 1,
                                transaction: '$txHash',
                                nftId: 1,
                                image: 1,
                                collectionName: '$collection.name',
                                buyer: {
                                    _id: '$buyer._id',
                                    wallet: '$buyer.wallet',
                                    username: '$buyer.username',
                                    photo: '$buyer.photo',
                                    twitterData: '$buyer.twitterData',
                                },
                                seller: {
                                    _id: '$seller._id',
                                    wallet: '$seller.wallet',
                                    username: '$seller.username',
                                    photo: '$seller.photo',
                                    twitterData: '$seller.twitterData',
                                },
                                creator: {
                                    _id: '$seller._id',
                                    wallet: '$seller.wallet',
                                    username: '$seller.username',
                                    photo: '$seller.photo',
                                    twitterData: '$seller.twitterData',
                                },
                                counterparty: {
                                    _id: '$counterparty._id',
                                    wallet: '$counterparty.wallet',
                                    username: '$counterparty.username',
                                    photo: '$counterparty.photo',
                                    twitterData: '$counterparty.twitterData',
                                },
                                likesCount: { $literal: 0 },
                                dislikesCount: { $literal: 0 },
                            },
                        },
                    ],
                },
            },
        ])

        return {
            deals: result?.deals || [],
            total: result?.totalCount?.[0]?.count || 0,
        }
    }

    private buildNftPriceHistory(nft: any, sales: Array<any>, ethUsdRate: number): Array<any> {
        const currentCurrency = this.resolveListingCurrency(nft?.isEth, nft?.isUsdc)
        const currentListedAt = this.getObjectIdDate(nft?._id) || new Date()
        const points = [
            ...sales.map((sale) => {
                const currency = this.normalizeCheckoutCurrency(sale?.currency)
                const price = Number(sale?.price || 0)

                return {
                    id: `sale-${String(sale?._id || '')}`,
                    timestamp: sale?.createdAt || currentListedAt,
                    price,
                    priceUsd: this.toUsdPrice(price, currency, ethUsdRate),
                    currency,
                    source: 'sale',
                }
            }),
            {
                id: `listing-${String(nft?._id || '')}`,
                timestamp: currentListedAt,
                price: Number(nft?.price || 0),
                priceUsd: this.toUsdPrice(Number(nft?.price || 0), currentCurrency, ethUsdRate),
                currency: currentCurrency,
                source: 'listing',
            },
        ]

        return points
            .filter((item) => Number(item.priceUsd || 0) > 0)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .slice(-20)
    }

    private buildNftActivities(params: {
        nft: any
        owner: any
        collectionName: string
        activeOrders: Array<any>
        orderHistory: Array<any>
        sales: Array<any>
        ethUsdRate: number
    }): Array<any> {
        const { nft, owner, collectionName, activeOrders, orderHistory, sales, ethUsdRate } = params
        const itemImage = this.resolveNftImage(nft)
        const itemName = String(nft?.name || `NFT #${Number(nft?.nftId || 0)}`)
        const ownerName = this.getUserDisplayName(owner)
        const currentCurrency = this.resolveListingCurrency(nft?.isEth, nft?.isUsdc)
        const listedAt = this.getObjectIdDate(nft?._id) || new Date()

        const listingActivity = Number(nft?.price || 0) > 0 ? [{
            id: `listing-${String(nft?._id || '')}`,
            type: 'Listing',
            status: nft?.isActive ? 'Live' : 'Inactive',
            itemImage,
            collectionName,
            itemName,
            price: Number(nft?.price || 0),
            priceUsd: this.toUsdPrice(Number(nft?.price || 0), currentCurrency, ethUsdRate),
            currency: currentCurrency,
            from: ownerName,
            to: 'Marketplace',
            createdAt: listedAt,
        }] : []

        const orderActivities = [...activeOrders, ...orderHistory].map((order) => {
            const currency = this.resolveListingCurrency(order?.isEth, order?.isUsdc)
            const fromUser = this.getUserDisplayName(order?.user)

            return {
                id: `offer-${String(order?._id || '')}`,
                type: 'Offer',
                status: order?.isActive ? 'Open' : order?.isConfirm ? 'Accepted' : 'Closed',
                itemImage,
                collectionName,
                itemName,
                price: Number(order?.price || 0),
                priceUsd: this.toUsdPrice(Number(order?.price || 0), currency, ethUsdRate),
                currency,
                from: fromUser,
                to: ownerName,
                createdAt: order?.created || listedAt,
            }
        })

        const saleActivities = sales.map((sale) => {
            const currency = this.normalizeCheckoutCurrency(sale?.currency)

            return {
                id: `sale-${String(sale?._id || '')}`,
                type: 'Sale',
                status: 'Completed',
                itemImage,
                collectionName,
                itemName,
                price: Number(sale?.price || 0),
                priceUsd: this.toUsdPrice(Number(sale?.price || 0), currency, ethUsdRate),
                currency,
                from: this.getUserDisplayName(sale?.seller),
                to: this.getUserDisplayName(sale?.buyer),
                createdAt: sale?.createdAt || listedAt,
            }
        })

        return [...listingActivity, ...orderActivities, ...saleActivities]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50)
    }

    async getNftData(id: string): Promise<any> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new HttpException('Nft not found', HttpStatus.NOT_FOUND)
        }

        const nft = await this.collectionNftModel.findById(id).lean().exec()
        if (!nft) throw new HttpException('Nft not found', HttpStatus.NOT_FOUND)

        const [ownerRaw, collectionRaw] = await Promise.all([
            this.userModel
                .findById(nft.ownerId, {
                    username: 1,
                    photo: 1,
                    twitterData: 1,
                    wallet: 1,
                })
                .lean()
                .exec(),
            this.collectionsService.getCollection(String(nft.collectionId || '')),
        ])

        if (!collectionRaw) {
            throw new HttpException('Nft project not found', HttpStatus.NOT_FOUND)
        }

        const collection: any = collectionRaw
        const owner = this.mapPublicUser(ownerRaw)
        const creatorSource = Array.isArray(collection?.owner) ? collection.owner[0] : collection?.owner
        const creator = this.mapPublicUser(creatorSource || ownerRaw)
        const project = collection?.project || null
        const collectionName = String(collection?.name || '')
        const currency = this.resolveListingCurrency(nft?.isEth, nft?.isUsdc)
        const ethUsdRate = Number(collection?.marketStats?.ethUsdRate || 0)
        const price = Number(nft?.price || 0)
        const priceUsd = this.toUsdPrice(price, currency, ethUsdRate)
        const image = this.resolveNftImage(nft)
        const rarity = this.extractRarity(nft?.attributes)
        const endDate = nft?.endDate || null

        const [activeOrders, orderHistory, sales, relatedFromCollection, relatedFromSeller] = await Promise.all([
            this.getNftOrdersForPage(id, true),
            this.getNftOrdersForPage(id, false),
            this.getNftSalesForPage(String(nft.collectionId || ''), Number(nft.nftId || 0), String(nft.tokenAddress || '')),
            this.getRelatedNfts(
                { collectionId: new mongoose.Types.ObjectId(String(nft.collectionId)) },
                id,
                4,
                ethUsdRate,
            ),
            this.getRelatedNfts(
                { ownerId: new mongoose.Types.ObjectId(String(nft.ownerId)) },
                id,
                4,
                ethUsdRate,
            ),
        ])

        const offers = activeOrders.map((order) => {
            const orderCurrency = this.resolveListingCurrency(order?.isEth, order?.isUsdc)

            return {
                _id: String(order?._id || ''),
                price: Number(order?.price || 0),
                priceUsd: this.toUsdPrice(Number(order?.price || 0), orderCurrency, ethUsdRate),
                currency: orderCurrency,
                createdAt: order?.created || null,
                endDate: order?.endDate || null,
                canCancel: false,
                user: this.mapPublicUser(order?.user),
            }
        })

        const activities = this.buildNftActivities({
            nft,
            owner,
            collectionName,
            activeOrders,
            orderHistory,
            sales,
            ethUsdRate,
        })

        const priceHistory = this.buildNftPriceHistory(nft, sales, ethUsdRate)
        const listedAt = this.getObjectIdDate(nft?._id) || null

        return {
            ...nft,
            owner,
            project,
            collection,
            viewsCount: Number(nft?.viewsCount || 0),
            currency,
            priceUsd,
            rarity,
            hiddenRarity: false,
            displayImage: image,
            endDate,
            nftPage: {
                image,
                rarity,
                views: Number(nft?.viewsCount || 0),
                listedAt,
                endDate,
                price: {
                    amount: price,
                    usd: priceUsd,
                    currency,
                },
                description: String(nft?.description || project?.bio || ''),
                collection: {
                    _id: String(collection?._id || ''),
                    name: collectionName,
                    avatar: String(project?.logo || ''),
                    smart: String(collection?.smart || ''),
                    tokenStandard: String(collection?.tokenStandart || ''),
                    metadataLink: String(collection?.metadataLink || ''),
                    metadataLabel: this.buildMetadataLabel(collection?.metadataLink),
                    blockchain: String(project?.blockchain || '-'),
                },
                creator: {
                    ...creator,
                    avatar: this.getUserAvatar(creator),
                    displayName: this.getUserDisplayName(creator, String(collection?.creator || '')),
                },
                owner: {
                    ...owner,
                    avatar: this.getUserAvatar(owner),
                    displayName: this.getUserDisplayName(owner),
                },
                info: {
                    contractAddress: String(collection?.smart || ''),
                    tokenId: String(nft?.nftId || ''),
                    tokenStandard: String(collection?.tokenStandart || ''),
                    blockchain: String(project?.blockchain || '-'),
                    metadataLink: String(collection?.metadataLink || ''),
                    metadataLabel: this.buildMetadataLabel(collection?.metadataLink),
                },
                offers,
                activities,
                priceHistory,
                related: {
                    fromCollection: relatedFromCollection,
                    fromSeller: relatedFromSeller,
                },
            },
        }
    }

    async addNftToCollection(data: CollectionNftDto): Promise<CollectionNft> {
        const isEth = !!data?.isEth
        const isUsdc = !!data?.isUsdc

        if (isEth === isUsdc) {
            throw new HttpException('Choose exactly one currency: ETH or USDC', HttpStatus.BAD_REQUEST)
        }

        const nftId = Number(data?.nftId)
        if (!Number.isFinite(nftId)) {
            throw new HttpException('Invalid nftId', HttpStatus.BAD_REQUEST)
        }

        const tokenAddress = String(data?.tokenAddress || '').trim().toLowerCase()
        if (!tokenAddress) {
            throw new HttpException('Invalid tokenAddress', HttpStatus.BAD_REQUEST)
        }

        const orderIdRaw = Number(data?.orderId)
        if (!Number.isFinite(orderIdRaw) || orderIdRaw <= 0) {
            throw new HttpException('Invalid orderId', HttpStatus.BAD_REQUEST)
        }

        const orderId = Math.trunc(orderIdRaw)
        const endDate = data?.endDate ? new Date(data.endDate) : null

        if (data?.endDate && (!endDate || Number.isNaN(endDate.getTime()))) {
            throw new HttpException('Invalid endDate', HttpStatus.BAD_REQUEST)
        }

        const currencyMatch: Record<string, any> = isEth ? { isEth: true } : { isUsdc: true }

        const tokenAddressRegex = new RegExp(`^${this.escapeRegExp(tokenAddress)}$`, 'i')

        const existingCurrencyListing = await this.collectionNftModel.findOne({
            collectionId: new mongoose.Types.ObjectId(data.collectionId),
            nftId,
            tokenAddress: tokenAddressRegex,
            isActive: true,
            ...currencyMatch,
        })

        if (existingCurrencyListing) {
            throw new HttpException(
                `NFT is already listed in ${isEth ? 'ETH' : 'USDC'}`,
                HttpStatus.CONFLICT
            )
        }

        const nft: CollectionNftDocument = await this.collectionNftModel.create({
            ...data,
            nftId,
            price: Number(data?.price || 0),
            orderId,
            endDate,
            isEth,
            isUsdc,
            tokenAddress,
            ownerId: new mongoose.Types.ObjectId(data.ownerId),
            collectionId: new mongoose.Types.ObjectId(data.collectionId)
        })

        await this.collectionModel.findByIdAndUpdate(data.collectionId, {
            $addToSet: {
                nfts: new mongoose.Types.ObjectId(nft._id)
            }
        })

        return nft
    }

    async removeNftFromCollection(id: string): Promise<CollectionNft> {
        const nft: CollectionNftDocument = await this.collectionNftModel.findByIdAndDelete(id)
        if (!nft) throw new HttpException('Nft listing not found', HttpStatus.NOT_FOUND)

        await this.collectionModel.findByIdAndUpdate(nft.collectionId, {
            $pull: {
                nfts: new mongoose.Types.ObjectId(id)
            }
        })

        return nft
    }

    async finalizeNftSale(tokenAddress: string, nftIdRaw: number): Promise<{ removedCount: number; listingIds: Array<string> }> {
        const normalizedAddress = String(tokenAddress || '').trim().toLowerCase()
        const nftId = Number(nftIdRaw)

        if (!normalizedAddress) {
            throw new HttpException('Invalid tokenAddress', HttpStatus.BAD_REQUEST)
        }

        if (!Number.isFinite(nftId)) {
            throw new HttpException('Invalid nftId', HttpStatus.BAD_REQUEST)
        }

        return this.finalizeSoldListings([{ tokenAddress: normalizedAddress, nftId }])
    }

    async completeCheckout(userIdRaw: string, dto: CompleteCollectionNftCheckoutDto): Promise<any> {
        const userId = String(userIdRaw || '').trim()
        const txHash = String(dto?.txHash || '').trim()
        const blockNumber = Math.max(0, Number(dto?.blockNumber || 0))
        const items = this.uniqueCheckoutItems(dto?.items || [])

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            throw new HttpException('Invalid user', HttpStatus.BAD_REQUEST)
        }

        if (!txHash) {
            throw new HttpException('Transaction hash is required', HttpStatus.BAD_REQUEST)
        }

        if (!items.length) {
            throw new HttpException('Checkout items are required', HttpStatus.BAD_REQUEST)
        }

        const buyer = await this.userModel.findById(userId, { wallet: 1 }).lean().exec()
        if (!buyer) {
            throw new HttpException('Buyer not found', HttpStatus.NOT_FOUND)
        }

        const existingSales = await this.collectionNftSaleModel.find(
            {
                txHash,
                orderId: { $in: items.map((item) => item.orderId) },
            },
            {
                orderId: 1,
                currency: 1,
            }
        ).lean().exec()

        const existingSaleKeys = new Set(
            existingSales.map((item) => `${Number(item.orderId || 0)}:${this.normalizeCheckoutCurrency(item.currency)}`)
        )

        const listingIds = items.map((item) => new mongoose.Types.ObjectId(item.collectionNftId))
        const listings = await this.collectionNftModel.find(
            { _id: { $in: listingIds } }
        ).lean().exec() as Array<CheckoutListingDoc>

        const listingsMap = new Map(
            listings.map((item) => [String(item._id), item])
        )

        const missingListings = items.filter(
            (item) =>
                !existingSaleKeys.has(`${item.orderId}:${item.currency}`) &&
                !listingsMap.has(item.collectionNftId)
        )

        if (missingListings.length) {
            throw new HttpException(
                'Some checkout listings were not found. Retry syncing the successful transaction.',
                HttpStatus.CONFLICT
            )
        }

        const listingsToProcess = items
            .filter((item) => !existingSaleKeys.has(`${item.orderId}:${item.currency}`))
            .map((item) => {
                const listing = listingsMap.get(item.collectionNftId)
                if (!listing) return null

                const listingCurrency = listing.isUsdc ? 'USDC' : 'ETH'
                if (listingCurrency !== item.currency) {
                    throw new HttpException(
                        `Listing currency mismatch for order ${item.orderId}`,
                        HttpStatus.CONFLICT
                    )
                }

                if (String(listing.ownerId) === String(userId)) {
                    throw new HttpException(
                        `You cannot buy your own NFT (order ${item.orderId})`,
                        HttpStatus.CONFLICT
                    )
                }

                return { item, listing }
            })
            .filter(Boolean) as Array<{ item: CompleteCollectionNftCheckoutItemDto; listing: CheckoutListingDoc }>

        const sellerIds = Array.from(
            new Set(
                listingsToProcess
                    .map(({ listing }) => String(listing.ownerId || ''))
                    .filter((value) => mongoose.Types.ObjectId.isValid(value))
            )
        ).map((id) => new mongoose.Types.ObjectId(id))

        const sellers = await this.userModel.find(
            { _id: { $in: sellerIds } },
            { wallet: 1 }
        ).lean().exec()

        const sellersMap = new Map(
            sellers.map((item) => [String(item._id), String(item.wallet || '')])
        )

        const saleCreatedAt = new Date()

        if (listingsToProcess.length) {
            await this.collectionNftSaleModel.bulkWrite(
                listingsToProcess.map(({ item, listing }) => ({
                    updateOne: {
                        filter: {
                            txHash,
                            orderId: item.orderId,
                            currency: item.currency,
                        },
                        update: {
                            $setOnInsert: {
                                collectionNftId: new mongoose.Types.ObjectId(item.collectionNftId),
                                collectionId: new mongoose.Types.ObjectId(listing.collectionId),
                                buyerId: new mongoose.Types.ObjectId(userId),
                                sellerId: new mongoose.Types.ObjectId(listing.ownerId),
                                buyerWallet: String(buyer.wallet || ''),
                                sellerWallet: sellersMap.get(String(listing.ownerId)) || '',
                                nftId: Number(listing.nftId || item.nftId),
                                name: String(listing.name || ''),
                                image: String(listing.image || ''),
                                tokenAddress: this.normalizeCollectionAddress(listing.tokenAddress || item.tokenAddress),
                                orderId: item.orderId,
                                price: this.toFixedMetric(Number(listing.price || item.price || 0)),
                                currency: item.currency,
                                txHash,
                                blockNumber,
                                createdAt: saleCreatedAt,
                            },
                        },
                        upsert: true,
                    },
                })),
                { ordered: false }
            )

            await this.updateCheckoutStats(
                listingsToProcess.map(({ item, listing }) => ({
                    collectionId: new mongoose.Types.ObjectId(listing.collectionId),
                    tokenAddress: this.normalizeCollectionAddress(listing.tokenAddress || item.tokenAddress),
                    currency: item.currency,
                    price: this.toFixedMetric(Number(listing.price || item.price || 0)),
                    createdAt: saleCreatedAt,
                }))
            )
        }

        const finalized = await this.finalizeSoldListings(
            items.map((item) => ({
                tokenAddress: item.tokenAddress,
                nftId: item.nftId,
            }))
        )

        if (finalized.listingIds.length) {
            await this.cartModel.deleteMany({
                nftId: {
                    $in: finalized.listingIds.map((id) => new mongoose.Types.ObjectId(id))
                }
            })
        }

        return {
            success: true,
            txHash,
            blockNumber,
            processedCount: items.length,
            finalizedListingsCount: finalized.removedCount,
            finalizedListingIds: finalized.listingIds,
        }
    }

    async getMarketNfts(query: Record<string, any>): Promise<{
        nfts: Array<any>;
        total: number;
        page: number;
        limit: number;
    }> {
        const page = Math.max(1, Number(query?.page || 1));
        const limit = Math.max(1, Math.min(100, Number(query?.limit || 12)));
        const skip = (page - 1) * limit;
        const sortKey = String(query?.sort || 'newest').toLowerCase();
        const search = String(query?.search || '').trim();
        const currency = String(query?.currency || '').toLowerCase();
        const statusFilters = this.normalizeMarketFilterValues(query?.status);
        const normalizedStatusFilters = statusFilters.map((item) => item.toLowerCase());
        const rarityFilters = this.normalizeMarketFilterValues(query?.rarity);
        const sortingFilters = this.normalizeMarketFilterValues(query?.sorting);
        const selectedSorting = String(sortingFilters[0] || '').toLowerCase();
        const { min: rarityRankMin, max: rarityRankMax } = this.getMarketRange(query, 'rarityRank');
        const { min: priceRangeMin, max: priceRangeMax } = this.getMarketRange(query, 'priceRange');
        const hasListed = normalizedStatusFilters.includes('listed');
        const hasNotListed = normalizedStatusFilters.includes('not listed');
        const wantsBuyNow = normalizedStatusFilters.includes('buy now');
        const wantsRarityRanking = normalizedStatusFilters.includes('rarity ranking');
        const rarityExpression = this.buildAttributeStringExpression(['rarity'], 'Common');
        const rarityRankExpression = this.buildAttributeNumberExpression([
            'rarity rank',
            'rarity_rank',
            'rarityrank',
            'rank',
        ]);

        const matchStage: Record<string, any> = {};

        if (hasListed && !hasNotListed) {
            matchStage.isActive = true;
        } else if (hasNotListed && !hasListed) {
            matchStage.isActive = false;
        } else if (
            !hasListed &&
            !hasNotListed &&
            (
                wantsBuyNow ||
                String(query?.includeInactive || '').toLowerCase() !== 'true'
            )
        ) {
            matchStage.isActive = true;
        }

        if (currency === 'eth') {
            matchStage.isEth = true;
        }

        if (currency === 'usdc') {
            matchStage.isUsdc = true;
        }

        if (query?.collectionId && mongoose.Types.ObjectId.isValid(query.collectionId)) {
            matchStage.collectionId = new mongoose.Types.ObjectId(query.collectionId);
        }

        const pipeline: Array<any> = [{ $match: matchStage }];

        pipeline.push({
            $lookup: {
                from: this.collectionModel.collection.name,
                localField: 'collectionId',
                foreignField: '_id',
                as: 'collection'
            }
        });

        pipeline.push({
            $unwind: {
                path: '$collection',
                preserveNullAndEmptyArrays: false
            }
        });

        if (query?.type && String(query.type).toLowerCase() !== 'all') {
            pipeline.push({
                $match: {
                    'collection.type': query.type
                }
            });
        }

        if (String(query?.isPinned || '').toLowerCase() === 'true') {
            pipeline.push({
                $match: {
                    'collection.isPinned': true
                }
            });
        }

        pipeline.push({
            $lookup: {
                from: this.projectModel.collection.name,
                localField: 'collection.project',
                foreignField: '_id',
                as: 'project'
            }
        });

        pipeline.push({
            $addFields: {
                project: { $arrayElemAt: ['$project', 0] }
            }
        });

        pipeline.push({
            $lookup: {
                from: this.userModel.collection.name,
                localField: 'ownerId',
                foreignField: '_id',
                as: 'owner'
            }
        });

        pipeline.push({
            $addFields: {
                owner: { $arrayElemAt: ['$owner', 0] },
                rarity: rarityExpression,
                rarityRank: rarityRankExpression,
                chain: { $ifNull: ['$project.blockchain', '-'] },
                round: { $ifNull: ['$project.round', '-'] },
                marketType: { $ifNull: ['$project.niche', '$collection.type'] },
                collectionNftsCount: {
                    $size: {
                        $ifNull: ['$collection.nfts', []]
                    }
                }
            }
        });

        pipeline.push({
            $addFields: {
                rarityRankSortAsc: { $ifNull: ['$rarityRank', 999999999] },
                rarityRankSortDesc: { $ifNull: ['$rarityRank', -1] },
            }
        });

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { 'collection.name': { $regex: search, $options: 'i' } },
                        { 'project.name': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        if (rarityFilters.length) {
            pipeline.push({
                $match: {
                    rarity: { $in: rarityFilters }
                }
            });
        }

        const rarityRankMatch: Record<string, any> = {};

        if (wantsRarityRanking) {
            rarityRankMatch.$ne = null;
        }

        if (rarityRankMin !== null) {
            rarityRankMatch.$gte = rarityRankMin;
        }

        if (rarityRankMax !== null) {
            rarityRankMatch.$lte = rarityRankMax;
        }

        if (Object.keys(rarityRankMatch).length) {
            pipeline.push({
                $match: {
                    rarityRank: rarityRankMatch
                }
            });
        }

        if (priceRangeMin !== null || priceRangeMax !== null) {
            const priceMatch: Record<string, any> = {};

            if (priceRangeMin !== null) {
                priceMatch.$gte = priceRangeMin;
            }

            if (priceRangeMax !== null) {
                priceMatch.$lte = priceRangeMax;
            }

            pipeline.push({
                $match: {
                    price: priceMatch
                }
            });
        }

        let sortStage: Record<string, 1 | -1> = { 'collection.isPinned': -1, _id: -1 };

        if (selectedSorting === 'price low to high') {
            sortStage = { price: 1, _id: -1 };
        } else if (selectedSorting === 'price high to low') {
            sortStage = { price: -1, _id: -1 };
        } else if (selectedSorting === 'rarity low to high') {
            sortStage = { rarityRankSortAsc: 1, _id: -1 };
        } else if (selectedSorting === 'rarity high to low') {
            sortStage = { rarityRankSortDesc: -1, _id: -1 };
        } else if (wantsRarityRanking) {
            sortStage = { rarityRankSortAsc: 1, _id: -1 };
        } else if (sortKey === 'price-asc') {
            sortStage = { price: 1, _id: -1 };
        } else if (sortKey === 'price-desc') {
            sortStage = { price: -1, _id: -1 };
        } else if (sortKey === 'oldest') {
            sortStage = { _id: 1 };
        } else if (sortKey === 'newest') {
            sortStage = { _id: -1 };
        } else if (sortKey === 'trending') {
            sortStage = { price: -1, _id: -1 };
        } else if (sortKey === 'favorite') {
            sortStage = { 'collection.isPinned': -1, _id: -1 };
        } else if (sortKey === 'tier-1') {
            sortStage = { price: -1, _id: -1 };
        } else if (sortKey === 'tier-2') {
            sortStage = { price: 1, _id: -1 };
        }

        pipeline.push({ $sort: sortStage });

        pipeline.push({
            $facet: {
                totalCount: [{ $count: 'count' }],
                nfts: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            nftId: 1,
                            name: 1,
                            image: 1,
                            description: 1,
                            external_url: 1,
                            price: 1,
                            orderId: 1,
                            endDate: 1,
                            isEth: 1,
                            isUsdc: 1,
                            isActive: 1,
                            tokenAddress: 1,
                            attributes: 1,
                            rarity: 1,
                            rarityRank: 1,
                            chain: 1,
                            round: 1,
                            marketType: 1,
                            collectionNftsCount: 1,
                            views: { $ifNull: ['$viewsCount', 0] },
                            viewsCount: { $ifNull: ['$viewsCount', 0] },
                            collection: {
                                _id: '$collection._id',
                                name: '$collection.name',
                                type: '$collection.type',
                                smart: '$collection.smart',
                                royalty: '$collection.royalty',
                                mintPrice: '$collection.mintPrice',
                                isPinned: '$collection.isPinned',
                                metadataLink: '$collection.metadataLink',
                                viewsCount: { $ifNull: ['$collection.viewsCount', 0] },
                            },
                            project: {
                                _id: '$project._id',
                                name: '$project.name',
                                niche: '$project.niche',
                                round: '$project.round',
                                blockchain: '$project.blockchain',
                                logo: '$project.logo',
                            },
                            owner: {
                                username: '$owner.username',
                                photo: '$owner.photo',
                                wallet: '$owner.wallet',
                                twitterData: '$owner.twitterData',
                            }
                        }
                    }
                ]
            }
        });

        const result = await this.collectionNftModel.aggregate(pipeline);
        const nfts = result?.[0]?.nfts || [];
        const total = result?.[0]?.totalCount?.[0]?.count || 0;

        return {
            nfts,
            total,
            page,
            limit,
        };
    }

    async syncMarketNfts(query: Record<string, any>): Promise<{
        mode: 'full' | 'statuses'
        nfts: Array<any>
        total: number
        page: number
        limit: number
        statuses: Array<{ _id: string; isActive: boolean }>
        missingIds: Array<string>
        inactiveIds: Array<string>
    }> {
        const page = Math.max(1, Number(query?.page || 1))
        const limit = Math.max(1, Math.min(100, Number(query?.limit || 12)))
        const currentTotal = Math.max(0, Number(query?.currentTotal || 0))
        const ids = this.normalizeMarketListingIds(query?.ids)

        if (this.hasMarketCollectionFilters(query)) {
            const result = await this.getMarketNfts(query)

            return {
                mode: 'full',
                nfts: result.nfts,
                total: result.total,
                page: result.page,
                limit: result.limit,
                statuses: [],
                missingIds: [],
                inactiveIds: [],
            }
        }

        if (currentTotal < limit) {
            const result = await this.getMarketNfts(query)

            return {
                mode: 'full',
                nfts: result.nfts,
                total: result.total,
                page: result.page,
                limit: result.limit,
                statuses: [],
                missingIds: [],
                inactiveIds: [],
            }
        }

        if (!ids.length) {
            return {
                mode: 'statuses',
                nfts: [],
                total: currentTotal,
                page,
                limit,
                statuses: [],
                missingIds: [],
                inactiveIds: [],
            }
        }

        const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id))
        const items = await this.collectionNftModel
            .find(
                { _id: { $in: objectIds } },
                { _id: 1, isActive: 1 }
            )
            .lean()
            .exec()

        const statusMap = new Map<string, boolean>()

        for (const item of items) {
            statusMap.set(String(item._id), item?.isActive !== false)
        }

        const missingIds = ids.filter((id) => !statusMap.has(id))
        const inactiveIds = ids.filter((id) => statusMap.has(id) && statusMap.get(id) === false)
        const removedCount = missingIds.length + inactiveIds.length

        return {
            mode: 'statuses',
            nfts: [],
            total: Math.max(0, currentTotal - removedCount),
            page,
            limit,
            statuses: Array.from(statusMap.entries()).map(([_id, isActive]) => ({
                _id,
                isActive,
            })),
            missingIds,
            inactiveIds,
        }
    }
}
