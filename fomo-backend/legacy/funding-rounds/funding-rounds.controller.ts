import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FundingRoundsService } from './funding-rounds.service';
import { FundingRoundFiltersQueryDto, FundingRoundsListQueryDto } from './dto/funding-rounds-query.dto';
import { Roles } from 'src/auth/role.decorator';
import { ProjectIntelInternalSyncGuard } from 'src/projects/intel-sync/project-intel-internal-sync.guard';
import { FundingRoundsIntelSyncService } from './funding-rounds-intel-sync.service';
import { IntelSyncWorkerRunnerService } from 'src/intel-sync/intel-sync-worker-runner.service';

@Controller('rounds')
export class FundingRoundsController {
    constructor(
        private readonly fundingRoundsService: FundingRoundsService,
        private readonly fundingRoundsIntelSyncService: FundingRoundsIntelSyncService,
        private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
    ) { }

    @Roles('admin')
    @UseGuards(ProjectIntelInternalSyncGuard)
    @Throttle({ default: { limit: 2, ttl: 60_000 } })
    @Post('sync/intel')
    syncIntelFundingRounds(
        @Body() body: Record<string, any> = {},
        @Query() query: Record<string, any> = {},
    ) {
        const force = this.isTruthy(query.force ?? body.force ?? false);
        if (!force) {
            return this.intelSyncWorkerRunnerService.runJob('funding-rounds-intel-fundraising', 'manual');
        }

        return this.fundingRoundsIntelSyncService.executeSyncFromIntelFundraising('manual', { force: true });
    }

    @Get('filters')
    @Throttle({ default: { limit: 240, ttl: 60_000 } })
    async getFilterOptions(
        @Query() query: FundingRoundFiltersQueryDto,
    ) {
        const safeLimit = query.limit;
        const filters = await this.fundingRoundsService.getFilterOptions(safeLimit);

        return {
            ...filters,
            limit: safeLimit || 8,
        };
    }

    @Get()
    @Throttle({ default: { limit: 240, ttl: 60_000 } })
    async listRounds(
        @Query() query: FundingRoundsListQueryDto,
    ) {
        const { rounds, total } = await this.fundingRoundsService.listRounds({
            ...query,
        });

        return {
            rounds,
            total,
            limit: query.limit ? Number(query.limit) : 100,
            offset: query.offset ? Number(query.offset) : 0,
        };
    }

    @Get('/:slug')
    getRounds(@Param('slug') slug: string) {
        return this.fundingRoundsService.getRounds(slug)
    }

    private isTruthy(value: any): boolean {
        return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase());
    }
}
