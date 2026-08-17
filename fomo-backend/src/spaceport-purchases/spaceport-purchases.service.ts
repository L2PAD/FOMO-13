import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSpaceportPurchaseDto } from './dto/create-spaceport-purchase.dto';
import { SpaceportPurchase } from './model/spaceport-purchase.model';
import { UserActionLogsService } from 'src/user-action-logs/user-action-logs.service';

@Injectable()
export class SpaceportPurchasesService {
  private readonly logger = new Logger(SpaceportPurchasesService.name);

  constructor(
    @InjectModel(SpaceportPurchase.name)
    private readonly spaceportPurchaseModel: Model<SpaceportPurchase>,
    private readonly userActionLogsService: UserActionLogsService,
  ) {
    // this.removeAll()
  }

  private async removeAll() {
    await this.spaceportPurchaseModel.deleteMany({});
  }

  async create(
    userId: string,
    dto: CreateSpaceportPurchaseDto,
  ): Promise<SpaceportPurchase> {
    this.validateCreatePayload(dto);

    const txHash = dto.txHash.trim().toLowerCase();
    const existing = await this.spaceportPurchaseModel.findOne({ txHash });

    if (existing) {
      throw new ConflictException('Transaction hash already exists');
    }

    const purchasedAt = dto.purchasedAt ? new Date(dto.purchasedAt) : new Date();
    if (Number.isNaN(purchasedAt.getTime())) {
      throw new BadRequestException('Invalid purchasedAt');
    }

    const payload: Partial<SpaceportPurchase> = {
      userId,
      txHash,
      quantity: Math.trunc(Number(dto.quantity)),
      totalPrice: Number(dto.totalPrice),
      totalPriceRaw: String(dto.totalPriceRaw).trim(),
      tokenDecimals: Number.isFinite(Number(dto.tokenDecimals))
        ? Math.max(0, Math.trunc(Number(dto.tokenDecimals)))
        : 6,
      walletAddress: String(dto.walletAddress || '').trim(),
      paymentTokenAddress: String(dto.paymentTokenAddress || '').trim() || undefined,
      marketAddress: String(dto.marketAddress || '').trim() || undefined,
      nftAddress: String(dto.nftAddress || '').trim() || undefined,
      blockNumber: Number.isFinite(Number(dto.blockNumber))
        ? Math.trunc(Number(dto.blockNumber))
        : undefined,
      purchasedAt,
      referralAddress: String(dto.referralAddress || '').trim() || undefined,
      metadata: dto.metadata || {},
    };

    const created = new this.spaceportPurchaseModel(payload);
    const saved = await created.save();

    this.logger.log(
      `Spaceport purchase saved: user=${userId} tx=${saved.txHash} qty=${saved.quantity} price=${saved.totalPrice}`,
    );

    await this.userActionLogsService.log({
      userId,
      walletAddress: saved.walletAddress,
      actorId: userId,
      actorType: 'user',
      category: 'nft_market',
      action: 'nft_market.spaceport_purchase_created',
      title: 'Spaceport purchase saved',
      entityType: 'spaceport_purchase',
      entityId: saved._id,
      metadata: {
        txHash: saved.txHash,
        quantity: saved.quantity,
        totalPrice: saved.totalPrice,
        walletAddress: saved.walletAddress,
        nftAddress: saved.nftAddress,
        marketAddress: saved.marketAddress,
        purchasedAt,
      },
    });

    return saved;
  }

  private validateCreatePayload(dto: CreateSpaceportPurchaseDto): void {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Payload is required');
    }

    if (!dto.txHash || dto.txHash.trim().length < 10) {
      throw new BadRequestException('txHash is required');
    }

    if (!dto.walletAddress || dto.walletAddress.trim().length < 10) {
      throw new BadRequestException('walletAddress is required');
    }

    const quantity = Number(dto.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be greater than 0');
    }

    const totalPrice = Number(dto.totalPrice);
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      throw new BadRequestException('totalPrice must be a valid number');
    }

    if (!dto.totalPriceRaw || String(dto.totalPriceRaw).trim().length === 0) {
      throw new BadRequestException('totalPriceRaw is required');
    }
  }
}
