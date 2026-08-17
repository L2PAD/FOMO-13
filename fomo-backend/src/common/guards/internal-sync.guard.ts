import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { timingSafeEqual } from "crypto";

@Injectable()
export class InternalSyncGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const internalToken = this.readHeader(request.headers["x-internal-sync-token"]);

    if (internalToken) {
      return this.canActivateWithInternalToken(context, request, internalToken);
    }

    return this.canActivateWithJwt(context, request);
  }

  private canActivateWithInternalToken(
    context: ExecutionContext,
    request: Request,
    internalToken: string,
  ): boolean {
    const expectedToken =
      this.configService.get<string>("INTERNAL_SYNC_TOKEN") ||
      this.configService.get<string>("PROJECT_INTEL_INTERNAL_SYNC_TOKEN");

    if (!this.safeEqual(internalToken, expectedToken)) {
      return false;
    }

    request.user = {
      role: ["admin"],
      internalSync: true,
    };

    return this.checkUserRole(["admin"], this.getRequiredRoles(context));
  }

  private canActivateWithJwt(context: ExecutionContext, request: Request): boolean {
    try {
      const accessToken = this.readBearerToken(request.headers.authorization);
      if (!accessToken) return false;

      const accessVerify = this.jwtService.verify(accessToken, {
        secret: this.configService.get("JWT_SECRET_ACCESS"),
      });
      request.user = accessVerify;

      if (!request?.user?.is2FAVerified && request?.user?.is2FAEnabled) {
        return false;
      }

      return this.checkUserRole(accessVerify.role, this.getRequiredRoles(context));
    } catch {
      return false;
    }
  }

  private readBearerToken(value: string | undefined): string {
    const [scheme, token, ...rest] = String(value || "")
      .trim()
      .split(/\s+/);
    if (scheme?.toLowerCase() !== "bearer" || !token || rest.length) return "";
    return token;
  }

  private getRequiredRoles(context: ExecutionContext): string[] {
    return this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]) || [];
  }

  private checkUserRole(userRoles: string[] | string = [], requiredRoles: string[] = []): boolean {
    const normalizedRequiredRoles = requiredRoles
      .flatMap((role) => String(role || "").split(","))
      .map((role) => role.trim())
      .filter(Boolean);

    if (!normalizedRequiredRoles.length || normalizedRequiredRoles.includes("any")) {
      return true;
    }

    const normalizedUserRoles = new Set(
      (Array.isArray(userRoles) ? userRoles : [userRoles])
        .map((role) => String(role || "").trim())
        .filter(Boolean),
    );

    return normalizedRequiredRoles.some((role) => normalizedUserRoles.has(role));
  }

  private readHeader(value: string | string[] | undefined): string {
    const raw = Array.isArray(value) ? value[0] : value;
    return String(raw || "").trim();
  }

  private safeEqual(value: string, expected?: string): boolean {
    if (!value || !expected) return false;

    const valueBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    if (valueBuffer.length !== expectedBuffer.length) return false;

    return timingSafeEqual(valueBuffer, expectedBuffer);
  }
}
