import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethers } from 'ethers';
import { SpaceportChainService } from './spaceport-chain.service';
import {
  getSpaceportRegistry,
  isPreMintRarity,
  isRevealedRarity,
  isShardRarity,
  shardMergeCount,
  rarityName,
  SALE_WRITE_CAPABILITIES,
  NFT_WRITE_CAPABILITIES,
  FUSION_RECIPES,
  FUSION_OWNER_CAPABILITIES,
} from './spaceport-registry';
import { SpaceportPurchase } from '../spaceport-purchases/model/spaceport-purchase.model';
import { SpaceportOpening } from '../spaceport-openings/model/spaceport-opening.model';
import { SpaceportFusion } from '../spaceport-fusions/model/spaceport-fusion.model';
import { SpaceportAdminAction } from './model/spaceport-admin-action.model';
import { NftAccessActivation } from '../entitlements/models/nft-access-activation.model';
import { User, UserDocument } from '../user/user.model';

function dayStart(offsetDays: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d;
}

// Sale contract write ABI (owner-signed). Encoding only; backend never signs.
const SALE_WRITE_IFACE = new ethers.Interface([
  'function setSalePaused(bool paused)',
  'function setPrice(uint256 newPrice)',
]);
const NFT_WRITE_IFACE = new ethers.Interface([
  'function setMergeStartTime(uint256 ts)',
]);

@Injectable()
export class SpaceportControlService {
  constructor(
    private readonly chain: SpaceportChainService,
    @InjectModel(SpaceportPurchase.name)
    private readonly purchaseModel: Model<SpaceportPurchase>,
    @InjectModel(SpaceportOpening.name)
    private readonly openingModel: Model<SpaceportOpening>,
    @InjectModel(SpaceportFusion.name)
    private readonly fusionModel: Model<SpaceportFusion>,
    @InjectModel(SpaceportAdminAction.name)
    private readonly actionModel: Model<SpaceportAdminAction>,
    @InjectModel(NftAccessActivation.name)
    private readonly activationModel: Model<NftAccessActivation>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ---------- Access <-> Ownership invariant (P: blocker) ----------
  private normW(w?: string | null): string { return (w || '').toLowerCase().trim(); }

  async reconcileAccessOwnership(tokensArg?: any[]) {
    const reg = getSpaceportRegistry();
    const nftAddr = this.normW(reg.contracts.nft.address);
    const rpc = await this.chain.getRpcStatus();
    const tokens = tokensArg || (await this.chain.enumerateTokens());
    const ownerByToken = new Map<string, string>();
    for (const t of tokens) if (t.owner != null) ownerByToken.set(String(t.tokenId), this.normW(t.owner));

    const activations = await this.activationModel
      .find({ status: 'ACTIVE' })
      .lean()
      .catch(() => [] as any[]);

    const now = Date.now();
    const rows = (activations as any[]).map((a) => {
      const benefitHolder = this.normW(a.currentOwnerWallet || a.activatedByWallet);
      const onChainOwner = ownerByToken.has(String(a.tokenId)) ? ownerByToken.get(String(a.tokenId))! : null;
      const expired = a.accessEndsAt && new Date(a.accessEndsAt).getTime() < now;
      // canonical policy (per activation model): remaining period follows the token
      const transferPolicy = 'REMAINING_FOLLOWS_TOKEN';
      let status: string;
      if (!rpc.ok) status = 'CHAIN_UNAVAILABLE';
      else if (this.normW(a.contractAddress) === nftAddr && onChainOwner == null) status = 'TOKEN_NOT_FOUND';
      else if (expired) status = 'EXPIRED';
      else if (onChainOwner && benefitHolder && onChainOwner === benefitHolder) status = 'IN_SYNC';
      else if (onChainOwner && benefitHolder && onChainOwner !== benefitHolder)
        // policy transfers remaining access -> do NOT revoke; flag for materialization
        status = 'TRANSFER_PENDING';
      else status = 'OWNER_MISMATCH';
      return {
        tokenId: a.tokenId,
        collection: a.contractAddress,
        currentOnChainOwner: onChainOwner,
        benefitHolder,
        activatedBy: this.normW(a.activatedByWallet),
        activatedAt: a.activatedAt,
        expiresAt: a.accessEndsAt,
        transferPolicy,
        status,
      };
    });

    const summary = rows.reduce((acc: Record<string, number>, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
    return {
      policy: 'REMAINING_FOLLOWS_TOKEN',
      note: 'OWNER_MISMATCH не отзывает benefit: по канонической политике остаток доступа следует за токеном. TRANSFER_PENDING = требуется материализация переноса benefit новому владельцу.',
      totalActive: rows.length,
      summary,
      activations: rows,
    };
  }

  /** Normalize a purchase's paid amount into human token units using chain decimals. */
  private normalizedPaid(p: any, decimals: number): number {
    if (p.totalPriceRaw && String(p.totalPriceRaw).length > 0) {
      try {
        return Number(ethers.formatUnits(String(p.totalPriceRaw), decimals));
      } catch {
        /* fallthrough */
      }
    }
    return Number(p.totalPrice || 0);
  }

  private async revenueBuckets(decimals: number) {
    const all = await this.purchaseModel.find({}).lean();
    const t0 = dayStart(0);
    const t7 = dayStart(7);
    const t30 = dayStart(30);
    let lifetime = 0;
    let today = 0;
    let d7 = 0;
    let d30 = 0;
    let units = 0;
    const buyers = new Set<string>();
    for (const p of all as any[]) {
      const paid = this.normalizedPaid(p, decimals);
      const when = new Date(p.purchasedAt || p.createdAt);
      lifetime += paid;
      units += Number(p.quantity || 0);
      if (p.walletAddress) buyers.add(String(p.walletAddress).toLowerCase());
      if (when >= t0) today += paid;
      if (when >= t7) d7 += paid;
      if (when >= t30) d30 += paid;
    }
    return {
      lifetime,
      today,
      d7,
      d30,
      unitsSold: units,
      buyers: buyers.size,
      orders: all.length,
      avgOrder: all.length ? lifetime / all.length : 0,
    };
  }

  async getRegistry() {
    const reg = getSpaceportRegistry();
    const rpc = await this.chain.getRpcStatus();
    return { registry: reg, rpc };
  }

  async getOverview() {
    const reg = getSpaceportRegistry();
    const [rpc, sale, nft, erc20, tokens] = await Promise.all([
      this.chain.getRpcStatus(),
      this.chain.getSaleState(),
      this.chain.getNftState(),
      this.chain.getErc20Meta(),
      this.chain.enumerateTokens(),
    ]);
    const decimals = (erc20 as any)?.decimals || reg.paymentTokenDecimals;
    const revenue = await this.revenueBuckets(decimals);

    // Holders from live enumeration
    const holderCounts = new Map<string, number>();
    let revealed = 0;
    let preMint = 0;
    let staked = 0;
    for (const t of tokens) {
      if (t.owner) holderCounts.set(t.owner.toLowerCase(), (holderCounts.get(t.owner.toLowerCase()) || 0) + 1);
      if (t.rarityId != null && isRevealedRarity(t.rarityId)) revealed += 1;
      if (t.rarityId != null && isPreMintRarity(t.rarityId)) preMint += 1;
      if (t.isStaked) staked += 1;
    }
    const multiHolders = [...holderCounts.values()].filter((c) => c >= 2).length;

    const openings = await this.openingModel.countDocuments({});
    const raritySupply = this.raritySupplyFromTokens(tokens);
    // live fusion eligibility summary (per-rarity pair/shard availability)
    const shardsNeeded = shardMergeCount();
    const eligByOwner = new Map<string, Map<number, number>>();
    for (const t of tokens) {
      if (t.owner == null || t.rarityId == null) continue;
      const w = t.owner.toLowerCase();
      const m = eligByOwner.get(w) || new Map<number, number>();
      m.set(t.rarityId, (m.get(t.rarityId) || 0) + 1);
      eligByOwner.set(w, m);
    }
    let fusionEligibleHolders = 0, fusionPossible = 0;
    for (const m of eligByOwner.values()) {
      let p = 0;
      for (const [rid, c] of m.entries()) {
        if (isPreMintRarity(rid) && c >= 2) p += Math.floor(c / 2);
        if (isRevealedRarity(rid) && rid < 8 && c >= 2) p += Math.floor(c / 2);
        if (isShardRarity(rid) && c >= shardsNeeded) p += Math.floor(c / shardsNeeded);
      }
      if (p > 0) { fusionEligibleHolders += 1; fusionPossible += p; }
    }
    const highestRarity = tokens.reduce((mx, t) => (t.rarityId != null && t.rarityId > mx ? t.rarityId : mx), -1);

    return {
      network: reg.network,
      registrySource: reg.source,
      rpc,
      genesis: {
        status: reg.contracts.genesis.address ? 'CONFIGURED' : 'NOT_CONFIGURED',
        address: reg.contracts.genesis.address,
      },
      sale,
      nft,
      paymentToken: erc20,
      supply: {
        minted: sale?.totalMinted ?? nft?.totalSupply ?? null,
        max: sale?.maxSupply ?? null,
        remaining: sale?.remaining ?? null,
        currentSupply: nft?.totalSupply ?? tokens.length,
      },
      holders: {
        unique: holderCounts.size,
        multiHolders,
        totalTokensHeld: tokens.length,
      },
      reveal: {
        revealed,
        preMint,
        openingsRecorded: openings,
        revealRate: tokens.length ? Math.round((revealed / tokens.length) * 100) : 0,
      },
      staking: { stakedTokens: staked },
      raritySupply,
      fusion: {
        eligibleHolders: fusionEligibleHolders,
        possibleFusions: fusionPossible,
        highestRarityId: highestRarity,
        highestRarityName: highestRarity >= 0 ? rarityName(highestRarity) : null,
      },
      revenue: { ...revenue, currency: (erc20 as any)?.symbol || 'USDT', decimals },
      saleState: sale?.salePaused === true ? 'PAUSED' : sale?.salePaused === false ? 'ACTIVE' : 'UNKNOWN',
    };
  }

  async getCollections() {
    const reg = getSpaceportRegistry();
    const [sale, nft, erc20] = await Promise.all([
      this.chain.getSaleState(),
      this.chain.getNftState(),
      this.chain.getErc20Meta(),
    ]);
    const collections = [
      {
        role: 'nft',
        label: reg.contracts.nft.label,
        kind: reg.contracts.nft.kind,
        address: reg.contracts.nft.address,
        network: reg.network,
        owner: (nft as any)?.owner || null,
        name: (nft as any)?.name || null,
        symbol: (nft as any)?.symbol || null,
        totalSupply: (nft as any)?.totalSupply ?? null,
        nextTokenId: (nft as any)?.nextTokenId ?? null,
        baseURI: (nft as any)?.baseURI ?? null,
        maxSupply: (sale as any)?.maxSupply ?? null,
        writeCapabilities: NFT_WRITE_CAPABILITIES,
      },
      {
        role: 'sale',
        label: reg.contracts.sale.label,
        kind: reg.contracts.sale.kind,
        address: reg.contracts.sale.address,
        network: reg.network,
        owner: (sale as any)?.owner || null,
        price: (sale as any)?.price ?? null,
        paymentToken: (sale as any)?.paymentToken || null,
        linkedNft: (sale as any)?.nftContract || null,
        maxSupply: (sale as any)?.maxSupply ?? null,
        maxPerWallet: (sale as any)?.maxPerWallet ?? null,
        salePaused: (sale as any)?.salePaused ?? null,
        writeCapabilities: SALE_WRITE_CAPABILITIES,
      },
      {
        role: 'paymentToken',
        label: reg.contracts.paymentToken.label,
        kind: reg.contracts.paymentToken.kind,
        address: reg.contracts.paymentToken.address,
        network: reg.network,
        symbol: (erc20 as any)?.symbol || null,
        decimals: (erc20 as any)?.decimals ?? reg.paymentTokenDecimals,
      },
      {
        role: 'launchpad',
        label: reg.contracts.launchpad.label,
        kind: reg.contracts.launchpad.kind,
        address: reg.contracts.launchpad.address,
        network: reg.network,
      },
      {
        role: 'genesis',
        label: reg.contracts.genesis.label,
        kind: reg.contracts.genesis.kind,
        address: reg.contracts.genesis.address,
        network: reg.network,
        status: reg.contracts.genesis.address ? 'CONFIGURED' : 'NOT_CONFIGURED',
      },
    ];
    return { collections };
  }

  async getSales() {
    const reg = getSpaceportRegistry();
    const erc20 = await this.chain.getErc20Meta();
    const decimals = (erc20 as any)?.decimals || reg.paymentTokenDecimals;
    const revenue = await this.revenueBuckets(decimals);
    const purchases = await this.purchaseModel.find({}).sort({ purchasedAt: -1 }).limit(200).lean();
    const rows = (purchases as any[]).map((p) => ({
      _id: String(p._id),
      walletAddress: p.walletAddress,
      quantity: Number(p.quantity || 0),
      paid: this.normalizedPaid(p, decimals),
      paidRaw: p.totalPriceRaw,
      txHash: p.txHash,
      blockNumber: p.blockNumber ?? null,
      referralAddress: p.referralAddress || null,
      purchasedAt: p.purchasedAt,
      source: 'backend_user_submitted',
    }));
    const indexedPurchased = await this.chain.countEvents('Purchased');
    return {
      currency: (erc20 as any)?.symbol || 'USDT',
      decimals,
      revenue,
      indexedPurchasedEvents: indexedPurchased,
      purchases: rows,
    };
  }

  async getHolders() {
    const tokens = await this.chain.enumerateTokens();
    const byOwner = new Map<string, number[]>();
    for (const t of tokens) {
      const owner = (t.owner || '').toLowerCase();
      if (!owner) continue;
      const arr = byOwner.get(owner) || [];
      arr.push(t.tokenId);
      byOwner.set(owner, arr);
    }
    const wallets = [...byOwner.keys()];
    // Join users by wallet (case-insensitive)
    const users = wallets.length
      ? await this.userModel
          .find({ wallet: { $in: wallets.flatMap((w) => [w, ethers.getAddress(w)]) } }, { wallet: 1, email: 1, name: 1, username: 1 })
          .lean()
          .catch(() => [] as any[])
      : [];
    const userByWallet = new Map<string, any>();
    for (const u of users as any[]) {
      if (u.wallet) userByWallet.set(String(u.wallet).toLowerCase(), u);
    }
    const holders = wallets
      .map((w) => {
        const ids = byOwner.get(w) || [];
        const u = userByWallet.get(w);
        return {
          wallet: w,
          userId: u ? String(u._id) : null,
          email: u?.email || null,
          name: u?.name || u?.username || null,
          tokenCount: ids.length,
          tokenIds: ids.sort((a, b) => a - b),
        };
      })
      .sort((a, b) => b.tokenCount - a.tokenCount);

    const segments = { s1: 0, s2: 0, s3: 0, s4plus: 0 };
    for (const h of holders) {
      if (h.tokenCount === 1) segments.s1 += 1;
      else if (h.tokenCount === 2) segments.s2 += 1;
      else if (h.tokenCount === 3) segments.s3 += 1;
      else if (h.tokenCount >= 4) segments.s4plus += 1;
    }
    return {
      uniqueHolders: holders.length,
      multiHolders: holders.filter((h) => h.tokenCount >= 2).length,
      segments,
      holders,
    };
  }

  async getTokens(opts: { search?: string } = {}) {
    const tokens = await this.chain.enumerateTokens();
    let filtered = tokens;
    const s = String(opts.search || '').trim().toLowerCase();
    if (s) {
      filtered = tokens.filter(
        (t) =>
          String(t.tokenId) === s ||
          (t.owner || '').toLowerCase().includes(s) ||
          (t.rarityName || '').toLowerCase().includes(s),
      );
    }
    return { tokens: filtered, total: tokens.length };
  }

  async getTokenDetail(tokenId: number) {
    const reg = getSpaceportRegistry();
    const [info, transfers, opening] = await Promise.all([
      this.chain.getTokenInfo(tokenId),
      this.chain.getEvents('Transfer', { tokenId, limit: 100 }),
      this.openingModel.findOne({ tokenId }).lean(),
    ]);
    return {
      token: info,
      transfers: transfers.items,
      opening: opening || null,
      revealed: (info as any)?.rarityId != null ? isRevealedRarity((info as any).rarityId) : null,
      explorerBase: reg.network.explorerUrl,
    };
  }

  async getReveal() {
    const tokens = await this.chain.enumerateTokens();
    const dist: Record<string, number> = {};
    let revealed = 0;
    let preMint = 0;
    for (const t of tokens) {
      const key = t.rarityName || 'Unknown';
      dist[key] = (dist[key] || 0) + 1;
      if (t.rarityId != null && isRevealedRarity(t.rarityId)) revealed += 1;
      if (t.rarityId != null && isPreMintRarity(t.rarityId)) preMint += 1;
    }
    const openings = await this.openingModel.find({}).sort({ openedAt: -1 }).limit(200).lean();
    return {
      model: 'IN_PLACE_RARITY_MUTATION',
      note: 'openPreMint(tokenId) mutates rarity on the same tokenId; no burn, no new token, no dedicated event.',
      distribution: dist,
      revealed,
      preMint,
      total: tokens.length,
      revealRate: tokens.length ? Math.round((revealed / tokens.length) * 100) : 0,
      openings: (openings as any[]).map((o) => ({
        walletAddress: o.walletAddress,
        tokenId: o.tokenId,
        txHash: o.txHash || null,
        openedAt: o.openedAt,
        rarityName: o.metadata?.rarityName || null,
      })),
    };
  }

  async getTransfers(opts: { limit?: number; skip?: number; wallet?: string } = {}) {
    const reg = getSpaceportRegistry();
    const { items, total } = await this.chain.getEvents('Transfer', opts);
    const ZERO = '0x0000000000000000000000000000000000000000';
    return {
      explorerBase: reg.network.explorerUrl,
      total,
      transfers: (items as any[]).map((e) => ({
        tokenId: e.tokenId,
        from: e.from,
        to: e.to,
        kind: e.from === ZERO ? 'mint' : e.to === ZERO ? 'burn' : 'transfer',
        blockNumber: e.blockNumber,
        txHash: e.txHash,
      })),
    };
  }

  async getContractControl() {
    const reg = getSpaceportRegistry();
    const [sale, nft, erc20, rpc] = await Promise.all([
      this.chain.getSaleState(),
      this.chain.getNftState(),
      this.chain.getErc20Meta(),
      this.chain.getRpcStatus(),
    ]);
    return {
      network: reg.network,
      rpc,
      sale: {
        address: reg.contracts.sale.address,
        owner: (sale as any)?.owner || null,
        salePaused: (sale as any)?.salePaused ?? null,
        price: (sale as any)?.price ?? null,
        priceRaw: (sale as any)?.priceRaw ?? null,
        paymentToken: (sale as any)?.paymentToken || null,
        nftContract: (sale as any)?.nftContract || null,
        maxSupply: (sale as any)?.maxSupply ?? null,
        maxPerWallet: (sale as any)?.maxPerWallet ?? null,
        writeCapabilities: SALE_WRITE_CAPABILITIES,
        requiresOwnerSignature: true,
      },
      nft: {
        address: reg.contracts.nft.address,
        owner: (nft as any)?.owner || null,
        baseURI: (nft as any)?.baseURI ?? null,
        mergeStartTime: (nft as any)?.mergeStartTime ?? null,
        writeCapabilities: NFT_WRITE_CAPABILITIES,
        fusionOwnerControls: FUSION_OWNER_CAPABILITIES,
        requiresOwnerSignature: true,
      },
      paymentToken: erc20,
    };
  }

  // ---------- Rarity supply (live, from enumeration) ----------
  private raritySupplyFromTokens(tokens: any[]) {
    const dist: Record<string, number> = {};
    let shards = 0, preMint = 0, revealed = 0;
    for (const t of tokens) {
      const key = t.rarityName || 'Unknown';
      dist[key] = (dist[key] || 0) + 1;
      if (t.rarityId != null && isShardRarity(t.rarityId)) shards += 1;
      else if (t.rarityId != null && isPreMintRarity(t.rarityId)) preMint += 1;
      else if (t.rarityId != null && isRevealedRarity(t.rarityId)) revealed += 1;
    }
    return { distribution: dist, circulating: tokens.length, shards, preMint, revealed };
  }

  // ---------- Fusion (P41-P46): recipes + live eligibility + operations ----------
  async getFusion() {
    const reg = getSpaceportRegistry();
    const [tokens, nftState] = await Promise.all([
      this.chain.enumerateTokens(),
      this.chain.getNftState(),
    ]);
    const shardsNeeded = shardMergeCount();

    // Group current holdings by owner + rarity (live ownership, NOT past purchases)
    const byOwner = new Map<string, Map<number, number>>();
    for (const t of tokens) {
      if (t.owner == null || t.rarityId == null) continue;
      const w = t.owner.toLowerCase();
      const m = byOwner.get(w) || new Map<number, number>();
      m.set(t.rarityId, (m.get(t.rarityId) || 0) + 1);
      byOwner.set(w, m);
    }

    // Eligibility per holder
    const eligibleHolders: any[] = [];
    let totalPossible = 0;
    for (const [wallet, m] of byOwner.entries()) {
      let possible = 0;
      const holdings: Record<string, number> = {};
      for (const [rid, count] of m.entries()) {
        holdings[rarityName(rid)] = count;
        if (isPreMintRarity(rid) && count >= 2) possible += Math.floor(count / 2);
        if (isRevealedRarity(rid) && rid < 8 && count >= 2) possible += Math.floor(count / 2);
        if (isShardRarity(rid) && count >= shardsNeeded) possible += Math.floor(count / shardsNeeded);
      }
      if (possible > 0) {
        eligibleHolders.push({ wallet, possibleFusions: possible, holdings });
        totalPossible += possible;
      }
    }
    eligibleHolders.sort((a, b) => b.possibleFusions - a.possibleFusions);

    // Historical operations from indexed events (canonical) + backend records
    const [preMintMerged, standardMerged, shardsMerged, backendFusions] = await Promise.all([
      this.chain.getEvents('PreMintMerged', { limit: 500 }),
      this.chain.getEvents('StandardMerged', { limit: 500 }),
      this.chain.getEvents('ShardsMerged', { limit: 500 }),
      this.fusionModel.find({}).sort({ createdAt: -1 }).limit(200).lean().catch(() => []),
    ]);
    const indexedOps = preMintMerged.total + standardMerged.total + shardsMerged.total;
    const opsUsers = new Set<string>();
    const mapOp = (items: any[], kind: string) => (items || []).map((e) => {
      if (e.from) opsUsers.add(e.from);
      return {
        kind,
        wallet: e.from,
        outputTokenId: e.tokenId,
        outputRarityId: e.raw?.newRarity ?? null,
        outputRarityName: e.raw?.newRarity != null ? rarityName(e.raw.newRarity) : null,
        burned: e.raw?.burned || [],
        txHash: e.txHash,
        blockNumber: e.blockNumber,
      };
    });
    const operations = [
      ...mapOp(preMintMerged.items as any[], 'premint_merge'),
      ...mapOp(standardMerged.items as any[], 'standard_upgrade'),
      ...mapOp(shardsMerged.items as any[], 'shard_merge'),
    ].sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));

    return {
      recipes: FUSION_RECIPES,
      shardsNeeded,
      permissionless: true,
      ownerControls: FUSION_OWNER_CAPABILITIES,
      mergeStartTime: (nftState as any)?.mergeStartTime ?? null,
      raritySupply: this.raritySupplyFromTokens(tokens),
      eligibility: {
        eligibleHolders: eligibleHolders.length,
        totalPossibleFusions: totalPossible,
        holders: eligibleHolders.slice(0, 100),
      },
      operations: {
        indexedTotal: indexedOps,
        users: opsUsers.size,
        backendRecords: (backendFusions as any[]).length,
        items: operations.slice(0, 100),
        historyStatus: indexedOps === 0 ? 'UNAVAILABLE_OR_NONE' : 'INDEXED',
      },
    };
  }

  // ---------- Customer 360 -> NFT (P47) ----------
  async getCustomerNft(userId: string) {
    const reg = getSpaceportRegistry();
    const user = await this.userModel.findById(userId, { wallet: 1, email: 1, name: 1, username: 1 }).lean().catch(() => null);
    const wallets = new Set<string>();
    if (user && (user as any).wallet) wallets.add(String((user as any).wallet).toLowerCase());
    // fallback: wallets seen in purchases/openings for this user
    const purch = await this.purchaseModel.find({ userId }).lean().catch(() => []);
    for (const p of purch as any[]) if (p.walletAddress) wallets.add(String(p.walletAddress).toLowerCase());

    const walletList = [...wallets];
    const tokens = await this.chain.enumerateTokens();
    // current ownership determined by CHAIN state, not past purchases
    const owned = tokens.filter((t) => t.owner && walletList.includes(t.owner.toLowerCase()));
    const shardsNeeded = shardMergeCount();

    // fusion eligibility for this user's holdings
    const byRarity = new Map<number, number>();
    for (const t of owned) if (t.rarityId != null) byRarity.set(t.rarityId, (byRarity.get(t.rarityId) || 0) + 1);
    let possibleFusions = 0;
    for (const [rid, c] of byRarity.entries()) {
      if (isPreMintRarity(rid) && c >= 2) possibleFusions += Math.floor(c / 2);
      if (isRevealedRarity(rid) && rid < 8 && c >= 2) possibleFusions += Math.floor(c / 2);
      if (isShardRarity(rid) && c >= shardsNeeded) possibleFusions += Math.floor(c / shardsNeeded);
    }

    const tokenIds = owned.map((t) => t.tokenId);
    const [openings, transfers, fusions] = await Promise.all([
      this.openingModel.find({ walletAddress: { $in: walletList } }).lean().catch(() => []),
      walletList.length ? this.chain.getEvents('Transfer', { wallet: walletList[0], limit: 100 }) : Promise.resolve({ items: [], total: 0 }),
      this.fusionModel.find({ walletAddress: { $in: walletList } }).lean().catch(() => []),
    ]);

    return {
      userId,
      email: user ? (user as any).email : null,
      name: user ? ((user as any).name || (user as any).username) : null,
      wallets: walletList,
      network: reg.network,
      currentAssets: {
        count: owned.length,
        tokens: owned,
        highestRarity: owned.reduce((mx, t) => (t.rarityId != null && t.rarityId > mx ? t.rarityId : mx), -1),
      },
      fusion: { possibleFusions, eligible: possibleFusions > 0 },
      openings: openings || [],
      transfers: (transfers as any).items || [],
      fusionRecords: fusions || [],
      note: 'Текущий владелец определяется состоянием блокчейна (ownerOf), а не историей покупок.',
    };
  }

  // ---------- Owner-signed Contract Control: prepare / record / audit ----------
  private buildCalldata(action: string, params: any): { to: string; data: string; contract: string } {
    const reg = getSpaceportRegistry();
    switch (action) {
      case 'setSalePaused':
        return { to: reg.contracts.sale.address!, contract: 'sale', data: SALE_WRITE_IFACE.encodeFunctionData('setSalePaused', [!!params.paused]) };
      case 'setPrice': {
        const raw = ethers.parseUnits(String(params.price), reg.paymentTokenDecimals);
        return { to: reg.contracts.sale.address!, contract: 'sale', data: SALE_WRITE_IFACE.encodeFunctionData('setPrice', [raw]) };
      }
      case 'setMergeStartTime':
        return { to: reg.contracts.nft.address!, contract: 'nft', data: NFT_WRITE_IFACE.encodeFunctionData('setMergeStartTime', [BigInt(Math.trunc(Number(params.ts)))]) };
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  async prepareControlAction(body: { action: string; params: any; actorWallet?: string }) {
    const reg = getSpaceportRegistry();
    const [sale, nft] = await Promise.all([this.chain.getSaleState(), this.chain.getNftState()]);
    const owner = (body.action === 'setMergeStartTime' ? (nft as any)?.owner : (sale as any)?.owner) || null;
    const built = this.buildCalldata(body.action, body.params || {});
    const isOwner = !!body.actorWallet && !!owner && body.actorWallet.toLowerCase() === owner.toLowerCase();
    let currentValue: any = null;
    if (body.action === 'setSalePaused') currentValue = (sale as any)?.salePaused;
    if (body.action === 'setPrice') currentValue = (sale as any)?.price;
    if (body.action === 'setMergeStartTime') currentValue = (nft as any)?.mergeStartTime;
    const highRisk = ['setPaymentToken', 'setNFTContract', 'rescueTokens', 'rescueNative'].includes(body.action);
    return {
      action: body.action,
      chainId: reg.network.chainId,
      to: built.to,
      contract: built.contract,
      data: built.data,
      requiredOwner: owner,
      connectedWalletIsOwner: isOwner,
      currentValue,
      newValue: body.params,
      highRisk,
      requiresOwnerSignature: true,
    };
  }

  async recordControlAction(body: { action: string; params: any; txHash?: string; actorWallet?: string; actorUserId?: string; status?: string }) {
    const reg = getSpaceportRegistry();
    const [sale, nft] = await Promise.all([this.chain.getSaleState(), this.chain.getNftState()]);
    const owner = (body.action === 'setMergeStartTime' ? (nft as any)?.owner : (sale as any)?.owner) || null;
    const built = this.buildCalldata(body.action, body.params || {});
    let afterValue: any = null;
    if (body.action === 'setSalePaused') afterValue = (sale as any)?.salePaused;
    if (body.action === 'setPrice') afterValue = (sale as any)?.price;
    if (body.action === 'setMergeStartTime') afterValue = (nft as any)?.mergeStartTime;
    const doc = await this.actionModel.create({
      chainId: reg.network.chainId,
      action: body.action,
      contractAddress: built.to.toLowerCase(),
      params: body.params || {},
      afterValue: afterValue != null ? String(afterValue) : null,
      actorWallet: body.actorWallet ? body.actorWallet.toLowerCase() : null,
      actorUserId: body.actorUserId || null,
      txHash: body.txHash ? body.txHash.toLowerCase() : null,
      status: body.status || (body.txHash ? 'submitted' : 'prepared'),
      ownerVerified: !!body.actorWallet && !!owner && body.actorWallet.toLowerCase() === owner.toLowerCase(),
    });
    return { ok: true, id: String(doc._id), postWriteChainValue: afterValue };
  }

  async getControlAudit() {
    const reg = getSpaceportRegistry();
    const items = await this.actionModel.find({ chainId: reg.network.chainId }).sort({ createdAt: -1 }).limit(100).lean();
    return { audit: items };
  }

  async syncIndexer(force = false) {
    return this.chain.syncEvents(force);
  }

  async getDiagnostics() {
    const reg = getSpaceportRegistry();
    const [rpc, sale, nft, tokens, cursors] = await Promise.all([
      this.chain.getRpcStatus(),
      this.chain.getSaleState(),
      this.chain.getNftState(),
      this.chain.enumerateTokens(),
      this.chain.getCursors(),
    ]);
    const [indexedTransfers, indexedPurchased, backendPurchases, backendOpenings, indexedFusion] = await Promise.all([
      this.chain.countEvents('Transfer'),
      this.chain.countEvents('Purchased'),
      this.purchaseModel.countDocuments({}),
      this.openingModel.countDocuments({}),
      Promise.all([
        this.chain.countEvents('PreMintMerged'),
        this.chain.countEvents('StandardMerged'),
        this.chain.countEvents('ShardsMerged'),
      ]).then((a) => a.reduce((x, y) => x + y, 0)),
    ]);

    const chainSupply = (nft as any)?.totalSupply ?? null;
    const enumerated = tokens.length;
    const chainMinted = (sale as any)?.totalMinted ?? null;

    const checks: Array<{ key: string; status: string; detail: string }> = [];
    const push = (key: string, status: string, detail: string) => checks.push({ key, status, detail });

    if (!rpc.ok) push('rpc', 'READS_UNAVAILABLE', rpc.error || 'RPC unavailable');
    else if (rpc.chainId !== rpc.expectedChainId)
      push('network', 'MISMATCH', `RPC chainId ${rpc.chainId} != expected ${rpc.expectedChainId}`);
    else push('network', 'IN_SYNC', `chainId ${rpc.chainId} (${reg.network.name})`);

    if (chainSupply != null) {
      push(
        'supply_enumeration',
        chainSupply === enumerated ? 'IN_SYNC' : 'MISMATCH',
        `chain totalSupply=${chainSupply}, enumerated=${enumerated}`,
      );
    } else push('supply_enumeration', 'READS_UNAVAILABLE', 'totalSupply read failed');

    push(
      'purchases_backend_vs_indexed',
      indexedPurchased === 0 && backendPurchases > 0 ? 'INDEXER_BEHIND' : indexedPurchased >= backendPurchases ? 'IN_SYNC' : 'INDEXER_BEHIND',
      `indexedPurchased=${indexedPurchased}, backendPurchases=${backendPurchases}`,
    );

    push(
      'transfers_indexed',
      indexedTransfers > 0 ? 'IN_SYNC' : 'UNKNOWN',
      indexedTransfers > 0 ? `${indexedTransfers} transfer events indexed` : 'No transfers indexed yet — run sync (logs may be pruned on free RPC; set SPACEPORT_INDEX_RPC_URL to archive-log endpoint)',
    );

    push(
      'fusion_indexed',
      indexedFusion > 0 ? 'IN_SYNC' : 'UNKNOWN',
      indexedFusion > 0 ? `${indexedFusion} fusion events indexed` : 'No fusion events in the queryable log window (or none occurred). Current-state fusion eligibility is live regardless.',
    );

    const needsAttention: string[] = [];
    const accessRecon = await this.reconcileAccessOwnership(tokens);
    const pendingTransfers = accessRecon.summary['TRANSFER_PENDING'] || 0;
    const ownerMismatch = accessRecon.summary['OWNER_MISMATCH'] || 0;
    if (pendingTransfers > 0) needsAttention.push(`${pendingTransfers} NFT-access активаций: токен сменил владельца — требуется материализация переноса benefit (TRANSFER_PENDING).`);
    if (ownerMismatch > 0) needsAttention.push(`${ownerMismatch} NFT-access активаций с OWNER_MISMATCH — проверьте политику доступа.`);
    if (!rpc.ok) needsAttention.push('RPC reads unavailable — Contract Control / live metrics degraded.');
    if (chainSupply != null && chainSupply !== enumerated)
      needsAttention.push('On-chain totalSupply differs from enumerated tokens.');
    if (indexedTransfers === 0)
      needsAttention.push('Transfer indexer empty — set SPACEPORT_INDEX_FROM_BLOCK to the deploy block for full history.');
    if (reg.paymentTokenDecimals !== 18)
      needsAttention.push('paymentTokenDecimals != 18 — verify against chain (USDT on this deployment is 18).');

    return {
      network: reg.network,
      registrySource: reg.source,
      rpc,
      counts: {
        chainSupply,
        chainMinted,
        enumerated,
        indexedTransfers,
        indexedPurchased,
        indexedFusion,
        backendPurchases,
        backendOpenings,
      },
      cursors,
      checks,
      systemHealth: {
        boxContract: (nft as any)?.available ? 'HEALTHY' : 'ACTION_REQUIRED',
        sale: (sale as any)?.available ? 'HEALTHY' : 'ACTION_REQUIRED',
        indexer: indexedTransfers > 0 ? 'HEALTHY' : 'DEGRADED',
        rpc: rpc.ok ? 'HEALTHY' : 'ACTION_REQUIRED',
        accessOwnership: (accessRecon.summary['OWNER_MISMATCH'] || accessRecon.summary['TRANSFER_PENDING'] || accessRecon.summary['TOKEN_NOT_FOUND']) ? 'ACTION_REQUIRED' : 'HEALTHY',
      },
      accessReconciliation: accessRecon,
      needsAttention,
    };
  }
}
