import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { DepositsController } from './deposits.controller';
import { DepositsService } from './deposits.service';
import { Deposit, DepositSchema } from './model/deposit.model';
import { UserModule } from 'src/user/user.module';
import { User, UserSchema } from 'src/user/user.model';

@Module({
  imports: [
    HttpModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    forwardRef(() => UserModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Deposit.name, schema: DepositSchema },
    ]),
  ],
  controllers: [DepositsController],
  providers: [DepositsService],
  exports: [DepositsService],
})
export class DepositsModule { }