import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FomoV2IntelInvestorSourceDocument =
  HydratedDocument<FomoV2IntelInvestorSource>;

@Schema({
  collection: "intel_investors",
  strict: false,
  autoIndex: false,
})
export class FomoV2IntelInvestorSource {
  _id?: Types.ObjectId;

  @Prop()
  source?: string;

  @Prop()
  sourceId?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  externalId?: string | number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  id?: string | number;

  @Prop()
  key?: string;

  @Prop()
  name?: string;

  @Prop()
  slug?: string;

  @Prop()
  investorSlug?: string;

  @Prop()
  type?: string;

  @Prop()
  ventureType?: string;

  @Prop()
  description?: string;

  @Prop()
  website?: string;

  @Prop()
  logo?: string;

  @Prop()
  image?: string;

  @Prop()
  detailUrl?: string;

  @Prop()
  sourceUrl?: string;

  [key: string]: any;
}

export const FomoV2IntelInvestorSourceSchema =
  SchemaFactory.createForClass(FomoV2IntelInvestorSource);

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
  FomoV2IntelInvestorSourceSchema.pre(
    method as any,
    function blockParserWrites(next) {
      next(
        new Error(
          "FomoV2IntelInvestorSource is a read-only parser DB binding. Backer importers must write only to DB_NAME collections."
        )
      );
    }
  );
}
