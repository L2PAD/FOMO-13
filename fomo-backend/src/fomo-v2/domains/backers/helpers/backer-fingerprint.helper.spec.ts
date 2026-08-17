import { buildBackerSourceIdentityKey } from "./backer-fingerprint.helper";
import { normalizeBackerSourceRefs } from "./backer-normalize.helper";

describe("backer source identity helpers", () => {
  it("canonicalizes aliases while preserving provider separation", () => {
    expect(
      buildBackerSourceIdentityKey({
        sourceType: "intel-fund-raising",
        sourceInvestorId: "investor-1",
      })
    ).toBe("intel_fundraising:investor-1");
    expect(
      normalizeBackerSourceRefs([
        { sourceType: "ICO-Drops", sourceId: "investor-1" },
      ])[0]
    ).toMatchObject({ sourceType: "icodrops", sourceId: "investor-1" });
    expect(
      buildBackerSourceIdentityKey({
        sourceType: "icodrops",
        sourceInvestorId: "investor-1",
      })
    ).not.toBe(
      buildBackerSourceIdentityKey({
        sourceType: "dropstab",
        sourceInvestorId: "investor-1",
      })
    );
  });
});
