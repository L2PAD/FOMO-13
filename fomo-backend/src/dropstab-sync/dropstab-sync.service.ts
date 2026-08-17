import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Optional,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import mongoose, { Model, Types } from "mongoose";
import { Funds, FundsDocument } from "src/funds/funds.model";
import { Investor } from "src/funds/funds.service";
import { Person, PersonDocument } from "src/persons/person.model";
import { Project, ProjectDocument } from "src/projects/project.model";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  ProjectChartHistory,
  ProjectChartHistoryDocument,
} from "../projects/project-chart-history.model";
import { AnalyticsService } from "src/analytics/analytics.service";
import { ExchangesService } from "src/exchanges/exchanges.service";
import { Exchange, ExchangeTicker } from "src/exchanges/models/exchange.model";
import { PortfolioRecalculationService } from "src/portfolio/portfolio-recalculation.service";
import { FomoV2ParserControlPolicyService } from "src/fomo-v2/domains/parser-control";

@Injectable()
export class DropstabSyncService {
  private readonly logger = new Logger(DropstabSyncService.name);
  private readonly apiUrl = "https://pro-api.coinmarketcap.com/v1";
  private readonly disabledLogContexts = new Set<string>();
  tokenUnlocks = [];

  constructor(
    @InjectModel(Funds.name) private readonly fundModel: Model<FundsDocument>,
    @InjectModel(ProjectChartHistory.name)
    private readonly projectChartHistoryModel: Model<ProjectChartHistoryDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
    private readonly configService: ConfigService,
    private readonly analyticsService: AnalyticsService,
    private readonly exchangesService: ExchangesService,
    private readonly portfolioRecalculationService: PortfolioRecalculationService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
  ) {
    // this.handleDetailedProjectsUpdateCron();
    // this.updateProjectsFromListings();
    // this.updateProjectsExchanges();
    // this.fetchAllExchanges()
    // this.handleChartData();
    // this.handleChartDataWeek()
    // this.handleTvlData()
    // this.fetchAllInvestors()
  }

  private async fetchWithRetry(
    url: string,
    retries = 3,
    delay = 1000
  ): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, { headers: this.getHeaders() });
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 429 && i < retries - 1) {
          console.warn(
            `429 Too Many Requests for ${url}. ${delay}мс...`
          );
          await this.sleep(delay);
        } else {
          throw err;
        }
      }
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      "x-dropstab-api-key": this.configService.get("DROPSTAB_KEY"),
      Accept: "*/*",
    };
  }

  private async safeRequest(
    url: string,
    params: any,
    headers: any
  ): Promise<any[]> {
    try {
      const response = await axios.get(url, { params, headers });

      return response.data.data || response.data || [];
    } catch (error) {
      console.error(`❌ Request failed for ${url}:`, error.message || error);
      return [];
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async syncFundingRoundsForProjects(): Promise<void> {
    const headers = this.getHeaders();
    const projects = await this.projectModel.find({
      slug: { $exists: true, $ne: null },
    });

    console.log(`🔄 Найдено проектов: ${projects.length}`);

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const slug = project.slug;

      if (!slug) continue;

      try {
        const url = `https://public-api.dropstab.com/api/v1/fundingRounds?coinSlug=${slug}`;
        const response = await axios.get(url, { headers });

        const fundingRounds = response?.data?.data?.content || [];

        let totalRaised = 0;
        const rounds: any[] = [];

        for (const round of fundingRounds) {
          if (typeof round.fundsRaised === "number") {
            totalRaised += round.fundsRaised;
          }

          rounds.push({
            stage: round.stage,
            date: round.date,
            fundsRaised: round.fundsRaised,
            preValuation: round.preValuation,
            preValuationInaccurate: round.preValuationInaccurate,
            category: round.category,
            twitterPerformance: round.twitterPerformance,
            investors: round.investors || [],
          });
        }

        await this.projectModel.updateOne(
          { _id: project._id },
          {
            $set: {
              fundsRaised: totalRaised,
              fundsRounds: rounds,
            },
          }
        );

        console.log(`✅ Обновлено финансирование для ${slug}`);
        await this.sleep(1000);
      } catch (err: any) {
        console.error(
          `❌ Ошибка при обновлении финансирования для ${slug}:`,
          err.message || err
        );
      }
    }

    console.log("✅ Синхронизация данных о финансировании завершена.");
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    if (!(await this.shouldRunDropstabCron("hourly-listings"))) return;

    console.log("🔄 Cron: Updating projects from listings/latest...");
    await this.updateProjectsFromListings();
  }

  // @Cron(CronExpression.EVERY_6_HOURS)
  async handleDetailedProjectsUpdateCron(): Promise<void> {
    if (!(await this.shouldRunDropstabCron("detailed-projects"))) return;

    // if (this.configService.get("IS_LOCAL_RUN") === "true") {
    //   return;
    // }

    console.log(
      "🔄 CRON: Обновление детальных данных проектов (раз в 6 часов)"
    );

    const projects = await this.projectModel.find({ trading: 'CURRENTLY_TRADING' }).lean();

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const slug = project.slug;

      if (i > projects.length) {
        console.log(`✅ UPDATE PROJECTS COMPLETED`);
        return;
      }

      if (!slug) continue;

      try {
        await this.upsertProjectBySlug(slug);
        // await this.syncChartHistoryBySlug(project._id, slug, "1W");
        console.log(`✅ Обновлено: ${slug}`);
        await this.sleep(2000);
      } catch (err) {
        console.error(`❌ Ошибка при обновлении ${slug}:`, err.message || err);
      }
    }

    console.log("✅ CRON: Обновление детальных данных завершено");
  }

  async syncFundsFromDropstab(): Promise<void> {
    try {
      // const investors = await this.fetchAllInvestors();
      const investors = await this.fundModel.find({});
      console.log(`🔄 Найдено инвесторов: ${investors.length}`);

      for (let investor of investors) {
        await this.upsertFundFromInvestor(investor);
        await this.sleep(2500);
      }

      console.log("✅ Синхронизация фондов завершена.");
    } catch (error: any) {
      console.error(
        "❌ Ошибка при синхронизации фондов:",
        error.response?.data || error.message
      );
      throw new HttpException(
        "Не удалось синхронизировать фондов из Dropstab",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async fetchAllInvestors(): Promise<Investor[]> {
    const allInvestors: Investor[] = [];
    const totalPages = 74;
    const pageSize = 100;

    try {
      for (let page = 0; page <= totalPages; page++) {
        let response;
        try {
          response = await axios.get(
            "https://public-api.dropstab.com/api/v1/investors",
            {
              headers: this.getHeaders(),
              params: { page, pageSize },
            }
          );
        } catch (err) {
          console.error(`Ошибка при получении страницы ${page}:`, err);
          continue; // переход к следующей странице
        }

        const content = response.data?.data?.content || [];

        for (let i = 0; i < content.length; i++) {
          try {
            const investor = content[i];

            const countryData = investor.country
              ? await this.fetchWithRetry(
                `https://restcountries.com/v3.1/name/${investor.country}`
              )
              : null;

            const fundData: Partial<Funds> = {
              projectStatus: "active",
              status: "active",
              name: investor.name,
              logo: investor.image,
              type: investor.ventureType,
              niche: investor.ventureType,
              tier: investor.tier,
              bio: investor.description,
              binanceListing: investor.binanceListing,
              dropstabId: investor.id,
              slug: investor.investorSlug,
              dropstabRank: investor.rank,
              twitterScore: investor.twitterScore,
              socialmedia: investor.links.map((item: any) => ({
                href: item.url,
                icon: "",
                name: "",
              })),
              publicSalesCount: investor.publicSalesCount,
              retailRoiPercent: investor.retailRoiPercent,
              privateRoiPercent: investor.privateRoiPercent,
              totalInvestments: investor.totalInvestments,
              leadInvestments: investor.leadInvestments,
              country: investor.country,
            };

            if (countryData?.length) {
              const data: any = countryData[0];
              fundData.regionData = {
                geometry: data.latlng,
                id: data.cca3,
                properties: { name: data.name.common },
                rsmKey: data.cca3,
                svgPath: data.coatOfArms?.svg || "",
                type: "Feature",
                img: data.flags.png,
                region: data.region,
                subregion: data.subregion,
              };
            }

            const filter = { dropstabId: investor.id };
            const update = {
              $set: fundData,
              $setOnInsert: { createdAt: new Date() },
            };

            fundData.type === "Angel Investor"
              ? await this.personModel
                .findOneAndUpdate(filter, update, { upsert: true, new: true })
                .exec()
              : await this.fundModel
                .findOneAndUpdate(filter, update, { upsert: true, new: true })
                .exec();
          } catch (err) {
            console.error(
              `Ошибка при обработке инвестора ${i} на странице ${page}:`,
              err
            );
            continue;
          }
        }

        await this.sleep(1500);
        console.log(
          `Loaded page ${page}/${totalPages}, total loaded: ${allInvestors.length}`
        );
      }

      console.log("START SYNC FUNDS");
      await this.syncFundsFromDropstab();
    } catch (err) {
      console.error("Общая ошибка при выполнении fetchAllInvestors:", err);
    }

    return allInvestors;
  }

  private async fetchAllExchanges(): Promise<Exchange[]> {
    const allExchanges: Exchange[] = [];
    const totalPages = 16;
    const pageSize = 100;

    try {
      for (let page = 0; page <= totalPages; page++) {
        let response;
        try {
          response = await axios.get(
            "https://public-api.dropstab.com/api/v1/exchanges?sortingField=RANK_REPORTED",
            {
              headers: this.getHeaders(),
              params: { page, pageSize },
            }
          );
        } catch (err) {
          console.error(`Ошибка при получении страницы ${page}:`, err);
          continue;
        }

        const content = response.data?.data?.content || [];

        for (let i = 0; i < content.length; i++) {
          try {
            const exchange = content[i];
            allExchanges.push(exchange);
          } catch (err) {
            console.error(
              `Ошибка при обработке инвестора ${i} на странице ${page}:`,
              err
            );
            continue;
          }
        }

        await this.sleep(2500);
        console.log(
          `Loaded page ${page}/${totalPages}, total loaded: ${allExchanges.length}`
        );
      }
    } catch (err) {
      console.error("Общая ошибка при выполнении fetchAllInvestors:", err);
    }

    await this.exchangesService.createManyExchanges(allExchanges);

    return allExchanges;
  }

  private async upsertFundFromInvestor(investor: any): Promise<any> {
    let extraData = null;

    try {
      const fullData = await this.fetchWithRetry(
        `https://public-api.dropstab.com/api/v1/investors/${investor.slug}`
      );
      extraData = fullData?.data || null;
    } catch (err: any) {
      console.error(
        `❌ Не удалось получить extraData для ${investor.slug}:`,
        err.message || err
      );
    }

    const fundData: Partial<Funds> = {
      projectStatus: "active",
      status: "active",
      name: investor.name,
      logo: investor.image,
      type: investor.ventureType,
      niche: investor.ventureType,
      tier: investor.tier,
      bio: investor.description,
      binanceListing: investor.binanceListing,
      dropstabId: extraData.id,
      slug: investor.investorSlug,
      dropstabRank: investor.rank,
      twitterScore: investor.twitterScore,
      socialmedia: extraData.links.map((item: any) => ({
        href: item.url,
        icon: "",
        name: "",
      })),
      publicSalesCount: investor.publicSalesCount,
      retailRoiPercent: investor.retailRoiPercent,
      privateRoiPercent: investor.privateRoiPercent,
      totalInvestments: investor.totalInvestments,
      leadInvestments: investor.leadInvestments,
      portfolioCoinsCount: investor.portfolioCoinsCount,
      country: investor.country,
      roundsByCategory: extraData?.roundsDistribution?.byCategory || [],
      roundsByStage: extraData?.roundsDistribution?.byStage || [],
      coInvestors: extraData?.coInvestors || [],
      portfolioCoins: extraData?.portfolioCoins || [],
    };

    const filter = { dropstabId: investor.dropstabId };
    const update = { $set: fundData, $setOnInsert: { createdAt: new Date() } };

    return fundData.type === "Angel Investor"
      ? this.personModel
        .findOneAndUpdate(filter, update, { upsert: true, new: true })
        .exec()
      : this.fundModel
        .findOneAndUpdate(filter, update, { upsert: true, new: true })
        .exec();
  }

  private async updateProjectsFromListings(): Promise<void> {
    const limit = 100;
    let currentPage = 0;
    let totalPages = 10;
    const updatedProjectIds = new Set<string>();

    const headers = {
      "x-dropstab-api-key": this.configService.get("DROPSTAB_KEY"),
      Accept: "*/*",
    };

    while (currentPage < totalPages) {
      const response: any = await this.safeRequest(
        `https://public-api.dropstab.com/api/v1/coins?trading=CURRENTLY_TRADING&sortingOrder=ASC&sortingField=RANK`,
        { page: currentPage, pageSize: limit },
        headers
      );

      const content = response?.content || [];
      currentPage++;

      for (const coin of content) {
        const circulatingSupply = coin?.circulatingSupply || 0;
        const totalSupply = coin?.totalSupply || 0;
        const maxSupply = coin?.maxSupply || 0;

        const updateData = {
          capId: coin.id,
          slug: coin.slug,
          symbol: coin.symbol,
          niche: coin.symbol,
          name: coin.name,
          rank: coin.rank,
          logo: coin.image,
          trading: coin.trading,
          anomalyDetected: coin.anomalyDetected,
          price: coin?.price || 0,
          marketCap: coin?.marketCap || 0,
          priceChange: coin?.priceChange24h || 0,
          volume24h: coin?.volume24h || 0,
          circulatingSupply,
          totalSupply,
          maxSupply,
          fullyDilutedMarketCap: coin?.fullyDilutedValuation || 0,
          volumeAndMarketCap:
            coin?.marketCap && coin?.volume24h
              ? coin.volume24h / coin.marketCap
              : 0,

          circulatingSupplyPercent:
            maxSupply > 0 ? (circulatingSupply / maxSupply) * 100 : 0,

          athUsd: coin.athUsd || 0,
          athUsdDate: coin.athUsdDate,
          atlUsd: coin.atlUsd || 0,
          atlUsdDate: coin.atlUsdDate,
          high24hUsd: coin.high24hUsd || 0,
          low24hUsd: coin.low24hUsd || 0,
          marketDataUpdatedAt: new Date(),
        };

        const project: ProjectDocument = await this.projectModel.findOneAndUpdate(
          { capId: coin.id },
          {
            $set: updateData,
            $setOnInsert: {
              status: "active",
              projectStatus: "active",
              projectType: "market",
              dateAdded: new Date(),
            },
          },
          {
            new: true,
            upsert: true,
          }
        );
        updatedProjectIds.add(project._id.toString());

        if (this.isDropstabPriceHistoryWriteEnabled()) {
          await this.analyticsService.addFundingPoint(project._id, 'project', {
            marketCap: updateData.marketCap,
            price: {
              USD: updateData.price,
              BTC: 0,
              ETH: 0,
              SOL: 0
            },
            volume24h: updateData.volume24h,
            timestamp: new Date().getTime()
          })
        }
      }

      console.log(`✅ Обработана страница #${currentPage}`);
      await this.portfolioRecalculationService.markPortfoliosForMarketData(Array.from(updatedProjectIds));
      updatedProjectIds.clear();
      await this.sleep(1000);
    }

    console.log("✅ Проекты успешно обновлены из Dropstab");
  }

  private async updateProjectsExchanges(): Promise<void> {
    const { items } = await this.exchangesService.getExchanges({});

    for (let i = 0; i < items.length; i++) {
      const exchange = items[i];
      let result: Array<ExchangeTicker> = [];
      let pages = 1;

      for (let j = 0; j < pages; j++) {
        const data: any = await this.safeRequest(
          `https://public-api.dropstab.com/api/v1/exchanges/${exchange.slug}/pairs`,
          { page: j, pageSize: 100 },
          this.getHeaders()
        );

        pages = data?.totalPages || 0;

        if (!data?.content?.length) {
          await this.sleep(2000);
          break;
        }
        result = [...result, ...data.content];
        await this.sleep(2000);
      }
      console.log(`${exchange.slug} ${result.length}`);
      await this.exchangesService.updateManyExchanges(exchange.slug, result);
    }
  }

  private getFundingStats(
    fundsRounds: { date?: string | null; fundsRaised?: number }[]
  ) {
    let totalFundsRaised = 0;
    let lastFundingDate: string | null = null;

    for (const round of fundsRounds) {
      if (typeof round.fundsRaised === "number") {
        totalFundsRaised += round.fundsRaised;
      }

      if (round.date) {
        const roundDate = new Date(round.date);
        if (!isNaN(roundDate.getTime())) {
          if (!lastFundingDate || roundDate > new Date(lastFundingDate)) {
            lastFundingDate = round.date;
          }
        }
      }
    }

    return {
      totalFundsRaised,
      lastFundingDate: lastFundingDate ? new Date(lastFundingDate) : null,
    };
  }

  async upsertProjectBySlug(slug: string): Promise<void> {
    const detailedUrl = `https://public-api.dropstab.com/api/v1/coins/detailed/${slug}`;
    const headers = this.getHeaders();

    const data: any = await this.safeRequest(detailedUrl, {}, headers);

    if (!data) return;

    const detailedData = data;

    const usdQuote = detailedData?.change
      ? {
        price: detailedData.price?.USD,
        percent_change_1h: detailedData.change["1H"].USD,
        percent_change_24h: detailedData.change["1D"].USD,
        percent_change_7d: detailedData.change["1W"].USD,
      }
      : {
        price: 0,
        percent_change_1h: 0,
        percent_change_24h: 0,
        percent_change_7d: 0,
      };

    let project = await this.projectModel.findOne({ slug });

    const socialmedia = [];
    const links = {};

    for (const key in detailedData.social) {
      const value: any = detailedData.social[key];

      if (Array.isArray(value)) {
        links[key] = value;
      } else {
        socialmedia.push({
          href: value,
          name: key,
        });
      }
    }

    let volume24hChange = 0;

    const volume1D = detailedData?.volume?.["1D"]?.USD;
    const volume1W = detailedData?.volume?.["1W"]?.USD;

    if (
      volume1D &&
      volume1W &&
      typeof volume1D === "number" &&
      typeof volume1W === "number"
    ) {
      const volumeLast6Days = volume1W - volume1D;
      const volumeYesterday = volumeLast6Days / 6;

      if (volumeYesterday !== 0) {
        volume24hChange =
          ((volume1D - volumeYesterday) / volumeYesterday) * 100;
      }
    }

    const roiData: Record<string, number | null> = {};

    if (detailedData?.icoPrice && detailedData?.price) {
      const currencies = ["USD", "BTC", "ETH", "SOL"];

      for (const currency of currencies) {
        const ico = detailedData.icoPrice[currency];
        const current = detailedData.price[currency];
        console.log(currency)
        if (
          ico != null &&
          current != null &&
          typeof ico === "number" &&
          typeof current === "number" &&
          ico > 0
        ) {
          roiData[currency] = ((current - ico) / ico) * 100;
        } else {
          roiData[currency] = null;
        }
      }
    }
    const { totalFundsRaised, lastFundingDate } = this.getFundingStats(
      project?.fundsRounds || []
    );

    const updateData: Partial<Project> = {
      type: detailedData?.mainCategory?.name ?? "",
      mainCategory: detailedData?.mainCategory ?? {},
      priceBTC: detailedData?.price?.BTC ?? 0,
      priceETH: detailedData?.price?.ETH ?? 0,
      priceSOL: detailedData?.price?.SOL ?? 0,
      priceChange: detailedData?.priceChange24h ?? 0,
      marketCap: detailedData?.marketCap?.USD ?? 0,
      yearHigh: detailedData.yearHigh?.USD,
      yearLow: detailedData.yearLow?.USD,
      yearHighDate: new Date(detailedData.yearHighDate?.USD),
      yearLowDate: new Date(detailedData.yearLowDate?.USD),
      priceRange: detailedData.priceRange,
      highs: detailedData.highs,
      lows: detailedData.lows,
      highsDates: detailedData.highsDates,
      lowsDates: detailedData.lowsDates,
      priceChangePercentFromYearHighDate:
        detailedData.priceChangePercentFromYearHighDate,
      priceChangePercentFromYearLowDate:
        detailedData.priceChangePercentFromYearLowDate,
      twitterAcc: detailedData.social?.twitter,
      twitterPerformance: detailedData.twitterPerformance,
      xfromIco: detailedData.xfromIco,
      icoPrice: detailedData.icoPrice,
      categories: detailedData.categories?.map((c) => c.name) ?? [],
      allTimePriceChange: detailedData?.change || {},
      usdQuote,
      bio: detailedData.description,
      socialmedia,
      contracts: detailedData?.contracts || [],
      volume24hChange,
      marketDataUpdatedAt: new Date(),
      roiData: roiData,
      totalRaised: totalFundsRaised,
      lastFunding: lastFundingDate,
      tokensSold: detailedData.icoPrice?.USD
        ? totalFundsRaised / detailedData.icoPrice?.USD
        : 0,
      ...links,
    };

    await this.projectModel.updateOne(
      { _id: project._id },
      { $set: updateData }
    );
    await this.sleep(2000);

  }

  async syncChartHistoryBySlug(
    _id: mongoose.Types.ObjectId,
    slug: string,
    from: string,
    to: string
  ): Promise<void> {
    const url = `https://public-api.dropstab.com/api/v1/coins/history/chart-by-interval/${slug}?from=${from}&to=${to}`;
    const headers = this.getHeaders();

    try {
      const response = await axios.get(url, {
        headers,
        params: { from, to },
      });

      const chartData = response.data?.data || [];
      if (!chartData.length) {
        console.warn(`⚠️ Нет данных для графика: ${slug}`);
        return;
      }

      const now = new Date();

      function subtractDays(date: Date, days: number) {
        const d = new Date(date);
        d.setDate(d.getDate() - days);
        return d;
      }

      function subtractYears(date: Date, years: number) {
        const d = new Date(date);
        d.setFullYear(d.getFullYear() - years);
        return d;
      }

      const timeframes = {
        chart24h: subtractDays(now, 1),
        chart7d: subtractDays(now, 7),
        // chart30d: subtractDays(now, 30),
        // chart90d: subtractDays(now, 90),
        // chart1y: subtractYears(now, 1),
      };

      const ranges = {
        chart24h: chartData.filter(
          (d) => new Date(d.timestamp) > timeframes.chart24h
        ),
        chart7d: chartData.filter(
          (d) => new Date(d.timestamp) > timeframes.chart7d
        ),
        // chart30d: chartData.filter(
        //   (d) => new Date(d.timestamp) > timeframes.chart30d
        // ),
        // chart90d: chartData.filter(
        //   (d) => new Date(d.timestamp) > timeframes.chart90d
        // ),
        // chart1y: chartData.filter(
        //   (d) => new Date(d.timestamp) > timeframes.chart1y
        // ),
        // chartAll: chartData,
      };

      for (const [chartType, data] of Object.entries(ranges)) {
        await this.analyticsService.upsertChartData(
          _id,
          "project",
          chartType as
          | "chart24h"
          | "chart7d"
          | "chart30d"
          | "chart90d"
          | "chart1y"
          | "chartAll",
          data
        );
      }

      console.log(`✅ Графики сохранены: ${slug}`);
    } catch (error: any) {
      console.error(
        `❌ Ошибка при получении графика ${slug}:`,
        error.response?.data || error.message
      );
    }
  }

  async handleChartDataWeek() {
    const projects = await this.projectModel.find({}).limit(200);
    const formatDate = (date: Date) => date.toISOString().slice(0, 19);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(todayStart);
    oneWeekAgo.setDate(todayStart.getDate() - 7);

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];

      await this.syncChartHistoryBySlug(
        project._id,
        project.slug,
        formatDate(oneWeekAgo),
        formatDate(todayStart)
      );

      await this.sleep(3000);
    }
  }
  // @Cron(CronExpression.EVERY_WEEK)
  async handleChartData() {
    const projects = await this.projectModel.find({}).limit(200);
    const formatDate = (date: Date) => date.toISOString().slice(0, 19);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const oneYearAgo = new Date(todayStart);
    oneYearAgo.setFullYear(todayStart.getFullYear() - 2);

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];

      await this.syncChartHistoryBySlug(
        project._id,
        project.slug,
        formatDate(oneYearAgo),
        formatDate(todayStart)
      );

      await this.sleep(3000);
    }
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async handleTvlData() {
    if (!(await this.shouldRunDropstabCron("tvl"))) return;

    const tvlUrl: string = `https://api.llama.fi/v2/chains`;

    try {
      const data = await this.safeRequest(tvlUrl, {}, {});
      const bulkOperations = [];

      for (const chainData of data) {
        if (!chainData.name) continue;
        const filter = {
          $or: [
            { name: { $regex: new RegExp(`^${chainData.name}$`, 'i') } },
            { symbol: { $regex: new RegExp(`^${chainData.tokenSymbol}$`, 'i') } },
          ],
        };
        bulkOperations.push({
          updateMany: {
            filter,
            update: {
              $set: {
                tvl: chainData.tvl,
                lastTvlUpdate: new Date()
              }
            }
          }
        });
      }
      
      if (bulkOperations.length > 0) {
        const result = await this.projectModel.bulkWrite(bulkOperations);
        console.log(`Обновлено TVL для ${result.modifiedCount} проектов`);
        return { success: true, modifiedCount: result.modifiedCount };
      }

      console.log('Нет данных для обновления');
      return { success: true, modifiedCount: 0 };

    } catch (error) {
      console.error('Ошибка при обновлении TVL данных:', error);
      throw new Error('Не удалось обновить TVL данные');
    }
  }

  private async shouldRunDropstabCron(context: string): Promise<boolean> {
    if (this.configService.get("IS_LOCAL_RUN") === "true") return false;

    if (
      this.parserControlPolicy &&
      !(await this.parserControlPolicy.canWriteDomainData("legacy:dropstab"))
    ) {
      return false;
    }

    if (this.isDropstabSyncEnabled()) return true;

    this.logDropstabDisabled(context);
    return false;
  }

  private isDropstabSyncEnabled(): boolean {
    return String(this.configService.get("DROPSTAB_SYNC_ENABLED") || "")
      .trim()
      .toLowerCase() === "true";
  }

  private isDropstabPriceHistoryWriteEnabled(): boolean {
    return this.readBooleanFlag("DROPSTAB_PRICE_HISTORY_WRITE_ENABLED", false);
  }

  private readBooleanFlag(name: string, defaultValue: boolean): boolean {
    const value = this.configService.get(name) ?? process.env[name];
    if (value === undefined || value === null || value === "") return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return defaultValue;
  }

  private logDropstabDisabled(context: string): void {
    if (this.disabledLogContexts.has(context)) return;
    this.disabledLogContexts.add(context);
    this.logger.log(`Dropstab sync disabled by DROPSTAB_SYNC_ENABLED context=${context}`);
  }
}
