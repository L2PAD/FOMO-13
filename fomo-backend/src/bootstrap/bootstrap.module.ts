import { Module } from "@nestjs/common";
import { BootstrapSeedService } from "./bootstrap-seed.service";

/**
 * Demo bootstrap module — restores mock data (EarlyLand test activities + ad
 * campaigns) on app start so the demo survives DB dumps / redeployments.
 * Uses the shared Mongoose connection; introduces NO new domain logic.
 */
@Module({
  providers: [BootstrapSeedService],
})
export class BootstrapModule {}
