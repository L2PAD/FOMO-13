import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { Logger } from "@nestjs/common";

@Injectable()
export class TwitterStartGuard extends AuthGuard("twitter") {
  private readonly logger = new Logger(TwitterStartGuard.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private hashState(state: string): string {
    return createHash("sha256").update(state).digest("hex").slice(0, 12);
  }

  getAuthenticateOptions(context: ExecutionContext): Record<string, string> {
    const request = context.switchToHttp().getRequest();
    const rawState = request.query?.state;
    const state = Array.isArray(rawState) ? rawState[0] : rawState;
    const origin = `${request.protocol}://${request.get("host")}`;
    const callbackURL = new URL(
      this.configService.get<string>("TWITTER_CALLBACK") ||
        "/api/twitter/callback",
      origin
    );

    if (request.session) {
      request.session.twitterLinkState = String(state || "");
    }

    this.logger.log(
      `twitter_oauth_redirect callbackUrl=${callbackURL.toString()} stateHash=${this.hashState(
        String(state || "")
      )}`
    );

    return {
      callbackURL: callbackURL.toString(),
    };
  }
}
