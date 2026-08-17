export interface ParserImportSafetyOptions {
  label: string;
  write: boolean;
  confirmWrite: boolean;
  all?: boolean;
  allConfirmed?: boolean;
}

export function parseStrictBoolean(value: string, optionName: string): boolean {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new Error(
    `Invalid --${optionName} boolean value "${value}". Use true or false.`
  );
}

export function assertParserImportSafety(
  options: ParserImportSafetyOptions
): void {
  if (options.write && !options.confirmWrite) {
    throw new Error(
      `${options.label} write mode requires --confirm-write=true.`
    );
  }
  if (options.all && !options.allConfirmed) {
    throw new Error(`${options.label} --all requires --all-confirmed=true.`);
  }
}

export function assertNoParserImportExecutionErrors(
  result: unknown,
  label: string
): void {
  const value = result as Record<string, any> | null | undefined;
  const failureCount = Math.max(
    toFailureCount(value?.errors),
    toFailureCount(value?.failed),
    toFailureCount(value?.summary?.failed)
  );
  if (failureCount > 0) {
    throw new Error(
      `${label} completed with ${failureCount} execution error${
        failureCount === 1 ? "" : "s"
      }.`
    );
  }
}

function toFailureCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  return value === true ? 1 : 0;
}
