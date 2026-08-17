import axios from 'axios';
import mongoose, { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { AiResultItem, AiResults,AiResultsDocument } from './models/ai-results.model'
import { CreateAlertDto } from './dto/create-alert.dto';
import { Project, ProjectDocument } from 'src/projects/project.model';
import { TwitterAccsParcingService } from '../social-parcing/twitter-accs-parcing.service';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from 'src/telegram/telegram.service';
import { User, UserDocument } from 'src/user/user.model';

@Injectable()
export class UtilsService {
    constructor(
        @InjectModel(AiResults.name) private aiResultsModel: Model<AiResultsDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly twitterAccsParcingService : TwitterAccsParcingService,
        private readonly configService: ConfigService,
        private readonly telegramService: TelegramService,
    ){}

    async createAlert(alertData:CreateAlertDto) : Promise<any> {
        const project : ProjectDocument = await this.projectModel.findById(alertData.projectId)
        
        const tweets : Array<any> = await this.twitterAccsParcingService.getProjectTweets(project.twitterData.twitter_id,30)

        const data : Array<{id:string,text:string}> 
        =
        tweets.map((item:any) => {
            return {id:item.id,text:item.text}
        })
    
        const FOMO_AI_API : string = this.configService.get('FOMO_AI')

        const res = await axios.post(`${FOMO_AI_API}/predict_batch`,{items:data})

        const aiResultItem = {
            name:alertData.name,
            notificationTypes:alertData.notificationTypes,
            sensitivity:alertData.sensitivity,
            results:res.data?.results,
            projectId:new mongoose.Types.ObjectId(alertData.projectId),
            userId:new mongoose.Types.ObjectId(alertData.userId),
        }

        const {message,userTelegramId,projectName} : {message:string,userTelegramId:string,projectName:string} 
        = 
        await this.configurateResults(project.name,aiResultItem.userId,aiResultItem.results)

        await this.telegramService.sendAnalyticsResults(userTelegramId,message,projectName)

        return this.aiResultsModel.create(aiResultItem)
    }

    async configurateResults(
        projectName:string,
        userId:mongoose.Types.ObjectId,
        results:Array<AiResultItem>
    ) : Promise<{message:string,userTelegramId:string,projectName:string}>{
        const user : UserDocument = await this.userModel.findById(userId)
        let totalScore = 0

        for (let i = 0; i < results.length; i++) {
            const result : AiResultItem = results[i];
            
            totalScore = totalScore + result.result.score
        }

        const middleScode : number = Number((totalScore / results.length).toFixed(2))

        return {
            message:`
Middle score: <b>${middleScode}</b>
Mood: <b>${middleScode > 0.5 ? 'Positive' : 'Negative'}</b>
            `,
            userTelegramId:user.telegramData.telegramId,
            projectName:projectName,
        }
    }

    async sendAIResults() : Promise<any> {

    }

    async getAiResults(userId:string,projectId:string) : Promise<any> {
        return this.aiResultsModel.findOne({
            userId:new mongoose.Types.ObjectId(userId),
            projectId:new mongoose.Types.ObjectId(projectId)
        })
    }
}
