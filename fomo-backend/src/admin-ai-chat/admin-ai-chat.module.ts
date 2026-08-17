import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AdminAiChatConfigService } from "./admin-ai-chat-config.service";
import { AdminAiChatController } from "./admin-ai-chat.controller";
import { AdminAiToolAuditService } from "./admin-ai-tool-audit.service";
import {
  adminAiConnectionProvider,
  adminAiParserConnectionProvider,
  adminAiModelProviders,
} from "./admin-ai-chat-mongo.providers";
import { AdminAiOpenAiService } from "./admin-ai-openai.service";
import { AdminAiChatService } from "./admin-ai-chat.service";
import { FomoV2AiContextService } from "./fomo-v2-context/fomo-v2-ai-context.service";
import { FomoParserAiToolsService } from "./fomo-v2-context/fomo-parser-ai-tools.service";
import { FomoV2AiRedactionService } from "./fomo-v2-context/fomo-v2-ai-redaction.service";
import { FomoV2AiToolsService } from "./fomo-v2-context/fomo-v2-ai-tools.service";
import { TavilyWebSearchProvider } from "./web-search/tavily-web-search.provider";
import { ADMIN_AI_EXPORT_QUEUE } from "./admin-ai-export.constants";
import { AdminAiExportService } from "./admin-ai-export.service";
import { AdminAiExportProcessor } from "./admin-ai-export.processor";
import { EntitlementsModule } from "src/entitlements/entitlements.module";

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    BullModule.registerQueue({ name: ADMIN_AI_EXPORT_QUEUE }),
    EntitlementsModule,
  ],
  controllers: [AdminAiChatController],
  providers: [
    AdminAiChatConfigService,
    adminAiConnectionProvider,
    adminAiParserConnectionProvider,
    ...adminAiModelProviders,
    AdminAiChatService,
    AdminAiExportService,
    AdminAiExportProcessor,
    AdminAiToolAuditService,
    AdminAiOpenAiService,
    FomoV2AiContextService,
    FomoParserAiToolsService,
    FomoV2AiRedactionService,
    FomoV2AiToolsService,
    TavilyWebSearchProvider,
  ],
})
export class AdminAiChatModule {}
