import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProjectChartHistoryDocument = HydratedDocument<ProjectChartHistory>;
export type ProjectChartHistorySource = "coingecko" | "dropstab_legacy" | "bybit_legacy";

@Schema({ timestamps: true })
export class ProjectChartHistory {
  @Prop({ type: Types.ObjectId, ref: "Project", required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ index: true })
  timestamp?: Date;

  @Prop({ index: true })
  bucketTimestamp?: Date;

  @Prop()
  price?: number;

  @Prop()
  marketCap?: number;

  @Prop()
  volume24h?: number;

  @Prop()
  priceChange24h?: number;

  @Prop({ enum: ["coingecko", "dropstab_legacy", "bybit_legacy"], default: "coingecko", index: true })
  source?: ProjectChartHistorySource;

  @Prop()
  timeframe?: string;

  @Prop()
  slug?: string;

  @Prop({ type: Array })
  data?: {
    timestamp: number;
    price: {
      USD: number;
      BTC?: number;
      ETH?: number;
      [symbol: string]: number;
    };
    marketCap: number;
    volume24h: number;
    funding?: number;
  }[];
}

export const ProjectChartHistorySchema =
  SchemaFactory.createForClass(ProjectChartHistory);

ProjectChartHistorySchema.index(
  { projectId: 1, bucketTimestamp: 1 },
  {
    unique: true,
    partialFilterExpression: { bucketTimestamp: { $type: "date" } },
  },
);

ProjectChartHistorySchema.index(
  { projectId: 1, bucketTimestamp: 1, source: 1 },
  { name: "projectId_1_bucketTimestamp_1_source_1_lookup" },
);

ProjectChartHistorySchema.index(
  { projectId: 1, bucketTimestamp: -1 },
  {
    name: "projectId_1_bucketTimestamp_-1_lookup",
    partialFilterExpression: { bucketTimestamp: { $type: "date" } },
  },
);

ProjectChartHistorySchema.index(
  { projectId: 1, updatedAt: -1 },
  {
    name: "projectId_1_updatedAt_-1_legacy_data_lookup",
    partialFilterExpression: { data: { $exists: true } },
  },
);
