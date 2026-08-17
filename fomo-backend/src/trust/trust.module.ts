import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';
import { SupportCategory, SupportCategorySchema } from './models/support-category.model';
import { ReportReason, ReportReasonSchema } from './models/report-reason.model';
import { TrustReport, TrustReportSchema } from './models/trust-report.model';
import { SupportTicket, SupportTicketSchema } from './models/support-ticket.model';
import { ModerationCase, ModerationCaseSchema } from './models/moderation-case.model';
import { Appeal, AppealSchema } from '../deals/model/appeal.model';

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: SupportCategory.name, schema: SupportCategorySchema },
      { name: ReportReason.name, schema: ReportReasonSchema },
      { name: TrustReport.name, schema: TrustReportSchema },
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: ModerationCase.name, schema: ModerationCaseSchema },
      { name: Appeal.name, schema: AppealSchema },
    ]),
  ],
  controllers: [TrustController],
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
