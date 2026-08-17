import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

/**
 * Phase G (P8) — NFT ownership adapter.
 *
 * Production-ready INTERFACE that the Access Engine depends on. The concrete
 * implementation here is a TEST provider backed by a Mongo ledger
 * (`nft_test_ownership`) so E2E flows (activation, transfer, resale) are fully
 * controllable without a live chain. Swapping to a real on-chain provider means
 * replacing ONLY the read methods — the engine contract stays the same.
 *
 * No fake PRODUCTION ownership is ever asserted: this ledger is explicitly a
 * test surface and is clearly namespaced.
 */
export interface INftOwnershipProvider {
  getOwner(chainId: string, contract: string, tokenId: string): Promise<string | null>;
  hasToken(wallet: string, chainId: string, contract: string, tokenId: string): Promise<boolean>;
}

const norm = (s: string) => String(s || "").trim().toLowerCase();

@Injectable()
export class NftOwnershipProvider implements INftOwnershipProvider {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  private coll() {
    return this.conn.collection("nft_test_ownership");
  }

  async getOwner(chainId: string, contract: string, tokenId: string): Promise<string | null> {
    const doc = await this.coll().findOne({
      chainId: String(chainId),
      contractAddress: norm(contract),
      tokenId: String(tokenId),
    });
    return doc?.ownerWallet ? norm(doc.ownerWallet) : null;
  }

  async hasToken(wallet: string, chainId: string, contract: string, tokenId: string): Promise<boolean> {
    const owner = await this.getOwner(chainId, contract, tokenId);
    return !!owner && owner === norm(wallet);
  }

  /** TEST helper — set/mint token ownership (used by admin test tools + transfer). */
  async setOwner(chainId: string, contract: string, tokenId: string, wallet: string) {
    await this.coll().updateOne(
      { chainId: String(chainId), contractAddress: norm(contract), tokenId: String(tokenId) },
      { $set: { ownerWallet: norm(wallet), updatedAt: new Date() } },
      { upsert: true },
    );
    return { chainId: String(chainId), contractAddress: norm(contract), tokenId: String(tokenId), ownerWallet: norm(wallet) };
  }
}
