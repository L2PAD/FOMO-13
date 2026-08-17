import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { TelegramService } from 'src/telegram/telegram.service';
import { User, UserDocument } from 'src/user/user.model';
import { ActionCategories } from 'src/actions/models/action.model';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationDocument } from './model/notification.model';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        private telegramService : TelegramService,
        private emailService : EmailService,
        private configService : ConfigService
    ){}

    async sendUsersNotifications(item:any) : Promise<{success:boolean}> {
        const notifications : Array<Notification> = 
        await this.notificationModel.find({itemId:new mongoose.Types.ObjectId(item._id)})

        for (let i = 0; i < notifications.length; i++) {
            const notification : Notification = notifications[i];
            
            await this.sendNotification(String(notification.userId),'projects',item)
        }

        return {success:true}
    }

    private getLinkByItemCategory(category:ActionCategories,itemId:string) : string {
        // const links = {
        //     'projects':`${this.configService.get('FRONT_URL')}/crypto/project/${itemId}`
        // }
        const links = {
            'projects':`fomo.wiki/crypto/project/${itemId}`
        }

        return links[category] || ''
    }

    async sendNotification(userId:string,category:ActionCategories,item:any) : Promise<void> {
        const user : User = await this.userModel.findById(userId)
        
        const link = this.getLinkByItemCategory(category,item._id)

        if(user.telegramNotification){
            await this.telegramService.sendNotification(user.telegramData.telegramId,item.name,link)
        }
   
        if(user.emailNotification){
            await this.emailService.sendNotification(user.email,item.name,link)
        }

    }

    async createNotification(itemId:string,userId:string) : Promise<Notification> {
        await this.userModel.findByIdAndUpdate(userId,{
            $push:{
                notifications:new mongoose.Types.ObjectId(itemId)
            }
        })

        return this.notificationModel.create({
            userId:new mongoose.Types.ObjectId(userId),
            itemId:new mongoose.Types.ObjectId(itemId),
        })
    }

    async removeNotification(itemId:string,userId:string) : Promise<Notification> {
        await this.userModel.findByIdAndUpdate(userId,{
            $pull:{
                notifications:new mongoose.Types.ObjectId(itemId)
            }
        })

        return this.notificationModel.findOneAndDelete({
            itemId:new mongoose.Types.ObjectId(itemId),
            userId:new mongoose.Types.ObjectId(userId)
        })
    }
}
