import { UpdateEventDto } from './dto/update-event.dto';
import { UseGuards, Controller, Get, Post, Body, Param, Put,Delete, HttpCode, HttpStatus, Res, Req} from '@nestjs/common';
import { EventsService } from "./events.service";
import { FormDataRequest } from 'nestjs-form-data/dist/decorators';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { Response,Request } from 'express';
import mongoose from 'mongoose';

@Controller("events")
export class EventsController {
  constructor(
    private readonly eventsService: EventsService
  ){}

  @Roles('user')
  @UseGuards(JwtAuthGuard)
  @Get('private/:page')
  getPrivateEvents(@Req() req : Request):Promise<Array<any>>{
    const userId : string = req.user?._id
    const page : string = req.params.page

    return this.eventsService.getEvents(page,'all',userId);
  }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('all/:page')
  getAllEvents(@Param('page') page : string):Promise<Array<any>>{
    return this.eventsService.getEvents(page,'all');
  }

  @Get('/:page')
  getEvents(@Param('page') page : string):Promise<Array<any>>{
    return this.eventsService.getEvents(page,'active');
  }

  @Roles('user')
  @UseGuards(JwtAuthGuard)
  @Post('create/user')
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createEventByUser(@Req() req : Request) {
    const userId : string = req.user?._id
    const createEventDto: CreateEventDto = req.body 

    return this.eventsService.createEvent({
      ...createEventDto,
      userId:new mongoose.Types.ObjectId(userId),
      isPrivate:true
    },
    'active'
    )
  }

  @Roles('moderator')
  @UseGuards(JwtAuthGuard)
  @Post('moderator')
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createEventByModerator(@Req() req : Request) {
    const userId : string = req.user?._id
    const createEventDto: CreateEventDto = req.body 

    return this.eventsService.createEvent(createEventDto,'admin',userId)
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Post('admin')
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createEvent(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.createEvent(createEventDto,'active')
  }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Put("/:id")
  @FormDataRequest()
  @HttpCode(HttpStatus.OK)
  async updateEvent(@Body() updateEventDto: UpdateEventDto, @Param('id') id: string, @Res() response: Response) {
    await this.eventsService.updateEvent(id, updateEventDto);
    response.send('Event was updated');
  }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Delete("/:id")
  @HttpCode(HttpStatus.OK)
  async deleteEvent(@Param('id') id: string, @Res() response: Response) {
    await this.eventsService.deleteEvent(id);
    response.send('Event was deleted');
  }
}
