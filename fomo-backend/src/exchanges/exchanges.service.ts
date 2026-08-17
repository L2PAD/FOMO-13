import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  Exchange,
  ExchangeDocument,
  ExchangeTicker,
} from "./models/exchange.model";
import { Model } from "mongoose";

@Injectable()
export class ExchangesService {
  constructor(
    @InjectModel(Exchange.name)
    private readonly exchangeModel: Model<ExchangeDocument>
  ) {}

  async createManyExchanges(
    exchanges: {
      id: number;
      slug: string;
      name: string;
      image: string;
      verified: boolean;
      type: string;
      rankVerified: number;
      rankReported: number;
      volume24hReported: number;
      volume24hVerified: number;
      marketsCount: number;
    }[]
  ): Promise<void> {
    if (!exchanges?.length) return;

    const operations = exchanges.map((exchange) => ({
      updateOne: {
        filter: { id: exchange.id },
        update: { $set: exchange },
        upsert: true,
      },
    }));

    await this.exchangeModel.bulkWrite(operations);
  }
  async updateManyExchanges(
    slug: string,
    data: ExchangeTicker[]
  ): Promise<void> {
    await this.exchangeModel.updateOne({ slug }, { $set: { tickers: data } });
  }

  async getExchanges(options: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    base?: string;
    quote?: string;
  }) {
    const { page = 1, limit = 10, search = "", type, base, quote } = options;

    const filter: any = {
      rankReported: { $ne: null },
    };

    if (search) {
      const names = search
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      if (names.length === 1) {
        filter.name = { $regex: names[0], $options: "i" };
      } else if (names.length > 1) {
        filter.$or = names.map((name) => ({
          name: { $regex: name, $options: "i" },
        }));
      }
    }

    if (type) {
      filter.type = type;
    }
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.exchangeModel
        .find(filter)
        .sort({ rankReported: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.exchangeModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getExchangesPairs(options: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    base?: string;
    quote?: string;
  }) {
    const { page = 1, limit = 10, search = "", type, base, quote } = options;

    const matchStage: any = {
      rankReported: { $ne: null },
      verified:true
    };

    if (search) {
      const names = search
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      if (names.length === 1) {
        matchStage.name = { $regex: names[0], $options: "i" };
      } else if (names.length > 1) {
        matchStage.$or = names.map((name) => ({
          name: { $regex: name, $options: "i" },
        }));
      }
    }

    if (type && type !== "ALL") {
      matchStage.type = type;
    }

    const pipeline: any[] = [{ $match: matchStage }, { $unwind: "$tickers" }];

    if (base) {
      pipeline.push({
        $match: {
          "tickers.base": { $regex: `^${base}`, $options: "i" },
        },
      });
    }

    // Добавим вычисление процента объема и нужные поля
    pipeline.push({
      $addFields: {
        "tickers.exchangeId": "$id",
        "tickers.exchangeName": "$name",
        "tickers.exchangeType": "$type",
        "tickers.exchangeSlug": "$slug",
        "tickers.exchangeImage": "$image",
        "tickers.exchangeRankReported": "$rankReported",
        "tickers.exchangeRankVerified": "$rankVerified",
        "tickers.totalExchangeVolume": "$volume24hReported",
      },
    });

    // Заменим корневой документ на тикер
    pipeline.push({ $replaceRoot: { newRoot: "$tickers" } });

    // Сортировка по объему 24ч
    pipeline.push({ $sort: { volume24h: -1 } });

    // Подсчёт общего количества
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await this.exchangeModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Пагинация
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    const tickers = await this.exchangeModel.aggregate(pipeline);

    return {
      items: tickers,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
