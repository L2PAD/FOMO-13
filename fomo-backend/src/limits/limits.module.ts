import { Module } from '@nestjs/common';
import { LimitsService } from './limits.service';
import { LimitGuard } from './limit.guard';
import { User, UserSchema } from 'src/user/user.model';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ])
  ],
  providers: [LimitsService, LimitGuard],
  exports: [LimitsService, LimitGuard]
})
export class LimitsModule { }
