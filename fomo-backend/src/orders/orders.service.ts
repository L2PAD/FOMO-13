import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import { Order, OrderDocument } from './model/order.model';
import { User, UserDocument } from 'src/user/user.model';
import { Project, ProjectDocument } from 'src/projects/project.model';
import { CollectionNft, CollectionNftDocument } from 'src/collection-nft/model/collection-nft.model';
import { Collection, CollectionDocument } from 'src/collections/models/collection.model';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(CollectionNft.name) private nftModel: Model<CollectionNftDocument>,
        @InjectModel(Collection.name) private collectionModel: Model<CollectionDocument>,
    ){
        // this.deleteMany()
    }

    private async deleteMany() {
        await this.orderModel.deleteMany({})
    }

    private toObjectId(value: string, message: string): mongoose.Types.ObjectId {
        const normalizedValue = String(value || '').trim()

        if (!mongoose.Types.ObjectId.isValid(normalizedValue)) {
            throw new HttpException(message, HttpStatus.BAD_REQUEST)
        }

        return new mongoose.Types.ObjectId(normalizedValue)
    }

    private parsePositiveNumber(value: string | undefined, fallback: number): number {
        const parsedValue = Math.trunc(Number(value || fallback))

        if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
            return fallback
        }

        return parsedValue
    }

    private parseNumber(value: string | undefined): number | null {
        const parsedValue = Number(value)

        if (!Number.isFinite(parsedValue)) {
            return null
        }

        return parsedValue
    }

    private parseDate(value: string | undefined): Date | null {
        if (!value) {
            return null
        }

        const parsedValue = new Date(value)

        if (Number.isNaN(parsedValue.getTime())) {
            return null
        }

        return parsedValue
    }

    private parseStringList(value: string | undefined): string[] {
        return String(value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
    }

    private getUserOrdersStatusExpression(now: Date) {
        return {
            $switch: {
                branches: [
                    {
                        case: { $eq: ['$isActive', false] },
                        then: {
                            $cond: [
                                { $eq: ['$isConfirm', true] },
                                'Completed',
                                'Rejected',
                            ],
                        },
                    },
                    {
                        case: { $eq: ['$isConfirm', true] },
                        then: 'Approved',
                    },
                    {
                        case: { $lte: ['$endDate', now] },
                        then: 'Rejected',
                    },
                ],
                default: 'Pending',
            },
        }
    }

    async getUserOrders(
        userId:string,
        query: Record<string, string | undefined> = {}
    ) : Promise<{
        orders: Array<any>
        total: number
        page: number
        limit: number
        totalPages: number
        maxPrice: number
    }> {
        const page = this.parsePositiveNumber(query.page, 1)
        const limit = Math.min(this.parsePositiveNumber(query.limit, 20), 100)
        const skip = (page - 1) * limit
        const now = new Date()
        const validStatuses = ['Completed', 'Approved', 'Pending', 'Rejected']
        const rawStatuses = this.parseStringList(query.statuses)
        const statuses = rawStatuses
            .filter((status) => validStatuses.includes(status))
        const currencies = this.parseStringList(query.currencies)
            .filter((currency) => ['ETH', 'USDC'].includes(currency))
        const createdStartDate = this.parseDate(query.createdStartDate)
        const createdEndDate = this.parseDate(query.createdEndDate)
        const expirationStartDate = this.parseDate(query.expirationStartDate)
        const expirationEndDate = this.parseDate(query.expirationEndDate)
        const minPrice = this.parseNumber(query.minPrice)
        const maxPrice = this.parseNumber(query.maxPrice)
        const userObjectId = new mongoose.Types.ObjectId(userId)
        const pipeline: any[] = [
            {
                $match: {
                    userId: userObjectId,
                }
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' }, 
            {
                $lookup: {
                    from: this.projectModel.collection.name,
                    localField: 'projectId',
                    foreignField: '_id',
                    as: 'project'
                }
            },
            {
                $unwind: {
                    path: '$project',
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $lookup: {
                    from: this.collectionModel.collection.name,
                    localField: 'collectionId',
                    foreignField: '_id',
                    as: 'collection'
                }
            },
            {
                $unwind: {
                    path: '$collection',
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $lookup: {
                    from: this.nftModel.collection.name,
                    localField: 'collectionNftId',
                    foreignField: '_id',
                    as: 'nft'
                }
            },
            {
                $unwind: {
                    path: '$nft',
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $lookup: {
                    from: 'collection_nft_sales',
                    let: {
                        collectionNftId: '$collectionNftId',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$collectionNftId', '$$collectionNftId'],
                                },
                            },
                        },
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $limit: 1,
                        },
                        {
                            $project: {
                                _id: 0,
                                collectionNftId: 1,
                                collectionId: 1,
                                nftId: 1,
                                name: 1,
                                image: 1,
                                tokenAddress: 1,
                            },
                        },
                    ],
                    as: 'latestSale',
                },
            },
            {
                $addFields: {
                    latestSale: { $arrayElemAt: ['$latestSale', 0] },
                    nft: {
                        $cond: [
                            { $ifNull: ['$nft._id', false] },
                            '$nft',
                            {
                                _id: '$collectionNftId',
                                collectionId: { $ifNull: ['$latestSale.collectionId', '$collectionId'] },
                                nftId: { $ifNull: ['$latestSale.nftId', null] },
                                name: { $ifNull: ['$latestSale.name', 'NFT'] },
                                image: { $ifNull: ['$latestSale.image', ''] },
                                tokenAddress: { $ifNull: ['$latestSale.tokenAddress', ''] },
                                isActive: false,
                            },
                        ],
                    },
                    status: this.getUserOrdersStatusExpression(now),
                }
            },
        ]

        const filterMatch: Record<string, any> = {}

        if (rawStatuses.length && !statuses.length) {
            filterMatch.status = { $in: [] }
        } else if (statuses.length) {
            filterMatch.status = { $in: statuses }
        }

        if (currencies.length === 1) {
            filterMatch[currencies[0] === 'USDC' ? 'isUsdc' : 'isEth'] = true
        }

        if (minPrice !== null || maxPrice !== null) {
            filterMatch.price = {}

            if (minPrice !== null) {
                filterMatch.price.$gte = minPrice
            }

            if (maxPrice !== null) {
                filterMatch.price.$lte = maxPrice
            }
        }

        if (createdStartDate || createdEndDate) {
            filterMatch.created = {}

            if (createdStartDate) {
                const startDate = new Date(createdStartDate)
                startDate.setHours(0, 0, 0, 0)
                filterMatch.created.$gte = startDate
            }

            if (createdEndDate) {
                const endDate = new Date(createdEndDate)
                endDate.setHours(23, 59, 59, 999)
                filterMatch.created.$lte = endDate
            }
        }

        if (expirationStartDate || expirationEndDate) {
            filterMatch.endDate = {}

            if (expirationStartDate) {
                const startDate = new Date(expirationStartDate)
                startDate.setHours(0, 0, 0, 0)
                filterMatch.endDate.$gte = startDate
            }

            if (expirationEndDate) {
                const endDate = new Date(expirationEndDate)
                endDate.setHours(23, 59, 59, 999)
                filterMatch.endDate.$lte = endDate
            }
        }

        if (Object.keys(filterMatch).length) {
            pipeline.push({
                $match: filterMatch,
            })
        }

        const projectStage: any = {
            $project: {
                user: {
                    username: 1,
                    twitterData: 1,
                    photo: 1,
                    wallet: 1
                },
                project: 1,
                collection: 1,
                nft: 1,
                collectionNftId: 1,
                isActive: 1,
                price: 1,
                belowFloor: 1,
                created: 1,
                endDate: 1,
                isEth: 1,
                isConfirm: 1,
                isUsdc: 1,
                smartOrderId: 1,
                status: 1,
            }
        }

        const [orders, countResult, maxPriceResult] = await Promise.all([
            this.orderModel.aggregate([
                ...pipeline,
                {
                    $sort: {
                        created: -1,
                    }
                },
                projectStage,
                { $skip: skip },
                { $limit: limit },
            ]),
            this.orderModel.aggregate([
                ...pipeline,
                { $count: 'total' },
            ]),
            this.orderModel.aggregate([
                {
                    $match: {
                        userId: userObjectId,
                    }
                },
                {
                    $group: {
                        _id: null,
                        maxPrice: {
                            $max: {
                                $ifNull: ['$price', 0],
                            }
                        }
                    }
                }
            ]),
        ])

        const total = countResult[0]?.total || 0
        const totalPages = Math.max(1, Math.ceil(total / limit))

        return {
            orders,
            total,
            page,
            limit,
            totalPages,
            maxPrice: Number(maxPriceResult[0]?.maxPrice || 0),
        }
    }

    async getNftOrders(isActive:boolean,isConfirm:boolean,nftId:string) : Promise<any> {
        return this.orderModel.aggregate([
            {
                $match: {
                    collectionNftId: new mongoose.Types.ObjectId(nftId),
                    isActive,
                }
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: this.projectModel.collection.name,
                    localField: 'projectId',
                    foreignField: '_id',
                    as: 'project'
                }
            },
            { $unwind: '$project' },
            {
                $lookup: {
                    from: this.collectionModel.collection.name,
                    localField: 'collectionId',
                    foreignField: '_id',
                    as: 'collection'
                }
            },
            { $unwind: '$collection' },
            {
                $lookup: {
                    from: this.nftModel.collection.name,
                    localField: 'collectionNftId',
                    foreignField: '_id',
                    as: 'nft'
                }
            },
            { $unwind: '$nft' },
            {
                $sort: {
                    created: -1 
                }
            },
            {
                $project: {
                    user: {
                        username: 1,
                        twitterData: 1,
                        photo: 1,
                        wallet: 1
                    },
                    project: 1,
                    collection: 1,
                    nft: 1,
                    collectionNftId: 1,
                    isActive: 1,
                    price: 1,
                    belowFloor: 1,
                    endDate: 1,
                    isEth: 1,
                    isConfirm: 1,
                    isUsdc: 1,
                    smartOrderId: 1
                }
            },
        ]);
    }
    
    async createOrder(orderData:CreateOrderDto) : Promise<Order> {
        const userId = this.toObjectId(orderData.userId, 'Invalid user')
        const collectionNftId = this.toObjectId(orderData.collectionNftId, 'Invalid NFT')
        const price = Number(orderData?.price || 0)
        const endDate = orderData?.endDate ? new Date(orderData.endDate) : null
        const isEth = !!orderData?.isEth
        const isUsdc = !!orderData?.isUsdc

        if (!Number.isFinite(price) || price <= 0) {
            throw new HttpException('Offer price must be greater than 0', HttpStatus.BAD_REQUEST)
        }

        if (isEth === isUsdc) {
            throw new HttpException('Choose exactly one currency: ETH or USDC', HttpStatus.BAD_REQUEST)
        }

        if (!endDate || Number.isNaN(endDate.getTime())) {
            throw new HttpException('Invalid offer endDate', HttpStatus.BAD_REQUEST)
        }

        if (endDate.getTime() <= Date.now()) {
            throw new HttpException('Offer endDate must be in the future', HttpStatus.BAD_REQUEST)
        }

        const nft = await this.nftModel.findOne(
            {
                _id: collectionNftId,
                isActive: true,
            },
            {
                ownerId: 1,
                collectionId: 1,
                price: 1,
            }
        ).lean().exec()

        if (!nft) {
            throw new HttpException('NFT listing not found', HttpStatus.NOT_FOUND)
        }

        if (String(nft.ownerId || '') === String(userId)) {
            throw new HttpException('You cannot make an offer on your own NFT', HttpStatus.CONFLICT)
        }

        const collection = await this.collectionModel.findById(
            nft.collectionId,
            {
                project: 1,
            }
        ).lean().exec()

        if (!collection) {
            throw new HttpException('Collection not found', HttpStatus.NOT_FOUND)
        }

        const listingPrice = Number(nft?.price || 0)
        const belowFloor = Number.isFinite(Number(orderData?.belowFloor))
            ? Number(orderData?.belowFloor)
            : listingPrice > 0
                ? ((listingPrice - price) / listingPrice) * 100
                : 0

        const projectId = this.toObjectId(String(collection.project || orderData.projectId || ''), 'Invalid project')

        return this.orderModel.create({
            userId,
            projectId,
            collectionId: new mongoose.Types.ObjectId(String(nft.collectionId || '')),
            collectionNftId,
            created: orderData?.created ? new Date(orderData.created) : new Date(),
            price,
            isEth,
            isUsdc,
            endDate,
            belowFloor,
        })
    }

    async confirmOrder(userId:string,orderId:string,smartOrderIdRaw?:number) : Promise<Order> {
        const userObjectId = this.toObjectId(userId, 'Invalid user')
        const orderObjectId = this.toObjectId(orderId, 'Invalid order')
        const smartOrderId = Math.trunc(Number(smartOrderIdRaw || 0))

        if (!Number.isFinite(smartOrderId) || smartOrderId <= 0) {
            throw new HttpException('smartOrderId is required', HttpStatus.BAD_REQUEST)
        }

        const order = await this.orderModel.findById(
            orderObjectId,
            {
                collectionNftId: 1,
                isActive: 1,
                endDate: 1,
            }
        ).lean().exec()

        if (!order) {
            throw new HttpException('Offer not found', HttpStatus.NOT_FOUND)
        }

        if (!order.isActive) {
            throw new HttpException('Offer is already inactive', HttpStatus.CONFLICT)
        }

        if (order?.isConfirm) {
            throw new HttpException('Offer is already confirmed', HttpStatus.CONFLICT)
        }

        if (order?.endDate && new Date(order.endDate).getTime() <= Date.now()) {
            throw new HttpException('Offer has already expired', HttpStatus.CONFLICT)
        }

        const nft = await this.nftModel.findOne(
            {
                _id: order.collectionNftId,
                isActive: true,
            },
            {
                ownerId: 1,
            }
        ).lean().exec()

        if (!nft) {
            throw new HttpException('NFT listing not found', HttpStatus.NOT_FOUND)
        }

        if (String(nft.ownerId || '') !== String(userObjectId)) {
            throw new HttpException('Only the seller can confirm this offer', HttpStatus.FORBIDDEN)
        }

        return this.orderModel.findOneAndUpdate(
            {
                _id: orderObjectId,
            },
            {
                isConfirm: true,
                smartOrderId,
            },
            {
                new: true,
            }
        )
    }
    
    async deactivateOrder(userId:string,orderId:string) : Promise<Order> {
        const userObjectId = this.toObjectId(userId, 'Invalid user')
        const orderObjectId = this.toObjectId(orderId, 'Invalid order')
        const order = await this.orderModel.findOne(
            {
                _id: orderObjectId,
                userId: userObjectId,
            },
            {
                _id: 1,
            }
        ).lean().exec()

        if (!order) {
            throw new HttpException('Offer not found', HttpStatus.NOT_FOUND)
        }

        return this.orderModel.findOneAndUpdate(
            {
                _id: orderObjectId,
                userId: userObjectId,
            },
            {
                isActive: false,
            },
            {
                new: true,
            }
        )
    }
}
