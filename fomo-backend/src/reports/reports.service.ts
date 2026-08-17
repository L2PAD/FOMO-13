import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Report, ReportDocument } from "./models/report.model";
import { SearchReportDto } from "./dto/report.dto";
import { User, UserDocument } from "src/user/user.model";

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) {}

  async createReport(wallet: string, dto: any): Promise<Report> {
    try {
      const user : UserDocument | null = await this.userModel.findOne({wallet})

      if(!user) throw new HttpException('User not found',HttpStatus.NOT_FOUND)
      
      const newReport = new this.reportModel({
        creatorId: new mongoose.Types.ObjectId(user._id),
        userId: new mongoose.Types.ObjectId(dto.userId),
        type: dto.type ?? "impersonality",
        subType: dto.subType,
        body: dto.body || "",
        attachment: dto.attachment || "",
      });

      return await newReport.save();
    } catch (e) {
      throw new HttpException(
        "Failed to create report",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getAllReports(query: SearchReportDto) {
    const { userId, type, subType } = query;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
    const page = Number(query.page) > 0 ? Number(query.page) : 1;

    const filter: any = {};

    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);
    if (type) filter.type = type;
    if (subType) filter.subType = subType;

    const skip = (page - 1) * limit;

    const aggregationPipeline: any[] = [
      { $match: filter },

      { $sort: { createdAt: -1 } },

      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: "users",
          localField: "creatorId",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ];

    const total = await this.reportModel.countDocuments(filter);

    const data = await this.reportModel.aggregate(aggregationPipeline);

    return {
      total,
      page,
      limit,
      data,
    };
  }
}
