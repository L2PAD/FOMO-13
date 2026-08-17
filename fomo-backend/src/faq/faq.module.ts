import { Module } from '@nestjs/common';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq,FaqSchema } from './faq.model';

@Module({
  imports:[
    MongooseModule.forFeature([{name: Faq.name,schema: FaqSchema}]),
    ConfigModule.forRoot(),
    JwtModule.register({}),
  ],
  controllers: [FaqController],
  providers: [FaqService]
})
export class FaqModule {}
