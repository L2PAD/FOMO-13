import {useState,useCallback,useEffect} from 'react';
import avatarImage from '../../assets/img/avatar.png';
import calculatePageFullness from '../utils/calculatePageFullness';
import calculateRating from '../utils/calculateRating';
import { IAsset, IFlag, INews, ISocialMediaItem, ITokenMetrics ,IComment, IRoundItem} from '../types/global_types';
import { FAQItem } from '../layouts/settings_layout/FAQ_layout';

export interface Investor{
    _id:string,
    img:string | File,
    name:string,
    selected:boolean
    rating?:string 
    description?:string
    logo?:string
    banner?:string
}

export interface IProject {
    _id?:string,
    name:string,
    status:string,
    niche:string,
    logo?:File,
    totalRaised:string,
    investors?:Array<any>,
    rating:string,
    fullness:string,
    banner:string,
    lastFunding:Date
    maxParticipants?:string
    activityType?:string
    reward?:string
    type?:string
    radFlags?:string
    redStatus?:boolean
    price?:number
    socialmedia?:Array<ISocialMediaItem>
    bio?:string
    smartContracts?:Array<string>
    topFollowers?:Array<object>
    allocation?:string
    totalAllocation?:Array<{name:string,value:number}>
    lowPrice?:number
    highPrice?:number
    priceRange?:number
    marketCap?:number
    dominance?:number
    volume?:number
    volumeGrowth?:number
    circulatingSupply?:number
    totalSupply?:number
    totalForSale?:number
    FullyDilVal?:string
    exchange?:Array<object>
    fundraising?:Array<IRoundItem>
    news?:Array<INews>
    tokenMetrics?:ITokenMetrics
    assets?:Array<IAsset>
    team?:Array<Investor>
    advisors?:Array<Investor>
    partners?:Array<Investor>
    greenFlagsList?:Array<IFlag>
    yellowFlagsList?:Array<IFlag>
    redFlagsList?:Array<IFlag>
    comments?:Array<IComment>
    projectType?:string
    twitterAcc?:string
    isDuplicate?:boolean
    isSponsored?:boolean
    isSandbox?:boolean
    isEralash?:boolean
    redFlags?:any
    isIdea?:boolean
    comparison?:Array<IProject>

      //SMART PROPS 
    fundingGoal?:number
    stakingDateStart?:Date
    stakingDateEnd?:Date
    stakingTimeStart?:string
    stakingTimeEnd?:string

    purchaseDateStart?:Date
    purchaseDateEnd?:Date
    purchaseTimeStart?:string
    purchaseTimeEnd?:string

    distributionStart?:Date
    distributionTimeStart?:string

    greenDate?:Date
    greenTimeStart?:string

    yellowDate?:Date
    yellowTimeStart?:string

    greenZone?:number
    yellowZone?:number
    nftStakeNeed?:number
    comission?:number
    mediaComission?:number
    media?:Array<string>
    poolId?:number
    poolActive?:boolean
    isMainProject?:boolean
    isClaimStart?:boolean
    isRefunded?:boolean
    hardCap?:string
    inititialMarketCap?:string
    valuation?:string

    descriptionText?:string
    overviewText?:string
    tokenUtilityText?:string
    revenueText?:string
    stakingText?:string
    purchaseText?:string
    distributionText?:string

    totalIssued?:string
    redemptionAmount?:string

    minInvest?:number
    maxInvest?:number
    totalMaxInvest?:number
    blockchain?:string
    platformRaise?:string
    recommendations?:Array<any>
    faq?:Array<FAQItem>
    descriptionImage?:File
    isETH?:boolean

    projects?:Array<IProject>
}

const gemslabInitial : IProject = {
    name:'',status:'Active',niche:'',totalRaised:'',
    rating:'',fullness:'',banner:'',lastFunding:new Date(),
    investors:[],purchaseDateEnd:new Date(),purchaseDateStart:new Date(),
    stakingDateEnd:new Date(),stakingDateStart:new Date(),
    distributionStart:new Date(),greenDate:new Date(),
    yellowDate:new Date()
}

const defaultInitial : IProject = {
    name:'',status:'Active',niche:'',totalRaised:'',
    rating:'',fullness:'',banner:'',lastFunding:new Date(),
    investors:[]
}

const useCreateProject = (type?:string) => {
    const projectDataInitial : IProject = type === 'gemslab' ? gemslabInitial : defaultInitial
    const [dataHook,setDataHook] = useState(false)
    const [data,setData] = useState<IProject>(projectDataInitial)
    
    const inputsHandler = useCallback((value:any,inputName:string,index?:number) => {
        setData({...data,[inputName]:value})
        setDataHook(!dataHook)
    },[data,dataHook])

    useEffect(() => {
        setData((prev:IProject) => {
            return {...prev,fullness:calculatePageFullness(prev),rating:String(calculateRating(prev))}
        })
    },[dataHook])

    return {data,inputsHandler}
}

export default useCreateProject
