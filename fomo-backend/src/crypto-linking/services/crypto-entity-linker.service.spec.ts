import { CryptoEntityLinkerService } from "./crypto-entity-linker.service";

describe("CryptoEntityLinkerService", () => {
  function createService() {
    const proposal = {
      sourceEntityId: "project-1",
      sourceEntity: "project",
      operation: "linkInvestor",
      investorType: "fund",
      fundId: "fund-1",
      confidence: "exact",
      matchedBy: "sourceId",
      reason: "Exact source id",
    };
    const diagnosticsService = {
      audit: jest.fn().mockResolvedValue({
        diagnostics: {},
        samples: {},
        proposedUpdates: { investors: [proposal] },
      }),
    };
    const auditLogModel = {
      find: jest.fn(),
    };
    return {
      service: new CryptoEntityLinkerService(
        diagnosticsService as any,
        auditLogModel as any
      ),
      proposal,
    };
  }

  it("returns investor-only proposals and keeps writes disabled", async () => {
    const { service, proposal } = createService();

    const proposed = await service.buildProposedUpdates();
    expect(proposed.proposedUpdates).toEqual({ investors: [proposal] });

    const preview = await service.applyProposedUpdates({
      dryRun: true,
      entityTypes: ["investors"],
    });
    expect(preview.proposed).toEqual({ investors: 1 });
    expect(preview.applied).toEqual({ investors: 0 });
    expect(preview.operations).toEqual([
      expect.objectContaining({
        entityType: "investor",
        status: "skippedUnsupportedInvestorApply",
      }),
    ]);
  });

  it("blocks real investor writes", async () => {
    const { service } = createService();

    const result = await service.applyProposedUpdates({
      apply: true,
      dryRun: false,
      entityTypes: ["investors"],
    });

    expect(result.apply).toBe(false);
    expect(result.safetyWarnings).toContain(
      "Real apply for investors is disabled."
    );
  });
});
