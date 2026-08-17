import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { TwitterAcc, TwitterAccDocument } from "./models/twitter-acc.model";
import {
  TwitterPerson,
  TwitterPersonDocument,
} from "./models/twitter-person.model";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { HttpService } from "@nestjs/axios/dist";
import MainInfoDto from "./dto/main-info.dto";
import axios from "axios";
import Twit from "twit";
import {
  AddTwitterAccByUserDto,
  AddTwitterAccDto,
  QueryParsingDto,
} from "./dto/add-twiiter-acc.dto";
import { SocialParcingService } from "./social-pacing.service";
import {
  KeywordItem,
  TwitterKeywords,
  TwitterKeywordsDocument,
} from "./models/twitter-keywords.model";
import { TwitterService } from "src/twitter/twitter.service";

@Injectable()
export class TwitterAccsParcingService {
  private readonly baseUrl = "https://api.twitter.com/2/";
  private readonly apiKey: string = "nqiMZ13WKC2kZ8ODvZxbqk0uJ";
  private readonly apiSecret: string =
    "0gob8JLDHFCwl2wR9Fxv01d7DfHbMi4XRrdFrE0G4JKFhZPrqO";
  private readonly accessToken: string =
    "1510335780761255941-r15bUnQ3MuBR17hDAzfplR2MdIuhll";
  private readonly accessSecret: string =
    "p96ifA8raQXSzwjgFsCTQPVf5PCdDDtf57URr3eYudltY";
  private readonly bearer: string =
    "AAAAAAAAAAAAAAAAAAAAAHAwuwEAAAAAlTbQG4AQg%2B4L2AFaszLP73Dt8oc%3DE9nF0f2NOM9pokgyi6g2EHSgGp12IfKH6hg8BOemysYCw7Oqfj";
  private twitterClient: Twit;

  constructor(
    @InjectModel(TwitterPerson.name)
    private twitterPersonModel: Model<TwitterPersonDocument>,
  ) {
    // this.start()
  }

  async getUserTweets(userId: string, paginationToken?: string): Promise<any> {
    const params: any = {};
    if (paginationToken) {
      params.pagination_token = paginationToken;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}users/${userId}/tweets`,
        {
          headers: {
            Authorization: `Bearer ${this.bearer}`,
          },
          params,
        }
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw new Error(`Error fetching tweets: ${error.message}`);
    }
  }

  async getAllTweets(userId: string, maxResults: number = 20): Promise<any[]> {
    let allTweets = [];
    let paginationToken = null;

    while (true) {
      const response = await this.getUserTweets(userId, paginationToken);
      allTweets = [...allTweets, ...response.data];
      paginationToken = response.meta.next_token;

      if (!paginationToken || allTweets.length >= maxResults) {
        break;
      }
    }

    return allTweets;
  }

  async getProjectTweets(id: string, value: number): Promise<any> {
    const tweets = await this.getAllTweets(id, value);

    return tweets;
  }

  async getUserData(username: string): Promise<MainInfoDto> {
    try {
      const params = {
        "user.fields": "profile_image_url,description,public_metrics",
      };

      const response = await axios.get(
        `${this.baseUrl}users/by/username/${username}`,
        {
          headers: {
            Authorization: `Bearer ${this.bearer}`,
          },
          params,
        }
      );

      // const tweets : any = await this.getAllTweets(response.data.data.id)

      const userData: MainInfoDto = {
        ...response.data.data,
        ...response.data.data.public_metrics,
        twitter_id: response.data.data.id,
        profile_image_url: response.data?.data?.profile_image_url?.replace(
          "normal",
          "200x200"
        ),
        // last100Tweets:tweets
      };

      return userData;
    } catch (error) {
      console.log(error);
    }
  }

  async getUsers(query?: QueryParsingDto): Promise<Array<TwitterPerson>> {
    const searchParams: any = { isPrivate: false };

    if (query?.searchValue) {
      const searchRegex = new RegExp(query.searchValue, "i");
      searchParams.$or = [{ username: searchRegex }, { name: searchRegex }];
    }

    const result: Array<TwitterPerson> = await this.twitterPersonModel
      .find(searchParams)
      .sort({ updatedAt: -1 });

    return result;
  }

  async getPrivateTweets(
    userId: string,
    query?: QueryParsingDto,
    ids?: any[]
  ): Promise<Array<TwitterPerson>> {
    const searchParams: any = {
      userId: new mongoose.Types.ObjectId(userId),
      isPrivate: true,
    };

    searchParams.isSentiment = query?.type === 'sentiment';

    if (query?.searchValue) {
      const searchRegex = new RegExp(query.searchValue, 'i');
      searchParams.$or = [{ username: searchRegex }, { name: searchRegex }];
    }

    if (query?.filter && query.filter !== 'all') {
      searchParams['mood.label'] = query.filter;
    }

    let sortField = 'updatedAt';
    let sortOrder: 1 | -1 = -1;


    if (ids && ids.length > 0) {
      searchParams._id = { $in: ids.map((item: any) => new mongoose.Types.ObjectId(item)) };
    }

    if (query?.sortBy) {
      switch (query.sortBy) {
        case 'createdAt':
          sortField = 'createdAt';
          break;
        case 'followersCount':
          sortField = 'followersCount';
          break;
        case 'tweetCount':
          sortField = 'tweetCount';
          break;
      }
    }

    if (query?.order === 'asc') {
      sortOrder = 1;
    }

    const result: Array<TwitterPerson> = await this.twitterPersonModel
      .find(searchParams)
      .sort({ [sortField]: sortOrder });

    return result;
  }
}


// Old version

// const mainInfo: any = await this.getMainInfo(client, username)
// const candidate: any = await this.twitterPersonModel.findOneAndUpdate({ username }, { $set: {
//   "followersCount": mainInfo.followersCount,
//   "followingCount": mainInfo.followingCount,
//   "tweetCount": mainInfo.tweetCount }
// })

// if (!candidate) {
//   await this.twitterPersonModel.create({
//     "username": username,
//     "followersCount": mainInfo.followersCount,
//     "followingCount": mainInfo.followingCount,
//     "tweetCount": mainInfo.tweetCount
//   })
// }

// const tweets = await this.getTweets(client, username)
// await this.twitterPersonModel.findOneAndUpdate({ username }, { $set: {
//   last100Tweets: tweets
// }})

// getMainInfo(client, username) {
//   console.log(username)

//   return new Promise(async (resolve, reject) => {
//     const userByUsername = await client.v2.userByUsername(username);

//     const id = userByUsername.data.id

//     const user = await client.v2.user(id, { 'user.fields': 'public_metrics' })

//     const followersCount = user.data.public_metrics.followers_count
//     const followingCount = user.data.public_metrics.following_count
//     const tweetCount = user.data.public_metrics.tweet_count

//     resolve({ followersCount, followingCount, tweetCount })
//   })
// }

// getTweets(client, username) {
//   return new Promise(async (resolve, reject) => {
//     const userByUsername = await client.v2.userByUsername(username);
//     const id = userByUsername.data.id
//     const res = await client.v2.userTimeline(id, {"max_results": 100 });
//     const tweets = res['_realData']['data']
//     const tweetIsd = tweets.map(tweet => {
//       return tweet.id
//     })

//     const tweetsMoreInfo = []

//     for (const tweetId of tweetIsd) {
//       const tweet = await client.v2.singleTweet(tweetId, { 'tweet.fields': 'public_metrics,created_at' })
//       tweetsMoreInfo.push(tweet.data)
//     }

//     resolve(tweetsMoreInfo)
//   })
// }
