import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { TopicsController } from "./topics.controller";
import { TopicsService } from "./topics.service";
import { Topic, TopicSchema } from "./models/topic.model";
import { Comment, CommentSchema } from "src/comments/models/comment.model";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Topic.name, schema: TopicSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [TopicsController],
  providers: [TopicsService, JwtService, ConfigService],
  exports: [TopicsService],
})
export class TopicsModule {}
