import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { ethers } from 'ethers';
import {
  CreateSpaceportStakingEventDto,
  SpaceportStakingAction,
} from './dto/create-spaceport-staking-event.dto';
import { SpaceportStakingEvent } from './model/spaceport-staking-event.model';
import { UserActionLogsService } from 'src/user-action-logs/user-action-logs.service';

const SPACEPORT_STAKING_ABI = [
  'event Staked(address indexed user, uint256 indexed tokenId, uint256 startedAt)',
  'event Unstaked(address indexed user, uint256 indexed tokenId, uint256 stakedSeconds)',
] as const;

type NormalizedStakingEvent = {
  walletAddress: string;
  nftAddress?: string;
  tokenId: number;
  action: SpaceportStakingAction;
  txHash: string;
  chainId?: number;
  blockNumber?: number;
  transactionIndex?: number;
  logIndex?: number;
  stakedAt?: Date;
  unstakedAt?: Date;
  stakedSeconds?: number;
  metadata?: Record<string, any>;
};

@Injectable()
export class SpaceportStakingService {
  private readonly logger = new Logger(SpaceportStakingService.name);
  private readonly stakingInterface = new ethers.Interface(SPACEPORT_STAKING_ABI);

  constructor(
    @InjectModel(SpaceportStakingEvent.name)
    private readonly stakingEventModel: Model<SpaceportStakingEvent>,
    private readonly userActionLogsService: UserActionLogsService,
  ) { }

  async create(dto: CreateSpaceportStakingEventDto) {
    this.validateCreatePayload(dto);

    const normalizedFromChain = await this.extractEventsFromChain(dto);
    const eventsToPersist =
      normalizedFromChain.length > 0
        ? normalizedFromChain
        : [this.buildFallbackEvent(dto)];

    const savedEvents = await Promise.all(
      eventsToPersist.map(event => this.upsertEvent(event)),
    );
    const firstEvent = eventsToPersist[0];

    await this.userActionLogsService.log({
      walletAddress: firstEvent?.walletAddress || dto.walletAddress,
      actorType: 'user',
      category: 'spaceport',
      action: 'spaceport.staking_event_saved',
      title: 'Spaceport staking event saved',
      entityType: 'spaceport_staking',
      entityId: firstEvent?.txHash || dto.txHash,
      metadata: {
        source: normalizedFromChain.length > 0 ? 'chain' : 'payload',
        txHash: firstEvent?.txHash || dto.txHash,
        walletAddress: firstEvent?.walletAddress || dto.walletAddress,
        eventsCount: savedEvents.length,
        actions: eventsToPersist.map(event => event.action),
        tokenIds: eventsToPersist.map(event => event.tokenId),
      },
    });

    return {
      isSuccess: true,
      source: normalizedFromChain.length > 0 ? 'chain' : 'payload',
      events: savedEvents,
    };
  }

  async getWalletHistory(walletAddress: string, tokenIds?: number[]) {
    const normalizedWallet = this.normalizeAddress(walletAddress);
    if (!normalizedWallet) {
      throw new BadRequestException('walletAddress is required');
    }

    const query: FilterQuery<SpaceportStakingEvent> = {
      walletAddress: normalizedWallet,
    };

    if (Array.isArray(tokenIds) && tokenIds.length > 0) {
      query.tokenId = { $in: tokenIds };
    }

    const events = await this.stakingEventModel
      .find(query)
      .sort({ blockNumber: -1, transactionIndex: -1, logIndex: -1, createdAt: -1 })
      .lean();

    const summary = this.buildSummary(
      [...events].sort((a, b) => {
        const blockA = Number(a.blockNumber || 0);
        const blockB = Number(b.blockNumber || 0);
        if (blockA !== blockB) {
          return blockA - blockB;
        }

        const txA = Number(a.transactionIndex || 0);
        const txB = Number(b.transactionIndex || 0);
        if (txA !== txB) {
          return txA - txB;
        }

        const logA = Number(a.logIndex || 0);
        const logB = Number(b.logIndex || 0);
        if (logA !== logB) {
          return logA - logB;
        }

        return this.getEventChronologyTime(a) - this.getEventChronologyTime(b);
      }),
    );

    return {
      isSuccess: true,
      walletAddress: normalizedWallet,
      events: events.map(event => this.serializeEvent(event)),
      summary,
    };
  }

  parseTokenIds(tokenIds?: string): number[] {
    if (!tokenIds) {
      return [];
    }

    return tokenIds
      .split(',')
      .map(value => Number(String(value || '').trim()))
      .filter(value => Number.isInteger(value) && value >= 0);
  }

  private async upsertEvent(event: NormalizedStakingEvent) {
    const filter = {
      txHash: event.txHash,
      logIndex: Number(event.logIndex || 0),
      tokenId: event.tokenId,
      action: event.action,
    };

    const payload = {
      ...event,
      logIndex: Number(event.logIndex || 0),
      transactionIndex: Number(event.transactionIndex || 0),
      chainId: Number(event.chainId || 0),
      blockNumber: Number(event.blockNumber || 0),
      metadata: event.metadata || {},
    };

    return await this.stakingEventModel.findOneAndUpdate(filter, payload, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  private async extractEventsFromChain(
    dto: CreateSpaceportStakingEventDto,
  ): Promise<NormalizedStakingEvent[]> {
    const rpcUrl = this.getRpcUrl();
    if (!rpcUrl) {
      return [];
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const [receipt, network] = await Promise.all([
        provider.getTransactionReceipt(dto.txHash),
        provider.getNetwork(),
      ]);

      if (!receipt) {
        return [];
      }

      const expectedNftAddress = this.normalizeAddress(
        dto.nftAddress ||
          process.env.SPACEPORT_NFT_ADDRESS ||
          process.env.FOMO_V2_LAUNCHPAD_STAKING_NFT_ADDRESS ||
          '',
      );

      const shouldReadBlockTimestamp = receipt.logs.some(log => {
        const parsed = this.safeParseLog(log);
        return parsed?.name === 'Unstaked';
      });

      const block =
        shouldReadBlockTimestamp && receipt.blockNumber != null
          ? await provider.getBlock(receipt.blockNumber)
          : null;
      const unstakedAtFromBlock =
        block?.timestamp != null ? new Date(Number(block.timestamp) * 1000) : undefined;

      const events: NormalizedStakingEvent[] = [];

      for (const log of receipt.logs) {
        const normalizedLogAddress = this.normalizeAddress(log.address);
        if (expectedNftAddress && normalizedLogAddress !== expectedNftAddress) {
          continue;
        }

        const parsed = this.safeParseLog(log);
        if (!parsed) {
          continue;
        }

        if (parsed.name !== 'Staked' && parsed.name !== 'Unstaked') {
          continue;
        }

        const walletAddress = this.normalizeAddress(String(parsed.args.user || ''));
        const tokenId = this.toSafeNumber(parsed.args.tokenId);

        const baseEvent = {
          walletAddress,
          nftAddress: normalizedLogAddress || expectedNftAddress || undefined,
          tokenId,
          txHash: String(dto.txHash || '').trim().toLowerCase(),
          chainId: Number(network.chainId),
          blockNumber: Number(receipt.blockNumber || 0),
          transactionIndex: Number(receipt.index || 0),
          logIndex: Number(log.index || 0),
          metadata: dto.metadata || {},
        };

        if (parsed.name === 'Staked') {
          events.push({
            ...baseEvent,
            action: 'stake',
            stakedAt: new Date(this.toSafeNumber(parsed.args.startedAt) * 1000),
          });
          continue;
        }

        events.push({
          ...baseEvent,
          action: 'unstake',
          unstakedAt: unstakedAtFromBlock,
          stakedSeconds: this.toSafeNumber(parsed.args.stakedSeconds),
        });
      }

      return events;
    } catch (error) {
      this.logger.warn(
        `Failed to verify staking tx ${dto.txHash} via RPC: ${error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  private buildFallbackEvent(
    dto: CreateSpaceportStakingEventDto,
  ): NormalizedStakingEvent {
    const action = dto.action;
    const tokenId = Number(dto.tokenId);

    if (!action || (action !== 'stake' && action !== 'unstake')) {
      throw new BadRequestException('action is required when tx verification is unavailable');
    }

    if (!Number.isInteger(tokenId) || tokenId < 0) {
      throw new BadRequestException(
        'tokenId is required when tx verification is unavailable',
      );
    }

    const walletAddress = this.normalizeAddress(dto.walletAddress || '');
    if (!walletAddress) {
      throw new BadRequestException(
        'walletAddress is required when tx verification is unavailable',
      );
    }

    return {
      walletAddress,
      nftAddress: this.normalizeAddress(dto.nftAddress || '') || undefined,
      tokenId,
      action,
      txHash: String(dto.txHash || '').trim().toLowerCase(),
      chainId: Number(dto.chainId || 0),
      blockNumber: Number(dto.blockNumber || 0),
      transactionIndex: 0,
      logIndex: 0,
      stakedAt: dto.stakedAt ? new Date(dto.stakedAt) : action === 'stake' ? new Date() : undefined,
      unstakedAt:
        dto.unstakedAt ? new Date(dto.unstakedAt) : action === 'unstake' ? new Date() : undefined,
      stakedSeconds: Number.isFinite(Number(dto.stakedSeconds))
        ? Math.max(0, Math.trunc(Number(dto.stakedSeconds)))
        : undefined,
      metadata: dto.metadata || {},
    };
  }

  private buildSummary(events: Array<any>) {
    const summary: Record<
      string,
      {
        tokenId: number;
        isCurrentlyStaked: boolean;
        lastAction: SpaceportStakingAction | null;
        lastTxHash: string | null;
        lastUpdatedAt: string | null;
        lastStakedAt: string | null;
        lastUnstakedAt: string | null;
        totalCompletedSeconds: number;
        currentCycleSeconds: number;
        totalSeconds: number;
        totalDays: number;
        historyCount: number;
      }
    > = {};

    const now = Date.now();

    for (const event of events) {
      const key = String(event.tokenId);
      const current =
        summary[key] ||
        {
          tokenId: Number(event.tokenId),
          isCurrentlyStaked: false,
          lastAction: null,
          lastTxHash: null,
          lastUpdatedAt: null,
          lastStakedAt: null,
          lastUnstakedAt: null,
          totalCompletedSeconds: 0,
          currentCycleSeconds: 0,
          totalSeconds: 0,
          totalDays: 0,
          historyCount: 0,
        };

      const stakedAtMs = event.stakedAt ? new Date(event.stakedAt).getTime() : null;
      const unstakedAtMs = event.unstakedAt ? new Date(event.unstakedAt).getTime() : null;

      current.historyCount += 1;
      current.lastAction = event.action;
      current.lastTxHash = event.txHash || null;
      current.lastUpdatedAt = new Date(
        event.updatedAt || event.createdAt || Date.now(),
      ).toISOString();

      if (event.action === 'stake') {
        current.isCurrentlyStaked = true;
        current.lastStakedAt = stakedAtMs ? new Date(stakedAtMs).toISOString() : null;
        current.currentCycleSeconds = stakedAtMs
          ? Math.max(0, Math.floor((now - stakedAtMs) / 1000))
          : current.currentCycleSeconds;
      } else {
        current.isCurrentlyStaked = false;
        current.lastUnstakedAt = unstakedAtMs ? new Date(unstakedAtMs).toISOString() : null;

        const completedSeconds = Number.isFinite(Number(event.stakedSeconds))
          ? Math.max(0, Math.trunc(Number(event.stakedSeconds)))
          : stakedAtMs && unstakedAtMs
            ? Math.max(0, Math.floor((unstakedAtMs - stakedAtMs) / 1000))
            : 0;

        current.totalCompletedSeconds += completedSeconds;
        current.currentCycleSeconds = 0;
      }

      current.totalSeconds = current.totalCompletedSeconds + current.currentCycleSeconds;
      current.totalDays = Math.floor(current.totalSeconds / 86400);
      summary[key] = current;
    }

    return summary;
  }

  private serializeEvent(event: any) {
    return {
      _id: String(event._id),
      walletAddress: event.walletAddress,
      nftAddress: event.nftAddress || '',
      tokenId: Number(event.tokenId),
      action: event.action,
      txHash: event.txHash,
      chainId: Number(event.chainId || 0),
      blockNumber: Number(event.blockNumber || 0),
      transactionIndex: Number(event.transactionIndex || 0),
      logIndex: Number(event.logIndex || 0),
      stakedAt: event.stakedAt ? new Date(event.stakedAt).toISOString() : null,
      unstakedAt: event.unstakedAt ? new Date(event.unstakedAt).toISOString() : null,
      stakedSeconds: Number(event.stakedSeconds || 0),
      metadata: event.metadata || {},
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : null,
    };
  }

  private getEventChronologyTime(event: any): number {
    const effectiveDate =
      event?.unstakedAt ||
      event?.stakedAt ||
      event?.updatedAt ||
      event?.createdAt ||
      null;

    const timestamp = effectiveDate ? new Date(effectiveDate).getTime() : 0;
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private safeParseLog(log: { topics: readonly string[]; data: string }) {
    try {
      return this.stakingInterface.parseLog(log);
    } catch {
      return null;
    }
  }

  private validateCreatePayload(dto: CreateSpaceportStakingEventDto): void {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Payload is required');
    }

    if (!dto.txHash || String(dto.txHash).trim().length < 10) {
      throw new BadRequestException('txHash is required');
    }
  }

  private getRpcUrl(): string {
    return (
      process.env.SPACEPORT_RPC_URL ||
      process.env.FOMO_V2_LAUNCHPAD_RPC_URL ||
      process.env.BSC_TESTNET_RPC_URL ||
      process.env.WEB3_RPC_URL ||
      process.env.ZKSYNC_RPC_URL ||
      ''
    );
  }

  private normalizeAddress(address: string): string {
    const value = String(address || '').trim().toLowerCase();
    return value || '';
  }

  private toSafeNumber(value: unknown): number {
    const normalized = typeof value === 'bigint' ? Number(value) : Number(String(value));
    if (!Number.isFinite(normalized)) {
      throw new BadRequestException('Failed to parse blockchain numeric value');
    }
    return Math.trunc(normalized);
  }
}
