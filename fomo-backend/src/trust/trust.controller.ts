import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { TrustService } from './trust.service';

const uid = (req: Request) => ((req.user as any)?._id ? String((req.user as any)._id) : undefined);

@Controller('trust')
export class TrustController {
  constructor(private readonly trust: TrustService) {}

  /* ─────────── PUBLIC (website Support Center) ─────────── */
  @Get('public/categories')
  publicCategories() { return this.trust.categoriesTree(true); }

  @Get('public/reasons')
  publicReasons(@Query('targetType') targetType?: string) { return this.trust.listReasons(targetType, true); }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Post('public/reports')
  createReport(@Req() req: Request, @Body() body: any) { return this.trust.createReport(body, uid(req)); }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Post('public/tickets')
  createTicket(@Req() req: Request, @Body() body: any) { return this.trust.createTicket(body, uid(req)); }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Get('public/tickets/mine')
  myTickets(@Req() req: Request) { return this.trust.myTickets(uid(req) as string); }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Post('public/tickets/:id/reply')
  replyTicket(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.trust.addTicketMessage(id, { ...body, authorType: 'user' }, uid(req));
  }

  /* ─────────── ADMIN / MODERATOR ─────────── */
  // Categories
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('categories')
  categories(@Query('tree') tree?: string) { return tree === 'false' ? this.trust.listCategories(false) : this.trust.categoriesTree(false); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Post('categories')
  createCategory(@Body() body: any) { return this.trust.createCategory(body); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Patch('categories/:code')
  updateCategory(@Param('code') code: string, @Body() body: any) { return this.trust.updateCategory(code, body); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Delete('categories/:code')
  deleteCategory(@Param('code') code: string) { return this.trust.deleteCategory(code); }

  // Reasons
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('reasons')
  reasons(@Query('targetType') targetType?: string) { return this.trust.listReasons(targetType); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Post('reasons')
  createReason(@Body() body: any) { return this.trust.createReason(body); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Patch('reasons/:code')
  updateReason(@Param('code') code: string, @Body() body: any) { return this.trust.updateReason(code, body); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Delete('reasons/:code')
  deleteReason(@Param('code') code: string) { return this.trust.deleteReason(code); }

  // Reports
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('reports')
  reports(@Query() q: any) { return this.trust.listReports(q); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('reports/:id')
  report(@Param('id') id: string) { return this.trust.getReport(id); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Patch('reports/:id')
  updateReportRoute(@Req() req: Request, @Param('id') id: string, @Body() body: any) { return this.trust.updateReport(id, body, uid(req)); }

  // Tickets
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('tickets')
  tickets(@Query() q: any) { return this.trust.listTickets(q); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('tickets/:id')
  ticket(@Param('id') id: string) { return this.trust.getTicket(id); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Patch('tickets/:id')
  updateTicketRoute(@Req() req: Request, @Param('id') id: string, @Body() body: any) { return this.trust.updateTicket(id, body, uid(req)); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Post('tickets/:id/messages')
  ticketMessage(@Req() req: Request, @Param('id') id: string, @Body() body: any) { return this.trust.addTicketMessage(id, body, uid(req)); }

  // Moderation cases
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('moderation')
  cases(@Query() q: any) { return this.trust.listCases(q); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Post('moderation')
  createCaseRoute(@Req() req: Request, @Body() body: any) { return this.trust.createCase(body, uid(req)); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('moderation/:id')
  caseOne(@Param('id') id: string) { return this.trust.getCase(id); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Patch('moderation/:id')
  updateCaseRoute(@Req() req: Request, @Param('id') id: string, @Body() body: any) { return this.trust.updateCase(id, body, uid(req)); }

  // Analytics + Customer 360 + seed
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('analytics/overview')
  analytics(@Query('includeDemo') includeDemo?: string) { return this.trust.analyticsOverview(includeDemo === 'true'); }
  @Roles('admin,moderator') @UseGuards(JwtAuthGuard) @Get('user/:id/summary')
  userSummary(@Param('id') id: string) { return this.trust.userTrustSummary(id); }
  @Roles('admin') @UseGuards(JwtAuthGuard) @Post('seed')
  seed() { return this.trust.seedCanonical(); }
  @Roles('admin') @UseGuards(JwtAuthGuard) @Post('seed-demo')
  seedDemo() { return this.trust.seedDemo(); }
  @Roles('admin') @UseGuards(JwtAuthGuard) @Post('reset-demo')
  resetDemo() { return this.trust.resetDemo(); }
}
