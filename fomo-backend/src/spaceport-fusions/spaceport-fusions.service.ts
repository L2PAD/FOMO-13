import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { ethers } from 'ethers';
import { CreateSpaceportFusionDto } from './dto/create-spaceport-fusion.dto';
import { SpaceportFusion } from './model/spaceport-fusion.model';
import { UserActionLogsService } from 'src/user-action-logs/user-action-logs.service';

const SPACEPORT_FUSION_ABI = [
  'event PreMintMerged(address indexed user, uint256 burnedToken1, uint256 burnedToken2, uint256 newTokenId, uint8 newRarity)',
] as const;

type NormalizedFusionEvent = {
  walletAddress: string;
  nftAddress?: string;
  txHash: string;
  tokenId1?: number;
  tokenId2?: number;
  resultTokenId?: number;
  resultRarityId?: number;
  resultRarityName?: string;
  chainId?: number;
  blockNumber?: number;
  transactionIndex?: number;
  logIndex?: number;
  mergedAt?: Date;
  metadata?: Record<string, any>;
};

@Injectable()
export class SpaceportFusionsService {
  private readonly fusionInterface = new ethers.Interface(SPACEPORT_FUSION_ABI);

  constructor(
    @InjectModel(SpaceportFusion.name)
    private readonly fusionModel: Model<SpaceportFusion>,
    private readonly userActionLogsService: UserActionLogsService,
  ) {}

  async create(dto: CreateSpaceportFusionDto) {
    this.validateCreatePayload(dto);

    const normalizedFromChain = await this.extractEventFromChain(dto);
    const eventToPersist =
      normalizedFromChain ?? this.buildFallbackEvent(dto);

    const saved = await this.upsertEvent(eventToPersist);

    await this.userActionLogsService.log({
      walletAddress: eventToPersist.walletAddress || dto.walletAddress,
      actorType: 'user',
      category: 'spaceport',
      action: 'spaceport.fusion_event_saved',
      title: 'Spaceport fusion event saved',
      entityType: 'spaceport_fusion',
      entityId: saved._id,
      metadata: {
        source: normalizedFromChain ? 'chain' : 'payload',
        txHash: saved.txHash,
        walletAddress: saved.walletAddress,
        tokenId1: saved.tokenId1,
        tokenId2: saved.tokenId2,
        resultTokenId: saved.resultTokenId,
        resultRarityName: saved.resultRarityName,
      },
    });

    return {
      isSuccess: true,
      source: normalizedFromChain ? 'chain' : 'payload',
      fusion: this.serialize(saved),
    };
  }

  async getWalletHistory(walletAddress: string, nftAddress?: string) {
    const normalizedWallet = this.normalizeAddress(walletAddress);
    if (!normalizedWallet) {
      throw new BadRequestException('walletAddress is required');
    }

    const normalizedNftAddress = this.normalizeAddress(nftAddress || '');
    const query: FilterQuery<SpaceportFusion> = {
      walletAddress: normalizedWallet,
    };

    if (normalizedNftAddress) {
      query.nftAddress = normalizedNftAddress;
    }

    const events = await this.fusionModel
      .find(query)
      .sort({ blockNumber: -1, transactionIndex: -1, logIndex: -1, createdAt: -1 })
      .lean();

    return {
      isSuccess: true,
      walletAddress: normalizedWallet,
      fusions: events.map(event => this.serialize(event)),
    };
  }

  private async upsertEvent(event: NormalizedFusionEvent) {
    const filter = {
      txHash: event.txHash,
      logIndex: Number(event.logIndex || 0),
    };

    const payload = {
      ...event,
      chainId: Number(event.chainId || 0),
      blockNumber: Number(event.blockNumber || 0),
      transactionIndex: Number(event.transactionIndex || 0),
      logIndex: Number(event.logIndex || 0),
      metadata: event.metadata || {},
      mergedAt: event.mergedAt || new Date(),
    };

    return await this.fusionModel.findOneAndUpdate(filter, payload, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  private async extractEventFromChain(
    dto: CreateSpaceportFusionDto,
  ): Promise<NormalizedFusionEvent | null> {
    const rpcUrl = this.getRpcUrl();
    if (!rpcUrl) {
      return null;
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const [receipt, network] = await Promise.all([
        provider.getTransactionReceipt(dto.txHash),
        provider.getNetwork(),
      ]);

      if (!receipt) {
        return null;
      }

      const expectedNftAddress = this.normalizeAddress(dto.nftAddress || '');
      const block =
        receipt.blockNumber != null
          ? await provider.getBlock(receipt.blockNumber)
          : null;
      const mergedAt =
        block?.timestamp != null ? new Date(Number(block.timestamp) * 1000) : new Date();

      for (const log of receipt.logs) {
        const normalizedLogAddress = this.normalizeAddress(log.address);
        if (expectedNftAddress && normalizedLogAddress !== expectedNftAddress) {
          continue;
        }

        const parsed = this.safeParseLog(log);
        if (!parsed || parsed.name !== 'PreMintMerged') {
          continue;
        }

        return {
          walletAddress: this.normalizeAddress(String(parsed.args.user || dto.walletAddress)),
          nftAddress: normalizedLogAddress || expectedNftAddress || undefined,
          txHash: String(dto.txHash || '').trim().toLowerCase(),
          tokenId1: this.toSafeNumber(parsed.args.burnedToken1),
          tokenId2: this.toSafeNumber(parsed.args.burnedToken2),
          resultTokenId: this.toSafeNumber(parsed.args.newTokenId),
          resultRarityId: this.toSafeNumber(parsed.args.newRarity),
          resultRarityName: String(dto.resultRarityName || '').trim() || undefined,
          chainId: Number(network.chainId),
          blockNumber: Number(receipt.blockNumber || 0),
          transactionIndex: Number(receipt.index || 0),
          logIndex: Number(log.index || 0),
          mergedAt,
          metadata: dto.metadata || {},
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private buildFallbackEvent(dto: CreateSpaceportFusionDto): NormalizedFusionEvent {
    return {
      walletAddress: this.normalizeAddress(dto.walletAddress),
      nftAddress: this.normalizeAddress(dto.nftAddress || '') || undefined,
      txHash: String(dto.txHash || '').trim().toLowerCase(),
      tokenId1: this.toOptionalNumber(dto.tokenId1),
      tokenId2: this.toOptionalNumber(dto.tokenId2),
      resultTokenId: this.toOptionalNumber(dto.resultTokenId),
      resultRarityId: this.toOptionalNumber(dto.resultRarityId),
      resultRarityName: String(dto.resultRarityName || '').trim() || undefined,
      chainId: this.toOptionalNumber(dto.chainId),
      blockNumber: this.toOptionalNumber(dto.blockNumber),
      mergedAt: dto.mergedAt ? new Date(dto.mergedAt) : new Date(),
      metadata: dto.metadata || {},
    };
  }

  private safeParseLog(log: any) {
    try {
      return this.fusionInterface.parseLog(log);
    } catch {
      return null;
    }
  }

  private serialize(event: any) {
    return {
      _id: String(event._id),
      walletAddress: String(event.walletAddress || ''),
      nftAddress: String(event.nftAddress || ''),
      txHash: String(event.txHash || ''),
      tokenId1: this.toOptionalNumber(event.tokenId1),
      tokenId2: this.toOptionalNumber(event.tokenId2),
      resultTokenId: this.toOptionalNumber(event.resultTokenId),
      resultRarityId: this.toOptionalNumber(event.resultRarityId),
      resultRarityName: String(event.resultRarityName || ''),
      chainId: this.toOptionalNumber(event.chainId),
      blockNumber: this.toOptionalNumber(event.blockNumber),
      mergedAt: event.mergedAt ? new Date(event.mergedAt).toISOString() : null,
      metadata: event.metadata || {},
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : null,
    };
  }

  private validateCreatePayload(dto: CreateSpaceportFusionDto): void {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Payload is required');
    }

    if (!dto.txHash || String(dto.txHash).trim().length < 10) {
      throw new BadRequestException('txHash is required');
    }

    if (!dto.walletAddress || String(dto.walletAddress).trim().length < 10) {
      throw new BadRequestException('walletAddress is required');
    }
  }

  private getRpcUrl(): string {
    return String(
      process.env.SPACEPORT_RPC_URL ||
        process.env.FOMO_V2_LAUNCHPAD_RPC_URL ||
        process.env.BSC_TESTNET_RPC_URL ||
        process.env.WEB3_RPC_URL ||
        process.env.ZKSYNC_RPC_URL ||
        '',
    ).trim();
  }

  private normalizeAddress(value: string): string {
    return String(value || '').trim().toLowerCase();
  }

  private toOptionalNumber(value: unknown): number | undefined {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.trunc(numeric) : undefined;
  }

  private toSafeNumber(value: unknown): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.trunc(numeric);
  }
}
