import {
  assertIndexWriteSafety,
  parseArgs,
} from "./fomo-v2-indexes.runner";

describe("fomo-v2-indexes runner safety", () => {
  it("rejects misspelled boolean values", () => {
    expect(() => parseArgs(["--force=flase"])).toThrow(
      'Invalid --force boolean value "flase"'
    );
    expect(() => parseArgs(["--confirm-write=treu"])).toThrow(
      'Invalid --confirm-write boolean value "treu"'
    );
  });

  it("requires explicit write confirmation in every environment", () => {
    expect(() =>
      assertIndexWriteSafety(
        { force: true, confirmWrite: false },
        { dbName: "fomo_test", nodeEnv: "test" }
      )
    ).toThrow("requires --confirm-write=true");
  });

  it("requires force for production regardless of its database name", () => {
    expect(() =>
      assertIndexWriteSafety(
        { force: false, confirmWrite: true },
        { dbName: "fomo_live", nodeEnv: "production" }
      )
    ).toThrow("production");
  });

  it("accepts a fully confirmed production migration", () => {
    expect(() =>
      assertIndexWriteSafety(
        { force: true, confirmWrite: true },
        { dbName: "fomo_live", nodeEnv: "production" }
      )
    ).not.toThrow();
  });
});
