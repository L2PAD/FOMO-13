import { ResolveCanonicalProjectService } from "./resolve-canonical-project.service";

const query = (value: any[]) => ({
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

const model = (handler?: (filter: any) => any[]) => ({
  find: jest.fn((filter: any) => query(handler ? handler(filter) : [])),
  create: jest.fn(),
  updateOne: jest.fn(),
  bulkWrite: jest.fn(),
  findOneAndUpdate: jest.fn(),
});

const includes = (filter: any, value: string) => JSON.stringify(filter).includes(value);

function createService(overrides: Record<string, any> = {}) {
  const canonicalProjectModel = overrides.canonicalProjectModel || model();
  const canonicalProjectSourceModel = overrides.canonicalProjectSourceModel || model();
  const sourceEntityModel = overrides.sourceEntityModel || model();
  const marketAssetModel = overrides.marketAssetModel || model();
  const projectAssetLinkModel = overrides.projectAssetLinkModel || model();

  const service = new ResolveCanonicalProjectService(
    canonicalProjectModel as any,
    canonicalProjectSourceModel as any,
    sourceEntityModel as any,
    marketAssetModel as any,
    projectAssetLinkModel as any,
  );

  return {
    service,
    canonicalProjectModel,
    canonicalProjectSourceModel,
    sourceEntityModel,
    marketAssetModel,
    projectAssetLinkModel,
  };
}

describe("ResolveCanonicalProjectService", () => {
  it("matches by provider id exactly", async () => {
    const canonicalProjectModel = model((filter) =>
      includes(filter, "providerIds.coingeckoId") ? [{ _id: "canonical-1" }] : [],
    );
    const { service } = createService({ canonicalProjectModel });

    const result = await service.resolveCanonicalProject({
      source: "coingecko",
      sourceEntityType: "asset",
      providerIds: { coingeckoId: "bitcoin" },
    });

    expect(result).toMatchObject({
      status: "matched",
      canonicalProjectId: "canonical-1",
      verified: true,
      confidence: "exact",
      matchedBy: "provider_id",
    });
  });

  it("matches by contract only when chain is present", async () => {
    const marketAssetModel = model(() => [{ _id: "asset-1" }]);
    const projectAssetLinkModel = model(() => [{ canonicalProjectId: "canonical-1" }]);
    const { service } = createService({ marketAssetModel, projectAssetLinkModel });

    const result = await service.resolveCanonicalProject({
      source: "coingecko",
      sourceEntityType: "asset",
      contracts: [{ chainSlug: "ethereum", address: "0xABC" }],
    });

    expect(result).toMatchObject({
      status: "matched",
      canonicalProjectId: "canonical-1",
      verified: true,
      confidence: "exact",
      matchedBy: "contract",
    });
    expect(marketAssetModel.find).toHaveBeenCalled();
  });

  it("rejects address-only contract matching", async () => {
    const marketAssetModel = model(() => [{ _id: "asset-1" }]);
    const { service } = createService({ marketAssetModel });

    const result = await service.resolveCanonicalProject({
      source: "coingecko",
      sourceEntityType: "asset",
      contracts: [{ address: "0xABC" }],
    });

    expect(result.status).toBe("created_candidate");
    expect(result.actions[0]?.type).toBe("would_create_canonical_project");
    expect(marketAssetModel.find).not.toHaveBeenCalled();
  });

  it("matches by source entity", async () => {
    const sourceEntityModel = model((filter) =>
      filter.sourceId === "dropstab-1" ? [{ canonicalProjectId: "canonical-1" }] : [],
    );
    const { service } = createService({ sourceEntityModel });

    const result = await service.resolveCanonicalProject({
      source: "dropstab",
      sourceEntityType: "project",
      sourceId: "dropstab-1",
    });

    expect(result).toMatchObject({
      status: "matched",
      canonicalProjectId: "canonical-1",
      verified: true,
      confidence: "exact",
      matchedBy: "source_entity",
    });
  });

  it("returns proposed for unique strong identity bundle", async () => {
    const canonicalProjectModel = model((filter) =>
      includes(filter, "strong-project") && includes(filter, "normalizedName")
        ? [{ _id: "canonical-1" }]
        : [],
    );
    const { service } = createService({ canonicalProjectModel });

    const result = await service.resolveCanonicalProject({
      source: "icodrops",
      sourceEntityType: "project",
      sourceSlug: "strong-project",
      name: "Strong Project",
      symbol: "STR",
    });

    expect(result).toMatchObject({
      status: "proposed",
      canonicalProjectId: "canonical-1",
      verified: false,
      confidence: "high",
      matchedBy: "strong_identity_bundle",
    });
  });

  it("returns conflict for strong identity bundle with multiple candidates", async () => {
    const canonicalProjectModel = model((filter) =>
      includes(filter, "strong-project") && includes(filter, "normalizedName")
        ? [{ _id: "canonical-1" }, { _id: "canonical-2" }]
        : [],
    );
    const { service } = createService({ canonicalProjectModel });

    const result = await service.resolveCanonicalProject({
      source: "icodrops",
      sourceEntityType: "project",
      sourceSlug: "strong-project",
      name: "Strong Project",
      symbol: "STR",
    });

    expect(result.status).toBe("conflict");
    expect(result.canonicalProjectId).toBeUndefined();
    expect(result.conflicts[0]).toMatchObject({
      type: "strong_identity_bundle",
      candidateIds: ["canonical-1", "canonical-2"],
    });
  });

  it("returns proposed for name-only and never verifies it", async () => {
    const canonicalProjectModel = model((filter) =>
      includes(filter, "normalizedName") && !includes(filter, "normalizedSymbol")
        ? [{ _id: "canonical-1" }]
        : [],
    );
    const { service } = createService({ canonicalProjectModel });

    const result = await service.resolveCanonicalProject({
      source: "parser",
      sourceEntityType: "project",
      name: "Name Only",
    });

    expect(result).toMatchObject({
      status: "proposed",
      canonicalProjectId: "canonical-1",
      verified: false,
      matchedBy: "name_only",
      confidence: "medium",
    });
  });

  it("returns proposed for symbol-only and never verifies it", async () => {
    const canonicalProjectModel = model((filter) =>
      includes(filter, "normalizedSymbol") ? [{ _id: "canonical-1" }] : [],
    );
    const { service } = createService({ canonicalProjectModel });

    const result = await service.resolveCanonicalProject({
      source: "parser",
      sourceEntityType: "project",
      symbol: "SYM",
    });

    expect(result).toMatchObject({
      status: "proposed",
      canonicalProjectId: "canonical-1",
      verified: false,
      matchedBy: "symbol_only",
      confidence: "low",
    });
  });

  it("parser symbol-only candidate stays proposed and does not write links automatically", async () => {
    const canonicalProjectModel = model((filter) =>
      includes(filter, "normalizedSymbol") ? [{ _id: "canonical-1" }] : [],
    );
    const { service, projectAssetLinkModel, canonicalProjectSourceModel } = createService({ canonicalProjectModel });

    const result = await service.resolveCanonicalProject({
      source: "parser",
      sourceEntityType: "project",
      symbol: "SYM",
    });

    expect(result).toMatchObject({
      status: "proposed",
      canonicalProjectId: "canonical-1",
      verified: false,
      matchedBy: "symbol_only",
    });
    expect(projectAssetLinkModel.create).not.toHaveBeenCalled();
    expect(projectAssetLinkModel.updateOne).not.toHaveBeenCalled();
    expect(projectAssetLinkModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(canonicalProjectSourceModel.create).not.toHaveBeenCalled();
    expect(canonicalProjectSourceModel.updateOne).not.toHaveBeenCalled();
    expect(canonicalProjectSourceModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns created_candidate action when no match exists", async () => {
    const { service } = createService();

    const result = await service.resolveCanonicalProject({
      source: "icodrops",
      sourceEntityType: "project",
      name: "New Project",
      symbol: "NEW",
    });

    expect(result).toMatchObject({
      status: "created_candidate",
      verified: false,
      confidence: "none",
      matchedBy: "none",
    });
    expect(result.actions).toEqual([
      expect.objectContaining({ type: "would_create_canonical_project" }),
    ]);
  });

  it("conflict returns no canonicalProjectId", async () => {
    const canonicalProjectModel = model((filter) =>
      includes(filter, "providerIds.coingeckoId")
        ? [{ _id: "canonical-1" }, { _id: "canonical-2" }]
        : [],
    );
    const { service } = createService({ canonicalProjectModel });

    const result = await service.resolveCanonicalProject({
      source: "coingecko",
      sourceEntityType: "asset",
      providerIds: { coingeckoId: "duplicate-id" },
    });

    expect(result.status).toBe("conflict");
    expect(result.canonicalProjectId).toBeUndefined();
    expect(result.conflicts[0].candidateIds).toEqual(["canonical-1", "canonical-2"]);
  });

  it("does not call write methods while resolving", async () => {
    const canonicalProjectModel = model((filter) =>
      includes(filter, "providerIds.coingeckoId") ? [{ _id: "canonical-1" }] : [],
    );
    const { service } = createService({ canonicalProjectModel });

    await service.resolveCanonicalProject({
      source: "coingecko",
      sourceEntityType: "asset",
      providerIds: { coingeckoId: "bitcoin" },
    });

    expect(canonicalProjectModel.create).not.toHaveBeenCalled();
    expect(canonicalProjectModel.updateOne).not.toHaveBeenCalled();
    expect(canonicalProjectModel.bulkWrite).not.toHaveBeenCalled();
    expect(canonicalProjectModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
