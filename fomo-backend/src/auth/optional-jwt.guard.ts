import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

/**
 * Populates request.user when a valid access token is present, but NEVER rejects
 * the request. Used for public endpoints that personalise output for logged-in
 * users (e.g. followers-only Buzz posts).
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const request: Request = context.switchToHttp().getRequest();
      const accessToken = request.headers.authorization?.split(" ")[1];
      if (accessToken) {
        this.jwtService.verify(accessToken, {
          secret: this.configService.get("JWT_SECRET_ACCESS"),
        });
        request.user = this.jwtService.decode(accessToken);
      }
    } catch {
      // ignore — anonymous access is allowed
    }
    return true;
  }
}
