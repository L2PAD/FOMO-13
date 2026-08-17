import { Module } from '@nestjs/common';
import { RefController } from './ref.controller';
import { RefService } from './ref.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { RefSchema, Ref } from './ref.model';
import { UserSchema, User } from 'src/user/user.model';
import { Activity, ActivitySchema } from 'src/activity/models/activity.model';
import { ActivityService } from 'src/activity/activity.service';
import { XpModule } from 'src/xp/xp.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ref.name, schema: RefSchema },
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
    JwtModule.register({}),
    XpModule,
  ],
  controllers: [RefController],
  providers: [RefService, ConfigService, ActivityService],
  exports: [RefService],
})
export class RefModule { }
