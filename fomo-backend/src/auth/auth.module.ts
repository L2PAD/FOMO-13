import { Module } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { UserSchema, User } from "../user/user.model";
import { AuthController } from './auth.controller';
import { EmailService } from "src/email/email.service";
import { TwoFactorService } from './two-factor/two-factor.service';
import { AuthChallenge, AuthChallengeSchema } from "./models/auth-challenge.model";
import { RefModule } from "src/ref/ref.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthChallenge.name, schema: AuthChallengeSchema },
    ]),
    RefModule,
  ],
  providers: [AuthService, EmailService, TwoFactorService],
  controllers: [AuthController],
  exports: [AuthService, TwoFactorService],
})
export class AuthModule { }
