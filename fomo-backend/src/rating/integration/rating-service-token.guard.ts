import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Service-token auth for INTERNAL ingestion endpoints. External data sources
 * (parser, ledger, indexers) authenticate with a shared secret in the
 * `x-service-token` header (env RATING_INGEST_TOKEN). Secure by default: if the
 * token env is unset, all internal ingestion is denied.
 */
@Injectable()
export class RatingServiceTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const expected =
      this.config.get<string>("RATING_INGEST_TOKEN") || process.env.RATING_INGEST_TOKEN;
    if (!expected) {
      throw new UnauthorizedException("Ingestion disabled: RATING_INGEST_TOKEN is not configured");
    }
    const provided =
      req.headers["x-service-token"] || req.headers["x-rating-service-token"];
    if (!provided || String(provided) !== String(expected)) {
      throw new UnauthorizedException("Invalid or missing service token");
    }
    return true;
  }
}
