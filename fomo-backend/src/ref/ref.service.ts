import mongoose, { Model } from "mongoose";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserDocument } from "src/user/user.model";
import { Ref, RefDocument } from "./ref.model";
import { ActivityService } from "src/activity/activity.service";
import { XpLedgerService } from "src/xp/xp-ledger.service";

@Injectable()
export class RefService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(Ref.name) private RefModel: Model<RefDocument>,
    private readonly activityService : ActivityService,
    private readonly xpLedger: XpLedgerService
  ) {}

  private async generateRefCode(): Promise<string> {
    const characters: string =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code: string = "";

    for (let i = 0; i < 5; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const isExist: Ref | null = await this.RefModel.findOne({ code });

    if (isExist) return await this.generateRefCode();

    return code;
  }

  async getUserRefCode(userWallet: string): Promise<string> {
    const userRefData: Ref | null = await this.RefModel.findOne({
      userAddress: userWallet,
    });

    if (userRefData) {
      return userRefData.code;
    }

    const newCode: string = await this.generateRefCode();

    await this.RefModel.create({ userAddress: userWallet, code: newCode });

    return newCode;
  }

  async checkUserRefCode(code: string): Promise<boolean> {
    const refData: Ref | null = await this.RefModel.findOne({ code });

    return !!refData;
  }

  async activateUserRefCode(
    code: string,
    userWallet: string
  ): Promise<boolean> {
    const activateAccPoints: number = 100;
    const secondLinePoints: number = 16;
    const thirdLinePoints: number = 8;

    const isValid: Ref | null = await this.RefModel.findOne({
      code,
    });
    if (!isValid) {
      throw new HttpException(
        "User exist or code incorrect",
        HttpStatus.BAD_REQUEST
      );
    }
    const user: UserDocument = await this.UserModel.findOneAndUpdate(
      { wallet: userWallet },
      {
        inviter: isValid.userAddress,
        isCodeActivated: true,
        $inc: { points: activateAccPoints },
      }
    );
    const inviter = await this.UserModel.findOneAndUpdate(
      { wallet: isValid.userAddress },
      {
        $inc: {
          points: secondLinePoints,
          partners: 1,
        },
        $addToSet: { refLvlOne: new mongoose.Types.ObjectId(user._id) },
      }
    );

    // L1 referral XP via ledger (once per referred user; code activation == qualification).
    if (inviter?._id) {
      await this.xpLedger.award({
        userId: inviter._id.toString(),
        eventType: "referral_l1",
        source: "system",
        sourceType: "referred_user",
        sourceId: user._id.toString(),
        verified: true,
        reason: "Квалифицированный реферал 1-го уровня",
      });
    }

    await this.activityService.createActivity({
        userId: new mongoose.Types.ObjectId(inviter._id),
        createdAt: new Date(),
        title: '',
        type: 'other',
        link:'',
        text:`<button class="inline-button">${user.username || user.twitterData.username || user.discordData.username}</button> joined FOMO via your referral link.`
    })

    const secondInviter = await this.UserModel.findOneAndUpdate(
      { wallet: inviter?.inviter },
      {
        $inc: { points: thirdLinePoints },
        $addToSet: { refLvlTwo: new mongoose.Types.ObjectId(user._id) },
      }
    );

    // L2 referral XP via ledger (once per referred user).
    if (secondInviter?._id) {
      await this.xpLedger.award({
        userId: secondInviter._id.toString(),
        eventType: "referral_l2",
        source: "system",
        sourceType: "referred_user",
        sourceId: user._id.toString(),
        verified: true,
        reason: "Квалифицированный реферал 2-го уровня",
      });
    }

    await this.RefModel.findOneAndUpdate(
      { code },
      { $push: { partnersList: userWallet } }
    );

    return !!isValid;
  }

  async getRefList(
    userId: string,
    listType: "refLvlOne" | "refLvlTwo"
  ): Promise<Array<any>> {
    const user: UserDocument | null = await this.UserModel.findById(
      userId
    ).lean();

    if (
      !user ||
      !Array.isArray(user[listType]) ||
      user[listType].length === 0
    ) {
      return [];
    }
    
    return this.UserModel.find(
      { _id: { $in: user[listType] } },
      {
        _id: 1,
        username: 1,
        name: 1,
        wallet: 1,
        fomoId: 1,
        email: 1,
        discordData: 1,
        twitterData: 1,
        telegramData: 1,
        points: 1,
        activityXP: 1,
        refLvlOne: 1,
        refLvlTwo: 1,
        createDate: 1,
        banned: 1,
        photo: 1,
      }
    ).lean();
  }
}
