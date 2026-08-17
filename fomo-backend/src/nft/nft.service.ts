import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, {Model} from "mongoose";

import { FilesService } from "src/files/files.service";
import { ActionsService } from "src/actions/actions.service";

import { Nft, NftDocument } from "./nft.model";

import { AddActionDto } from "src/actions/dto/add-action.dto";
import { CreateNftDto } from "./dto/create-nft.dto";
import commentDto from "src/comments/dto/comment.dto";

@Injectable()
export class NftService {
    constructor(
        @InjectModel(Nft.name) private nftModel: Model<NftDocument>,
        private readonly filesService:FilesService,
        private readonly actionsService:ActionsService
    ){}

    async getNft(){
        const nft =  await this.nftModel.find()

        return nft.reverse()
    }

    async getModeratorNft(){
        const nft = await this.nftModel.find()

        return nft.reverse()

    }

    async getAdminNft(){
        const nft = await this.nftModel.find()

        return nft.reverse()

    }

    async createNft(createNftDto:CreateNftDto){
        const logo = await this.filesService.writeFile(createNftDto.logo)

        const investors = createNftDto.investors[0]?.length && JSON.parse(createNftDto.investors[0])

        const newNft = await this.nftModel.create({...createNftDto,logo:logo,investors})

        return newNft
    }

    async createNftByModerator(createNftDto:CreateNftDto,initiator){
        const actionType : string = 'Publication on Nfts page'
        const actionDate : Date = new Date()

        const logo = await this.filesService.writeFile(createNftDto.logo)

        const investors = createNftDto.investors[0]?.length && JSON.parse(createNftDto.investors[0])

        const newNft = await this.nftModel.create(
            {
                ...createNftDto,
                logo:logo,
                actionInitiator:initiator,
                investors
            })
            
        const action : AddActionDto = {
            user: new mongoose.Types.ObjectId(initiator),
            itemId:new mongoose.Types.ObjectId(newNft._id),
            name:'Create nft',
            type:actionType,
            value:{name:CreateNftDto.name,img:logo},
            date:actionDate,
            category:'nfts',
            status:'admin',
        } 

        await this.actionsService.addAction(action)    

        return newNft
    }

    async editNft(id:string,updateNftDto:CreateNftDto) : Promise<NftDocument | string>{
        const updatedProject = await this.nftModel.findById(id) 

        const isNewLogo : boolean = typeof updateNftDto.logo !== 'string'

        const newLogo : string = isNewLogo ? await this.filesService.writeFile(updateNftDto.logo) : updatedProject.logo

        const {success} = updatedProject.logo && isNewLogo ? await this.filesService.removeFile(updatedProject.logo) : {success:true}

        if(!success) return 'Update error'

        const investors = updateNftDto.investors[0]?.length && JSON.parse(updateNftDto.investors[0])

        const updatedProjectTmp = {...updateNftDto,logo:newLogo,investors,
            items: Array.isArray(updateNftDto.items) ? updateNftDto.items : updatedProject.items,
            owners: Array.isArray(updateNftDto.owners) ? updateNftDto.owners : updatedProject.owners
        }
        
        const result = await this.nftModel.findByIdAndUpdate(id,updatedProjectTmp)

        return result
    }
    
    async addComment(id:string,comment:commentDto){
        const nft = await this.nftModel.findById(id)

        if(nft.comments){
            nft.comments = [comment,...nft.comments]
        }else{
            nft.comments = [comment]
        }

        await nft.save()
        return nft
    }

    async removeComment(id:string,comment:string){
        const nft = await this.nftModel.findOne({_id:id})

        nft.comments = nft.comments.filter((c) => c.id !== comment)

        await nft.save()

        return nft
    }

    async removeProject(id:string){
        const project = await this.nftModel.findOneAndDelete({_id:id})

        return project
    }

    async toggleRedStatus(id:string){
        const project = await this.nftModel.findById(id)

        project.redStatus = !project.redStatus

        return await project.save() 
    }

    async changeStatus(id:string,status:string){
        const project = await this.nftModel.findById(id)

        project.status = status
        
        return await project.save() 
    }
}
