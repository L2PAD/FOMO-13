import { resolveFomoV2ParserExecutionPolicy } from "./parser-control-policy.service";

describe("resolveFomoV2ParserExecutionPolicy", () => {
  it("blocks every run while the global switch is off", () => {
    expect(
      resolveFomoV2ParserExecutionPolicy({
        globalEnabled: false,
        globalMode: "prod",
        paused: false,
        requestedMode: "write",
      })
    ).toMatchObject({
      canRun: false,
      effectiveMode: "dry-run",
      writesDomainData: false,
      blockedReason: "global-off",
    });
  });

  it("forces requested writes to dry-run in TEST", () => {
    expect(
      resolveFomoV2ParserExecutionPolicy({
        globalEnabled: true,
        globalMode: "test",
        paused: false,
        requestedMode: "write",
      })
    ).toEqual({
      canRun: true,
      canWrite: false,
      effectiveMode: "dry-run",
      writesDomainData: false,
      downgraded: true,
      blockedReason: "test-mode",
    });
  });

  it("allows a write only in PROD for an unpaused parser", () => {
    expect(
      resolveFomoV2ParserExecutionPolicy({
        globalEnabled: true,
        globalMode: "prod",
        paused: false,
        requestedMode: "write",
      })
    ).toMatchObject({
      canRun: true,
      canWrite: true,
      effectiveMode: "write",
      writesDomainData: true,
      downgraded: false,
    });
  });

  it("blocks both modes for a paused source", () => {
    expect(
      resolveFomoV2ParserExecutionPolicy({
        globalEnabled: true,
        globalMode: "prod",
        paused: true,
        requestedMode: "dry-run",
      })
    ).toMatchObject({
      canRun: false,
      writesDomainData: false,
      blockedReason: "parser-paused",
    });
  });
});
