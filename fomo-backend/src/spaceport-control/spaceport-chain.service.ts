import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethers } from 'ethers';
import {
  getSpaceportRegistry,
  rarityName,
  SpaceportRegistry,
} from './spaceport-registry';
import {
  SpaceportChainEvent,
  SpaceportIndexCursor,
} from './model/spaceport-chain-event.model';

const SALE_ABI = [
  'function owner() view returns (address)',
  'function paymentToken() view returns (address)',
  'function nftContract() view returns (address)',
  'function price() view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'function salePaused() view returns (bool)',
  'function MAX_SUPPLY() view returns (uint256)',
  'function MAX_PER_WALLET() view returns (uint256)',
  'function getBaseTotalPrice(uint256 amount) view returns (uint256)',
  'event Purchased(address indexed buyer, uint256 amount, uint256 totalPaid, address indexed level1Referrer)',
];

const NFT_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function tokenByIndex(uint256 index) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function tokenRarities(uint256 tokenId) view returns (uint8)',
  'function nextTokenId() view returns (uint256)',
  'function baseURI() view returns (string)',
  'function active_tokens() view returns (uint256)',
  'function owner() view returns (address)',
  'function isStaked(uint256 tokenId) view returns (bool)',
  'function stakedAt(uint256 tokenId) view returns (uint256)',
  'function stakeOwner(uint256 tokenId) view returns (address)',
  'function mergeStartTime() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event PreMintMerged(address indexed user, uint256 burnedToken1, uint256 burnedToken2, uint256 newTokenId, uint8 newRarity)',
  'event StandardMerged(address indexed user, uint256 burnedToken1, uint256 burnedToken2, uint256 newTokenId, uint8 newRarity)',
  'event ShardsMerged(address indexed user, uint256[] burnedTokenIds, uint256 newTokenId)',
];

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

export interface RpcStatus {
  ok: boolean;
  chainId: number | null;
  expectedChainId: number;
  latestBlock: number | null;
  rpcUrl: string;
  error?: string;
}

@Injectable()
export class SpaceportChainService {
  private readonly logger = new Logger(SpaceportChainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private providerRpc = '';
  private indexProvider: ethers.JsonRpcProvider | null = null;
  private indexRpc = '';

  constructor(
    @InjectModel(SpaceportChainEvent.name)
    private readonly eventModel: Model<SpaceportChainEvent>,
    @InjectModel(SpaceportIndexCursor.name)
    private readonly cursorModel: Model<SpaceportIndexCursor>,
  ) {}

  registry(): SpaceportRegistry {
    return getSpaceportRegistry();
  }

  private getProvider(): ethers.JsonRpcProvider {
    const reg = this.registry();
    if (!this.provider || this.providerRpc !== reg.network.rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(reg.network.rpcUrl, {
        chainId: reg.network.chainId,
        name: reg.network.name,
      }, { staticNetwork: true });
      this.providerRpc = reg.network.rpcUrl;
    }
    return this.provider;
  }

  /** Log-capable (ideally archive) provider for eth_getLogs / eth_getCode. */
  private getIndexProvider(): ethers.JsonRpcProvider {
    const reg = this.registry();
    if (!this.indexProvider || this.indexRpc !== reg.indexRpcUrl) {
      this.indexProvider = new ethers.JsonRpcProvider(reg.indexRpcUrl, {
        chainId: reg.network.chainId,
        name: reg.network.name,
      }, { staticNetwork: true });
      this.indexRpc = reg.indexRpcUrl;
    }
    return this.indexProvider;
  }

  private async withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T> {
    let t: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, rej) => {
      t = setTimeout(() => rej(new Error('rpc-timeout')), ms);
    });
    try {
      return await Promise.race([p, timeout]);
    } finally {
      if (t) clearTimeout(t);
    }
  }

  private async safe<T>(fn: () => Promise<T>, fallback: T | null = null): Promise<T | null> {
    try {
      return await this.withTimeout(fn());
    } catch (e) {
      return fallback;
    }
  }

  async getRpcStatus(): Promise<RpcStatus> {
    const reg = this.registry();
    try {
      const provider = this.getProvider();
      const [net, block] = await Promise.all([
        this.withTimeout(provider.getNetwork()),
        this.withTimeout(provider.getBlockNumber()),
      ]);
      return {
        ok: true,
        chainId: Number(net.chainId),
        expectedChainId: reg.network.chainId,
        latestBlock: Number(block),
        rpcUrl: reg.network.rpcUrl,
      };
    } catch (e) {
      return {
        ok: false,
        chainId: null,
        expectedChainId: reg.network.chainId,
        latestBlock: null,
        rpcUrl: reg.network.rpcUrl,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  private num(v: any): number {
    try {
      return typeof v === 'bigint' ? Number(v) : Number(String(v));
    } catch {
      return 0;
    }
  }

  async getSaleState() {
    const reg = this.registry();
    const addr = reg.contracts.sale.address;
    if (!addr) return { available: false, address: null };
    const provider = this.getProvider();
    const sale = new ethers.Contract(addr, SALE_ABI, provider);
    const decimals = reg.paymentTokenDecimals;
    const [owner, paymentToken, nftContract, price, totalMinted, paused, maxSupply, maxPerWallet] =
      await Promise.all([
        this.safe(() => sale.owner()),
        this.safe(() => sale.paymentToken()),
        this.safe(() => sale.nftContract()),
        this.safe(() => sale.price()),
        this.safe(() => sale.totalMinted()),
        this.safe(() => sale.salePaused()),
        this.safe(() => sale.MAX_SUPPLY()),
        this.safe(() => sale.MAX_PER_WALLET()),
      ]);
    const priceStr = price != null ? String(price) : null;
    return {
      available: owner != null,
      address: addr,
      owner: owner ? String(owner) : null,
      paymentToken: paymentToken ? String(paymentToken) : null,
      nftContract: nftContract ? String(nftContract) : null,
      priceRaw: priceStr,
      price: priceStr ? Number(ethers.formatUnits(priceStr, decimals)) : null,
      totalMinted: totalMinted != null ? this.num(totalMinted) : null,
      salePaused: typeof paused === 'boolean' ? paused : null,
      maxSupply: maxSupply != null ? this.num(maxSupply) : null,
      maxPerWallet: maxPerWallet != null ? this.num(maxPerWallet) : null,
      remaining:
        maxSupply != null && totalMinted != null
          ? Math.max(0, this.num(maxSupply) - this.num(totalMinted))
          : null,
      paymentTokenDecimals: decimals,
    };
  }

  async getNftState() {
    const reg = this.registry();
    const addr = reg.contracts.nft.address;
    if (!addr) return { available: false, address: null };
    const provider = this.getProvider();
    const nft = new ethers.Contract(addr, NFT_ABI, provider);
    const [name, symbol, totalSupply, nextTokenId, baseURI, activeTokens, owner, mergeStartTime] =
      await Promise.all([
        this.safe(() => nft.name()),
        this.safe(() => nft.symbol()),
        this.safe(() => nft.totalSupply()),
        this.safe(() => nft.nextTokenId()),
        this.safe(() => nft.baseURI()),
        this.safe(() => nft.active_tokens()),
        this.safe(() => nft.owner()),
        this.safe(() => nft.mergeStartTime()),
      ]);
    return {
      available: totalSupply != null,
      address: addr,
      name: name ? String(name) : null,
      symbol: symbol ? String(symbol) : null,
      totalSupply: totalSupply != null ? this.num(totalSupply) : null,
      nextTokenId: nextTokenId != null ? this.num(nextTokenId) : null,
      baseURI: baseURI != null ? String(baseURI) : null,
      activeTokens: activeTokens != null ? this.num(activeTokens) : null,
      owner: owner ? String(owner) : null,
      mergeStartTime: mergeStartTime != null ? this.num(mergeStartTime) : null,
    };
  }

  async getErc20Meta() {
    const reg = this.registry();
    const addr = reg.contracts.paymentToken.address;
    if (!addr) return { available: false, address: null };
    const provider = this.getProvider();
    const erc20 = new ethers.Contract(addr, ERC20_ABI, provider);
    const [symbol, decimals] = await Promise.all([
      this.safe(() => erc20.symbol()),
      this.safe(() => erc20.decimals()),
    ]);
    return {
      available: symbol != null,
      address: addr,
      symbol: symbol ? String(symbol) : null,
      decimals: decimals != null ? this.num(decimals) : reg.paymentTokenDecimals,
    };
  }

  /** Enumerate all current tokens via ERC721Enumerable (cheap for small supply). */
  async enumerateTokens(limit = 2000): Promise<
    Array<{
      tokenId: number;
      owner: string | null;
      rarityId: number | null;
      rarityName: string | null;
      tokenUri: string | null;
      isStaked: boolean | null;
      stakeOwner: string | null;
    }>
  > {
    const reg = this.registry();
    const addr = reg.contracts.nft.address;
    if (!addr) return [];
    const provider = this.getProvider();
    const nft = new ethers.Contract(addr, NFT_ABI, provider);
    const supplyRaw = await this.safe(() => nft.totalSupply());
    const supply = supplyRaw != null ? Math.min(limit, this.num(supplyRaw)) : 0;
    const ids: number[] = [];
    for (let i = 0; i < supply; i++) {
      const id = await this.safe(() => nft.tokenByIndex(i));
      if (id != null) ids.push(this.num(id));
    }
    const out = await Promise.all(
      ids.map(async (tokenId) => {
        const [owner, rarityId, uri, staked, stakeOwner] = await Promise.all([
          this.safe(() => nft.ownerOf(tokenId)),
          this.safe(() => nft.tokenRarities(tokenId)),
          this.safe(() => nft.tokenURI(tokenId)),
          this.safe(() => nft.isStaked(tokenId)),
          this.safe(() => nft.stakeOwner(tokenId)),
        ]);
        const rId = rarityId != null ? this.num(rarityId) : null;
        return {
          tokenId,
          owner: owner ? String(owner) : null,
          rarityId: rId,
          rarityName: rId != null ? rarityName(rId) : null,
          tokenUri: uri != null ? String(uri) : null,
          isStaked: typeof staked === 'boolean' ? staked : null,
          stakeOwner: stakeOwner ? String(stakeOwner) : null,
        };
      }),
    );
    return out;
  }

  async getTokenInfo(tokenId: number) {
    const reg = this.registry();
    const addr = reg.contracts.nft.address;
    if (!addr) return { available: false, tokenId };
    const provider = this.getProvider();
    const nft = new ethers.Contract(addr, NFT_ABI, provider);
    const [owner, rarityId, uri, staked, stakedAt, stakeOwner] = await Promise.all([
      this.safe(() => nft.ownerOf(tokenId)),
      this.safe(() => nft.tokenRarities(tokenId)),
      this.safe(() => nft.tokenURI(tokenId)),
      this.safe(() => nft.isStaked(tokenId)),
      this.safe(() => nft.stakedAt(tokenId)),
      this.safe(() => nft.stakeOwner(tokenId)),
    ]);
    const rId = rarityId != null ? this.num(rarityId) : null;
    return {
      available: owner != null,
      tokenId,
      owner: owner ? String(owner) : null,
      rarityId: rId,
      rarityName: rId != null ? rarityName(rId) : null,
      tokenUri: uri != null ? String(uri) : null,
      isStaked: typeof staked === 'boolean' ? staked : null,
      stakedAt: stakedAt != null ? this.num(stakedAt) : null,
      stakeOwner: stakeOwner ? String(stakeOwner) : null,
    };
  }

  // ----- On-demand log indexer (idempotent) -----

  private async getCursor(contract: string, eventType: string) {
    const reg = this.registry();
    const c = await this.cursorModel.findOne({
      chainId: reg.network.chainId,
      contractAddress: contract.toLowerCase(),
      eventType,
    });
    return c;
  }

  /**
   * Detect the earliest block the index RPC will serve logs from (free public
   * nodes prune older logs). Exponential probe from head backwards. Returns the
   * smallest block for which getLogs does NOT return a pruned/limit error.
   */
  async findLogWindowStart(address: string, latest: number): Promise<number> {
    const provider = this.getIndexProvider();
    const canQuery = async (from: number): Promise<boolean> => {
      try {
        await this.withTimeout(
          provider.getLogs({ address, fromBlock: from, toBlock: Math.min(latest, from + 1) }),
          12000,
        );
        return true;
      } catch {
        return false;
      }
    };
    // If configured explicitly, trust it.
    const reg = this.registry();
    if (reg.indexFromBlock != null) return reg.indexFromBlock;
    let back = 20000;
    let good = latest; // worst case: only head is queryable
    while (back <= 60_000_000) {
      const from = Math.max(0, latest - back);
      if (await canQuery(from)) {
        good = from;
        if (from === 0) break;
        back *= 4;
      } else {
        break;
      }
    }
    return good;
  }

  async syncEvents(force = false): Promise<{
    ok: boolean;
    scannedFrom: number | null;
    scannedTo: number | null;
    inserted: number;
    logWindowStart: number | null;
    pruned: boolean;
    error?: string;
  }> {
    const reg = this.registry();
    const provider = this.getIndexProvider();
    let inserted = 0;
    let scannedFrom: number | null = null;
    let scannedTo: number | null = null;
    let logWindowStart: number | null = null;
    try {
      const latest = Number(await this.withTimeout(provider.getBlockNumber()));
      scannedTo = latest;

      // Determine a usable start block honoring the RPC's log-availability window.
      const windowStart = await this.findLogWindowStart(
        reg.contracts.nft.address || reg.contracts.sale.address || '',
        latest,
      );
      logWindowStart = windowStart;
      const defaultFrom =
        reg.indexFromBlock != null ? reg.indexFromBlock : windowStart;

      const jobs: Array<{ addr: string | null; type: string; abi: string[]; map: any }> = [
        {
          addr: reg.contracts.nft.address, type: 'Transfer', abi: NFT_ABI,
          map: (p: ethers.LogDescription) => ({ tokenId: this.num(p.args.tokenId), from: String(p.args.from).toLowerCase(), to: String(p.args.to).toLowerCase() }),
        },
        {
          addr: reg.contracts.sale.address, type: 'Purchased', abi: SALE_ABI,
          map: (p: ethers.LogDescription) => ({ buyer: String(p.args.buyer).toLowerCase(), quantity: this.num(p.args.amount), amountRaw: String(p.args.totalPaid) }),
        },
        {
          addr: reg.contracts.nft.address, type: 'PreMintMerged', abi: NFT_ABI,
          map: (p: ethers.LogDescription) => ({ from: String(p.args.user).toLowerCase(), tokenId: this.num(p.args.newTokenId), raw: { burned: [this.num(p.args.burnedToken1), this.num(p.args.burnedToken2)], newRarity: this.num(p.args.newRarity) } }),
        },
        {
          addr: reg.contracts.nft.address, type: 'StandardMerged', abi: NFT_ABI,
          map: (p: ethers.LogDescription) => ({ from: String(p.args.user).toLowerCase(), tokenId: this.num(p.args.newTokenId), raw: { burned: [this.num(p.args.burnedToken1), this.num(p.args.burnedToken2)], newRarity: this.num(p.args.newRarity) } }),
        },
        {
          addr: reg.contracts.nft.address, type: 'ShardsMerged', abi: NFT_ABI,
          map: (p: ethers.LogDescription) => ({ from: String(p.args.user).toLowerCase(), tokenId: this.num(p.args.newTokenId), raw: { burned: (p.args.burnedTokenIds || []).map((x: any) => this.num(x)) } }),
        },
      ];

      for (const j of jobs) {
        if (!j.addr) continue;
        inserted += await this.scanContract(j.addr, j.type, j.abi, defaultFrom, latest, force, j.map);
      }
      scannedFrom = defaultFrom;
      const pruned = logWindowStart != null && logWindowStart > 0;
      return { ok: true, scannedFrom, scannedTo, inserted, logWindowStart, pruned };
    } catch (e) {
      return {
        ok: false, scannedFrom, scannedTo, inserted, logWindowStart, pruned: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  private async scanContract(
    address: string,
    eventType: string,
    abi: string[],
    defaultFrom: number,
    latest: number,
    force: boolean,
    mapArgs: (parsed: ethers.LogDescription, log: ethers.Log) => Record<string, any>,
  ): Promise<number> {
    const reg = this.registry();
    const provider = this.getIndexProvider();
    const iface = new ethers.Interface(abi);
    const contract = new ethers.Contract(address, abi, provider);
    const topic = contract.getEvent(eventType).fragment.topicHash;

    const cursor = await this.getCursor(address, eventType);
    let fromBlock = defaultFrom;
    if (!force && cursor && cursor.lastProcessedBlock > 0) {
      fromBlock = Math.max(fromBlock, cursor.lastProcessedBlock + 1);
    }
    if (fromBlock > latest) return 0;

    // publicnode supports up to 50k block ranges for eth_getLogs.
    const CHUNK = Math.max(2000, Math.min(50000, Number(process.env.SPACEPORT_INDEX_CHUNK || 50000)));
    const MAX_CHUNKS = Math.max(1, Number(process.env.SPACEPORT_INDEX_MAX_CHUNKS || 40));
    const budgetMs = Math.max(10000, Number(process.env.SPACEPORT_INDEX_BUDGET_MS || 60000));
    const startedAt = Date.now();
    let inserted = 0;
    let start = fromBlock;
    let chunks = 0;
    let lastProcessed = cursor?.lastProcessedBlock || 0;

    while (start <= latest && chunks < MAX_CHUNKS) {
      if (Date.now() - startedAt > budgetMs) break;
      const end = Math.min(latest, start + CHUNK - 1);
      let logs: ethers.Log[] = [];
      try {
        logs = await this.withTimeout(
          provider.getLogs({ address, topics: [topic], fromBlock: start, toBlock: end }),
          15000,
        );
      } catch (e) {
        // RPC range failure: stop gracefully, keep cursor at last good block.
        this.logger.warn(`getLogs failed ${eventType} ${start}-${end}: ${e instanceof Error ? e.message : e}`);
        break;
      }
      for (const log of logs) {
        let parsed: ethers.LogDescription | null = null;
        try {
          parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
        } catch {
          continue;
        }
        if (!parsed) continue;
        const mapped = mapArgs(parsed, log);
        try {
          const res = await this.eventModel.updateOne(
            { chainId: reg.network.chainId, txHash: log.transactionHash.toLowerCase(), logIndex: log.index },
            {
              $setOnInsert: {
                chainId: reg.network.chainId,
                contractAddress: address.toLowerCase(),
                eventType,
                blockNumber: log.blockNumber,
                txHash: log.transactionHash.toLowerCase(),
                logIndex: log.index,
                ...mapped,
              },
            },
            { upsert: true },
          );
          if (res.upsertedCount && res.upsertedCount > 0) inserted += 1;
        } catch {
          // duplicate -> ignore (idempotent)
        }
      }
      lastProcessed = end;
      start = end + 1;
      chunks += 1;
    }

    await this.cursorModel.updateOne(
      { chainId: reg.network.chainId, contractAddress: address.toLowerCase(), eventType },
      { $set: { lastProcessedBlock: lastProcessed, lastSyncedAt: new Date() } },
      { upsert: true },
    );
    return inserted;
  }

  async getEvents(
    eventType: string,
    opts: { tokenId?: number; wallet?: string; limit?: number; skip?: number } = {},
  ) {
    const reg = this.registry();
    const q: Record<string, any> = { chainId: reg.network.chainId, eventType };
    if (opts.tokenId != null) q.tokenId = opts.tokenId;
    if (opts.wallet) {
      const w = opts.wallet.toLowerCase();
      q.$or = [{ from: w }, { to: w }, { buyer: w }];
    }
    const limit = Math.min(500, Math.max(1, opts.limit || 100));
    const [items, total] = await Promise.all([
      this.eventModel.find(q).sort({ blockNumber: -1, logIndex: -1 }).skip(opts.skip || 0).limit(limit).lean(),
      this.eventModel.countDocuments(q),
    ]);
    return { items, total };
  }

  async getCursors() {
    const reg = this.registry();
    return this.cursorModel.find({ chainId: reg.network.chainId }).lean();
  }

  async countEvents(eventType: string): Promise<number> {
    const reg = this.registry();
    return this.eventModel.countDocuments({ chainId: reg.network.chainId, eventType });
  }
}
