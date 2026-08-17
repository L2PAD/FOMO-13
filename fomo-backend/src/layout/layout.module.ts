import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LayoutService } from './layout.service';
import { LayoutController } from './layout.controller';
import { Layout,LayoutSchema } from './models/layout.model';
import { SocialMedia ,SocialMediaSchema} from './models/socialmedia.model';
import { CoinmarketcapModule } from 'src/coinmarketcap/coinmarketcap.module';
import { FilesModule } from 'src/files/files.module';
import { News, NewsSchema } from 'src/news/models/news.model';
import { NewsModule } from 'src/news/news.module';


@Module({
  imports:[
    JwtModule.register({}),
    ConfigModule.forRoot(),
    CoinmarketcapModule,
    NewsModule,
    MongooseModule.forFeature([
        {name:Layout.name,schema:LayoutSchema},
        {name:SocialMedia.name,schema:SocialMediaSchema},
        {name:News.name,schema:NewsSchema},
    ]),
    FilesModule,
  ],
  providers: [LayoutService],
  controllers: [LayoutController]
})
export class LayoutModule {}
