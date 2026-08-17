import {
  assertNoParserImportExecutionErrors,
  assertParserImportSafety,
  parseStrictBoolean,
} from "./parser-import-runner.utils";

describe("parser import runner guardrails", () => {
  it("rejects misspelled boolean values", () => {
    expect(() => parseStrictBoolean("flase", "write")).toThrow(
      'Invalid --write boolean value "flase"'
    );
  });

  it("requires explicit confirmation for write mode", () => {
    expect(() =>
      assertParserImportSafety({
        label: "Example import",
        write: true,
        confirmWrite: false,
      })
    ).toThrow("--confirm-write=true");
  });

  it("requires all-confirmed whenever all is requested", () => {
    expect(() =>
      assertParserImportSafety({
        label: "Example import",
        write: false,
        confirmWrite: false,
        all: true,
        allConfirmed: false,
      })
    ).toThrow("--all-confirmed=true");
  });

  it("fails a runner only for reported execution errors", () => {
    expect(() =>
      assertNoParserImportExecutionErrors(
        { errors: [{ message: "write failed" }] },
        "Example import"
      )
    ).toThrow("completed with 1 execution error");
    expect(() =>
      assertNoParserImportExecutionErrors(
        { summary: { failed: 2 } },
        "Example import"
      )
    ).toThrow("completed with 2 execution errors");
  });

  it("does not treat dry-run findings as execution errors", () => {
    expect(() =>
      assertNoParserImportExecutionErrors(
        {
          errors: [],
          ambiguousMatches: 12,
          skippedSourceConflicts: 4,
          warnings: ["review required"],
        },
        "Example import"
      )
    ).not.toThrow();
  });
});
