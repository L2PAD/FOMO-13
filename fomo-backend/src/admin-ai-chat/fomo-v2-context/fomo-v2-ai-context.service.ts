import { Injectable } from "@nestjs/common";
import { FomoV2AiToolsService } from "./fomo-v2-ai-tools.service";

@Injectable()
export class FomoV2AiContextService {
  constructor(private readonly toolsService: FomoV2AiToolsService) {}

  async getDefaultContext() {
    const stats = await this.toolsService.fomoV2CollectionStats({
      includeBreakdowns: true,
    });

    return {
      scope: "FOMO v2 crypto data dev inspection with guarded typed writes",
      readOnly: false,
      writePolicy:
        "Only typed fomoDev* write tools may write to fomo_dev, and only with dryRun=false plus confirm=true when enabled by env.",
      generatedAt: new Date().toISOString(),
      defaultCollections: stats.data,
    };
  }
}
