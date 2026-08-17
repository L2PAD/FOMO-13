import { Controller, Get, Param, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { SpaceportControlService } from './spaceport-control.service';

/**
 * Admin Spaceport / NFT Assets Control Center (read + diagnostics + indexer trigger).
 * On-chain writes are performed client-side (owner-signed wallet), never here.
 */
@Controller('admin/spaceport-cc')
@Roles('admin')
@UseGuards(JwtAuthGuard)
export class SpaceportControlController {
  constructor(private readonly service: SpaceportControlService) {}

  @Get('registry')
  registry() {
    return this.service.getRegistry();
  }

  @Get('overview')
  overview() {
    return this.service.getOverview();
  }

  @Get('collections')
  collections() {
    return this.service.getCollections();
  }

  @Get('sales')
  sales() {
    return this.service.getSales();
  }

  @Get('holders')
  holders() {
    return this.service.getHolders();
  }

  @Get('tokens')
  tokens(@Query('search') search?: string) {
    return this.service.getTokens({ search });
  }

  @Get('tokens/:tokenId')
  tokenDetail(@Param('tokenId') tokenId: string) {
    return this.service.getTokenDetail(Number(tokenId));
  }

  @Get('reveal')
  reveal() {
    return this.service.getReveal();
  }

  @Get('transfers')
  transfers(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('wallet') wallet?: string,
  ) {
    return this.service.getTransfers({
      limit: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
      wallet,
    });
  }

  @Get('contract-control')
  contractControl() {
    return this.service.getContractControl();
  }

  @Get('fusion')
  fusion() {
    return this.service.getFusion();
  }

  @Get('customer/:userId')
  customer(@Param('userId') userId: string) {
    return this.service.getCustomerNft(userId);
  }

  @Post('contract-control/prepare')
  prepare(@Body() body: any) {
    return this.service.prepareControlAction(body || {});
  }

  @Post('contract-control/record')
  record(@Body() body: any) {
    return this.service.recordControlAction(body || {});
  }

  @Get('contract-control/audit')
  audit() {
    return this.service.getControlAudit();
  }

  @Get('diagnostics')
  diagnostics() {
    return this.service.getDiagnostics();
  }

  @Get('access-reconcile')
  accessReconcile() {
    return this.service.reconcileAccessOwnership();
  }

  @Post('sync')
  sync(@Query('force') force?: string) {
    return this.service.syncIndexer(String(force || '') === 'true');
  }
}
