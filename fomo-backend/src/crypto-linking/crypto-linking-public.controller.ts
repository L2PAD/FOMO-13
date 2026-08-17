import { Controller, Get, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CryptoLinkingGraphService } from "./services/crypto-linking-graph.service";
import {
  CryptoLinkingGraphQueryDto,
  CryptoLinkingSearchQueryDto,
} from "./dto/crypto-linking-public-query.dto";

@Controller("crypto-linking")
export class CryptoLinkingPublicController {
  constructor(private readonly graphService: CryptoLinkingGraphService) {}

  @Get("search")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async search(@Query() query: CryptoLinkingSearchQueryDto) {
    return this.graphService.search(query.q || "", query.limit?.toString());
  }

  @Get("graph")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  async graph(@Query() query: CryptoLinkingGraphQueryDto) {
    return this.graphService.graph(
      query.entityType,
      query.id,
      query.limit?.toString(),
      {
        entityTypes: query.entityTypes,
        relationTypes: query.relationTypes,
        contextScopes: query.contextScopes,
      }
    );
  }
}
