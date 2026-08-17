import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';
import { FilesService } from 'src/files/files.service';
import { About,AboutSchema } from './models/about.model';
import { Member,MemberSchema } from './models/member.model';
import { Partner,PartnerSchema } from './models/partner.model';
import { TeamItem,TeamItemSchema } from './models/teamItem.model';

@Module({
  imports:[
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {name:About.name,schema:AboutSchema},
      {name:Member.name,schema:MemberSchema},
      {name:Partner.name,schema:PartnerSchema},
      {name:TeamItem.name,schema:TeamItemSchema},
    ])
  ],
  controllers: [AboutController],
  providers: [AboutService,FilesService]
})
export class AboutModule {}
