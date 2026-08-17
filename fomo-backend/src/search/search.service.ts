import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from 'src/projects/project.model';
import { Funds } from 'src/funds/funds.model';
import { Person } from 'src/persons/person.model';
import { SearchDto } from './dto/search.dto';
import { News } from 'src/news/models/news.model';
import { Deal } from 'src/deals/model/deal.model';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Funds.name) private fundModel: Model<Funds>,
    @InjectModel(Person.name) private personModel: Model<Person>,
    @InjectModel(News.name) private newsModel: Model<News>,
    @InjectModel(Deal.name) private dealModel: Model<Deal>,
  ) { }

  async search(searchDto: SearchDto) {
    const { query } = searchDto;

    const regex = new RegExp(query.trim(), 'i');
    const limit = 3;


    const [
      projects,
      projectsTotal,

      funds,
      fundsTotal,

      persons,
      personsTotal,

      news,
      newsTotal,

      deals,
      dealsTotal,
    ] = await Promise.all([
      // Projects — name
      this.projectModel
        .find({ name: regex })
        .limit(limit)
        .select('_id name logo category niche symbol price usdQuote'),
      this.projectModel.countDocuments({ name: regex }),

      // Funds — name
      this.fundModel
        .find({ name: regex })
        .limit(limit)
        .select('_id name logo'),
      this.fundModel.countDocuments({ name: regex }),

      // Persons — name
      this.personModel
        .find({ name: regex })
        .limit(limit)
        .select('_id name logo position'),
      this.personModel.countDocuments({ name: regex }),

      // News — title
      this.newsModel
        .find({ title: regex })
        .limit(limit)
        .select('_id title image createdAt'),
      this.newsModel.countDocuments({ title: regex }),

      // Deals — name
      this.dealModel
        .find({ name: regex })
        .limit(limit)
        .select('_id name status amount price ticker'),
      this.dealModel.countDocuments({ name: regex }),
    ]);

    return {
      projects: {
        items: projects,
        total: projectsTotal,
        limit,
      },
      funds: {
        items: funds,
        total: fundsTotal,
        limit,
      },
      persons: {
        items: persons,
        total: personsTotal,
        limit,
      },
      news: {
        items: news,
        total: newsTotal,
        limit,
      },
      deals: {
        items: deals,
        total: dealsTotal,
        limit,
      },
      meta: {
        query,
        totalAll:
          projectsTotal +
          fundsTotal +
          personsTotal +
          newsTotal +
          dealsTotal,
        tabs: [
          {
            name: 'All',
            key: 'all',
            total:
              projectsTotal +
              fundsTotal +
              personsTotal +
              newsTotal +
              dealsTotal,
          },
          {
            name: 'Assets',
            key: 'projects',
            total: projectsTotal,
          },
          {
            name: 'Funds',
            key: 'funds',
            total: fundsTotal,
          },
          {
            name: 'Persons',
            key: 'persons',
            total: personsTotal,
          },
          {
            name: 'News',
            key: 'news',
            total: newsTotal,
          },
          {
            name: 'Deals',
            key: 'deals',
            total: dealsTotal,
          },
        ],
      },
    };
  }
}
