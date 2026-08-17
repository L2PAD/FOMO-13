import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import axios from "axios";
import { LiveNews, LiveNewsDocument } from "./livenews.model";
import mongoose, { Model } from "mongoose";
import { createHash, randomBytes } from "crypto";
import { Project, ProjectDocument } from "src/projects/project.model";
import {
  ParsingTwitterData,
  ProjectTwitter,
  ProjectTwitterDocument,
} from "./project-twitter.model";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { Person, PersonDocument } from "src/persons/person.model";
import { Funds, FundsDocument } from "src/funds/funds.model";
import { User, UserDocument, UserRankType } from "src/user/user.model";
import { RatingService } from "src/rating/rating.service";
import {
  TwitterOAuthState,
  TwitterOAuthStateDocument,
} from "./twitter-oauth-state.model";

const TWITTER_LINK_STATE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly ratingService: RatingService,
    @InjectModel(LiveNews.name) private liveNewsModel: Model<LiveNewsDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Person.name) private personModel: Model<PersonDocument>,
    @InjectModel(Funds.name) private fundModel: Model<FundsDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ProjectTwitter.name)
    private projectTwitterModel: Model<ProjectTwitterDocument>,
    @InjectModel(TwitterOAuthState.name)
    private twitterOAuthStateModel: Model<TwitterOAuthStateDocument>,
    @InjectQueue("twitter-parser") private twitterQueue: Queue
  ) {
    // this.handleTwitterRatingCron();
    // this.handleAllTwitterCrons();
    // this.handlePersonsCron()
    // this.handleFundsCron()
    // this.handleProjectsCron()
    // this.cleanTweetsWithoutAuthor()
  }

  private hashState(state: string): string {
    return createHash("sha256").update(state).digest("hex").slice(0, 12);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async createLinkState(userId: string): Promise<string> {
    const state = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TWITTER_LINK_STATE_TTL_MS);

    await this.twitterOAuthStateModel.create({
      state,
      userId: new mongoose.Types.ObjectId(userId),
      expiresAt,
    });

    this.logger.log(
      `twitter_oauth_start userId=${userId} stateHash=${this.hashState(state)}`
    );

    return state;
  }

  async isLinkStatePending(state: string): Promise<boolean> {
    const record = await this.twitterOAuthStateModel
      .findOne({
        state,
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      })
      .select({ _id: 1 })
      .lean();

    return Boolean(record);
  }

  async linkTwitterProfile(state: string, profile: any): Promise<UserDocument> {
    const stateHash = this.hashState(state || "");
    const stateRecord = await this.twitterOAuthStateModel.findOneAndUpdate(
      {
        state,
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      },
      { $set: { usedAt: new Date() } },
      { new: true }
    );

    if (!stateRecord) {
      this.logger.warn(
        `twitter_link_failed reason=invalid_state stateHash=${stateHash}`
      );
      throw new HttpException(
        "Invalid Twitter OAuth state",
        HttpStatus.UNAUTHORIZED
      );
    }

    const twitterData = {
      id: profile?.id || profile?._json?.id_str || profile?._json?.id || "",
      photo: profile?.photos?.[0]?.value || "",
      username: String(profile?.username || "").trim(),
      name: String(profile?.displayName || "").trim(),
    };

    this.logger.log(
      `twitter_oauth_callback userId=${stateRecord.userId.toString()} twitterId=${twitterData.id || "-"} username=${twitterData.username || "-"} stateHash=${stateHash}`
    );

    if (!twitterData.username) {
      this.logger.warn(
        `twitter_link_failed reason=missing_username userId=${stateRecord.userId.toString()} stateHash=${stateHash}`
      );
      throw new HttpException(
        "Twitter username is missing",
        HttpStatus.BAD_REQUEST
      );
    }

    const existingUser = await this.userModel
      .findOne({
        _id: { $ne: stateRecord.userId },
        "twitterData.username": new RegExp(
          `^${this.escapeRegExp(twitterData.username)}$`,
          "i"
        ),
      })
      .select({ _id: 1 })
      .lean();

    if (existingUser) {
      this.logger.warn(
        `twitter_link_failed reason=username_taken userId=${stateRecord.userId.toString()} username=${twitterData.username} stateHash=${stateHash}`
      );
      throw new HttpException(
        "User with this X account already exists",
        HttpStatus.CONFLICT
      );
    }

    const user = await this.userModel.findByIdAndUpdate(
      stateRecord.userId,
      { $set: { twitterData } },
      { new: true }
    );

    if (!user) {
      this.logger.warn(
        `twitter_link_failed reason=user_not_found userId=${stateRecord.userId.toString()} stateHash=${stateHash}`
      );
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);
    }

    this.logger.log(
      `twitter_link_success userId=${user._id.toString()} username=${twitterData.username} stateHash=${stateHash}`
    );

    return user;
  }

  async cleanTweetsWithoutAuthor(): Promise<void> {
    await this.liveNewsModel.updateMany(
      {}, // по всем документам
      {
        $pull: {
          tweets: { author: { $exists: false } } // удаляем если нет author
        }
      }
    );
  }
  private extractTwitterUsername(url: string): string | null {
    try {
      const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    } catch (e) {
      return null;
    }
  }
  private async updateModelTwitterRating(
    model: Model<any>,
    twitterModel: Model<any>,
    twitterFieldName: string,
    label: string
  ) {
    const batchSize = 100;
    let skip = 0;

    while (true) {
      const docs = await model
        .find({ parsingTwitterData: { $ne: null } })
        .skip(skip)
        .limit(batchSize)
        .lean();

      if (docs.length === 0) break;

      const bulkOps = [];

      for (const doc of docs) {
        if (!doc.parsingTwitterData) continue;

        console.log(`${label} - ${doc.name || doc.username || doc._id}`);

        const twitterDataDocs = await twitterModel.find({
          [twitterFieldName]: new mongoose.Types.ObjectId(doc._id),
        });

        if (!twitterDataDocs?.length) continue;

        const twitterScore: number = await this.ratingService.calculateScore({
          followersCount: doc.parsingTwitterData.followers_count || 0,
          friendsCount: doc.parsingTwitterData.friends_count || 0,
          statusesCount: doc.parsingTwitterData.statuses_count || 0,
          isBlueVerified: doc.parsingTwitterData.is_blue_verified || false,
          createdAt: doc.parsingTwitterData.created_at
            ? new Date(doc.parsingTwitterData.created_at)
            : undefined,
          tweets: twitterDataDocs[0].tweets,
          followers: twitterDataDocs[0].followers,
          location: doc.parsingTwitterData.location,
        });

        bulkOps.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(doc._id) },
            update: {
              $set: {
                previousTwitterScore: doc.twitterScore || 0,
                twitterScore: twitterScore,
                twitterScoreUpdate: new Date(),
              },
            },
          },
        });
      }

      if (bulkOps.length) {
        await model.bulkWrite(bulkOps);
      }

      skip += batchSize;
    }
  }

  private calculateUserStatus(points: number): UserRankType {
    switch (true) {
      case points <= 200:
        return "Stellar Awakening";
      case points <= 5000:
        return "Cosmic Explorer";
      case points <= 10000:
        return "Galactic Navigator";
      case points <= 25000:
        return "Celestial Master";
      case points <= 50000:
        return "Astral Sage";
      case points <= 100000:
        return "Universal Enlightenment";
      default:
        return "Stellar Awakening";
    }
  }

  async collectTwitterUsernames(limit: number): Promise<{
    users: Array<{
      username: string;
      id: string;
      type: string;
      activityXP: number;
    }>;
    funds: Array<{ username: string; id: string; type: string }>;
    persons: Array<{ username: string; id: string; type: string }>;
  }> {
    const [usersDocs, fundsDocs, personsDocs] = await Promise.all([
      this.userModel
        .find({ "twitterData.username": { $exists: true } })
        .limit(limit),
      this.fundModel.find({}).limit(limit),
      this.personModel.find({}).limit(limit),
    ]);

    const users = usersDocs
      .filter((user) => user.twitterData?.username)
      .map((user) => ({
        username: user.twitterData.username,
        id: user._id.toString(),
        type: "users",
        activityXP: user.activityXP || 0,
      }));

    const funds = fundsDocs
      .map((fund) => {
        const twitter = fund.socialmedia?.find(
          (s) => s.href?.includes("twitter.com") || s.href?.includes("x.com")
        );
        const username = twitter
          ? this.extractTwitterUsername(twitter.href)
          : null;
        if (username) {
          return { username, id: fund._id.toString(), type: "funds" };
        }
        return null;
      })
      .filter(Boolean) as Array<{ username: string; id: string; type: string }>;

    const persons = personsDocs
      .map((person) => {
        const twitter = person.socialmedia?.find(
          (s) => s.href?.includes("twitter.com") || s.href?.includes("x.com")
        );
        const username = twitter
          ? this.extractTwitterUsername(twitter.href)
          : null;
        if (username) {
          return { username, id: person._id.toString(), type: "persons" };
        }
        return null;
      })
      .filter(Boolean) as Array<{ username: string; id: string; type: string }>;

    return { users, funds, persons };
  }

  async enqueueTwitterJobs() {
    const batchSize = 20;
    const projects = await this.projectModel
      .find({
        twitterAcc: { $exists: true, $ne: "" },
        projectType: "market",
        projectStatus: "active",
      })
      .select({ _id: 1, twitterAcc: 1 })
      .limit(batchSize)
      .lean();

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const twitterAccName = project.twitterAcc?.split("/").pop();
      console.log(`Project ${twitterAccName} #${i}`);
      if (!twitterAccName) continue;

      await this.twitterQueue.add("parse-project", {
        projectId: project._id,
        twitterAcc: twitterAccName,
      });
    }

    console.log(`📩 Добавлено ${projects.length} проектов в очередь`);
  }

  async getTweets(
    username: string,
    count: number = 20,
    tweetsPath = "tweets",
    followersPath = "followers"
  ): Promise<{
    tweets: Array<any>;
    // followers: Array<any>;
    user: ParsingTwitterData | null;
  }> {
    const parserUrl: string = this.configService.get("FOMO_PARSER");

    try {
      const tweetsRes = await axios.post(
        `${parserUrl}/${tweetsPath}/${username}`
      );
      const { tweets, user } = tweetsRes.data;

      // const followersRes = await axios.post(
      //   `${parserUrl}/${followersPath}/${username}`
      // );
      // const followers = followersRes.data.followers || [];

      return { tweets, user };
    } catch (error) {
      console.error(
        `Ошибка при запросе твитов или подписчиков для пользователя ${username}:`,
        error.message || error
      );
      return { tweets: [], user: null };
    }
  }

  async getTweetByKeywords(keywords: string, paginationToken?: string): Promise<any> {
    const params: any = {};
    const parserUrl: string = this.configService.get("FOMO_PARSER");

    if (paginationToken) {
      params.pagination_token = paginationToken;
    }

    try {
      const response = await axios.post(
        `${parserUrl}/search/${keywords}`,
      );
      return response.data;
    } catch (error) {
      console.log(error);

      return { tweets: [] }
    }
  }

  async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async handleProjectsCron() {
    try {
      const totalLimit = 10;
      const batchSize = 1;
      const pauseAfter = 10;
      const pauseDuration = 10 * 60 * 1000;

      const projects = await this.projectModel
        .find({
          twitterAcc: { $exists: true, $ne: "" },
          projectType: "market",
          projectStatus: "active",
        })
        .select({ _id: 1, twitterAcc: 1 })
        .limit(totalLimit)
        .lean();

      console.log(`Найдено проектов: ${projects.length}`);

      const processProject = async (project, idx) => {
        const twitterAccName = project.twitterAcc?.split("/").pop();
        if (!twitterAccName) {
          console.warn(
            `Не удалось извлечь имя из twitterAcc: ${project.twitterAcc}`
          );
          return;
        }
        console.log(`Обработка проекта ${twitterAccName} (#${idx + 1})`);

        try {
          const { tweets, followers, user }: any = await this.getTweets(
            twitterAccName,
            20,
          );

          await this.liveNewsModel.updateOne(
            { page: "crypto" },
            {
              $push: { tweets: { $each: tweets } },
              $set: { entityId: new mongoose.Types.ObjectId(project._id) }
            },
            { upsert: true }
          );

          await this.projectTwitterModel.findOneAndUpdate(
            { projectId: new mongoose.Types.ObjectId(project._id) },
            {
              projectId: new mongoose.Types.ObjectId(project._id),
              twitterName: twitterAccName,
              tweets,
            },
            { upsert: true, new: true }
          );

          if (user) {
            await this.projectModel.findByIdAndUpdate(project._id, {
              parsingTwitterData: user,
            });
          }
        } catch (err) {
          console.error(
            `Ошибка при обработке проекта ${twitterAccName} (_id: ${project._id}):`,
            err
          );
        }
      };

      for (let i = 0; i < projects.length; i += batchSize) {
        const batch = projects.slice(i, i + batchSize);
        console.log(
          `Обработка батча проектов с ${i + 1} по ${i + batch.length}`
        );

        await Promise.all(
          batch.map((project, idx) => processProject(project, i + idx))
        );

        if (
          (i + batchSize) % pauseAfter === 0 &&
          i + batchSize < projects.length
        ) {
          console.log(
            `⏸ Достигнуто ${i + batchSize} проектов. Пауза 10 минут...`
          );
          await this.delay(pauseDuration);
        }
      }

      console.log("✅ Обновление твитов проектов завершено");
    } catch (error) {
      console.error("Ошибка в handleProjectsCron:", error);
    }
  }

  async handleUsersCron() {
    try {
      const { users } = await this.collectTwitterUsernames(50);

      for (const item of users) {
        const { username, id, type, activityXP } = item;
        console.log(`🔍 Парсим @${username}`);

        try {
          const { tweets, followers, user }: any = await this.getTweets(
            username,
            20,
            `${type}/tweets`,
            `${type}/followers`
          );

          await this.projectTwitterModel.findOneAndUpdate(
            { twitterName: username },
            {
              twitterName: username,
              tweets,
              followers,
              projectId: new mongoose.Types.ObjectId(id),
            },
            { upsert: true, new: true }
          );

          if (user)
            await this.userModel.findByIdAndUpdate(id, {
              parsingTwitterData: user,
              rank: this.calculateUserStatus(activityXP),
            });
          // await this.userModel.findByIdAndUpdate(id)

          console.log(`✅ Сохранили данные @${username}`);
        } catch (err) {
          console.error(
            `❌ Ошибка при обработке @${username}:`,
            err.message || err
          );
        }
      }

      console.log("🟢 Завершён сбор твитов для пользователей");
    } catch (err) {
      console.error("🔴 Ошибка в handleUsersCron:", err.message || err);
    }
  }

  async handlePersonsCron() {
    try {
      const { persons } = await this.collectTwitterUsernames(50);

      for (const item of persons) {
        const { username, id, type } = item;
        console.log(`🔍 Парсим @${username}`);

        try {
          const { tweets, followers, user }: any = await this.getTweets(
            username,
            20,
            `${type}/tweets`,
            `${type}/followers`
          );

          await this.projectTwitterModel.findOneAndUpdate(
            { twitterName: username },
            {
              twitterName: username,
              tweets,
              followers,
              projectId: new mongoose.Types.ObjectId(id),
            },
            { upsert: true, new: true }
          );

          if (user)
            await this.personModel.findByIdAndUpdate(id, {
              parsingTwitterData: user,
            });

          console.log(`✅ Сохранили данные @${username}`);
        } catch (err) {
          console.error(
            `❌ Ошибка при обработке @${username}:`,
            err.message || err
          );
        }
      }

      console.log("🟢 Завершён сбор твитов для Persons");
    } catch (err) {
      console.error("🔴 Ошибка в handleUsersCron:", err.message || err);
    }
  }

  async handleFundsCron() {
    try {
      const { funds } = await this.collectTwitterUsernames(50);

      for (const item of funds) {
        const { username, id, type } = item;
        console.log(`🔍 Парсим @${username}`);

        try {
          const { tweets, followers, user }: any = await this.getTweets(
            username,
            20,
            `${type}/tweets`,
            `${type}/followers`
          );

          await this.liveNewsModel.updateOne(
            { page: "funds" },
            {
              $push: { tweets: { $each: tweets } },
              $set: { entityId: new mongoose.Types.ObjectId(id) }
            },
            { upsert: true }
          );
          if (user)
            await this.fundModel.findByIdAndUpdate(id, {
              parsingTwitterData: user,
            });

          console.log(`✅ Сохранили данные @${username}`);
        } catch (err) {
          console.error(
            `❌ Ошибка при обработке @${username}:`,
            err.message || err
          );
        }
      }

      console.log("🟢 Завершён сбор твитов для funds");
    } catch (err) {
      console.error("🔴 Ошибка в handleUsersCron:", err.message || err);
    }
  }
  // @Cron(CronExpression.EVERY_6_HOURS)
  async handleAllTwitterCrons() {
    console.log("🚀 Запуск общего Twitter Cron");
    // if (
    //   this.configService.get("IS_LOCAL_RUN") &&
    //   this.configService.get("IS_LOCAL_RUN") === "true"
    // )
    //   return;

    try {
      await this.handleProjectsCron();
    } catch (err) {
      console.error("❌ Ошибка в handleProjectsCron:", err.message || err);
    }

    // try {
    //   await this.handleUsersCron();
    // } catch (err) {
    //   console.error("❌ Ошибка в handleUsersCron:", err.message || err);
    // }

    // try {
    //   await this.handlePersonsCron();
    // } catch (err) {
    //   console.error("❌ Ошибка в handlePersonsCron:", err.message || err);
    // }

    // try {
    //   await this.handleFundsCron();
    // } catch (err) {
    //   console.error("❌ Ошибка в handleFundsCron:", err.message || err);
    // }

    console.log("✅ Общий Twitter Cron завершён");
  }

  // @Cron(CronExpression.EVERY_6_HOURS)
  async handleTwitterRatingCron() {
    const batchSize = 100;

    await this.updateModelTwitterRating(
      this.projectModel,
      this.projectTwitterModel,
      "projectId",
      "Проект"
    );

    await this.updateModelTwitterRating(
      this.personModel,
      this.projectTwitterModel,
      "projectId",
      "Персона"
    );

    await this.updateModelTwitterRating(
      this.fundModel,
      this.projectTwitterModel,
      "projectId",
      "Фонд"
    );

    await this.updateModelTwitterRating(
      this.userModel,
      this.projectTwitterModel,
      "projectId",
      "Юзер"
    );
  }

  async getLiveNews(
    page: string,
    pageNumber = 1,
    pageSize = 20
  ): Promise<{ news: any[]; total: number }> {
    const skip = (pageNumber - 1) * pageSize;

    const result = await this.liveNewsModel.aggregate([
      { $match: { page } },
      {
        $addFields: {
          total: { $size: "$tweets" }
        }
      },
      {
        $project: {
          total: 1,
          tweets: {
            $slice: [
              {
                $sortArray: { input: "$tweets", sortBy: { createdAt: -1 } }
              },
              skip,
              pageSize
            ]
          }
        }
      }
    ]);

    if (!result.length) {
      return { news: [], total: 0 };
    }

    return {
      news: result[0].tweets,
      total: result[0].total
    };
  }

}
