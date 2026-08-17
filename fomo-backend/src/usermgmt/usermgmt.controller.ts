import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { UsermgmtService } from "./usermgmt.service";

@Controller()
export class UsermgmtController {
  constructor(private readonly svc: UsermgmtService) {}

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/settings/email")
  getEmail() {
    return this.svc.getEmailSettings();
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Put("admin/settings/email")
  updateEmail(@Body() body: any) {
    return this.svc.updateEmailSettings(body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/settings/email/test")
  testEmail() {
    return this.svc.testEmail();
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/invites")
  listInvites() {
    return this.svc.listInvites();
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/invites")
  createInvite(@Req() req: Request, @Body() body: any) {
    return this.svc.createInvite(body, String((req.user as any)?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/invites/:id/resend")
  resendInvite(@Param("id") id: string) {
    return this.svc.resendInvite(id);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("user/:id/timeline")
  timeline(@Param("id") id: string, @Query("type") type?: string) {
    return this.svc.getTimeline(id, type);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/settings/2fa-status")
  twofaStatus(@Req() req: Request) {
    return this.svc.get2FAStatus(String((req.user as any)?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/users/master-list")
  masterList(@Query() query: any) {
    return this.svc.getMasterList(query);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/users/:id/mute")
  mute(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.svc.muteUser(id, body, String((req.user as any)?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/users/:id/unmute")
  unmute(@Req() req: Request, @Param("id") id: string) {
    return this.svc.unmuteUser(id, String((req.user as any)?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/users/:id/suspend")
  suspend(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.svc.suspendUser(id, body, String((req.user as any)?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/users/:id/unsuspend")
  unsuspend(@Req() req: Request, @Param("id") id: string) {
    return this.svc.unsuspendUser(id, String((req.user as any)?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/users/:id/soft-delete")
  softDelete(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.svc.softDeleteUser(id, body, String((req.user as any)?._id || ""));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/users/:id/restore")
  restore(@Req() req: Request, @Param("id") id: string) {
    return this.svc.restoreUser(id, String((req.user as any)?._id || ""));
  }
}
