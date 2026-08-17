import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { LimitTypes } from 'src/actions/actions.service';
import { User, UserDocument } from 'src/user/user.model';

@Injectable()
export class LimitsService implements OnModuleInit {
  private readonly logger = new Logger(LimitsService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // @Cron('*/10 * * * * *')
  @Cron('0 0 * * *')
  async handleCron() {
    await this.resetProjectLimits();
  }

  async resetProjectLimits(): Promise<void> {
    this.logger.log(`Resetting project limits at ${new Date().toISOString()}`);
    await this.userModel.aggregate([
      {
        $addFields: {
          projectLimit: {
            $switch: {
              branches: [
                { case: { $gte: ["$points", 100000] }, then: 100 },
                { case: { $gte: ["$points", 75000] }, then: 30 },
                { case: { $gte: ["$points", 50000] }, then: 10 },
              ],
              default: 5
            }
          },
          newsLimit: {
            $switch: {
              branches: [
                { case: { $gte: ["$points", 100000] }, then: 100 },
                { case: { $gte: ["$points", 75000] }, then: 30 },
                { case: { $gte: ["$points", 50000] }, then: 10 },
              ],
              default: 5
            }
          },
          personLimit: {
            $switch: {
              branches: [
                { case: { $gte: ["$points", 100000] }, then: 100 },
                { case: { $gte: ["$points", 75000] }, then: 30 },
                { case: { $gte: ["$points", 50000] }, then: 10 },
              ],
              default: 5
            }
          },
          fundLimit: {
            $switch: {
              branches: [
                { case: { $gte: ["$points", 100000] }, then: 100 },
                { case: { $gte: ["$points", 75000] }, then: 30 },
                { case: { $gte: ["$points", 50000] }, then: 10 },
              ],
              default: 5
            }
          },
          nftsLimit: {
            $switch: {
              branches: [
                { case: { $gte: ["$points", 100000] }, then: 100 },
                { case: { $gte: ["$points", 75000] }, then: 30 },
                { case: { $gte: ["$points", 50000] }, then: 10 },
              ],
              default: 5
            }
          },
          eventsLimit: {
            $switch: {
              branches: [
                { case: { $gte: ["$points", 100000] }, then: 100 },
                { case: { $gte: ["$points", 75000] }, then: 30 },
                { case: { $gte: ["$points", 50000] }, then: 10 },
              ],
              default: 5
            }
          },
          shareLimit: 10,
          lastReset: new Date()
        }
      },
      {
        $merge: { into: "users", whenMatched: "replace", whenNotMatched: "fail" }
      }
    ]).exec();
  }

  async checkUserLimit(id: string, limitType: LimitTypes): Promise<boolean> {
    const user: User = await this.userModel.findById(id)

    if (user.role.includes('admin')) return true

    const currentLimit: number = user[limitType]

    return currentLimit > 0
  }

  async onModuleInit(): Promise<void> {
    if (process.env.LIMITS_RESET_ON_STARTUP !== 'true') {
      this.logger.log('Startup limits reset is disabled');
      return;
    }

    await this.resetProjectLimits();
  }
}
