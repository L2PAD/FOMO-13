import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { AdvertisingService } from './advertising.service';
import { DeliveryService } from './delivery.service';

@Controller('ads')
export class AdvertisingController {
  constructor(
    private readonly ads: AdvertisingService,
    private readonly delivery: DeliveryService,
  ) {}

  /* ── PUBLIC delivery + tracking (no auth) ── */
  private countryFrom(req: Request, fallback?: string): string {
    const h = (req?.headers || {}) as any;
    const c = h['cf-ipcountry'] || h['x-vercel-ip-country'] || h['x-geo-country']
      || h['x-appengine-country'] || h['x-country-code'] || fallback || '';
    const cc = String(c).toUpperCase().trim();
    // Ignore CDN placeholders that are not real ISO codes.
    return cc && cc !== 'XX' && cc !== 'T1' && cc.length === 2 ? cc : '';
  }

  @Get('/serve')
  serve(@Req() req: Request, @Query() q: any) {
    return this.delivery.serve({
      placement: q.placement,
      device: q.device,
      loggedIn: q.loggedIn === 'true' || q.loggedIn === true,
      sessionId: q.session || q.sessionId,
      anonId: q.anon || q.anonId,
      country: this.countryFrom(req, q.country),
    });
  }

  @Post('/track')
  track(@Req() req: Request, @Body() body: any) {
    return this.delivery.track({ ...body, country: this.countryFrom(req, body?.country) });
  }

  @Get('/placement-config/:code')
  placementConfig(@Param('code') code: string) { return this.ads.placementConfig(code); }

  /** PUBLIC: submit an "advertise with us" request (Your Ad Here modal). */
  @Post('/request')
  submitRequest(@Body() body: any) {
    return this.ads.submitAdRequest(body);
  }

  /* ── ADMIN ── */
  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/requests')
  listRequests(@Query() q: any) { return this.ads.listAdRequests(q); }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/requests/counts')
  requestCounts() { return this.ads.adRequestCounts(); }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Patch('/admin/requests/:id/status')
  updateRequestStatus(@Param('id') id: string, @Body() body: any) {
    return this.ads.updateAdRequestStatus(id, body?.status);
  }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Post('/admin/requests/:id/ai-generate')
  aiGenerateRequest(@Param('id') id: string, @Req() req: any) {
    return this.ads.aiGenerateFromRequest(id, String(req?.user?._id || req?.user?.id || ''));
  }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Post('/admin/requests/:id/approve')
  approveRequest(@Param('id') id: string) {
    return this.ads.approveRequestCampaign(id);
  }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Post('/admin/requests/:id/reject')
  rejectRequest(@Param('id') id: string) {
    return this.ads.rejectRequestCampaign(id);
  }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/placements')
  placements() { return this.ads.listPlacements(); }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Patch('/admin/placements/:code')
  setPlacement(@Param('code') code: string, @Body() body: any) {
    return this.ads.updatePlacementSetting(code, body);
  }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/analytics/overview')
  overview(@Query() q: any) { return this.ads.analyticsOverview(q); }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/analytics/campaign/:id')
  campaignAnalytics(@Param('id') id: string) { return this.ads.analyticsCampaign(id); }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Post('/admin/forecast')
  forecast(@Body() body: any) { return this.ads.forecast(body); }

  // advertisers
  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/advertisers')
  advertisers() { return this.ads.listAdvertisers(); }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Post('/admin/advertisers')
  createAdvertiser(@Body() body: any) { return this.ads.createAdvertiser(body); }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/campaigns/:id/report')
  getReport(@Param('id') id: string) { return this.ads.getReportState(id); }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Patch('/admin/campaigns/:id/report')
  setReportConfig(@Param('id') id: string, @Body() body: any) { return this.ads.updateReportConfig(id, body); }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Post('/admin/campaigns/:id/report/generate')
  genReport(@Param('id') id: string) { return this.ads.generateReport(id, { trigger: 'manual', send: false }); }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Post('/admin/campaigns/:id/report/send')
  sendReport(@Param('id') id: string) { return this.ads.generateReport(id, { trigger: 'manual', send: true }); }

  // campaigns
  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/campaigns')
  listCampaigns(@Query() q: any) { return this.ads.listCampaigns(q); }

  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/campaigns/:id')
  getCampaign(@Param('id') id: string) { return this.ads.getCampaign(id); }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Post('/admin/campaigns')
  createCampaign(@Req() req: Request, @Body() body: any) {
    return this.ads.createCampaign(body, String((req as any).user?._id || ''));
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Patch('/admin/campaigns/:id')
  updateCampaign(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.ads.updateCampaign(id, body, String((req as any).user?._id || ''));
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Patch('/admin/campaigns/:id/status')
  setStatus(@Param('id') id: string, @Body() body: any) {
    return this.ads.setStatus(id, body?.status);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Delete('/admin/campaigns/:id')
  deleteCampaign(@Param('id') id: string) { return this.ads.deleteCampaign(id); }

  // creatives
  @Roles('admin,moderator')
  @UseGuards(JwtAuthGuard)
  @Get('/admin/campaigns/:id/creatives')
  listCreatives(@Param('id') id: string) { return this.ads.listCreatives(id); }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Post('/admin/campaigns/:id/creatives')
  createCreative(@Param('id') id: string, @Body() body: any) { return this.ads.createCreative(id, body); }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Patch('/admin/creatives/:id')
  updateCreative(@Param('id') id: string, @Body() body: any) { return this.ads.updateCreative(id, body); }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Delete('/admin/creatives/:id')
  deleteCreative(@Param('id') id: string) { return this.ads.deleteCreative(id); }
}
