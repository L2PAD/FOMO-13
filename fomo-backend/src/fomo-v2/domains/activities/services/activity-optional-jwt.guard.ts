import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class FomoV2ActivityOptionalJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const authorization = String(request.headers.authorization || "");
    const [scheme, token] = authorization.split(/\s+/, 2);
    if (scheme?.toLowerCase() !== "bearer" || !token) return true;

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET_ACCESS"),
      });
      if (payload?.is2FAEnabled && !payload?.is2FAVerified) {
        request.user = undefined;
        return true;
      }
      request.user = payload;
    } catch (_error) {
      // Optional authentication must not turn a public read into a 401. An
      // invalid token remains anonymous and can never unlock Prime content.
      request.user = undefined;
    }
    return true;
  }
}
