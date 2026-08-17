import mongoose, { Model, mongo } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateInviteDto, InviteDto } from './dto/invite.dto';
import { Board, BoardDocument } from 'src/board/models/board.model';
import { Invite, InviteDocument } from './models/invite.model';
import { ConfirmInviteDto } from './dto/confirm-invite.dto';
import { RejectInviteDto } from './dto/reject-invite.dto';
import { User, UserDocument } from 'src/user/user.model';

export type GlobalReturnData = {
    isSuccess:boolean
    data?:any
}

@Injectable()
export class InvitesService {
    constructor(
        @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
        @InjectModel(Invite.name) private inviteModel: Model<InviteDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ){}

    async getInvites(inviterId:string) : Promise<Array<InviteDto>> {
        return this.inviteModel.aggregate([
            {
                $match: {
                    inviterId: new mongoose.Types.ObjectId(inviterId),
                    isAccepted:false,
                    isCanceled:false
                }
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: "senderId",
                    foreignField: "_id",
                    as: "sender"
                }
            },
            {
                $unwind: "$sender" 
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: "inviterId",
                    foreignField: "_id",
                    as: "inviter"
                }
            },
            {
                $unwind: "$inviter" 
            },
            {
                $lookup: {
                    from: this.boardModel.collection.name,
                    localField: "boardId",
                    foreignField: "_id",
                    as: "board"
                }
            },
            {
                $unwind: "$board" 
            }
        ]);
    }

    async createInvites(invitesData:CreateInviteDto) : Promise<Array<Invite>> {
        const invites = []
        
        for (let index = 0; index < invitesData.users.length; index++) {
            const userId : string = invitesData.users[index]

            const inviteItem : Invite | null
            =
            await this.inviteModel.findOne({
                boardId:new mongoose.Types.ObjectId(invitesData.boardId),
                inviterId:new mongoose.Types.ObjectId(userId),
                senderId:new mongoose.Types.ObjectId(invitesData.senderId),
                isCanceled:false
            })

            if(inviteItem && inviteItem.senderId) throw new HttpException('Invite already created',HttpStatus.BAD_GATEWAY)
            
            const invite : Invite = await this.inviteModel.create({
                category:'board',
                boardId:new mongoose.Types.ObjectId(invitesData.boardId),
                inviterId:new mongoose.Types.ObjectId(userId),
                senderId:new mongoose.Types.ObjectId(invitesData.senderId),
            })

            await this.userModel.findOneAndUpdate(
                {
                    _id:new mongoose.Types.ObjectId(userId)
                },
                {
                    $push:{
                        invitedBoards:new mongoose.Types.ObjectId(invite.boardId)
                    }
                }
            )

            invites.push(invite)
        }

        return invites
    }

    async confirmInvite(confirmData:ConfirmInviteDto) : Promise<Board> {
        const invite : Invite = await this.inviteModel.findOneAndUpdate(
            {
                _id:new mongoose.Types.ObjectId(confirmData.id),
                inviterId:new mongoose.Types.ObjectId(confirmData.inviterId)
            },    
            {
                isAccepted:true
            }
        )

        if(!invite || !invite?.inviterId) throw new HttpException('Invite not found',HttpStatus.NOT_FOUND)

        const board : BoardDocument = await this.boardModel.findByIdAndUpdate(
            confirmData.boardId,
            {
                $push:{
                    users:new mongoose.Types.ObjectId(confirmData.inviterId)
                }
            }
        )

        return board
    }

    async rejectInvite(rejectData:RejectInviteDto) : Promise<Invite> {
        const invite : Invite = await this.inviteModel.findOneAndUpdate(
            {
                _id:new mongoose.Types.ObjectId(rejectData.id),
                inviterId:new mongoose.Types.ObjectId(rejectData.inviterId)
            },    
            {
                isAccepted:false,
                isCanceled:true
            }
        )
        
        await this.userModel.findByIdAndUpdate(
            rejectData.inviterId,
            {
                $pull:{
                    invitedBoards:new mongoose.Types.ObjectId(invite.boardId)
                }
            }
        )

        return invite
    }

    async leaveBoard(boardId:string,userId:string) : Promise<GlobalReturnData> {
        const invite : Invite | undefined = await this.inviteModel.findOne({
            inviterId:new mongoose.Types.ObjectId(userId),
            boardId:new mongoose.Types.ObjectId(boardId),
        })

        if(!invite || !invite.inviterId) throw new HttpException('Invite not found',HttpStatus.NOT_FOUND)

        const board : BoardDocument | undefined = await this.boardModel.findOneAndUpdate(
            {
                _id:new mongoose.Types.ObjectId(boardId),
            },
            {
                $pull:{
                    users:new mongoose.Types.ObjectId(invite.inviterId)
                }
            }
        )

        if(!board || !board?.owner) throw new HttpException('Board not found',HttpStatus.NOT_FOUND)
        
        const user : User | null = await this.userModel.findByIdAndUpdate(
            userId,
            {
                $pull:{
                    invitedBoards:new mongoose.Types.ObjectId(board._id)
                }
            }
        )

        if(!user) throw new HttpException('User not found',HttpStatus.NOT_FOUND)

        return {isSuccess:true,data:'Success! You leave board!'}
    }

    async excludeUser(senderId:string,boardId:string,inviterId:string) : Promise<GlobalReturnData> {
        const invite : Invite | null = await this.inviteModel.findOneAndDelete(
            {
                senderId:new mongoose.Types.ObjectId(senderId),
                boardId:new mongoose.Types.ObjectId(boardId),
                inviterId:new mongoose.Types.ObjectId(inviterId),
                isAccepted:true
            }
        )

        if(!invite) throw new HttpException('User not found',HttpStatus.NOT_FOUND)

        const board : BoardDocument | undefined = await this.boardModel.findOneAndUpdate(
            {
                _id:new mongoose.Types.ObjectId(boardId),
            },
            {
                $pull:{
                    users:new mongoose.Types.ObjectId(invite.inviterId)
                }
            }
        )
    
        if(!board || !board?.owner) throw new HttpException('Board not found',HttpStatus.NOT_FOUND)
        
        const user : User | null = await this.userModel.findByIdAndUpdate(
            senderId,
            {
                $pull:{
                    invitedBoards:new mongoose.Types.ObjectId(board._id)
                }
            }
        )

        return {isSuccess:true}
    }
}
