export class TwitterDataDto {
  followersCount: number;
  friendsCount: number;
  statusesCount: number;
  isBlueVerified: boolean;
  createdAt?: Date | undefined;
  tweets: {
    likes: number;
    retweets: number;
    replies: number;
    timestamp: Date;
  }[];
  followers: {
    id: string;
    username: string;
    isBlueVerified: boolean;
    followersCount: number;
  }[];
  location?: string;
}
