import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { AdminCommentsController } from './admin-comments.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { CommentsService } from './comments.service';
import { BuzzAccessGuard } from './buzz-access.guard';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { CommentSchema, Comment } from './models/comment.model';
import { DiscussionSummary, DiscussionSummarySchema } from './models/discussion-summary.model';
import { UserSchema, User } from 'src/user/user.model';
import { Activity, ActivitySchema } from 'src/activity/models/activity.model';
import { ActivityService } from 'src/activity/activity.service';
import { MessageModule } from '../message/message.module';
import { FilesService } from 'src/files/files.service';
import { XpModule } from '../xp/xp.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContentInfluenceService } from './content-influence.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name, schema: CommentSchema,
      },
      {
        name: User.name, schema: UserSchema,
      },
      {
        name: Activity.name, schema: ActivitySchema
      },
      {
        name: DiscussionSummary.name, schema: DiscussionSummarySchema
      }
    ]
    ),
    MessageModule,
    EntitlementsModule,
    XpModule,
    NotificationsModule
  ],
  controllers: [CommentsController, AdminCommentsController],
  providers: [CommentsService, JwtService, ConfigService, ActivityService, FilesService, BuzzAccessGuard, ContentInfluenceService],
  exports: [CommentsService, ContentInfluenceService]
})
export class CommentsModule { }
