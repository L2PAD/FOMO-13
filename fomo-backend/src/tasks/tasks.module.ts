import { Module } from '@nestjs/common';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { User, UserSchema } from 'src/user/user.model';
import { Project, ProjectSchema } from 'src/projects/project.model';
import { Task, TaskSchema } from './models/task.model';
import { Comment, CommentSchema } from 'src/comments/models/comment.model';
import { CommentsModule } from 'src/comments/comments.module';
import { UserModule } from 'src/user/user.module';
import { Ref, RefSchema } from 'src/ref/ref.model';
import {
  EarlylandTaskUserState,
  EarlylandTaskUserStateSchema,
} from './models/earlyland-task-user-state.model';
import {
  TaskUserProgress,
  TaskUserProgressSchema,
} from './models/task-user-progress.model';
import { FomoV2Module } from 'src/fomo-v2/fomo-v2.module';
import { XpModule } from 'src/xp/xp.module';
import { XpTransaction, XpTransactionSchema } from 'src/xp/xp-transaction.model';
import {
  EarlyLandAccessGrant,
  EarlyLandAccessGrantSchema,
} from 'src/fomo-v2/domains/activities/models/earlyland-access.model';
import { BadgesModule } from 'src/badges/badges.module';
import { TaskMetricResolver } from './metrics/task-metric-resolver';

@Module({
  imports: [
    CommentsModule,
    UserModule,
    FomoV2Module,
    XpModule,
    BadgesModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: EarlylandTaskUserState.name, schema: EarlylandTaskUserStateSchema },
      { name: TaskUserProgress.name, schema: TaskUserProgressSchema },
      { name: Ref.name, schema: RefSchema },
      { name: XpTransaction.name, schema: XpTransactionSchema },
      { name: EarlyLandAccessGrant.name, schema: EarlyLandAccessGrantSchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskMetricResolver],
})
export class TasksModule {}
