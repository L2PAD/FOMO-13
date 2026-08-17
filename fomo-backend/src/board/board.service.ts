import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, mongo } from 'mongoose';
import { FilesService } from 'src/files/files.service';
import { Board,BoardDocument } from './models/board.model';
import { BoardTask,BoardTaskDocument } from './models/task.model';
import { CreateBoardDto, CreateTaskDto, UpdateBoardDto,UpdateTaskDto } from './dto/board.dto';
import { User, UserDocument } from 'src/user/user.model';
import { Project, ProjectDocument } from 'src/projects/project.model';

@Injectable()
export class BoardService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    @InjectModel(BoardTask.name) private taskModel: Model<BoardTaskDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private readonly filesService: FilesService,
  ) {}

  private async findBoard(boardId:string,userId:string,isInviteUser:boolean) : Promise<BoardDocument> {
    const query : any = 
    isInviteUser
    ?
    {
      _id: new mongoose.Types.ObjectId(boardId),
      users:new mongoose.Types.ObjectId(userId)
    }
    :
    {
      _id: new mongoose.Types.ObjectId(boardId),
      owner:new mongoose.Types.ObjectId(userId)
    }

    const board = await this.boardModel.findOne(query);

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board
  }

  async addPhotoToTask(taskId: string, file: any): Promise<BoardTask> {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const filename = await this.filesService.writeFile(file);
    task.img = filename;
    return task.save();
  }

  async create(createBoardDto: CreateBoardDto): Promise<Board> {
    const board = new this.boardModel(
        {
            ...createBoardDto,
            owner:new mongoose.Types.ObjectId(createBoardDto.owner),
            projectId:new mongoose.Types.ObjectId(createBoardDto.projectId),
            created:new Date()
        }
    )

    const img = createBoardDto.img ? await this.filesService.writeFile(createBoardDto.img) : ''
    
    board.img = img
    board.columns = [
      { name: 'To Do', tasks: [] },
      { name: 'In Progress', tasks: [] },
      { name: 'Completed', tasks: [] },
    ];

    return board.save();
  }

  async getUserBoards(userId:string) : Promise<Board[]> {
    return this.boardModel.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(userId) }
      },
      {
        $lookup: {
          from: this.projectModel.collection.name,
          localField: 'projectId',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $unwind: {
          path: '$project',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: 'users',
          foreignField: '_id',
          as: 'users'
        }
      },
      {
        $unwind: {
          path: '$columns',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: this.taskModel.collection.name,
          localField: 'columns.tasks',
          foreignField: '_id',
          as: 'columns.tasks'
        }
      },
      {
        $project: {
          name: 1,
          owner: 1,
          img: 1,
          project: 1,
          created: 1,
          columns: 1,
          users: {
            $map: {
              input: '$users',
              as: 'user',
              in: {
                _id: '$$user._id',
                email: '$$user.email',
                name: '$$user.name',
                username: '$$user.username',
                fomoId: '$$user.fomoId',
                photo: '$$user.photo',
                rating: '$$user.rating',
                wallet: '$$user.wallet',
                twitterData: '$$user.twitterData',
                invitedBoards: '$$user.invitedBoards'
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          owner: { $first: '$owner' },
          img: { $first: '$img' },
          users: { $first: '$users' },
          columns: { $push: '$columns' },
          project: { $first: '$project' },
          created: { $first: '$created' }
        }
      },
      {
        $sort: { created: -1 }
      }
    ]).exec();
  }

  async getUserInvitedBoards(userId:string) : Promise<Board[]> {
    return this.boardModel.aggregate([
      {
        $match: { 
          users: new mongoose.Types.ObjectId(userId)
         }
      },
      {
        $lookup: {
          from: this.projectModel.collection.name,
          localField: 'projectId',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $unwind: {
          path: '$project',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: 'users',
          foreignField: '_id',
          as: 'users'
        }
      },
      {
        $unwind: {
          path: '$columns',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: this.taskModel.collection.name,
          localField: 'columns.tasks',
          foreignField: '_id',
          as: 'columns.tasks'
        }
      },
      {
        $project: {
          name: 1,
          owner: 1,
          img: 1,
          project: 1,
          created: 1,
          columns: 1,
          users: {
            $map: {
              input: '$users',
              as: 'user',
              in: {
                _id: '$$user._id',
                email: '$$user.email',
                name: '$$user.name',
                username: '$$user.username',
                fomoId: '$$user.fomoId',
                photo: '$$user.photo',
                rating: '$$user.rating',
                wallet: '$$user.wallet',
                twitterData: '$$user.twitterData',
                invitedBoards: '$$user.invitedBoards'
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          owner: { $first: '$owner' },
          img: { $first: '$img' },
          users: { $first: '$users' },
          columns: { $push: '$columns' },
          project: { $first: '$project' },
          created: { $first: '$created' }
        }
      },
      {
        $sort: { created: -1 }
      }
    ]).exec();
  }

  async findOne(id: string): Promise<Board> {
    return this.boardModel.findById(id).populate('users tasks').exec();
  }

  async update(id: string, updateBoardDto: UpdateBoardDto): Promise<Board> {
    const data : any = {
      name:updateBoardDto.name,
      projectId:new mongoose.Types.ObjectId(updateBoardDto.projectId),
    }

    if(updateBoardDto.img){
      data.img = await this.filesService.writeFile(updateBoardDto.img)
    }

    if(updateBoardDto?.columns?.length){
      data.columns = data.columns.map((column:any) => {
        return ({
          ...column,
          tasks:column.tasks.map((item:string) => new mongoose.Types.ObjectId(item))
        })
      })
    }

    const board = await this.boardModel.findByIdAndUpdate(id, data, { new: true });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async updateColumns(id: string, updateBoardDto: UpdateBoardDto): Promise<Board> {
    const data : any = {}

    data.columns = updateBoardDto.columns.map((column:any) => {
      return ({
        ...column,
        tasks:column.tasks.map((item:string) => new mongoose.Types.ObjectId(item))
      })
    })

    const board = await this.boardModel.findByIdAndUpdate(id, data, { new: true });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async remove(id: string,userId: string): Promise<string> {
    const board = await this.boardModel.findOneAndDelete({
        _id:new mongoose.Types.ObjectId(id),
        owner:new mongoose.Types.ObjectId(userId)
    });

    const tasks : Array<mongoose.Types.ObjectId> = board.columns.map((column:any) => column.tasks).flat(1)

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    await this.filesService.removeFile(board.img)

    await this.taskModel.deleteMany({_id:tasks})

    return 'Success!'
  }

  async addTask(boardId: string, createTaskDto: CreateTaskDto, userId: string): Promise<BoardTask> {
    const isInvestUser : boolean = createTaskDto.isInviteUser === 'true'

    const board : BoardDocument = await this.findBoard(boardId,userId,isInvestUser)

    const img = createTaskDto.img ? await this.filesService.writeFile(createTaskDto.img) : ''

    const task = new this.taskModel({ 
      ...createTaskDto,
      board: board._id, 
      img,
      isInvestUser 
    });

    await task.save();

    board.columns[createTaskDto.status].tasks.push(task._id); 

    await board.save();

    return task;
  }

  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto,userId:string): Promise<BoardTask> {
    const data : any
    =
    {
      title:updateTaskDto.title,
      description:updateTaskDto.description,
      status:updateTaskDto.status,
    }

    const img : string = updateTaskDto.img ? await this.filesService.writeFile(updateTaskDto.img) : ''

    if(img){
      data.img = img
    }
    
    const task = await this.taskModel.findByIdAndUpdate(taskId, data);

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    
    return task;
  }

  async deleteTask(taskId: string): Promise<string> {
    const task = await this.taskModel.findByIdAndDelete(taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.filesService.removeFile(task.img)

    const board = await this.boardModel.findById(task.board);

    if (board) {
      board.columns[task.status].tasks
      =
      board.columns[task.status].tasks.filter((item:any) => item._id !== task._id)
      
      await board.save();
    }

    return 'Success'
  }
}
