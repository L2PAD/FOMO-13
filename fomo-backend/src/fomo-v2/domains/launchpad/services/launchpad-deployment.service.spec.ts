import { ConfigService } from "@nestjs/config";
import { FomoV2LaunchpadDeploymentService } from "./launchpad-deployment.service";

describe("FomoV2LaunchpadDeploymentService", () => {
  it("uses the BSC testnet Launchpad deployment defaults", () => {
    const deployment = new FomoV2LaunchpadDeploymentService(
      new ConfigService({})
    ).getDeployment();

    expect(deployment).toMatchObject({
      chainId: 97,
      launchpadAddress: "0x0608B52aAC58E7313481d0809E8b4525BDD11d33",
      investTokenAddress: "0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948",
      investTokenDecimals: 18,
      investTokenSymbol: "USDT",
      stakingNftAddress: "0x512C670006456D46679A67456eBe8564810C5609",
      nftMarketAddress: "0x40198F1A090d9893d7822F8804e5317E28C5A776",
    });
  });
});
