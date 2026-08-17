import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { UserSchema , User} from "../user/user.model";
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports:[
    NestjsFormDataModule,
    MongooseModule.forFeature([{name: User.name,schema: UserSchema}]),
    ConfigModule.forRoot(),
    JwtModule.register({}),
  ],
  exports:[EmailService],
  controllers: [EmailController],
  providers: [EmailService]
})
export class EmailModule {}
