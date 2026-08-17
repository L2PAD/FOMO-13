import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupportController } from './support.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { MongooseModule } from '@nestjs/mongoose';

import { SupportService } from './support.service';
import { AuthService } from "src/auth/auth.service";
import { FilesService } from 'src/files/files.service';

import { User, UserSchema } from 'src/user/user.model';
import { Project, ProjectSchema } from 'src/projects/project.model';
import { Support, SupportSchema } from './support.model';
import { EmailService } from 'src/email/email.service';
import { TwoFactorService } from 'src/auth/two-factor/two-factor.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    NestjsFormDataModule,
    ConfigModule.forRoot(),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Support.name, schema: SupportSchema },
    ]),
    AuthModule
  ],
  controllers: [SupportController],
  providers: [SupportService, FilesService, EmailService]
})
export class SupportModule { }
