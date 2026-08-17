import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getAddress } from "ethers";
import { FomoV2LaunchpadDeployment } from "../types";

const DEFAULT_DEPLOYMENT = {
  chainId: 97,
  chainName: "BSC Testnet",
  launchpadAddress: "0x0608B52aAC58E7313481d0809E8b4525BDD11d33",
  investTokenAddress: "0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948",
  investTokenDecimals: 18,
  investTokenSymbol: "USDT",
  stakingNftAddress: "0x512C670006456D46679A67456eBe8564810C5609",
  nftMarketAddress: "0x40198F1A090d9893d7822F8804e5317E28C5A776",
  explorerUrl: "https://testnet.bscscan.com",
  confirmations: 1,
  abiVersion: "launchpad-bsc-testnet-v1",
} as const;

@Injectable()
export class FomoV2LaunchpadDeploymentService {
  private readonly deployment: FomoV2LaunchpadDeployment;
  private readonly rpcUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.rpcUrl = this.cleanString(
      this.configService.get<string>("FOMO_V2_LAUNCHPAD_RPC_URL") ||
        this.configService.get<string>("BSC_TESTNET_RPC_URL")
    );

    this.deployment = {
      chainId: this.readInteger(
        "FOMO_V2_LAUNCHPAD_CHAIN_ID",
        DEFAULT_DEPLOYMENT.chainId,
        1,
        Number.MAX_SAFE_INTEGER
      ),
      chainName:
        this.cleanString(
          this.configService.get<string>("FOMO_V2_LAUNCHPAD_CHAIN_NAME")
        ) || DEFAULT_DEPLOYMENT.chainName,
      launchpadAddress: this.readAddress(
        "FOMO_V2_LAUNCHPAD_ADDRESS",
        DEFAULT_DEPLOYMENT.launchpadAddress
      ),
      investTokenAddress: this.readAddress(
        "FOMO_V2_LAUNCHPAD_INVEST_TOKEN_ADDRESS",
        DEFAULT_DEPLOYMENT.investTokenAddress
      ),
      investTokenDecimals: this.readInteger(
        "FOMO_V2_LAUNCHPAD_INVEST_TOKEN_DECIMALS",
        DEFAULT_DEPLOYMENT.investTokenDecimals,
        0,
        255
      ),
      investTokenSymbol:
        this.cleanString(
          this.configService.get<string>(
            "FOMO_V2_LAUNCHPAD_INVEST_TOKEN_SYMBOL"
          )
        ) || DEFAULT_DEPLOYMENT.investTokenSymbol,
      stakingNftAddress: this.readAddress(
        "FOMO_V2_LAUNCHPAD_STAKING_NFT_ADDRESS",
        DEFAULT_DEPLOYMENT.stakingNftAddress
      ),
      nftMarketAddress: this.readAddress(
        "FOMO_V2_LAUNCHPAD_NFT_MARKET_ADDRESS",
        DEFAULT_DEPLOYMENT.nftMarketAddress
      ),
      explorerUrl:
        this.cleanString(
          this.configService.get<string>("FOMO_V2_LAUNCHPAD_EXPLORER_URL")
        ) || DEFAULT_DEPLOYMENT.explorerUrl,
      confirmations: this.readInteger(
        "FOMO_V2_LAUNCHPAD_CONFIRMATIONS",
        DEFAULT_DEPLOYMENT.confirmations,
        1,
        100
      ),
      abiVersion:
        this.cleanString(
          this.configService.get<string>("FOMO_V2_LAUNCHPAD_ABI_VERSION")
        ) || DEFAULT_DEPLOYMENT.abiVersion,
      rpcConfigured: Boolean(this.rpcUrl),
    };
  }

  getDeployment(): FomoV2LaunchpadDeployment {
    return { ...this.deployment };
  }

  getRpcUrl(): string | undefined {
    return this.rpcUrl;
  }

  assertExpectedDeployment(chainId: number, launchpadAddress: string): void {
    if (chainId !== this.deployment.chainId) {
      throw new Error(
        `Unsupported launchpad chainId ${chainId}; expected ${this.deployment.chainId}.`
      );
    }
    if (
      this.normalizeAddress(launchpadAddress) !==
      this.normalizeAddress(this.deployment.launchpadAddress)
    ) {
      throw new Error(
        `Unsupported launchpad address ${launchpadAddress}; expected ${this.deployment.launchpadAddress}.`
      );
    }
  }

  normalizeAddress(value: string): string {
    return getAddress(value).toLowerCase();
  }

  private readAddress(key: string, fallback: string): string {
    const value =
      this.cleanString(this.configService.get<string>(key)) || fallback;
    try {
      return getAddress(value);
    } catch {
      throw new Error(`${key} must be a valid EVM address.`);
    }
  }

  private readInteger(
    key: string,
    fallback: number,
    min: number,
    max: number
  ): number {
    const raw = this.cleanString(this.configService.get<string>(key));
    if (!raw) return fallback;
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < min || value > max) {
      throw new Error(`${key} must be an integer between ${min} and ${max}.`);
    }
    return value;
  }

  private cleanString(value: any): string | undefined {
    const text = String(value || "").trim();
    return text || undefined;
  }
}
