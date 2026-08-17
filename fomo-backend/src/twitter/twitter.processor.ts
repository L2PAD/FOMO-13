import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import axios from "axios";
import { ConfigService } from "@nestjs/config";

import {
  ProjectTwitter,
  ProjectTwitterDocument,
} from "./project-twitter.model";

@Processor("twitter-parser")
export class TwitterParserProcessor {
  constructor(
    private configService: ConfigService,
    @InjectModel(ProjectTwitter.name)
    private projectTwitterModel: Model<ProjectTwitterDocument>
  ) {}

  @Process("parse-project")
  async handleParse(job: Job<{ projectId: string; twitterAcc: string }>) {
    const { projectId, twitterAcc } = job.data;
    const parserUrl = this.configService.get("FOMO_PARSER");

    try {
      const tweetsRes = await axios.post(`${parserUrl}/tweets/${twitterAcc}`);
      const followersRes = await axios.post(
        `${parserUrl}/followers/${twitterAcc}`
      );

      const tweets = tweetsRes.data.tweets || [];
      const followers = followersRes.data.followers || [];
      
      await this.projectTwitterModel.findOneAndUpdate(
        { projectId },
        {
          projectId,
          twitterName: twitterAcc,
          tweets,
          followers,
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Обработан Twitter ${twitterAcc}`);
    } catch (error) {
      console.error(
        `❌ Ошибка при парсинге ${twitterAcc}:`,
        error.message || error
      );
    }
  }
}
