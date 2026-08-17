/**
 * DATA PROVIDER LAYER. Formulas must NOT reach into Mongo/Twitter/CoinGecko/
 * EarlyLand/OTC directly. Each entity type has a provider contract returning a
 * Raw DTO envelope. Today we ship Manual / Mock / StoredSnapshot providers.
 * Real providers (parser, portfolio DB, ledger, ...) are declared as stubs and
 * plug in later WITHOUT touching the formulas.
 */
import {
  FundRawRatingInput,
  PersonRawRatingInput,
  ProjectRawRatingInput,
  RatingInputEnvelope,
  TradeRawRatingInput,
  TwitterRawRatingInput,
  UserRawRatingInput,
  RATING_SCHEMA_VERSION,
} from "./rating-raw-dto";

export interface RatingDataProvider<T> {
  readonly source: string;
  getRaw(entityId: string): Promise<RatingInputEnvelope<T> | null>;
}
export type FundRatingDataProvider = RatingDataProvider<FundRawRatingInput>;
export type PersonRatingDataProvider = RatingDataProvider<PersonRawRatingInput>;
export type ProjectRatingDataProvider = RatingDataProvider<ProjectRawRatingInput>;
export type TwitterRatingDataProvider = RatingDataProvider<TwitterRawRatingInput>;
export type UserRatingDataProvider = RatingDataProvider<UserRawRatingInput>;
export type TradeRatingDataProvider = RatingDataProvider<TradeRawRatingInput>;

/** Wraps an admin-typed preview payload as a MANUAL envelope. */
export class ManualPreviewProvider<T> implements RatingDataProvider<T> {
  readonly source = "admin-preview";
  constructor(private readonly payloadById: Record<string, T> = {}) {}
  async getRaw(entityId: string): Promise<RatingInputEnvelope<T> | null> {
    const payload = this.payloadById[entityId];
    if (payload === undefined) return null;
    return { source: this.source, schemaVersion: RATING_SCHEMA_VERSION, payload };
  }
}

/** Deterministic MOCK provider — clearly labelled so it never looks real. */
export class MockRatingDataProvider<T> implements RatingDataProvider<T> {
  readonly source = "mock";
  constructor(private readonly factory: (id: string) => T) {}
  async getRaw(entityId: string): Promise<RatingInputEnvelope<T>> {
    return {
      source: this.source,
      schemaVersion: RATING_SCHEMA_VERSION,
      observedAt: new Date().toISOString(),
      payload: this.factory(entityId),
    };
  }
}

/** Reads the last ingested snapshot from storage (real-source or otherwise). */
export class StoredSnapshotProvider<T> implements RatingDataProvider<T> {
  readonly source = "stored-snapshot";
  constructor(
    private readonly entityType: string,
    private readonly reader: (entityType: string, id: string) => Promise<RatingInputEnvelope<T> | null>
  ) {}
  getRaw(entityId: string) {
    return this.reader(this.entityType, entityId);
  }
}

/* ------------------- future real providers (stubs) ------------------- */
/** These exist so wiring/DI is ready. They must NOT fake external calls. */
class NotImplementedProvider<T> implements RatingDataProvider<T> {
  constructor(public readonly source: string) {}
  async getRaw(_entityId?: string): Promise<RatingInputEnvelope<T> | null> {
    throw new Error(`${this.source} provider is not implemented yet — connect the real source and return a Raw DTO envelope`);
  }
}
export const TwitterParserProvider = () => new NotImplementedProvider<TwitterRawRatingInput>("twitter-parser");
export const FundPortfolioProvider = () => new NotImplementedProvider<FundRawRatingInput>("portfolio-db");
export const ProjectDataProvider = () => new NotImplementedProvider<ProjectRawRatingInput>("project-importer");
export const EarlyLandProvider = () => new NotImplementedProvider<UserRawRatingInput>("earlyland");
export const NFTProvider = () => new NotImplementedProvider<UserRawRatingInput>("nft-indexer");
export const TradeLedgerProvider = () => new NotImplementedProvider<TradeRawRatingInput>("trade-ledger");
