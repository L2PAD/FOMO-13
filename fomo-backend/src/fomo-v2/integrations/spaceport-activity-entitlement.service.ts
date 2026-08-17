import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { SpaceportNftService } from "src/spaceport-nft/spaceport-nft.service";
import { User } from "src/user/user.model";
import {
  FomoV2ActivityEntitlementResolver,
} from "../domains/activities/types";

@Injectable()
export class FomoV2SpaceportActivityEntitlementService
  implements FomoV2ActivityEntitlementResolver
{
  constructor(
    private readonly spaceportNftService: SpaceportNftService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async resolve(user?: Record<string, any>): Promise<{
    entitled: boolean;
    available: boolean;
  }> {
    const wallet = await this.verifiedWalletFromUser(user);
    if (!wallet) {
      return { entitled: false, available: true };
    }
    const result = await this.spaceportNftService.getWalletNftCount(wallet);

    return {
      entitled: result.status === "ready" && Number(result.count || 0) > 0,
      available: result.status !== "unavailable",
    };
  }

  private async verifiedWalletFromUser(
    user?: Record<string, any>,
  ): Promise<string | undefined> {
    const userId = String(user?._id || "").trim();
    if (!Types.ObjectId.isValid(userId)) return undefined;

    const claimedWallet = String(
      user?.wallet || user?.walletAddress || user?.address || "",
    ).trim().toLowerCase();
    if (!claimedWallet) return undefined;

    const principal = await this.userModel
      .findOne(
        { _id: new Types.ObjectId(userId), banned: { $ne: true } },
        { wallet: 1 },
      )
      .lean()
      .exec();
    const persistedWallet = String(principal?.wallet || "").trim().toLowerCase();

    return persistedWallet && persistedWallet === claimedWallet
      ? persistedWallet
      : undefined;
  }
}
