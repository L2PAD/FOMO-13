import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { RatingIngestionService } from "./rating-ingestion.service";
import { RatingServiceTokenGuard } from "./rating-service-token.guard";

/**
 * INTERNAL rating-inputs ingestion. Protected by a service token (not admin
 * JWT) so data sources (parser, ledger, indexers) can push RAW DTOs. Each call:
 * validates, stores an idempotent snapshot, recomputes, records provenance.
 */
@Controller("internal/rating-inputs")
@UseGuards(RatingServiceTokenGuard)
export class RatingIngestionController {
  constructor(private readonly ingestion: RatingIngestionService) {}

  @Put("funds/:id")
  @HttpCode(HttpStatus.OK)
  funds(@Param("id") id: string, @Body() body: any) {
    return this.ingestion.ingest("funds", id, body);
  }

  @Put("persons/:id")
  @HttpCode(HttpStatus.OK)
  persons(@Param("id") id: string, @Body() body: any) {
    return this.ingestion.ingest("persons", id, body);
  }

  @Put("projects/:id")
  @HttpCode(HttpStatus.OK)
  projects(@Param("id") id: string, @Body() body: any) {
    return this.ingestion.ingest("projects", id, body);
  }

  @Put("twitter/:id")
  @HttpCode(HttpStatus.OK)
  twitter(@Param("id") id: string, @Body() body: any) {
    return this.ingestion.ingest("twitter", id, body);
  }

  @Put("users/:id")
  @HttpCode(HttpStatus.OK)
  users(@Param("id") id: string, @Body() body: any) {
    return this.ingestion.ingest("users", id, body);
  }

  @Put("trade/:id")
  @HttpCode(HttpStatus.OK)
  trade(@Param("id") id: string, @Body() body: any) {
    return this.ingestion.ingest("trade", id, body);
  }
}
