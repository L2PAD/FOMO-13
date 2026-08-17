import { UpdateEventDto } from './dto/update-event.dto';
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from 'mongoose';
import { Event, EventDocument } from "./models/event.model";
import { ActionsService } from 'src/actions/actions.service';
import { CreateEventDto } from "./dto/create-event.dto";
import { AddActionDto } from 'src/actions/dto/add-action.dto';
import { Nft, NftDocument } from 'src/nft/nft.model';
import { ProjectDocument, Project } from "src/projects/project.model";
import { User, UserDocument } from 'src/user/user.model';

@Injectable()
export class EventsService {
    constructor(
      @InjectModel(Event.name) private eventModel: Model<EventDocument>,
      @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
      @InjectModel(Nft.name) private nftModel: Model<NftDocument>,
      @InjectModel(User.name) private userModel: Model<UserDocument>,
      private readonly actionsService:ActionsService
    ){}

    async getEvents(page:string,status:string,userId?:string) {
      const isPrivate : boolean = !!userId
      const searchParams : any = status === 'all' ? {page,isPrivate} : {isPrivate,page,status}

      if(isPrivate){
        searchParams.userId = new mongoose.Types.ObjectId(userId)
      }

      const eventsData = await this.eventModel.aggregate([
        {
          $match:searchParams
        },
        {
          $lookup: {
            from: this.projectModel.collection.name, 
            localField: "projectId", 
            foreignField: "_id", 
            as: "projectData"
          },
        },
        {
          $lookup: {
            from: this.nftModel.collection.name, 
            localField: "projectId", 
            foreignField: "_id", 
            as: "nftsData"
          },
        },
      ])

      const allEvents = eventsData.map((item) => {
        return {
          ...item,
          project: item.projectData[0] ||
            item.nftsData[0] ||
            {
              image: item.projectLogo,
              logo: item.projectLogo,
              name: item.projectName || item.name,
              slug: item.projectSlug,
            },
        }
      })

      return allEvents
    }

    async createEvent(createEventDto: CreateEventDto,status:string,initiator?:string) {
      const actionType : string = `Publication in calendar on ${createEventDto.page} page`
      const actionDate : Date = new Date()

      const eventData : any = {
        ...createEventDto,
        status
      }
 
      if(createEventDto.projectId){
        eventData.projectId = new Types.ObjectId(createEventDto.projectId)
      }
      
      const newEvent = await this.eventModel.create(eventData)

      if(initiator){
        const action : AddActionDto = {
          user: new mongoose.Types.ObjectId(initiator),
          itemId:new mongoose.Types.ObjectId(newEvent._id),
          name:'Create event',
          type:actionType,
          date:actionDate,
          status:status === 'moderator' ? 'moderator' : 'admin',
          category:'events',
        }

        await this.actionsService.addAction(action)    
      }

      if(createEventDto.isProjectEvent){
        await this.userModel.findByIdAndUpdate(createEventDto.userId,{
          $push:{
            privateEvents:new mongoose.Types.ObjectId(createEventDto.projectId)
          }
        })
      }

      return newEvent
    }

    async updateEvent(id: string, updateEventDto: UpdateEventDto) {    
      delete updateEventDto._id  
      
      const newEvent = ({
        ...updateEventDto,
        projectId: new Types.ObjectId(updateEventDto.projectId),
      })

      return await this.eventModel.findOneAndUpdate({ _id:id }, { $set: newEvent })
    }

    async deleteEvent(id: string) {
      return await this.eventModel.findOneAndDelete({ _id:id })
    }
}
