
export default class MainInfoDto {
    twitter_id:string 
    
    name:string;

    username: string;

    profile_image_url: string;
  
    followers_count: number;
  
    following_count: number;
  
    tweet_count: number;
  
    last100Tweets: Array<any>;

    description:string
}