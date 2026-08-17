import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { DROPSTAB_VESTING_PARSER_COLLECTION } from "../helpers";

export type FomoV2DropstabVestingSourceDocument =
  HydratedDocument<FomoV2DropstabVestingSource>;

@Schema({
  collection: DROPSTAB_VESTING_PARSER_COLLECTION,
  strict: false,
  autoIndex: false,
})
export class FomoV2DropstabVestingSource {
  _id?: Types.ObjectId;

  @Prop()
  source?: string;

  @Prop()
  sourceProjectId?: string;

  @Prop()
  sourceId?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  coinId?: string | number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  currencyId?: string | number;

  @Prop()
  sourceSlug?: string;

  @Prop()
  coinSlug?: string;

  @Prop()
  slug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop()
  name?: string;

  @Prop()
  coinName?: string;

  @Prop()
  symbol?: string;

  @Prop()
  coinSymbol?: string;

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  tokenAllocation?: any[];

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  vestingRounds?: any[];

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  vestingSchedule?: any[];

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  vestingTimeline?: any[];

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  unlockingEvents?: any[];

  @Prop({ type: mongoose.Schema.Types.Mixed })
  nextUnlockingEvent?: any;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  vestingSummary?: any;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  publicVesting?: any;

  [key: string]: any;
}

export const FomoV2DropstabVestingSourceSchema =
  SchemaFactory.createForClass(FomoV2DropstabVestingSource);

const WRITE_METHODS = [
  "save",
  "updateOne",
  "updateMany",
  "replaceOne",
  "deleteOne",
  "deleteMany",
  "findOneAndUpdate",
  "findOneAndReplace",
  "findOneAndDelete",
  "insertMany",
] as const;

for (const method of WRITE_METHODS) {
  FomoV2DropstabVestingSourceSchema.pre(
    method as any,
    function blockParserWrites(next) {
      next(
        new Error(
          "FomoV2DropstabVestingSource is a read-only parser DB binding. Vesting importers must write only to DB_NAME collections."
        )
      );
    }
  );
}
