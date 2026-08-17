import { Module } from '@nestjs/common';

import { NestjsFormDataModule } from 'nestjs-form-data';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';
import { Banner, BannerSchema } from './models/banner.model';
import { FilesService } from 'src/files/files.service';

@Module({
  imports:[
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {name:Banner.name,schema:BannerSchema}
    ])
  ],
  controllers: [BannerController],
  providers: [BannerService,FilesService]
})
export class BannerModule {}
