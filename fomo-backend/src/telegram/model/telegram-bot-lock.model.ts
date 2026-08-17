import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type TelegramBotLockDocument = HydratedDocument<TelegramBotLock>;

@Schema({
  collection: "telegram_bot_locks",
  timestamps: true,
})
export class TelegramBotLock {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ required: true })
  ownerId: string;

  @Prop({ required: true, index: true })
  leaseUntil: Date;

  @Prop({ required: true })
  lastHeartbeatAt: Date;
}

export const TelegramBotLockSchema = SchemaFactory.createForClass(TelegramBotLock);
