import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { SupportDto } from "./dto/support.dto";
import { ConfigService } from "@nestjs/config";
import { FilesService } from "../files/files.service";
import { User, UserDocument } from "src/user/user.model";
import { Project, ProjectDocument } from "src/projects/project.model";
import { Support, SupportDocument } from "./support.model";
import { UserActionLogsService } from "src/user-action-logs/user-action-logs.service";

@Injectable()
export class SupportService {
  constructor(
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Support.name) private supportModel: Model<SupportDocument>,
    private readonly userActionLogsService: UserActionLogsService
  ) { }

  async getMessages(): Promise<Array<SupportDto>> {
    const messages: Array<SupportDto> = await this.supportModel.aggregate([
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $addFields: {
          userData: {
            $let: {
              vars: {
                userData: { $arrayElemAt: ["$userData", 0] },
              },
              in: {
                $mergeObjects: ["$$userData", { password: "$$REMOVE" }],
              },
            },
          },
        },
      },
    ]);

    return messages.reverse();
  }

  async sendMessage(data: SupportDto, creatorWallet: string): Promise<any> {
    const user: UserDocument = await this.userModel.findOne({
      wallet: creatorWallet,
    });

    if (!user)
      throw new HttpException("Creator not founded", HttpStatus.NOT_FOUND);

    const file: string | undefined =
      data.file && await this.filesService.writeFile(data.file);

    const messageData: SupportDto = {
      ...data,
      file,
      user: new mongoose.Types.ObjectId(user._id),
      date: new Date(data.date),
    };

    const newSupportMessage: SupportDocument = await this.supportModel.create(
      messageData
    );

    await this.userActionLogsService.log({
      userId: user._id,
      actorId: user._id,
      actorType: "user",
      category: "support",
      action: "support.ticket_created",
      title: "Support request created",
      entityType: "support",
      entityId: newSupportMessage._id,
      metadata: {
        theme: data.theme,
        category: data.category,
        project: data.project,
        hasFile: Boolean(file),
      },
    });

    return newSupportMessage;
  }
}
