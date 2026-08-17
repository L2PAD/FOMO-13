import { MODULE_METADATA } from "@nestjs/common/constants";
import { LeaderboardModule } from "src/leaderboard/leaderboard.module";
import { TabsModule } from "src/tabs/tabs.module";
import { ActionsService } from "./actions.service";

describe("ActionsService module boundaries", () => {
  it.each([
    ["LeaderboardModule", LeaderboardModule],
    ["TabsModule", TabsModule],
  ])("does not redeclare ActionsService in %s", (_name, moduleType) => {
    const providers =
      Reflect.getMetadata(MODULE_METADATA.PROVIDERS, moduleType) || [];

    expect(providers).not.toContain(ActionsService);
  });
});
