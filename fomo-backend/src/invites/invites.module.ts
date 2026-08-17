import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { InvitesController } from './invites.controller';

import { InvitesService } from './invites.service';

import { Invite,InviteSchema } from './models/invite.model';
import { User, UserSchema } from 'src/user/user.model';
import { Board, BoardSchema } from 'src/board/models/board.model';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name: Invite.name,schema: InviteSchema},
      {name: User.name,schema: UserSchema},
      {name: Board.name,schema: BoardSchema},
    ]),
    ConfigModule.forRoot(),
    JwtModule.register({}),
  ],
  controllers: [InvitesController],
  providers: [InvitesService]
})
export class InvitesModule {}
