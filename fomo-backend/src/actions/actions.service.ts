import { HttpCode, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, ObjectId } from 'mongoose';
import { Action,ActionCategories,ActionDocument } from './models/action.model';

import { Project,ProjectDocument } from 'src/projects/project.model';
import { News,NewsDocument } from 'src/news/models/news.model';
import { Event,EventDocument } from 'src/events/models/event.model';
import { Funds,FundsDocument } from 'src/funds/funds.model';
import { Person,PersonDocument } from 'src/persons/person.model';
import { Nft,NftDocument } from 'src/nft/nft.model';
import { User,UserDocument } from 'src/user/user.model';

import { ActionsDto } from './dto/actions.dto';
import { AddActionDto } from './dto/add-action.dto';
import { FundsService } from 'src/funds/funds.service';
import { NotificationsService } from 'src/notifications/notifications.service';

export type LimitTypes = 'projectLimit' | 'newsLimit' | 'personLimit' | 'fundLimit' | 'nftsLimit' | 'eventsLimit' | 'shareLimit'

@Injectable()
export class ActionsService {
    constructor(
      @InjectModel(Project.name) private readonly projectModel : Model<ProjectDocument>,
      @InjectModel(Event.name) private readonly eventModel : Model<EventDocument>,
      @InjectModel(Funds.name) private readonly fundModel : Model<FundsDocument>,
      @InjectModel(Person.name) private readonly personModel : Model<PersonDocument>,
      @InjectModel(News.name) private readonly newsModel : Model<NewsDocument>,
      @InjectModel(Action.name) private readonly actionModel : Model<ActionDocument>,
      @InjectModel(User.name) private readonly userModel : Model<UserDocument>,
      @InjectModel(Nft.name) private readonly nftModel : Model<NftDocument>,
      private readonly notificationsService : NotificationsService
    ){}

    private getActionItemModel (category : ActionCategories) : Project | Event | Funds | Person | News {
        const models : any = {
            'projects':this.projectModel,
            'news':this.newsModel,
            'nfts':this.nftModel,
            'events':this.eventModel,
            'funds':this.fundModel,
            'persons':this.personModel,
        }

        const currentModel : Project | Event | Funds | Person | News = models[category]

        return currentModel
    }

    private getActionLimitType (category : ActionCategories) : LimitTypes {
      const limitTypes : any = {
          'projects':'projectLimit',
          'news':'newsLimit',
          'nfts':'nftsLimit',
          'events':'eventsLimit',
          'funds':'fundLimit',
          'persons':'personLimit',
      }

      return limitTypes[category]
    }

    private async updateProjectsFunds(projects:{
      oldFunds:Array<mongoose.Types.ObjectId>,
      newFunds:Array<mongoose.Types.ObjectId>,
      newProjectIds:Array<mongoose.Types.ObjectId>,
      oldProjectIds:Array<mongoose.Types.ObjectId>
    }) : Promise<any> {
        const { oldFunds, newFunds, oldProjectIds, newProjectIds } = projects;

        return await this.projectModel.bulkWrite([
            {
                updateMany: {
                    filter: { _id: { $in: oldProjectIds } },
                    // @ts-ignore
                    update: { $pull: { investors: { $in: oldFunds } } }
                }
            },
            {
                updateMany: {
                    filter: { _id: { $in: newProjectIds } },
                    // @ts-ignore
                    update: { $addToSet: { investors: { $each: newFunds } } }
                }
            }
        ]);
    }

    private async finishUpdateEntity (deletedAction:Action) : Promise<void> {
      const currentModel : any = this.getActionItemModel(deletedAction.category)
      const limitType : LimitTypes = this.getActionLimitType(deletedAction.category)

      const entity : any = await currentModel.findByIdAndDelete(deletedAction.itemId)
      const originalEntity : any = await currentModel.findByIdAndDelete(entity.originalEntityId)

      if(deletedAction.category === 'funds'){
        await this.updateProjectsFunds({
          oldFunds:deletedAction.oldFunds,
          newFunds:deletedAction.newFunds,
          newProjectIds:deletedAction.newProjectIds,
          oldProjectIds:deletedAction.oldProjectIds
        })
      }
  
      const newEntity : any = await currentModel.create({
        ...entity.toObject(),
        _id:new mongoose.Types.ObjectId(entity.originalEntityId),
        isDuplicate:false, 
        projectStatus:'active',
        status:originalEntity.status
      })
      
      await this.notificationsService.sendUsersNotifications(newEntity)

      await this.userModel.findByIdAndUpdate(deletedAction.user,{
        $inc:{[limitType]:-1,points:5},
      })
    }

    private async finishCreateEntity (deletedAction:Action) : Promise<void> {
      const currentModel : any = this.getActionItemModel(deletedAction.category)
      const limitType : LimitTypes = this.getActionLimitType(deletedAction.category)
      
      await currentModel.findOneAndUpdate(
          {
            _id:new mongoose.Types.ObjectId(deletedAction.itemId)
          },
          {
              status:'active',
              projectStatus:'active'
          }
      )
      
      await this.userModel.findByIdAndUpdate(deletedAction.user,{
        $inc:{[limitType]:-1,points:5},
        $push:{[deletedAction.category]:new mongoose.Types.ObjectId(deletedAction.itemId)}
      })
    }

    async getUserActions (userId:string) : Promise<Array<any>> { 
      const actions : Array<any>
      =
      await this.actionModel.aggregate([
        {
          $match:{
            user:new mongoose.Types.ObjectId(userId),
            category:'projects'
          }
        },
        {
          $lookup: {
            from: this.projectModel.collection.name,
            localField: 'itemId',
            foreignField: '_id',
            as: 'projectData',
          }
        },
        {
          $unwind: {
            path: '$projectData',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            'projectData.investors': {
              $cond: {
                if: { $isArray: '$projectData.investors' },
                then: '$projectData.investors',
                else: []
              }
            }
          }
        },
        {
          $lookup: {
            from: this.fundModel.collection.name,
            let: { investorIds: '$projectData.investors' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$_id', '$$investorIds']
                  }
                }
              }
            ],
            as: 'projectData.investors'
          }
        },
        {
          $group: {
            _id: '$_id',
            actionData: { $first: '$$ROOT' },
            projectData: {
              $push: {
                $cond: {
                  if: { $gt: [{ $size: '$projectData.investors' }, 0] },
                  then: '$projectData',
                  else: '$$REMOVE'
                }
              }
            }
          }
        },
        {
          $addFields: {
            projectData: {
              $cond: {
                if: { $eq: [{ $size: '$projectData' }, 0] },
                then: [],
                else: '$projectData'
              }
            }
          }
        }
      ])
    
      return actions.map((item:any) => item.projectData && item.projectData[0])
    }

    async getActions(id : string,actionStatus:'moderator' | 'admin') : Promise<Array<ActionsDto>> {
        const actionsData = await this.actionModel.aggregate([
            {
                $match:{
                    status:actionStatus,
                }
            },
            {
              $lookup: {
                from: this.userModel.collection.name,
                localField: 'user',
                foreignField: '_id',
                as: 'userData',
              }
            },
            {
              $lookup: {
                from: this.eventModel.collection.name,
                localField: 'itemId',
                foreignField: '_id',
                as: 'eventData',
              }
            },
            {
              $lookup: {
                from: this.projectModel.collection.name,
                localField: 'itemId',
                foreignField: '_id',
                as: 'projectData',
              }
            },
            {
              $lookup: {
                from: this.nftModel.collection.name,
                localField: 'itemId',
                foreignField: '_id',
                as: 'nftData',
              }
            },
            {
              $lookup: {
                from: this.newsModel.collection.name,
                localField: 'itemId',
                foreignField: '_id',
                as: 'newsData',
              }
            },
            {
              $lookup: {
                from: this.fundModel.collection.name,
                localField: 'itemId',
                foreignField: '_id',
                as: 'fundsData',
              }
            },
            {
              $lookup: {
                from: this.personModel.collection.name,
                localField: 'itemId',
                foreignField: '_id',
                as: 'personData',
              }
            },
            {
              $addFields: {
                categoryData: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$category', 'projects'] }, then: { $arrayElemAt: ['$projectData', 0] } },
                      { case: { $eq: ['$category', 'events'] }, then: { $arrayElemAt: ['$eventData', 0] } },
                      { case: { $eq: ['$category', 'nfts'] }, then: { $arrayElemAt: ['$nftData', 0] } },
                      { case: { $eq: ['$category', 'news'] }, then: { $arrayElemAt: ['$newsData', 0] } },
                      { case: { $eq: ['$category', 'funds'] }, then: { $arrayElemAt: ['$fundsData', 0] } },
                      { case: { $eq: ['$category', 'persons'] }, then: { $arrayElemAt: ['$personData', 0] } },
                    ],
                    default: null,
                  },
                },
                userData: {
                  $let: {
                    vars: {
                      userData: { $arrayElemAt: ['$userData', 0] }
                    },
                    in: {
                      $mergeObjects: [
                        "$$userData",
                        { password: "$$REMOVE" } 
                      ]
                    }
                  }
                }
              },
            },
            {
              $project: {
                'userData.password': 0,
                projectData: 0,
                eventData: 0,
                nftData: 0,
                newsData: 0,
                fundsData: 0,
                personData: 0,
              },
            },
        ]);
        
        const actions : Array<ActionsDto> = actionsData

        return actions.reverse()
    }

    async deleteActions(actionIds:Array<string>,status:'moderator' | 'admin') : Promise<number> {
        const actionMongooseIds : Array<mongoose.Types.ObjectId>
        =
        actionIds.map((item:string) => new mongoose.Types.ObjectId(item))

        const actionsToUpdate : Array<Action> = await this.actionModel.find({ _id: { $in: actionMongooseIds },status });

        const itemIdsToUpdate : Array<mongoose.Types.ObjectId> = actionsToUpdate.map((action:Action) => 
          new mongoose.Types.ObjectId(action.itemId)
        );
        
        const usersIdsToUpdate : Array<mongoose.Types.ObjectId> = actionsToUpdate.map((action:Action) => 
          new mongoose.Types.ObjectId(action.user)
        );
 
        await Promise.all([
            this.nftModel.deleteMany({ _id: { $in: itemIdsToUpdate } }),
            this.projectModel.deleteMany({ _id: { $in: itemIdsToUpdate } }),
            this.fundModel.deleteMany({ _id: { $in: itemIdsToUpdate } }),
            this.personModel.deleteMany({ _id: { $in: itemIdsToUpdate } }),
            this.eventModel.deleteMany({ _id: { $in: itemIdsToUpdate } }),
            this.newsModel.deleteMany({ _id: { $in: itemIdsToUpdate } }),
            this.userModel.updateMany({_id:usersIdsToUpdate},{
              $inc:{points:(actionsToUpdate.length * -10),redFlags:actionsToUpdate.length},
            })   
        ]);

        const deletedActions = 
        (await this.actionModel.deleteMany({_id:{ $in: actionIds },status})).deletedCount
        
        return deletedActions
    }

    async addAction(action:AddActionDto) : Promise<Action> {
        return this.actionModel.create(action)
    }

    async confirmActionByModerator(actionId:string,moderatorId:string) : Promise<Action> {
        const newStatus : 'admin' = 'admin'

        const confrimedAction : Action = await this.actionModel.findOneAndUpdate(
            {
                _id:new mongoose.Types.ObjectId(actionId),
                status: 'moderator'
            },
            {
                status:newStatus,
                moderatorId:new mongoose.Types.ObjectId(moderatorId)
            }
        ) 

        if(!confrimedAction) throw new HttpException('Action not found',HttpStatus.BAD_REQUEST)

        const currentModel : any = this.getActionItemModel(confrimedAction.category)

        await currentModel.findOneAndUpdate(
            {_id:new mongoose.Types.ObjectId(confrimedAction.itemId)},
            {
                status:newStatus,
                projectStatus:newStatus
            }
        )

        return confrimedAction
    }

    async confirmActionByAdmin(actionId:string) : Promise<Action> {
        const deletedAction : Action = await this.actionModel.findOneAndDelete(
            {
                _id:new mongoose.Types.ObjectId(actionId),
                status: 'admin'
            },
        ) 
        
        if(!deletedAction) throw new HttpException('Action not found',HttpStatus.BAD_REQUEST)

        if(deletedAction.actionType === 'update'){
          await this.finishUpdateEntity(deletedAction)
        }else{
          await this.finishCreateEntity(deletedAction)
        }

        return deletedAction
    }

    async confirmManyActionsByAdmin(actionIds:Array<string>) : Promise<any> {
      const confirmedActions: Action[] = [];

      for (const actionId of actionIds) {
        const deletedAction: Action = await this.actionModel.findOneAndDelete(
            {
                _id: new mongoose.Types.ObjectId(actionId),
                status: 'admin'
            },
        );

        if (!deletedAction) throw new HttpException('Action not found', HttpStatus.BAD_REQUEST);

        if (deletedAction.actionType === 'update') {
          await this.finishUpdateEntity(deletedAction)
        } else {
          await this.finishCreateEntity(deletedAction)
        }

        confirmedActions.push(deletedAction);
      }

      return confirmedActions;
    }

    async confirmManyActionsByModerator(actionIds:Array<string>,moderatorId:string) : Promise<any> {
        const newStatus : 'admin' = 'admin'
        
        await this.actionModel.updateMany(
            {
                _id:{ $in: actionIds },
                status:'moderator'
            },
            {
                status:newStatus,
                moderatorId:new mongoose.Types.ObjectId(moderatorId)
            }
        ) 

        const actionsToUpdate : Array<Action> = await this.actionModel.find({ _id: { $in: actionIds } });
        const itemIdsToUpdate : Array<mongoose.Types.ObjectId> = actionsToUpdate.map((action) => action.itemId);

        await Promise.all([
            this.nftModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { projectStatus:newStatus }),
            this.projectModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { projectStatus:newStatus }),
            this.fundModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { projectStatus:newStatus }),
            this.personModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { projectStatus:newStatus }),
            this.eventModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { status:newStatus }),
            this.newsModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { status:newStatus }),
        ]);

        return 'Actions updated'
    }

    async rejectActionByAdmin(actionId:string) : Promise<Action> {
        const newStatus : 'moderator' = 'moderator'

        const updatedAction : Action = await this.actionModel.findOneAndUpdate(
            {
                _id:new mongoose.Types.ObjectId(actionId),
                status:'admin'
            },
            {
                status:newStatus
            }
        ) 

        if(!updatedAction) throw new HttpException('Action not found',HttpStatus.BAD_REQUEST)

        const currentModel : any = this.getActionItemModel(updatedAction.category)

        await currentModel.updateOne(
            {
                _id:new mongoose.Types.ObjectId(updatedAction.itemId)
            },
            {
                status:newStatus,
                projectStatus:newStatus
            }
        )

        if(updatedAction.moderatorId){
          await this.userModel.findByIdAndUpdate(updatedAction.moderatorId,{
            $inc:{rejectedEntities:1}
          })  
        }

        return updatedAction
    }

    async rejectManyActionsByAdmin(actionIds:Array<string>) : Promise<any> {
        const newStatus : 'moderator' = 'moderator'
        
        await this.actionModel.updateMany(
            {
                _id:{ $in: actionIds },
                status:'admin'
            },
            {
                status:newStatus
            }
        ) 

        const actionsToUpdate : Array<Action> = await this.actionModel.find({ _id: { $in: actionIds } });
        const itemIdsToUpdate : Array<mongoose.Types.ObjectId> = actionsToUpdate.map((action) => action.itemId);
        const moderatorsIdsToUpdate : Array<mongoose.Types.ObjectId | string> = actionsToUpdate.map((action:Action) => 
          action.moderatorId ? new mongoose.Types.ObjectId(action.moderatorId) : ''
        )

        await Promise.all([
            this.nftModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { projectStatus:newStatus }),
            this.projectModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { projectStatus:newStatus }),
            this.fundModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { projectStatus:newStatus }),
            this.personModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { projectStatus:newStatus }),
            this.eventModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { status:newStatus }),
            this.newsModel.updateMany({ _id: { $in: itemIdsToUpdate } }, { status:newStatus }),
            this.userModel.updateMany({_id: { $in:moderatorsIdsToUpdate } },{
              $inc:{rejectedEntities:actionsToUpdate.length},
            })   
        ]);

        return 'Actions updated'
    }

    async deleteActionByUser(itemId:string,userId:string) : Promise<any> {
      const project = await this.projectModel.findById(itemId);
      
      if (project && (project.projectStatus === 'moderator' || project.projectStatus === 'admin')) {
        await this.projectModel.findByIdAndDelete(itemId);
        await this.actionModel.findOneAndDelete({
          itemId:new mongoose.Types.ObjectId(itemId),
          user:new mongoose.Types.ObjectId(userId),
        })
      }

      return project
    }
}
