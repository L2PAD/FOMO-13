import { Types } from "mongoose";
import { IcoProjectResolverService } from "./ico-project-resolver.service";

function createService(projectSourceProfileModel: any = {}) {
  return new IcoProjectResolverService(
    projectSourceProfileModel,
    {} as any,
    {} as any,
    {} as any
  );
}

describe("IcoProjectResolverService source identity", () => {
  it("maps a generic sourceProjectId only to the matching provider", () => {
    const service = createService();

    const dropstab = service.toIdentity(
      {
        sourceProjectId: "Shared-ID",
        icodropsId: "ico-explicit",
        name: "Project",
      },
      "drop-stab"
    );
    const icodrops = service.toIdentity(
      { sourceProjectId: "Shared-ID", name: "Project" },
      "ico-drops"
    );

    expect(dropstab.sourceType).toBe("dropstab");
    expect(dropstab.providerIds.dropstabId).toBe("shared-id");
    expect(dropstab.providerIds.icodropsId).toBe("ico-explicit");
    expect(icodrops.sourceType).toBe("icodrops");
    expect(icodrops.providerIds.icodropsId).toBe("shared-id");
    expect(icodrops.providerIds.dropstabId).toBeUndefined();
  });

  it("uses the source-specific provider ID as source identity", () => {
    const service = createService();

    const identity = service.toIdentity(
      { dropstabId: "Drop-42", name: "Project" },
      "dropstab"
    );

    expect(identity.sourceProjectId).toBe("drop-42");
    expect(identity.providerIds.dropstabId).toBe("drop-42");
    expect(identity.providerIds.icodropsId).toBeUndefined();
  });

  it("resolves a persisted source profile written with a legacy alias", async () => {
    const canonicalProjectId = new Types.ObjectId();
    const lean = jest.fn().mockResolvedValue([
      {
        _id: new Types.ObjectId(),
        canonicalProjectId,
        sourceType: "ICO-Drops",
        sourceProjectId: "provider-id",
      },
    ]);
    const limit = jest.fn().mockReturnValue({ lean });
    const find = jest.fn().mockReturnValue({ limit });
    const service = createService({ find });

    const result = await (service as any).resolveByExistingSourceProfile({
      sourceType: "icodrops",
      sourceProjectId: "provider-id",
      providerIds: {},
    });

    expect(result.action).toBe("LINK_EXISTING");
    const filter = find.mock.calls[0][0];
    expect(filter.$or[0].sourceType).toBeInstanceOf(RegExp);
    expect(filter.$or[0].sourceType.test("ICO-Drops")).toBe(true);
    expect(filter.$or[0].sourceType.test("dropstab")).toBe(false);
  });
});
