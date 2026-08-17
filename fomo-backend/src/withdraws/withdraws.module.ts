import { forwardRef, Module } from '@nestjs/common';
import { WithdrawsController } from './withdraws.controller';
import { WithdrawsService } from './withdraws.service';
import { HttpModule } from '@nestjs/axios';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/user.model';
import { Withdraw, WithdrawSchema } from './model/withdraw.model';

@Module({
  imports: [
    HttpModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    forwardRef(() => UserModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Withdraw.name, schema: WithdrawSchema },
    ]),
  ],
  controllers: [WithdrawsController],
  providers: [WithdrawsService]
})
export class WithdrawsModule { }
