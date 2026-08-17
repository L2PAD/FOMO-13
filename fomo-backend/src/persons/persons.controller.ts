import {
  UseGuards,
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Query,
} from "@nestjs/common";
import mongoose from "mongoose";
import { PersonsService } from "./persons.service";
import { FormDataRequest } from "nestjs-form-data/dist/decorators";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { CreatePersonDto } from "./dto/create-person.dto";
import commentDto from "src/comments/dto/comment.dto";
import UpdatePersonDto, { UpdatePersonByUser } from "./dto/update-person.dto";
import { Request } from "express";
import { LimitGuard } from "src/limits/limit.guard";
import { Limits } from "src/limits/limit.decorator";
import { RolesDto } from "src/projects/dto/update-project.dto";
import { QueryFomiesDto, QueryPersonDto } from "./dto/query-person.dto";

@Controller("persons")
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Get()
  getPersons(@Query() query: QueryPersonDto): Promise<{items:Array<any>,totalCount:number}> {
    const projectStatus: string = "active";

    return this.personsService.getPersons(projectStatus, query);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("data/all")
  async getAdminPersons(): Promise<Array<any>> {
    const projectStatus: string = "all";

    const data = await this.personsService.getPersons(projectStatus);

    return data.items
  }
  
  @Get(":id")
  async getPerson(
    @Param("id") id: string,
    @Query() query: QueryFomiesDto
  ): Promise<any> {
    if (query.type === 'fomies') {
      return this.personsService.getFomies(id, query);
    } else {
      return this.personsService.getPerson(id);
    }
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createPerson(@Body() createPersonDto: CreatePersonDto) {
    return this.personsService.createPerson(createPersonDto);
  }

  @Roles("user")
  @Limits("personLimit")
  @UseGuards(JwtAuthGuard, LimitGuard)
  @Post("user")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createProjectByUser(@Req() req: Request) {
    const createProjectDto: CreatePersonDto = req.body;
    const initiator: string = req.user._id;

    return this.personsService.createPersonByUser(
      { ...createProjectDto, projectStatus: "moderator" },
      initiator
    );
  }

  @Roles("moderator")
  @UseGuards(JwtAuthGuard)
  @Post("moderator")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createPersonByModerator(@Req() req: Request) {
    const id: string = req.user._id;
    const createPersonDto: CreatePersonDto = req.body;

    return this.personsService.createPersonByModerator(
      createPersonDto,
      id,
      "admin"
    );
  }

  @Roles("any")
  @Limits("personLimit")
  @UseGuards(JwtAuthGuard, LimitGuard)
  @Put("projects/update/:id/:key")
  @FormDataRequest()
  updatePersonsProjects(
    @Req() req: Request,
    @Body()
    projects: {
      newProjectIds: Array<string>;
    },
    @Param("id") id: string,
    @Param("key") key: "participated" | "colleagues"
  ) {
    const initiator: string = req.user._id;
    const rolesData: RolesDto = {
      isAdmin: req.user.role.includes("admin"),
      isModerator: req.user.role.includes("moderator"),
      isUser: req.user.role.includes("user"),
    };

    return this.personsService.updatePersonProject(
      projects.newProjectIds,
      id,
      key,
      initiator,
      rolesData
    );
  }

  @Roles("user")
  @Limits("personLimit")
  @UseGuards(JwtAuthGuard, LimitGuard)
  @Put("user/:id")
  @FormDataRequest()
  updatePersonByUser(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() updatePersonDto: UpdatePersonByUser
  ) {
    const userId: string = req.user._id;

    return this.personsService.editPersonByUser(id, updatePersonDto, userId);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @FormDataRequest()
  updatePerson(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() updatePersonDto: UpdatePersonDto
  ) {
    const userId: string = req.user._id;
    const rolesData: RolesDto = {
      isAdmin: req.user.role.includes("admin"),
      isModerator: req.user.role.includes("moderator"),
      isUser: req.user.role.includes("user"),
    };

    return this.personsService.editPerson(
      id,
      updatePersonDto,
      rolesData,
      userId
    );
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("comment/:id")
  addComment(@Req() req: Request) {
    const comment: commentDto = req.body;
    const userId: string = req.user._id;
    const itemId: string = req.params.id;

    return this.personsService.addComment(itemId, {
      ...comment,
      author: new mongoose.Types.ObjectId(userId),
    });
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Delete("comment/:id/:comment")
  removeComment(@Param() params) {
    const { id, comment } = params;
    return this.personsService.removeComment(id, comment);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  removeProject(@Param() params) {
    const { id } = params;
    return this.personsService.removeProject(id);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  changeRedStatus(@Param() params) {
    const { id } = params;
    return this.personsService.toggleRedStatus(id);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("sponsored/update/:id")
  changeSponsoredStatus(@Param() params) {
    const { id }: { id: string } = params;
    return this.personsService.updateSponsoredStatus(id);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("eralash/update/:id")
  changeEralashStatus(@Param() params) {
    const { id }: { id: string } = params;
    return this.personsService.updateEralashStatus(id);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("/:status/:id")
  changeStatus(@Param() params) {
    const { id, status }: { id: string; status: string } = params;
    return this.personsService.changeStatus(id, status);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("action/like/:id")
  async likeItem(@Req() req: Request, @Param("id") prId: string) {
    const userId: string = req.user._id;

    return this.personsService.addLike(prId, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("action/dislike/:id")
  async dislikeItem(@Req() req: Request, @Param("id") prId: string) {
    const userId: string = req.user._id;

    return this.personsService.addDislike(prId, userId);
  }
}
