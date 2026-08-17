import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { BoardController } from './board.controller';

import { BoardService } from './board.service';
import { FilesService } from 'src/files/files.service';

import { Board, BoardSchema } from './models/board.model';
import { BoardTask, BoardTaskSchema } from './models/task.model';
import { User, UserSchema } from 'src/user/user.model';
import { Project, ProjectSchema } from 'src/projects/project.model';

@Module({
  imports: [
    HttpModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: BoardTask.name, schema: BoardTaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardService, FilesService],
})
export class BoardModule {}