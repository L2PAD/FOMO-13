import { IProject, Investor } from '../hooks/useCreateProject'
import { STATUS_LIST } from '../../static_content/dropdowns_data'

export type UserRisk = 'Low' | 'Medium' | 'High'

export interface IUser {
  _id: string
  email: string
  name?: string
  password: string
  isActive: boolean
  role: Array<string>
  avatar?: string
  photo?: string
  rating?: string
  projects?: Array<any>
  points?: number
  staking?: string
  wallet: string
  telegram?: string
  redFlags?: number
  lastLogin: Date
  onlineDate?: Date | string
  selected?: boolean
  blocked?: boolean
  username?: string
  actions?: Array<any>
  createDate?: Date
  twitterData?: any
  telegramData?: any
  discordData?: any
  banned?: boolean
  fomoId?: number
  projectLimit?: number
  newsLimit?: number
  tasks?: number
  rejectedEntities?: number
  reviewLikes?: Array<any>
  reviewDislikes?: Array<any>
  risk?: UserRisk
  verificationStatus?: boolean
}

export interface INft {
  _id: string
  name: string
  status: string
  niche: string
  logo?: File
  totalRaised: string
  investors?: Array<any>
  rating: string
  fullness: string
  banner: string
  lastFunding: Date
  floorPrice?: string
  items?: Array<any>
  owners?: Array<any>
  redFlags?: string
  redStatus: boolean
  actionDate?: Date
}

export interface INews {
  _id: string
  image: string
  text: string
  title: string
  type: string
  date: Date
  recommendations?: Array<string>
  recommendationNewsItems?: Array<INews>
}

export interface Initiator {
  _id: string
  email: string
  avatar?: string
  username?: string
}

export interface IAction {
  _id: string
  action: string
  actionInitiator: string
  actionType?: string
  initiator: Initiator
  logo?: string
  image?: string
  name?: string
  type?: string
  status?: string
  rating?: string
  title?: string
  fullness?: string
  niche?: string
  selected?: boolean
  userData?: any
  categoryData?: any
  date: Date
  value?: { name: string; img: string }
  category: any
}

export interface IEvent {
  _id?: string
  name: string
  date: Date
  stars: number
  time: string
  project?: IProject | INft
  projectId?: string
  projectsData?: Array<IProject>
}

export interface ISocialMediaItem {
  href: string
  name: string
  icon?: any
}

export interface ITokenMetrics {
  ticket?: string
  tokenType?: string
  tokenPrice?: string
  preSale?: string
  KYC?: string
  whitelist?: string
  personalCap?: string
  accepts?: string
}

export interface IAsset {
  asset?: string
  tokenSupply?: string
  publicVesting?: string
  seedVesting?: string
  privateVesting?: string
  strategicVesting?: string
  stage?: STATUS_LIST
  upcomingEvent?: string
  lastEvent?: string
}

export interface IProjectNews {
  date: Date
  time: string
  title: string
  text: string
}

export interface IFlag {
  text: string
  link: string
  type: boolean
}

export interface IComment {
  _id?: string
  authorId?: string
  author: Array<IUser>
  date: Date
  text: string
}

export interface ITwitterAcc {
  _id: string
  name?: string
  username: string
  avatar?: string
  followersCount: number
  followingCount: number
  tweetCount: number
  last100Tweets?: Array<any>
  description?: string
}

export interface ISocialItem {
  name: string
  url: string
  icon: any
}

export interface ICreateMember {
  name: string
  lastname: string
  avatar?: File
  profession: string
}

export interface IMember {
  _id: string
  name: string
  lastname: string
  avatar: string
  profession: string
}

export interface ICreatePartner {
  url: string
  img?: File
}

export interface IPartner {
  _id: string
  url: string
  img: string
}

export interface ISocial {
  email: string
  twitter: string
  telegramRu: string
  telegramEn: string
  youtube: string
  discord: string
  instagram: string
  tikTok: string
  linktree: string
}

export interface IFooterApps {
  telegramMiniApp: string
  appStore: string
  googlePlay: string
  fomoIntel: string
  fomoAi: string
  whitepaper: string
  lightpaper: string
}

export interface ILegal {
  policy: string
  terms: string
  disclaimer: string
  careers: string
}

export interface IPerson {
  _id?: string
  name: string
  status: string
  niche: string
  logo?: string
  totalRaised: string
  investors?: Array<any>
  rating: string
  fullness: string
  banner: string
  lastFunding: Date
  maxParticipants?: string
  activityType?: string
  reward?: string
  type?: string
  radFlags?: string
  redStatus?: boolean
  price?: number
  socialmedia?: Array<ISocialMediaItem>
  bio?: string
  smartContracts?: Array<string>
  topFollowers?: Array<object>
  allocation?: string
  totalAllocation?: Array<{ name: string; value: number }>
  lowPrice?: number
  highPrice?: number
  priceRange?: number
  marketCap?: number
  dominance?: number
  volume?: number
  volumeGrowth?: number
  circulatingSupply?: number
  totalSupply?: number
  totalForSale?: number
  FullyDilVal?: string
  exchange?: Array<object>
  fundraising?: Array<object>
  news?: Array<INews>
  tokenMetrics?: ITokenMetrics
  assets?: Array<IAsset>
  team?: Array<Investor>
  advisor?: Array<Investor>
  partners?: Array<Investor>
  greenFlagsList?: Array<IFlag>
  yellowFlagsList?: Array<IFlag>
  redFlagsList?: Array<IFlag>
  comments?: Array<IComment>
  socialMedia?: Array<ISocialItem>

  colleagues?: Array<any>
  participated?: Array<any>
}

export interface IMessageTelegram {
  title: string
  message: string
  file?: any
}

export interface IBannerItem {
  _id?: string
  title: string
  description: string
  link: string
  timeStart: string
  date: Date
  img: File | string
  page?: string
  isTimerVisible?: boolean
}

export type TaskTypes = 'default' | 'special'
export type TaskStatus = 'completed' | 'in progress' | 'not started'

export interface ITask {
  _id?: string
  name: string
  date: Date
  link: string
  description: string
  time: string
  projectId?: string
  v2ActivityId?: string
  activityEntity?: 'fomo_v2'
  accessTier?: 'public' | 'prime'
  scope?: 'global'
  origin?: 'admin'
  awardedUsers?: Array<any>
  usersRequests?: Array<any>
  type: TaskTypes
  points: number
  project?: any
  requests?: Array<IUser>
  awarded?: Array<IUser>
  smallDescription?: string
  status?: TaskStatus
  validationKey?: string
  goal?: number
}

export interface ICollectionTypes {
  'FOMO Key': 'FOMO Key'
  'Early rounds': 'Early rounds'
  'Public rounds': 'Public rounds'
  'NFT Launch': 'NFT Launch'
}

export interface ICollection {
  _id?: string
  name: string
  type: keyof ICollectionTypes
  smart: string
  royalty: number
  project:
  | IProject
  | {
    _id?: string
    name: string
    logo: string
    banner: string
  }
  | null
  nftQuantity: number
  nfts: Array<any>
  creatorFee: number
  revenue: number
  mintPrice: number
  lastFunding: Date
  tokenStandart: string
  isPinned: boolean
  metadataLink?: string
  creator?: string
}

export interface IRoundItem {
  price: number
  raised: number
  preValuation: number
  date: Date
}

export type DealType = 'buy' | 'sell'

export type DealTicker = 'usd' | 'ETH'

export type DealStatus = 'waiting' | 'started' | 'ended' | 'blocked' | 'forced-termination'

export type DealServiceTypes =
  | 'Services'
  | 'NFT'
  | 'Project account'
  | 'Projects'
  | 'KYC'
  | 'Social network'
  | 'Other'

export interface IDeal {
  _id: string
  type: DealType
  name: string
  amount: number
  price: number
  ticker: DealTicker
  date: Date
  description: string
  dealId: number
  creator: IUser
  movingTokens: boolean
  buyer?: IUser
  status: DealStatus
  offersList?: Array<IDeal>
  isReservedFunds?: boolean
  lastStatusUpdate: Date
  createDate: Date
  serviceType: DealServiceTypes
  isCompleteByAdmin?: boolean
  likesCount?: number
  dislikesCount?: number
  isRealAsset?: boolean
}

export type AppealStatus = 'open' | 'in_review' | 'resolved'

export interface IAppeal {
  _id: string
  appealId?: string
  dealId: string
  role: 'buyer' | 'seller' | 'creator'
  reason?: string
  description?: string
  email?: string
  attachments?: string[]
  status: AppealStatus
  supportChatId?: string
  resolution?: string
  txHash?: string
  resolvedAt?: string
  createdAt?: string
  updatedAt?: string
  creator?: IUser
  assignedTo?: IUser
  deal?: IDeal & {
    section?: string
    isAppeal?: boolean
    isReservedFunds?: boolean
    isMakePayment?: boolean
    seller?: IUser
  }
}

export type ReportTypes = 'impersonality' | 'inappropriateBehavior' | 'underageAccount'
export type ReportSubTypes = 'me' | 'publicFigure' | 'someoneIknow' | string

export interface IAttachmentReport {
  _id: string;
  type: ReportTypes;
  subType: ReportSubTypes;
  body: string;
  attachment: string;
  creatorId: string;
  creator: IUser;
  userId: string;
  user: IUser;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export enum WithdrawStatuses {
  'PENDING',
  'COMPLETED',
  'REJECTED',
  'CANCELED',
  'DELETED',
  'APPROVED',
}

export interface IWithdraw {
  _id: string;
  userId: any;
  status: WithdrawStatuses;
  type: string;
  transactionHash: string;
  network: string;
  userWallet: string;
  amount: number;
  fee: number;
  totalSend: number;
  confirmationDate: Date;
  moderatorId?: string;
  reason?: string;
  currency: 'ETH' | 'USDC';
  expireDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  fomoId?: string
  selected?: boolean
  discordData: any
  twitterData: any
  userName: string
  userEmail: string
}

export interface IDeposit {
  _id: string;
  userId: string;
  currency: 'ETH' | 'USDC' | string;
  amount: number;
  netAmount: number;
  status: 'pending' | 'confirmed' | 'failed';
  network: string;
  walletAddress: string;
  transactionHash: string;
  gasFee: number;
  serviceFee: number;
  confirmations: number;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  _id?: string;
  date?: Date;
  from: string;
  to: string;
  message: string;
  title: string;
  sender?: IUser;
  isNew?: boolean;
  attachments?: Array<{
    url: string;
    name?: string;
    type?: string;
    size?: number;
  }>;
  replyTo?: string;
  replyToMessage?: {
    _id?: string;
    message?: string;
    sender?: IUser;
  };
  reports?: string[];
}

export interface IChat {
  created: string;
  messages: Array<IMessage>;
  participantsData: Array<IUser>;
  user?: IUser;
  lastMessage?: IMessage;
  _id: string;
  isPinned?: boolean;
}
