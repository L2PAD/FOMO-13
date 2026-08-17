import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "src/auth/auth.service";

@Injectable()
export class DiscordService {
  private API: string;
  private FRONT: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    this.API = this.configService.get("API_URL");
    this.FRONT = this.configService.get("FRONT_URL");
  }

  async discordAuth(code: string): Promise<string> {
    try {
      const redirectUri: string = `${this.API}/discord`;
      const clientId: string = process.env.DISCORD_ID;
      const clientSecret: string = process.env.DISCORD_SECRET;

      const requestPayload = {
        redirect_uri: redirectUri,
        client_id: clientId,
        grant_type: "authorization_code",
        client_secret: clientSecret,
        code,
      };

      const resPost = await this.httpService
        .post("https://discordapp.com/api/oauth2/token", requestPayload, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "DiscordBot",
          },
        })
        .toPromise();
      const data = resPost.data;
      const resGet = await this.httpService
        .get("https://discordapp.com/api/users/@me", {
          headers: { Authorization: `${data.token_type} ${data.access_token}` },
        })
        .toPromise();
      const user = resGet.data;

      const isUnique: boolean = await this.authService.isSocialUsernameUnique(
        "discord",
        user.username
      );

      const redirectLink: string = isUnique
        ? `${this.FRONT}/discord/?id=${user.id}&username=${user.username}&avatar=${user.avatar}&status=success`
        : `${this.FRONT}/discord/?id=${user.id}&username=${user.username}&avatar=${user.avatar}&status=error&errorText=User with this discord account already exists`;

      return redirectLink;
    } catch (err) {
      return "";
    }
  }
}
