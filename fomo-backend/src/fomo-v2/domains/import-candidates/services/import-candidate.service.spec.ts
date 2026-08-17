import { FomoV2ImportCandidateService } from "./import-candidate.service";

describe("FomoV2ImportCandidateService", () => {
  it("uses one atomic source-scoped upsert", async () => {
    const findOneAndUpdate = jest.fn().mockResolvedValue({
      value: { _id: "candidate-1", seenCount: 1 },
      lastErrorObject: { upserted: "candidate-1", updatedExisting: false },
    });
    const service = new FomoV2ImportCandidateService({
      findOneAndUpdate,
    } as any);

    const result = await service.createOrUpdateCandidate({
      domain: "vesting",
      entityType: "project",
      sourceType: "dropstab",
      sourceId: "project-1",
      name: "Project One",
      payload: { nested: { value: 1 } },
      metadata: { importer: "test" },
    });

    expect(result.created).toBe(true);
    expect(findOneAndUpdate).toHaveBeenCalledTimes(1);
    const [filter, pipeline, options] = findOneAndUpdate.mock.calls[0];
    expect(filter.candidateFingerprint.$in).toContain(
      result.candidateFingerprint
    );
    expect(pipeline).toEqual([
      {
        $set: expect.objectContaining({
          sourceType: { $literal: "dropstab" },
          seenCount: { $add: [{ $ifNull: ["$seenCount", 0] }, 1] },
          payload: {
            $mergeObjects: [
              { $ifNull: ["$payload", {}] },
              { $literal: { nested: { value: 1 } } },
            ],
          },
        }),
      },
    ]);
    expect(options).toEqual(
      expect.objectContaining({ upsert: true, new: true, rawResult: true })
    );
  });

  it("produces different candidate identities for different providers", async () => {
    const findOneAndUpdate = jest
      .fn()
      .mockImplementation(async (filter) => ({
        value: { _id: filter.candidateFingerprint.$in[0] },
        lastErrorObject: { updatedExisting: true },
      }));
    const service = new FomoV2ImportCandidateService({
      findOneAndUpdate,
    } as any);
    const base = {
      domain: "funding",
      entityType: "project",
      name: "Same Project",
      normalizedName: "same_project",
    };

    const dropstab = await service.createOrUpdateCandidate({
      ...base,
      sourceType: "dropstab",
    });
    const icodrops = await service.createOrUpdateCandidate({
      ...base,
      sourceType: "icodrops",
    });

    expect(dropstab.candidateFingerprint).not.toBe(
      icodrops.candidateFingerprint
    );
    expect(dropstab.created).toBe(false);
    expect(icodrops.created).toBe(false);
  });

  it("maps aliases into one provider identity", async () => {
    const findOneAndUpdate = jest
      .fn()
      .mockImplementation(async (filter) => ({
        value: { _id: filter.candidateFingerprint.$in[0] },
        lastErrorObject: { updatedExisting: true },
      }));
    const service = new FomoV2ImportCandidateService({
      findOneAndUpdate,
    } as any);
    const base = {
      domain: "ico",
      entityType: "project",
      sourceId: "provider-1",
      name: "Alias Project",
    };

    const alias = await service.createOrUpdateCandidate({
      ...base,
      sourceType: "ICO-Drops",
    });
    const canonical = await service.createOrUpdateCandidate({
      ...base,
      sourceType: "icodrops",
    });

    expect(alias.candidateFingerprint).toBe(canonical.candidateFingerprint);
    expect(findOneAndUpdate.mock.calls[0][0]).toEqual(
      findOneAndUpdate.mock.calls[1][0]
    );
    expect(findOneAndUpdate.mock.calls[0][0].candidateFingerprint.$in).toHaveLength(
      3
    );
  });

  it("rejects a caller-supplied fingerprint that bypasses source identity", async () => {
    const service = new FomoV2ImportCandidateService({} as any);

    await expect(
      service.createOrUpdateCandidate({
        domain: "funding",
        entityType: "project",
        sourceType: "icodrops",
        name: "Project",
        candidateFingerprint: "legacy-unscoped-fingerprint",
      })
    ).rejects.toThrow("canonical source-scoped identity");
  });
});
