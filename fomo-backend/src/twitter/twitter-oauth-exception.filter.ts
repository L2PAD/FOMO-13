import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";

@Catch()
export class TwitterOAuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TwitterOAuthExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(error: Error | UnauthorizedException, host: ArgumentsHost): void {
    this.logger.warn(`twitter_oauth_failed message=${error?.message || "unknown"}`);

    const response = host.switchToHttp().getResponse<Response>();
    const frontUrl = String(this.configService.get("FRONT_URL") || "").replace(
      /\/+$/,
      ""
    );
    const url = new URL(`${frontUrl}/auth/twitter`);

    url.searchParams.set("status", "error");
    url.searchParams.set("reason", "callback_failed");

    response.redirect(url.toString());
  }
}
