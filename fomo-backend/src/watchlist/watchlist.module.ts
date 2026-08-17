import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { JwtService } from '@nestjs/jwt';

import { Watchlist,WatchlistSchema } from './models/watchlist.model';
import { User, UserSchema } from 'src/user/user.model';
import { Project,ProjectSchema } from 'src/projects/project.model';
import { Nft,NftSchema } from 'src/nft/nft.model';
import { Funds,FundsSchema } from 'src/funds/funds.model';
import { Person,PersonSchema } from 'src/persons/person.model';

@Module({
  imports:[
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {name:Watchlist.name,schema:WatchlistSchema},
      {name:User.name,schema:UserSchema},
      {name:Project.name,schema:ProjectSchema},
      {name:Nft.name,schema:NftSchema},
      {name:Funds.name,schema:FundsSchema},
      {name:Person.name,schema:PersonSchema},
    ]),
  ],
  controllers: [WatchlistController],
  providers: [WatchlistService,JwtService],
})
export class WatchlistModule {}
  