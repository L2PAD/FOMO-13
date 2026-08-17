import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
  projectSourceTypeStorageAliases,
} from "./project-domain-source.helper";

describe("normalizeProjectSourceType", () => {
  it.each(["icodrops", "ico-drops", "ICO-Drops", "ico_drops"])(
    "canonicalizes %s to icodrops",
    (value) => {
      expect(normalizeProjectSourceType(value)).toBe("icodrops");
    }
  );

  it.each(["dropstab", "drop-stab", "Drop_Stab"])(
    "canonicalizes %s to dropstab",
    (value) => {
      expect(normalizeProjectSourceType(value)).toBe("dropstab");
    }
  );

  it("keeps a normalized unknown source for non-runtime domain policies", () => {
    expect(normalizeProjectSourceType("Partner Feed")).toBe("partner_feed");
  });

  it("exposes legacy storage aliases for safe lazy canonicalization", () => {
    expect(projectSourceTypeStorageAliases("icodrops")).toEqual(
      expect.arrayContaining(["icodrops", "ico_drops", "icodrop"])
    );
    const matcher = projectSourceTypeMongoPattern("icodrops");
    expect(matcher.test("ICO-Drops")).toBe(true);
    expect(matcher.test("ico_drops")).toBe(true);
    expect(matcher.test("dropstab")).toBe(false);
  });
});
