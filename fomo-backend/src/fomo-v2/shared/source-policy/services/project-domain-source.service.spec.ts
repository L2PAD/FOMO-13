import { Types } from "mongoose";
import { FomoV2ProjectDomainSourceService } from "./project-domain-source.service";

describe("FomoV2ProjectDomainSourceService source aliases", () => {
  it("treats a legacy alias lock as the same provider", async () => {
    const existing = {
      _id: new Types.ObjectId(),
      canonicalProjectId: new Types.ObjectId(),
      domain: "vesting",
      selectedSourceType: "ICO-Drops",
      status: "locked",
    };
    const model = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existing),
      }),
    };
    const service = new FomoV2ProjectDomainSourceService(model as any);

    await expect(
      service.ensureLock({
        canonicalProjectId: existing.canonicalProjectId,
        domain: "vesting",
        sourceType: "icodrops",
      })
    ).resolves.toEqual({
      allowed: true,
      action: "matched_lock",
      lock: existing,
    });
  });
});
