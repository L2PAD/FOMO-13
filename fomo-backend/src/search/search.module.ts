import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { SearchController } from './search.controller';

import { SearchService } from './search.service';
import { Project, ProjectSchema } from 'src/projects/project.model';
import { Funds, FundsSchema } from 'src/funds/funds.model';
import { Person, PersonSchema } from 'src/persons/person.model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { News, NewsSchema } from '../news/models/news.model';
import { Deal, DealSchema } from '../deals/model/deal.model';


@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: Person.name, schema: PersonSchema },
      { name: News.name, schema: NewsSchema },
      { name: Deal.name, schema: DealSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule { }
