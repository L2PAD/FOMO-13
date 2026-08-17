import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CryptoActivitiesSyncLockDocument = HydratedDocument<CryptoActivitiesSyncLock>;

@Schema({ timestamps: true, collection: "sync_locks" })
export class CryptoActivitiesSyncLock {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ required: true })
  owner: string;

  @Prop({ required: true })
  acquiredAt: Date;

  @Prop({ required: true, index: true })
  expiresAt: Date;
}

export const CryptoActivitiesSyncLockSchema =
  SchemaFactory.createForClass(CryptoActivitiesSyncLock);

CryptoActivitiesSyncLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
