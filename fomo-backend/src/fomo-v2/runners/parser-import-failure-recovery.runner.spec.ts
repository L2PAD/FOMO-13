import {
  assertRecoverySafety,
  parseArgs,
} from "./parser-import-failure-recovery.runner";

const exactIdentity = [
  "--pipeline=activities",
  "--source=dropstab",
  "--database=parser",
  "--collection=crypto_activities",
];

describe("parser import failure recovery runner", () => {
  it("defaults to a bounded read-only list", () => {
    const args = parseArgs(exactIdentity);
    expect(args).toEqual(
      expect.objectContaining({ action: "list", limit: 50, write: false })
    );
    expect(() => assertRecoverySafety(args)).not.toThrow();
  });

  it("requires an exact document and both write confirmations for requeue", () => {
    expect(() =>
      assertRecoverySafety(
        parseArgs([
          ...exactIdentity,
          "--action=requeue",
          "--document-id=42",
          "--write=true",
        ])
      )
    ).toThrow("--confirm-write=true");

    expect(() =>
      assertRecoverySafety(
        parseArgs([
          ...exactIdentity,
          "--action=requeue",
          "--document-id=42",
          "--write=true",
          "--confirm-write=true",
        ])
      )
    ).not.toThrow();
  });

  it("rejects implicit or explicit all-document mutation", () => {
    expect(() => parseArgs([...exactIdentity, "--all=true"])).toThrow(
      "Unknown option --all"
    );
    expect(() =>
      assertRecoverySafety(
        parseArgs([
          ...exactIdentity,
          "--action=requeue",
          "--write=true",
          "--confirm-write=true",
        ])
      )
    ).toThrow("exact --document-id");
  });
});
