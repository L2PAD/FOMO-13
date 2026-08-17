import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TwitterService } from "./twitter.service";

@Injectable()
export class TwitterLinkStateGuard implements CanActivate {
  constructor(private readonly twitterService: TwitterService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawState = request.query?.state;
    const state = Array.isArray(rawState) ? rawState[0] : rawState;

    if (!state || !(await this.twitterService.isLinkStatePending(String(state)))) {
      throw new UnauthorizedException("Invalid Twitter OAuth state");
    }

    return true;
  }
}
