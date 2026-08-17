import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { FomoV2BackerReadService } from "../services/backer-read.service";
import { FomoV2BackerType } from "../types";

@Controller("admin/fomo-v2/backers")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 180, ttl: 60_000 } })
export class FomoV2BackersAdminController {
  constructor(private readonly backerReadService: FomoV2BackerReadService) {}

  @Get("funds")
  listFunds(@Query() query: Record<string, any>) {
    return this.backerReadService.listAdminFunds(query);
  }

  @Get("persons")
  listPersons(@Query() query: Record<string, any>) {
    return this.backerReadService.listAdminPersons(query);
  }

  @Patch(":type/:id/status/:status")
  changeStatus(
    @Param("type") type: string,
    @Param("id") id: string,
    @Param("status") status: string
  ) {
    return this.backerReadService.changeBackerAdminStatus(
      this.backerType(type),
      id,
      status
    );
  }

  @Patch(":type/:id/sponsored")
  changeSponsoredStatus(@Param("type") type: string, @Param("id") id: string) {
    return this.backerReadService.updateBackerSponsoredStatus(
      this.backerType(type),
      id
    );
  }

  @Patch(":type/:id/eralash")
  changeEralashStatus(@Param("type") type: string, @Param("id") id: string) {
    return this.backerReadService.updateBackerEralashStatus(
      this.backerType(type),
      id
    );
  }

  @Patch(":type/:id/red-status")
  changeRedStatus(@Param("type") type: string, @Param("id") id: string) {
    return this.backerReadService.toggleBackerRedStatus(
      this.backerType(type),
      id
    );
  }

  @Delete(":type/:id")
  removeBacker(@Param("type") type: string, @Param("id") id: string) {
    return this.backerReadService.removeBackerFromAdmin(
      this.backerType(type),
      id
    );
  }

  private backerType(type: string): FomoV2BackerType {
    if (type === "fund" || type === "funds") return "fund";
    if (type === "person" || type === "persons") return "person";

    throw new BadRequestException("Unknown FOMO v2 backer type");
  }
}
