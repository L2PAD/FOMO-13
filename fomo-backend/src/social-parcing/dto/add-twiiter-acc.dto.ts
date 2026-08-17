export type ParsingTypes = "account" | "keywords";

export type SentimentFilterTypes = 'all' | 'Negative' | 'Positive' | 'Neutral'

export class QueryParsingDto {
  searchValue?: string;
  type?: 'default' | 'sentiment'
  filter?: SentimentFilterTypes
  sortBy?: 'createdAt' | 'followersCount' | 'tweetCount' | 'updatedAt'
  order?: 'asc' | 'desc'
}

export class QueryKeywordsDto {
  searchValue?: string;
  offset: number;
  limit: number;
  isPrivate?: boolean
  isSentiment?: boolean
  excludedKeywords?: string
  includedKeywords?: string[]
  includedPublic?: boolean
  ids?:string[]
}

export class AddTwitterAccDto {
  username: string;
  keywords: string;
  type?: ParsingTypes;
  isSentiment?: boolean
}

export class AddTwitterKeywordsDto {
  userId: string;
  keywords: string;
  isSentiment?: boolean
  isPrivate?: boolean
}

export class AddTwitterAccByUserDto {
  userId: string;
  username?: string;
  keywords: string;
  type: ParsingTypes;
  isSentiment: boolean
  category: string
}

export class UpdateTwitterAccByUserDto {
  id: string
  userId: string;
  username: string;
  isPrivate?: boolean
  isSentiment?: boolean
}
