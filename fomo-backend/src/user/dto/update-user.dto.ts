import mongoose from "mongoose"
import { NavItemDto } from "./menu.dto"
import { UserRiskStatus } from "../user.model"
import { RegionData } from "src/funds/funds.model"

export class UpdateUserDto {
    email: string

    username: string

    risk: UserRiskStatus

    password: string

    isActive: boolean

    avatar: File

    rating: string

    projects: Array<any>

    points: number

    staking: string

    wallet: string

    telegram: any
    telegramData?: any

    discord: any
    discordData?: any

    twitter: any
    twitterData?: any

    redFlags: number

    blocked?: boolean

    lastLogin?: Date

    multichainwallet: Array<any>

    kyc: string

    userMenu?: Array<NavItemDto>

    regionData?: RegionData
}
