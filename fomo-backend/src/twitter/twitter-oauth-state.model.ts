import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { User } from "src/user/user.model";

export type TwitterOAuthStateDocument = HydratedDocument<TwitterOAuthState>;

@Schema({ timestamps: true })
export class TwitterOAuthState {
  @Prop({ required: true, unique: true, index: true })
  state: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  usedAt?: Date;
}

export const TwitterOAuthStateSchema =
  SchemaFactory.createForClass(TwitterOAuthState);

TwitterOAuthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
