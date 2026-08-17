import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';
import { ConfigService } from '@nestjs/config'; 
import { Request } from 'express';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy,'twitter') {
  constructor(private readonly configService: ConfigService) {
    super({
      consumerKey: configService.get('TWITTER_CONSUMER_KEY'),
      consumerSecret: configService.get('TWITTER_CONSUMER_SECRET'),
      callbackURL: configService.get('TWITTER_CALLBACK'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, token: string, tokenSecret: string, profile: any): Promise<any> {
    return profile;
  }
}