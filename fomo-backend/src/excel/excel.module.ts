import { Module } from '@nestjs/common';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { User,UserSchema } from 'src/user/user.model';

@Module({
  imports:[
    NestjsFormDataModule,
    MongooseModule.forFeature([{name: User.name,schema: UserSchema}]),
    ConfigModule.forRoot(),
    JwtModule.register({}),
  ],
  controllers: [ExcelController],
  providers: [ExcelService]
})
export class ExcelModule {}
