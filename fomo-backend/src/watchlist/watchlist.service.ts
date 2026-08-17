import { InjectModel } from '@nestjs/mongoose';
import { Injectable , HttpException, HttpStatus, HttpCode} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { WatchlistDto } from './dto/watchlist.dto';
import { Watchlist , WatchlistDocument} from './models/watchlist.model';
import { Project,ProjectDocument } from 'src/projects/project.model';
import { Nft,NftDocument } from 'src/nft/nft.model';
import { Person,PersonDocument } from 'src/persons/person.model';
import { Funds,FundsDocument } from 'src/funds/funds.model';
import { User, UserDocument } from 'src/user/user.model';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';

@Injectable()
export class WatchlistService {
    constructor(
        @InjectModel(Watchlist.name) private readonly watchlistModel :Model<WatchlistDocument>,
        @InjectModel(Project.name) private readonly projectModel :Model<ProjectDocument>,
        @InjectModel(Nft.name) private readonly nftModel :Model<NftDocument>,
        @InjectModel(Person.name) private readonly personModel :Model<PersonDocument>,
        @InjectModel(Funds.name) private readonly fundModel :Model<FundsDocument>,
        @InjectModel(User.name) private readonly userModel :Model<UserDocument>,
    ){}

    private async parseWatchlist(data : Array<any>,page : string) : Promise<WatchlistDto> {
  
        const projects : any = []
        
        for (let i = 0; i < data[0].projects?.reverse().length; i++) {
            const project = data[0].projects?.reverse()[i];
            const investors : any = await this.fundModel.find({_id:project.investors})

            projects.push({...project,investors})
        }

        return {
            projects,
            nfts:data[0].nfts?.reverse(),
            persons:data[0].persons?.reverse(),
            funds:data[0].funds?.reverse(),
        }
    }

    async getWatchlist(page : string,id : string | mongoose.Types.ObjectId) : Promise<any>{
        const userId : mongoose.Types.ObjectId = new mongoose.Types.ObjectId(id)

        const watchlistArray : Array<any> = await this.watchlistModel.aggregate([
            {
                $match:{
                    userId
                }
            },
            {
                $lookup:{
                    from:this.projectModel.collection.name,
                    localField:'projectsList.projectId',
                    foreignField:'_id',
                    as:'projects'
                }
            },
            {
                $lookup:{
                    from:this.nftModel.collection.name,
                    localField:'projectsList.projectId',
                    foreignField:'_id',
                    as:'nfts'
                }
            },
            {
                $lookup:{
                    from:this.personModel.collection.name,
                    localField:'projectsList.projectId',
                    foreignField:'_id',
                    as:'persons'
                }
            },
            {
                $lookup:{
                    from:this.fundModel.collection.name,
                    localField:'projectsList.projectId',
                    foreignField:'_id',
                    as:'funds'
                }
            },
        ])
    
        if(!watchlistArray.length){
            return new HttpException('User not found',HttpStatus.NOT_FOUND)
        }

        const watchlist : WatchlistDto = await this.parseWatchlist(watchlistArray,page)

        return watchlist
    }

    async createWatchList(createData : CreateWatchlistDto) : Promise<WatchlistDto>{
        const watchlist : any = await this.watchlistModel.create(
            {
                userId:new mongoose.Types.ObjectId(createData.userId),
                projectsList:[{projectId:new mongoose.Types.ObjectId(createData.projectId),page:createData.page,}]
            },
        )

        return watchlist
    }

    async addToWatchlist (page : string,uId : string,pId : string) : Promise<WatchlistDto> {
        const userId : mongoose.Types.ObjectId = new mongoose.Types.ObjectId(uId)

        const projectId : mongoose.Types.ObjectId = new mongoose.Types.ObjectId(pId)

        const updatedWatchlist = await this.watchlistModel.findOneAndUpdate(
            {userId,projectsId:{$ne:projectId}},
            {$push:{projectsList:{projectId,page}}}
        )
     
        if(!updatedWatchlist){
            return await this.createWatchList({userId,projectId,page})
        }
   
        const watchlist : WatchlistDto = await this.getWatchlist(page,userId)

        return watchlist
    }

    async removeFromWatchlist (page : string,uId : string, pId : string) : Promise<WatchlistDto> { 
        const userId  : mongoose.Types.ObjectId = new mongoose.Types.ObjectId(uId)

        const projectId :mongoose.Types.ObjectId = new mongoose.Types.ObjectId(pId)
        
        await this.watchlistModel.findOneAndUpdate(
            {userId},
            {$pull:{projectsList:{projectId}}}
        )

        const watchlist : WatchlistDto = await this.getWatchlist(page,userId)

        return watchlist
    }
}
