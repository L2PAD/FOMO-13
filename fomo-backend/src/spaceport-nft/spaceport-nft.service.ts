import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

const SPACEPORT_NFT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
] as const;

// Spaceport NFT is shared with the current BSC testnet Launchpad deployment.
// Production must provide SPACEPORT_RPC_URL (or the Launchpad RPC alias) so
// entitlement checks never silently query the contract on a different chain.
const DEFAULT_SPACEPORT_NFT_ADDRESS = '0x512C670006456D46679A67456eBe8564810C5609';

export type SpaceportNftCountStatus = 'ready' | 'no-wallet' | 'unavailable';

export interface SpaceportNftCountResponse {
  isSuccess: boolean;
  status: SpaceportNftCountStatus;
  walletAddress: string | null;
  nftAddress?: string;
  chainId?: number;
  count: number | null;
  source: 'contract';
  error?: string;
}

@Injectable()
export class SpaceportNftService {
  private readonly logger = new Logger(SpaceportNftService.name);
  private readonly countCache = new Map<
    string,
    { expiresAt: number; value: SpaceportNftCountResponse }
  >();

  async getWalletNftCount(walletAddress?: string): Promise<SpaceportNftCountResponse> {
    const normalizedWallet = this.normalizeAddress(walletAddress || '');

    if (!normalizedWallet) {
      return this.buildResponse({
        status: 'no-wallet',
        walletAddress: null,
        count: null,
      });
    }

    const cachedValue = this.getCachedCount(normalizedWallet);

    if (cachedValue) {
      return cachedValue;
    }

    const rpcUrl = this.getRpcUrl();
    const nftAddress = this.getNftAddress();

    if (!rpcUrl || !nftAddress) {
      return this.buildResponse({
        status: 'unavailable',
        walletAddress: normalizedWallet,
        nftAddress: nftAddress || undefined,
        count: null,
        error: 'spaceport-nft-config-missing',
      });
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(nftAddress, SPACEPORT_NFT_ABI, provider);

      const [balance, network] = await this.withTimeout(
        Promise.all([
          contract.balanceOf(normalizedWallet),
          provider.getNetwork(),
        ]),
      );

      return this.buildResponse({
        status: 'ready',
        walletAddress: normalizedWallet,
        nftAddress,
        chainId: Number(network.chainId),
        count: this.toSafeNumber(balance),
      }, true);
    } catch (error) {
      this.logger.warn(
        `Failed to fetch Spaceport NFT count for ${normalizedWallet}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return this.buildResponse({
        status: 'unavailable',
        walletAddress: normalizedWallet,
        nftAddress,
        count: null,
        error: 'spaceport-nft-rpc-unavailable',
      });
    }
  }

  async getWalletNftCounts(
    walletAddresses: string[],
  ): Promise<Record<string, SpaceportNftCountResponse>> {
    const normalizedWallets = Array.from(
      new Set(
        walletAddresses
          .map((walletAddress) => this.normalizeAddress(walletAddress || ''))
          .filter(Boolean),
      ),
    );
    const response: Record<string, SpaceportNftCountResponse> = {};
    const walletsToFetch: string[] = [];

    for (const walletAddress of normalizedWallets) {
      const cachedValue = this.getCachedCount(walletAddress);

      if (cachedValue) {
        response[walletAddress] = cachedValue;
      } else {
        walletsToFetch.push(walletAddress);
      }
    }

    if (!walletsToFetch.length) {
      return response;
    }

    const rpcUrl = this.getRpcUrl();
    const nftAddress = this.getNftAddress();

    if (!rpcUrl || !nftAddress) {
      for (const walletAddress of walletsToFetch) {
        response[walletAddress] = this.buildResponse({
          status: 'unavailable',
          walletAddress,
          nftAddress: nftAddress || undefined,
          count: null,
          error: 'spaceport-nft-config-missing',
        });
      }

      return response;
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(nftAddress, SPACEPORT_NFT_ABI, provider);
      const network = await this.withTimeout(provider.getNetwork());
      const chainId = Number(network.chainId);

      await Promise.all(
        walletsToFetch.map(async (walletAddress) => {
          try {
            const balance = await this.withTimeout(contract.balanceOf(walletAddress));

            response[walletAddress] = this.buildResponse({
              status: 'ready',
              walletAddress,
              nftAddress,
              chainId,
              count: this.toSafeNumber(balance),
            }, true);
          } catch (error) {
            this.logger.warn(
              `Failed to fetch Spaceport NFT count for ${walletAddress}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );

            response[walletAddress] = this.buildResponse({
              status: 'unavailable',
              walletAddress,
              nftAddress,
              count: null,
              error: 'spaceport-nft-rpc-unavailable',
            });
          }
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to initialize Spaceport NFT batch request: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      for (const walletAddress of walletsToFetch) {
        response[walletAddress] = this.buildResponse({
          status: 'unavailable',
          walletAddress,
          nftAddress,
          count: null,
          error: 'spaceport-nft-rpc-unavailable',
        });
      }
    }

    return response;
  }

  private buildResponse(
    payload: Omit<SpaceportNftCountResponse, 'isSuccess' | 'source'>,
    cache = false,
  ): SpaceportNftCountResponse {
    const response: SpaceportNftCountResponse = {
      ...payload,
      isSuccess: payload.status === 'ready',
      source: 'contract',
    };

    if (cache && response.walletAddress) {
      this.countCache.set(response.walletAddress, {
        expiresAt: Date.now() + this.getCacheTtlMs(),
        value: response,
      });
    }

    return response;
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

  private getNftAddress(): string {
    return this.normalizeAddress(
      process.env.SPACEPORT_NFT_ADDRESS ||
        process.env.FOMO_V2_LAUNCHPAD_STAKING_NFT_ADDRESS ||
        DEFAULT_SPACEPORT_NFT_ADDRESS,
    );
  }

  private normalizeAddress(address: string): string {
    const value = String(address || '').trim();

    if (!ethers.isAddress(value)) {
      return '';
    }

    return ethers.getAddress(value).toLowerCase();
  }

  private getCachedCount(walletAddress: string): SpaceportNftCountResponse | null {
    const cachedValue = this.countCache.get(walletAddress);

    if (!cachedValue) {
      return null;
    }

    if (cachedValue.expiresAt <= Date.now()) {
      this.countCache.delete(walletAddress);
      return null;
    }

    return cachedValue.value;
  }

  private getCacheTtlMs(): number {
    return Math.max(
      0,
      Number(process.env.SPACEPORT_NFT_COUNT_CACHE_TTL_MS || 5 * 60 * 1000),
    );
  }

  private toSafeNumber(value: unknown): number {
    const normalized =
      typeof value === 'bigint' ? Number(value) : Number(String(value));

    if (!Number.isSafeInteger(normalized) || normalized < 0) {
      throw new Error('Invalid Spaceport NFT balance value');
    }

    return normalized;
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeoutMs = Math.max(
      1000,
      Number(process.env.SPACEPORT_NFT_RPC_TIMEOUT_MS || 8000),
    );

    let timeout: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('Spaceport NFT RPC timeout'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
