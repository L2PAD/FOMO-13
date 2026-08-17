import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type FomoV2IcoProjectSourceDocument =
  HydratedDocument<FomoV2IcoProjectSource>;

@Schema({
  collection: "ico_projects",
  strict: false,
  autoIndex: false,
})
export class FomoV2IcoProjectSource {
  _id?: Types.ObjectId;

  @Prop()
  source?: string;

  @Prop()
  sourceId?: string;

  @Prop()
  slug?: string;

  @Prop()
  name?: string;

  @Prop()
  symbol?: string;

  @Prop()
  ticker?: string;

  @Prop()
  detailUrl?: string;

  @Prop()
  sourceUrl?: string;

  [key: string]: any;
}

export const FomoV2IcoProjectSourceSchema =
  SchemaFactory.createForClass(FomoV2IcoProjectSource);

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
  FomoV2IcoProjectSourceSchema.pre(method as any, function blockParserWrites(next) {
    next(
      new Error(
        "FomoV2IcoProjectSource is a read-only parser DB binding. Importers must write only to DB_NAME collections.",
      ),
    );
  });
}
