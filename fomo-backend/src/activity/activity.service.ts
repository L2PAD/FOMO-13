import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Activity, ActivityDocument, ActivityTypes } from './models/activity.model';
import mongoose, { Model } from 'mongoose';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
  ) { }

  private parsePath(path: string): string {
    return path.length > 1
      ?
      path.split('/')
        .map((item: string) =>
          `${item.slice(0, 1)}`.toUpperCase() + `${item.slice(1, item.length)}`
        ).join(' ')
      :
      'Crypto Market'
  }

  private buildTitleByType(type: string, path: string, text?: string): string {
    switch (type) {
      case 'comments':
        return `You commented on <button
                data-path="${path}" class="inline-button"
                >${this.parsePath(path)}</button>: “${text?.length > 20 ? `${text.slice(0, 20)}...` : text}.”`
      case 'deals':
        return text
      case 'other':
        return text
      default:
        return ''
    }
  }

  async createActivity(data: CreateActivityDto): Promise<{ isSuccess: boolean, data: Activity }> {
    const activity: Activity = await this.activityModel.create({
      ...data,
      title: this.buildTitleByType(data.type, data.link, data.text)
    })

    return { isSuccess: true, data: activity }
  }

  async getActivities(
    userId: string,
    type: ActivityTypes | 'all' | string,
    query?: any
  ): Promise<{ activities: Activity[]; totalCount: number }> {
    const match: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (type !== 'all') match.type = type;

    const page = parseInt(query?.page) > 0 ? parseInt(query.page) : 1;
    const limit = parseInt(query?.limit) > 0 ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const result = await this.activityModel.aggregate([
      { $match: match },
      {
        $facet: {
          activities: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [
            { $count: 'count' },
          ],
        },
      },
      {
        $project: {
          activities: 1,
          totalCount: { $arrayElemAt: ['$totalCount.count', 0] },
        },
      },
    ]);

    return {
      activities: result[0]?.activities || [],
      totalCount: result[0]?.totalCount || 0,
    };
  }


}
