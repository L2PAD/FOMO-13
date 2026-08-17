import { UserDto } from "src/user/dto/user.dto"

export class WatchlistDto {
    _id?:any
    projects?: Array<any> 
    nfts?: Array<any> 
    persons?: Array<any> 
    funds?: Array<any> 
    user?:UserDto
}