/**
 * Entity Normalizer (ADAPTED from FOMO-DATA normalizers/entity-normalizer).
 * Parity kept for alias-map + slug fallback (highest-confidence path). The
 * donor's DB lookups against canonical_entities/intel_* are intentionally
 * dropped for a self-contained Phase 3 core; alias map can be expanded later.
 */
import { Injectable } from "@nestjs/common";
import { ExtractedEntities } from "./entity-extractor.service";

export interface NormalizedEntity { name: string; canonicalId: string; type: string; confidence: number; matched: boolean; }
export interface NormalizedEntities { all: NormalizedEntity[]; }

const KNOWN_ALIASES: Record<string, string> = {
  a16z: "andreessen-horowitz", andreessen: "andreessen-horowitz", "andreessen horowitz": "andreessen-horowitz",
  paradigm: "paradigm", polychain: "polychain-capital", multicoin: "multicoin-capital", pantera: "pantera-capital",
  sequoia: "sequoia-capital", dragonfly: "dragonfly-capital", jump: "jump-crypto", "jump crypto": "jump-crypto",
  binance: "binance-labs", "binance labs": "binance-labs", coinbase: "coinbase-ventures", framework: "framework-ventures",
  galaxy: "galaxy-digital", grayscale: "grayscale-investments", dcg: "dcg", alameda: "alameda-research",
  "3ac": "three-arrows-capital", wintermute: "wintermute", blackrock: "blackrock", fidelity: "fidelity",
  ethereum: "ethereum", eth: "ethereum", bitcoin: "bitcoin", btc: "bitcoin", solana: "solana", sol: "solana",
  polygon: "polygon", matic: "polygon", arbitrum: "arbitrum", arb: "arbitrum", optimism: "optimism", op: "optimism",
  base: "base", avalanche: "avalanche", avax: "avalanche", near: "near-protocol", cosmos: "cosmos", atom: "cosmos",
  polkadot: "polkadot", dot: "polkadot", cardano: "cardano", ada: "cardano", ripple: "ripple", xrp: "ripple",
  dogecoin: "dogecoin", doge: "dogecoin", tron: "tron", trx: "tron", ton: "ton", sui: "sui", aptos: "aptos", apt: "aptos",
  uniswap: "uniswap", uni: "uniswap", aave: "aave", compound: "compound", makerdao: "makerdao", maker: "makerdao",
  curve: "curve-finance", lido: "lido", eigenlayer: "eigenlayer", pendle: "pendle", gmx: "gmx", dydx: "dydx",
  chainlink: "chainlink", link: "chainlink", layerzero: "layerzero", celestia: "celestia", tia: "celestia",
  starknet: "starknet", zksync: "zksync", scroll: "scroll", linea: "linea", mantle: "mantle", blast: "blast",
  opensea: "opensea", blur: "blur", worldcoin: "worldcoin", wld: "worldcoin", render: "render", bittensor: "bittensor",
  tao: "bittensor", tether: "tether", usdt: "tether", usdc: "usdc", stripe: "stripe", paypal: "paypal",
};

@Injectable()
export class NewsAiEntityNormalizer {
  normalize(extracted: ExtractedEntities): NormalizedEntities {
    const all: NormalizedEntity[] = [];
    const push = (names: string[], type: string) => {
      for (const name of names) all.push(this.one(name, type));
    };
    push(extracted.projects, "project");
    push(extracted.funds, "fund");
    push(extracted.tokens, "token");
    push(extracted.persons, "person");
    return { all };
  }

  private one(name: string, type: string): NormalizedEntity {
    const slug = this.slugify(name);
    const lower = name.toLowerCase();
    if (KNOWN_ALIASES[lower]) return { name, canonicalId: KNOWN_ALIASES[lower], type, confidence: 0.98, matched: true };
    if (KNOWN_ALIASES[slug]) return { name, canonicalId: KNOWN_ALIASES[slug], type, confidence: 0.97, matched: true };
    return { name, canonicalId: `${type}:${slug}`, type, confidence: 0.6, matched: false };
  }

  private slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
}
