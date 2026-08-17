import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Request } from "express";
import { Connection, Types } from "mongoose";

@Injectable()
export class CurrentRatingAdminGuard implements CanActivate {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const claims = request.user;
    const userId = String(claims?._id || "").trim();

    if (!/^[a-f\d]{24}$/i.test(userId) || !this.connection.db) return false;

    try {
      const currentUser = await this.connection.db.collection("users").findOne(
        { _id: new Types.ObjectId(userId) },
        {
          projection: {
            _id: 1,
            role: 1,
            isActive: 1,
            is2FAEnabled: 1,
          },
        }
      );

      if (!currentUser || currentUser.isActive !== true) return false;
      if (!this.hasAdminRole(currentUser.role)) return false;

      if (
        currentUser.is2FAEnabled === true &&
        (claims?.is2FAEnabled !== true || claims?.is2FAVerified !== true)
      ) {
        return false;
      }

      return true;
    } catch {
      // Mutation authorization fails closed when current account state cannot be read.
      return false;
    }
  }

  private hasAdminRole(value: unknown): boolean {
    const roles = Array.isArray(value) ? value : [value];
    return roles.some((role) => String(role || "").trim() === "admin");
  }
}
