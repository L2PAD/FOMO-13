import { 
  Controller, Get, Post, Body, Param,
  Put, Delete, UseGuards, Req, Patch 
} from '@nestjs/common';
import { Request } from 'express';
import { FormDataRequest } from 'nestjs-form-data';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { BoardService } from './board.service';
import { 
    CreateBoardDto,
    UpdateBoardDto,
    CreateTaskDto,
    UpdateTaskDto
 } from './dto/board.dto';

@Controller('boards')
export class BoardController {
  constructor(
    private readonly boardService: BoardService
  ) {}

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  @Post()
  createBoard(
    @Req() req : Request,
    @Body() createBoardDto: CreateBoardDto
) {
    const id : string = req.user._id 

    return this.boardService.create({...createBoardDto,owner:id});
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Get()
  getUserBoards(@Req() req : Request) {
    const id : string = req.user._id 

    return this.boardService.getUserBoards(id)
  }

  
  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Get('/invited')
  getInvitedBoards(@Req() req : Request) {
    const id : string = req.user._id 

    return this.boardService.getUserInvitedBoards(id)
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.boardService.findOne(id);
  // }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  @Put(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardService.update(id,updateBoardDto);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Patch('columns/:id')
  updateColumns(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardService.updateColumns(id,updateBoardDto);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Req() req : Request,
    @Param('id') id: string
  ) {
    const userId : string =  req.user._id

    return this.boardService.remove(id,userId);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  @Post('tasks/:id')
  addTask(
    @Req() req : Request,
    @Param('id') boardId: string,
    @Body() createTaskDto: CreateTaskDto
    ) {
    const userId : string = req.user._id

    return this.boardService.addTask(boardId,createTaskDto,userId);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  @Put('tasks/:taskId')
  updateTask(
    @Req() req : Request,
    @Param('taskId') taskId: string, 
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    const userId : string = req.user._id

    return this.boardService.updateTask(taskId,updateTaskDto,userId);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Delete('tasks/:taskId')
  deleteTask(@Param('taskId') taskId: string) {
    return this.boardService.deleteTask(taskId);
  }
}