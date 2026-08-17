import { Types } from "mongoose";
import { FomoV2ProjectSourceProfileSchema } from "../../project-profiles";
import { FomoV2IcoProjectReadModelSchema } from "../models";
import { IcoProjectProfileImportService } from "./ico-project-profile-import.service";

function createService(projectSourceProfileModel: any = {}) {
  return new IcoProjectProfileImportService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    projectSourceProfileModel,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    undefined
  );
}

describe("IcoProjectProfileImportService source identity", () => {
  it("upserts profile and read model by canonical project within source", () => {
    const service = createService();
    const canonicalProjectId = new Types.ObjectId();
    const payload = {
      canonicalProjectId,
      sourceType: "icodrops",
      sourceProjectId: "provider-id",
      sourceSlug: "same-slug",
      slug: "same-slug",
      hasMarketData: false,
    };

    const profileFilter = (service as any).profileUpsertFilter(payload);
    const readModelFilter = (service as any).readModelUpsertFilter(payload);

    expect(profileFilter.canonicalProjectId).toEqual(canonicalProjectId);
    expect(readModelFilter.canonicalProjectId).toEqual(canonicalProjectId);
    expect(profileFilter.sourceType).toBeInstanceOf(RegExp);
    expect(readModelFilter.sourceType).toBeInstanceOf(RegExp);
    expect(profileFilter.sourceType.test("ICO-Drops")).toBe(true);
    expect(readModelFilter.sourceType.test("ico_drops")).toBe(true);
    expect(profileFilter.sourceType.test("dropstab")).toBe(false);
  });

  it("allows the same external value in another source but rejects it within the same source", async () => {
    const canonicalProjectId = new Types.ObjectId();
    const conflictingCanonicalId = new Types.ObjectId();
    const lean = jest.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
      canonicalProjectId: conflictingCanonicalId,
    });
    const findOne = jest.fn().mockReturnValue({ lean });
    const service = createService({ findOne });

    await expect(
      (service as any).assertSourceProfileIdentityAvailable({
        canonicalProjectId,
        sourceType: "icodrops",
        sourceProjectId: "shared-id",
        sourceSlug: "shared-slug",
      })
    ).rejects.toThrow("Source identity conflict");
    const [conflictFilter] = findOne.mock.calls[0];
    expect(conflictFilter).toEqual(
      expect.objectContaining({
        sourceType: expect.any(RegExp),
        canonicalProjectId: { $ne: canonicalProjectId },
        $or: [
          { sourceProjectId: "shared-id" },
          { sourceSlug: "shared-slug" },
        ],
      })
    );
    expect(conflictFilter.sourceType.test("ico-drops")).toBe(true);
    expect(findOne.mock.calls[0][1]).toEqual(expect.any(Object));
  });

  it("declares provider-scoped unique profile and read-model indexes", () => {
    const profileIndexes = FomoV2ProjectSourceProfileSchema.indexes() as any[];
    const readIndexes = FomoV2IcoProjectReadModelSchema.indexes() as any[];

    const providerId = profileIndexes.find(
      ([, options]) =>
        options?.name === "uniq_project_source_profiles_source_project_id"
    );
    const providerSlug = profileIndexes.find(
      ([, options]) =>
        options?.name === "uniq_project_source_profiles_source_slug"
    );
    const readIdentity = readIndexes.find(
      ([, options]) =>
        options?.name === "uniq_ico_project_read_models_project_source"
    );

    expect(providerId?.[0]).toEqual({ sourceType: 1, sourceProjectId: 1 });
    expect(providerId?.[1]?.unique).toBe(true);
    expect(providerSlug?.[0]).toEqual({ sourceType: 1, sourceSlug: 1 });
    expect(providerSlug?.[1]?.unique).toBe(true);
    expect(readIdentity?.[0]).toEqual({
      canonicalProjectId: 1,
      sourceType: 1,
    });
    expect(readIdentity?.[1]?.unique).toBe(true);
  });

  it("does not silently classify rows without source as ICODrops", () => {
    const service = createService();

    const icoQuery = (service as any).sourceQuery("icodrops");
    const dropstabQuery = (service as any).sourceQuery("dropstab");
    const legacyQuery = (service as any).sourceQuery("icodrops", true);

    expect(icoQuery.source).toBeInstanceOf(RegExp);
    expect(icoQuery.source.test("ICO-Drops")).toBe(true);
    expect(icoQuery.source.test("dropstab")).toBe(false);
    expect(dropstabQuery.source).toBeInstanceOf(RegExp);
    expect(dropstabQuery.source.test("drop-stab")).toBe(true);
    expect(legacyQuery.$or).toEqual([
      { source: expect.any(RegExp) },
      { source: { $exists: false } },
      { source: null },
      { source: "" },
    ]);
    expect(legacyQuery.$or[0].source.test("ico-drops")).toBe(true);
  });
});
