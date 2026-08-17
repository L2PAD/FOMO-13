
export class UserDto{
    email:string

    password:string

    isActive:boolean

    avatar:string 

    rating:string

    projects:Array<any>

    points:number

    staking:string

    wallet:string

    telegram:string

    redFlags:number

    blocked?:boolean
    
    lastLogin?:Date

    username:string
}