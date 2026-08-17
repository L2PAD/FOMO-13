import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { TwitterAcc, TwitterAccDocument } from "./models/twitter-acc.model";
import {
  AddTwitterAccByUserDto,
  AddTwitterAccDto,
  AddTwitterKeywordsDto,
  QueryKeywordsDto,
  UpdateTwitterAccByUserDto,
} from "./dto/add-twiiter-acc.dto";
import { TwitterAccsParcingService } from "./twitter-accs-parcing.service";
import {
  TwitterAccMood,
  TwitterPerson,
  TwitterPersonDocument,
} from "./models/twitter-person.model";
import { TwitterService } from "src/twitter/twitter.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  IKeywordTweet,
  KeywordItem,
  TwitterKeywords,
  TwitterKeywordsDocument,
} from "./models/twitter-keywords.model";
import axios from "axios";

@Injectable()
export class SocialParcingService {
  constructor(
    @InjectModel(TwitterAcc.name)
    private twitterAccModel: Model<TwitterAccDocument>,
    @InjectModel(TwitterPerson.name)
    private twitterPerson: Model<TwitterPersonDocument>,
    @InjectModel(TwitterKeywords.name)
    private twitterKeywordsModel: Model<TwitterKeywordsDocument>,
    private readonly parserService: TwitterService
  ) {
    // this.updateAllTwitterPersons()
    // this.updateAllKeywords()

    // this.analyzeTweetMood()
    // this.dK()
    // this.twitterPersonsDelete()

    // this.analyzeKeywordTweetMood([new mongoose.Types.ObjectId('68c9697327bc3b84fe0c4b74')])
    // this.updateAllTweetsCreatedAtAndRemoveDuplicates()
    // this.getKeywords('662153f47d6b86a569358c4d')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async upC() {
    this.twitterPerson.updateMany({}, { category: 'Other' })
  }

  async dK() {
    await this.twitterKeywordsModel.deleteMany({})
  }

  async twitterPersonsDelete() {
    await this.twitterPerson.deleteMany({isSentiment:true})
  }

  private getLabel(score: number): "Neutral" | "Negative" | "Positive" {
    let label: "Neutral" | "Negative" | "Positive";

    if (score >= 0.4 && score <= 0.6) {
      label = "Neutral";
    } else if (score < 0.4) {
      label = "Negative";
    } else {
      label = "Positive";
    }

    return label;
  }

  async analyzeTweetMood(ids: string[] | Types.ObjectId[]) {
    try {
      // if (process.env.IS_LOCAL_RUN === "true") return;

      const persons = await this.twitterPerson.find({
        _id: { $in: ids },
        isSentiment: true
      }).exec();

      for (let i = 0; i < persons.length; i++) {
        const person = persons[i];
        const updatedTweets: Array<any> = [];
        let totalScore: number = 0;
        let processedTweets = 0;

        for (let j = 0; j < person.tweets.length; j++) {
          const tweetText = person.tweets[j].text;

          try {
            const res = await axios.post(`${process.env.FOMO_AI}/predict/text`, {
              text: tweetText,
            });

            if (res?.data?.score !== undefined) {
              updatedTweets.push({
                ...person.tweets[j],
                mood: res.data
              });

              totalScore += res.data.score;
              processedTweets++;
            } else {
              updatedTweets.push(person.tweets[j]);
            }

            await this.sleep(1000);
          } catch (error) {
            console.error(`Ошибка анализа твита ${person.tweets[j].id}:`, error.message);
            updatedTweets.push(person.tweets[j]);
          }
        }

        if (processedTweets > 0) {
          await this.twitterPerson.findByIdAndUpdate(person._id, {
            tweets: updatedTweets,
            mood: {
              score: totalScore / processedTweets,
              label: this.getLabel(totalScore / processedTweets)
            }
          });

          console.log(`Проанализирован аккаунт ${person.username}: ${processedTweets} твитов`);
        }
      }
    } catch (error) {
      console.error('Ошибка в analyzeTweetMood:', error);
    }
  }

  async analyzeKeywordTweetMood(searchData: Types.ObjectId[] | string[], searchKey?: '_id' | 'stringKeywords') {
    try {
      const options = { isSentiment: true, [searchKey || '_id']: { $in: searchData } }

      const keywordDocuments = await this.twitterKeywordsModel.find(options).exec();

      for (let i = 0; i < keywordDocuments.length; i++) {
        const keywordDoc = keywordDocuments[i];
        const updatedTweets: IKeywordTweet[] = [];
        let totalScore: number = 0;
        let processedTweets = 0;

        for (let j = 0; j < keywordDoc.tweets.length; j++) {
          const tweet = keywordDoc.tweets[j];
          const tweetText = tweet.text;

          try {
            const res = await axios.post(`${process.env.FOMO_AI}/predict/text`, {
              text: tweetText,
            });
            if (res?.data?.score !== undefined) {
              const moodData: TwitterAccMood = {
                score: res.data.score.toString(),
                label: this.getLabel(res.data.score)
              };

              updatedTweets.push({
                ...tweet,
                mood: moodData
              });

              totalScore += Number(res.data.score);
              processedTweets++;
            } else {
              updatedTweets.push(tweet);
            }

            await this.sleep(1000);
          } catch (error) {
            console.error(`Ошибка анализа твита ключевого слова ${tweet.id}:`, error.message);
            updatedTweets.push(tweet);
          }
        }

        if (processedTweets > 0) {
          await this.twitterKeywordsModel.findByIdAndUpdate(keywordDoc._id, {
            tweets: updatedTweets,
            mood: {
              score: (totalScore / processedTweets).toString(),
              label: this.getLabel(totalScore / processedTweets)
            },
            isSentiment: true
          });

          console.log(`Проанализированы твиты ключевого слова ${keywordDoc._id}: ${processedTweets} твитов`);

          return {
            tweets: updatedTweets,
            mood: {
              score: (totalScore / processedTweets).toString(),
              label: this.getLabel(totalScore / processedTweets)
            }
          }
        }
      }
    } catch (error) {
      console.error('Ошибка в analyzeKeywordTweetMood:', error);
    }

    return {
      tweets: [],
      mood: { score: "0", label: "Neutral" }
    };


  }

  async getTwitterAccs() {
    return await this.twitterAccModel.find();
  }

  // @Cron(CronExpression.EVERY_HOUR)
  async updateAllTwitterPersons(): Promise<void> {
    const allPersons = await this.twitterPerson.find().exec();

    for (const person of allPersons) {
      try {
        const username = person.username;
        if (!username) continue;

        const { user, tweets } = await this.parserService.getTweets(
          username
        );

        const twitterPersonData: any = {
          followers: [],
          updatedAt: new Date(),
        };

        if (tweets.length) twitterPersonData.tweets = tweets

        await this.twitterPerson.findByIdAndUpdate(
          person._id,
          twitterPersonData,
          { new: true }
        );

        console.log(`${person?.username} - updated`);
      } catch (error) {
        console.error(
          `Ошибка обновления twitterPerson с username ${person.username}:`,
          error
        );
      }
    }

    // await this.analyzeTweetMood()
  }

  async updateKeywords(id: string, keywords: string): Promise<TwitterPerson> {
    const twitterAcc: TwitterPerson =
      await this.twitterPerson.findByIdAndUpdate(
        id,
        { keywords },
        { new: true }
      );

    if (!twitterAcc)
      throw new HttpException(
        "Twitter account not found",
        HttpStatus.NOT_FOUND
      );

    return twitterAcc;
  }

  async deleteTwitterPerson(
    isAdmin: boolean,
    id: string,
    userId?: string
  ): Promise<TwitterPerson> {
    if (isAdmin && userId)
      return await this.twitterPerson.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      });

    return await this.twitterPerson.findByIdAndDelete(id);
  }

  private async getUniqueKeywords(newKeywords: string[]): Promise<string[]> {
    if (!newKeywords?.length) return [];

    const docs = await this.twitterKeywordsModel.find({
      stringKeywords: { $ne: '' },
    }).select('stringKeywords').lean();

    const existingKeywords = docs
      .map(doc => doc.stringKeywords.split(',').map(k => k.trim()))
      .flat();

    const uniqueKeywords = newKeywords.filter(
      k => !existingKeywords.includes(k)
    );

    return uniqueKeywords;
  }

  async addTwitterAccByUser(accountData: AddTwitterAccByUserDto) {
    const rawUsername = accountData.username.trim();
    const cleanUsername = rawUsername.startsWith("@")
      ? rawUsername.slice(1)
      : rawUsername;

    const { user, tweets } = await this.parserService.getTweets(
      cleanUsername
    );

    const twitterPersonData = {
      name: user.name,
      twitterId: user.rest_id || user.id,
      username: user.screen_name,
      avatar: user.avatar_url,
      followersCount: user.followers_count,
      followingCount: user.friends_count,
      tweetCount: user.statuses_count,
      tweets: tweets || [],
      description: user.description,
      followers: [],
      registrationDate: new Date(user.created_at),
      isBlueVerified: user.is_blue_verified,
      location: user.location,
      isPrivate: true,
      userId: new mongoose.Types.ObjectId(accountData.userId),
      keywords: accountData.keywords,
      isSentiment: !!accountData.isSentiment,
      category: accountData.category || 'Other'
    };

    const twitterPerson = await this.twitterPerson.create(twitterPersonData);

    if (accountData.isSentiment) {
      await this.analyzeTweetMood([twitterPerson._id])
    }

    return twitterPerson;
  }

  async addTwitterAccByAdmin(accountData: AddTwitterAccDto) {
    const rawUsername = accountData.username.trim();
    const cleanUsername = rawUsername.startsWith("@")
      ? rawUsername.slice(1)
      : rawUsername;

    const { user, tweets } = await this.parserService.getTweets(
      cleanUsername
    );

    const twitterPersonData = {
      name: user.name,
      twitterId: user.rest_id || user.id,
      username: user.screen_name,
      avatar: user.avatar_url,
      followersCount: user.followers_count,
      followingCount: user.friends_count,
      tweetCount: user.statuses_count,
      tweets: tweets || [],
      description: user.description,
      followers: [],
      registrationDate: new Date(user.created_at),
      isBlueVerified: user.is_blue_verified,
      location: user.location,
      isPrivate: false,
      keywords: accountData.keywords,
    };

    const twitterPerson = await this.twitterPerson.create(twitterPersonData);

    if (accountData.isSentiment) {
      await this.analyzeTweetMood([twitterPerson._id])
    }

    return twitterPerson;
  }

  async addTwitterKeywords(data: AddTwitterKeywordsDto) {
    if (!data.keywords?.length) throw new HttpException('Keywords required', HttpStatus.BAD_REQUEST);

    const items: Array<string> = await this.getUniqueKeywords(data.keywords.split(","));

    const { tweets } = await this.parserService.getTweetByKeywords(data.keywords);

    const createData: any = {
      tweets,
      stringKeywords: data.keywords,
      isPrivate: !!data.isPrivate,
      isSentiment: data.isSentiment,
      keywords: items.map((item: string, i: number) => ({
        value: item,
        index: i
      }))
    };

    if (data.userId && mongoose.Types.ObjectId.isValid(data.userId)) {
      createData.userId = new mongoose.Types.ObjectId(data.userId);
    }

    const keyWords = await this.twitterKeywordsModel.create(createData);

    if (data.isSentiment) {
      await this.analyzeKeywordTweetMood([keyWords._id])

      const data: any = await this.twitterKeywordsModel.findById(keyWords._id)

      return data
    }

    await this.sleep(1000)

    return keyWords;
  }

  async updateTwitterAccByUser(accountData: UpdateTwitterAccByUserDto) {
    const rawUsername = accountData.username.trim();
    const cleanUsername = rawUsername.startsWith("@")
      ? rawUsername.slice(1)
      : rawUsername;

    const { user, tweets } = await this.parserService.getTweets(
      cleanUsername
    );

    if (accountData.isSentiment) {
      await this.analyzeTweetMood([new mongoose.Types.ObjectId(accountData.id)])
    }

    const twitterPersonData: any = {
      name: user.name,
      twitterId: user.rest_id || user.id,
      username: user.screen_name,
      avatar: user.avatar_url,
      followersCount: user.followers_count,
      followingCount: user.friends_count,
      tweetCount: user.statuses_count,
      description: user.description,
      registrationDate: new Date(user.created_at),
      isBlueVerified: user.is_blue_verified,
      location: user.location,
      tweets: tweets || [],
    };

    if (accountData.isPrivate) {
      twitterPersonData.userId = new mongoose.Types.ObjectId(
        accountData.userId
      );
      twitterPersonData.isPrivate = true;

      return await this.twitterPerson.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(accountData.id),
          userId: new mongoose.Types.ObjectId(accountData.userId),
        },
        twitterPersonData
      );
    }

    return await this.twitterPerson.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(accountData.id),
      },
      twitterPersonData
    );
  }

  async updateKeywordsTweets(keywordIds?: string[] | Types.ObjectId[]): Promise<{ message: string; updatedCount: number }> {
    try {
      const findCondition = keywordIds && keywordIds.length > 0
        ? { _id: { $in: keywordIds } }
        : {};

      const keywordsToUpdate = await this.twitterKeywordsModel.find(findCondition)
        .sort({ createdAt: -1 })
        .limit(keywordIds ? keywordIds.length : 50);

      if (!keywordsToUpdate.length) {
        throw new HttpException('No keywords found', HttpStatus.NOT_FOUND);
      }

      let updatedCount = 0;

      for (const keywordDoc of keywordsToUpdate) {
        try {
          const { stringKeywords, tweets: existingTweets, _id } = keywordDoc;
          console.log(`Updating keywords: ${stringKeywords} (ID: ${_id})`);

          const { tweets: newTweets } = await this.parserService.getTweetByKeywords(stringKeywords);

          if (!newTweets?.length) {
            console.log(`No new tweets found for: ${stringKeywords}`);
            continue;
          }

          const existingTweetIds = new Set(existingTweets.map(tweet => tweet.id));
          const uniqueNewTweets = newTweets.filter(tweet => !existingTweetIds.has(tweet.id));

          if (uniqueNewTweets.length === 0) {
            console.log(`No unique new tweets for: ${stringKeywords}`);
            continue;
          }

          const tweetsToAdd = uniqueNewTweets.map(item => ({
            ...item,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
          }));

          await this.twitterKeywordsModel.updateOne(
            { _id },
            {
              $addToSet: {
                tweets: { $each: tweetsToAdd }
              },
              $set: {
                updatedAt: new Date(),
              },
            }
          );

          updatedCount++;
          console.log(`Added ${tweetsToAdd.length} new tweets to: ${stringKeywords}`);

          await this.sleep(3000);

        } catch (error) {
          console.error(`Error updating keyword ${keywordDoc._id}:`, error.message);
        }
      }

      return {
        message: `Successfully updated ${updatedCount} out of ${keywordsToUpdate.length} keywords`,
        updatedCount
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error in updateKeywords:', error);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async saveKeywords(
    userTwitterId: string,
    userId: string | Types.ObjectId,
    keywords: string
  ): Promise<TwitterKeywords> {
    const parsedKeywords: KeywordItem[] = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((value) => value.length > 0)
      .map((value, index) => ({ index, value }));

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const existingDoc = await this.twitterKeywordsModel.findOne({
      userId: objectUserId,
    });

    let updatedKeywords: KeywordItem[] = parsedKeywords;

    const { tweets } = await this.parserService.getTweetByKeywords(keywords)

    if (existingDoc) {
      const existingValues = new Set(
        existingDoc.keywords.map((kw) => kw.value.toLowerCase())
      );
      const newUnique = parsedKeywords.filter(
        (kw) => !existingValues.has(kw.value.toLowerCase())
      );

      updatedKeywords = [...existingDoc.keywords, ...newUnique].map(
        (kw, index) => ({
          ...kw,
          index,
        })
      );
    }

    return await this.twitterKeywordsModel.findOneAndUpdate(
      { userId: objectUserId },
      {
        userId: objectUserId,
        userTwitterId: userTwitterId,
        keywords: updatedKeywords,
        tweets
      },
      { upsert: true, new: true }
    );
  }

  async getKeywords(userId?: string, query?: QueryKeywordsDto) {
    const matchStage: any = {};

    if (userId) {
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    if (query?.isPrivate !== undefined) {
      matchStage.isPrivate = query.isPrivate;
    }

    // фильтр по sentiment
    if (query?.isSentiment !== undefined) {
      matchStage.isSentiment = query.isSentiment;
    }

    // фильтр по массиву _id (если передан)
    if (query?.ids && Array.isArray(query.ids) && query.ids.length > 0) {
      matchStage._id = { $in: query.ids.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const offset = Number(query?.offset) || 0;
    const limit = Number(query?.limit) || 20;
    const excludedKeywords = query?.excludedKeywords?.split(",") || [];
    const includedKeywords = query?.includedKeywords || [];

    const pipeline: any[] = [];

    pipeline.push({
      $match: {
        tweets: { $exists: true, $not: { $size: 0 } },
        stringKeywords: { $exists: true, $ne: "" },
        ...matchStage,
      },
    });

    pipeline.push({ $unwind: "$tweets" });

    if (query?.searchValue) {
      const searchRegex = new RegExp(query.searchValue, "i");
      pipeline.push({
        $match: {
          stringKeywords: { $regex: searchRegex },
        },
      });
    }

    if (excludedKeywords.length > 0) {
      pipeline.push({
        $match: {
          "keywords.value": { $nin: excludedKeywords },
        },
      });
    }

    if (includedKeywords.length > 0) {
      pipeline.push({
        $match: {
          "stringKeywords": { $in: includedKeywords },
        },
      });
    }

    pipeline.push({ $sort: { "tweets.createdAt": -1 } });

    pipeline.push({
      $facet: {
        paginatedTweets: [
          { $skip: offset },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              tweet: "$tweets",
              keywords: 1,
              stringKeywords: 1,
              isPrivate: 1,
              createdAt: 1,
              updatedAt: 1,
              mood: 1,
            },
          },
        ],
        totalCount: [{ $count: "total" }],
        allKeywords: [
          { $unwind: "$keywords" },
          { $group: { _id: 1, keywords: { $addToSet: "$keywords.value" } } },
        ],
        globalMood: [
          {
            $group: {
              _id: null,
              avgScore: { $avg: { $toDouble: "$mood.score" } },
            },
          },
        ],
      },
    });

    const result = await this.twitterKeywordsModel.aggregate(pipeline);
    const avgScore = result[0]?.globalMood[0]?.avgScore || 0;

    let label = "Neutral";
    if (avgScore > 0.05) label = "Positive";
    else if (avgScore < -0.05) label = "Negative";

    return {
      ids: result[0]?.allKeywords?._id || [],
      tweets: result[0]?.paginatedTweets || [],
      total: result[0]?.totalCount[0]?.total || 0,
      keywords: result[0]?.allKeywords[0]?.keywords || [],
      mood: {
        score: avgScore.toFixed(4),
        label,
      } as TwitterAccMood,
    };
  }

  async getRandomKeywords(): Promise<Array<string>> {
    const result = await this.twitterKeywordsModel.aggregate([
      { $unwind: "$keywords" },
      { $sample: { size: 11 } },
      {
        $project: {
          _id: 0,
          value: "$keywords.value",
        },
      },
    ]);

    return result.map((item) => item.value);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateAllTweetsCreatedAtAndRemoveDuplicates() {
    const docs = await this.twitterKeywordsModel.find({ "tweets.0": { $exists: true } });

    let updatedCount = 0;

    for (const doc of docs) {
      const uniqueTweetsMap = new Map();

      for (const tweet of doc.tweets) {
        let createdAt = tweet.createdAt;
        if (typeof createdAt === "string") {
          createdAt = new Date(createdAt);
        }

        const key = tweet.id;

        if (!uniqueTweetsMap.has(key)) {
          uniqueTweetsMap.set(key, { ...tweet, createdAt });
        }
      }

      const newTweets = Array.from(uniqueTweetsMap.values());

      if (newTweets.length !== doc.tweets.length) {
        doc.tweets = newTweets;
        await doc.save();
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  }


  async findAllByStringKeywords(userId?: string, searchString?: string): Promise<TwitterKeywords[]> {
    if (!searchString || !searchString.trim() || !userId) {
      throw new HttpException('Search string is empty', HttpStatus.BAD_REQUEST);
    }

    try {
      const keywords = await this.twitterKeywordsModel.find({
        userId: new mongoose.Types.ObjectId(userId), stringKeywords: { $regex: searchString.trim(), $options: 'i' },
      }).sort({ createdAt: -1 }).limit(30);

      return keywords;
    } catch (err) {
      console.error('Ошибка при поиске TwitterKeywords по stringKeywords:', err.message);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
