import { Controller, Get, Param, Req, Res, UseFilters, UseGuards, Post } from '@nestjs/common';
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { TwitterService } from "./twitter.service";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { TwitterLinkStateGuard } from "./twitter-link-state.guard";
import { TwitterStartGuard } from "./twitter-start.guard";
import { TwitterOAuthExceptionFilter } from "./twitter-oauth-exception.filter";

@Controller("twitter")
export class TwitterController {
  constructor(
    private configService: ConfigService,
    private twitterService: TwitterService,
  ) { }

  @Post("link/start")
  @Roles("any")
  @UseGuards(JwtAuthGuard)
  async startTwitterLink(@Req() req) {
    const state = await this.twitterService.createLinkState(String(req.user._id));

    return {
      redirectUrl: this.buildBackendUrl(req, `/twitter?state=${encodeURIComponent(state)}`),
    };
  }

  @Get()
  @UseGuards(TwitterLinkStateGuard, TwitterStartGuard)
  @UseFilters(TwitterOAuthExceptionFilter)
  async twitterAuth() { }

  @Get("callback")
  @UseGuards(AuthGuard("twitter"))
  @UseFilters(TwitterOAuthExceptionFilter)
  async twitterAuthRedirect(@Req() req, @Res() res) {
    try {
      const state =
        this.getSingleQueryParam(req.query?.state) ||
        this.getSingleQueryParam(req.session?.twitterLinkState);

      this.clearTwitterLinkState(req);

      await this.twitterService.linkTwitterProfile(state, req.user);

      return res.redirect(this.buildFrontendTwitterUrl("success"));
    } catch (error) {
      return res.redirect(
        this.buildFrontendTwitterUrl("error", this.getTwitterErrorReason(error))
      );
    }
  }

  @Get("livenews/:page")
  getLiveNews(@Param("page") page: string) {
    return this.twitterService.getLiveNews(page);
  }

  private buildBackendUrl(req: any, path: string): string {
    const origin = `${req.protocol}://${req.get("host")}`;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    return `${origin}/api${normalizedPath}`;
  }

  private buildFrontendTwitterUrl(
    status: "success" | "error",
    reason?: string
  ): string {
    const frontUrl = String(this.configService.get("FRONT_URL") || "").replace(/\/+$/, "");
    const url = new URL(`${frontUrl}/auth/twitter`);

    url.searchParams.set("status", status);

    if (reason) {
      url.searchParams.set("reason", reason);
    }

    return url.toString();
  }

  private getSingleQueryParam(value: any): string {
    return String(Array.isArray(value) ? value[0] : value || "");
  }

  private clearTwitterLinkState(req: any): void {
    if (req.session?.twitterLinkState) {
      delete req.session.twitterLinkState;
    }
  }

  private getTwitterErrorReason(error: any): string {
    const status = typeof error?.getStatus === "function" ? error.getStatus() : error?.status;
    const message = String(error?.message || "");

    if (status === 401) return "invalid_state";
    if (status === 409) return "username_taken";
    if (/username/i.test(message)) return "missing_username";

    return "callback_failed";
  }
}
