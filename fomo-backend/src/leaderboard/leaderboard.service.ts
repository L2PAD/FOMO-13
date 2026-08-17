import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { LeaderboardDto } from './dto/leaderboard.dto';

import { User, UserDocument } from 'src/user/user.model';

@Injectable()
export class LeaderboardService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ){}

    async getLeaderboard() : Promise<Array<LeaderboardDto>>{
        const users : Array<LeaderboardDto> 
        =
        await this.userModel.aggregate([
            {
                $project: {
                  address: '$wallet',
                  partners: 1,
                  stakingNft: '$staking', 
                  creater: 1,
                  tasks: 1,
                  investmentsQuanity: { $size: { $ifNull: ['$funds', []] } },
                  points: 1,
                  totalScore: {
                    $add: ['$partners', '$creater', '$tasks', '$points']
                  }
                },
            },
            {
                $sort: {
                    points: -1
                  }
            }
        ])

        return users
    }
}
