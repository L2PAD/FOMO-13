import { Board } from 'src/board/models/board.model';
import { User } from 'src/user/user.model';
import { InviteCategories } from '../models/invite.model';

export class CreateInviteDto {
    users:Array<string> 
    
    boardId:string 

    senderId:string
}

export class InviteDto {
    inviter:User
    sender:User
    board:Board
    category:InviteCategories
    isAccepted:boolean
    isCanceled:boolean
}