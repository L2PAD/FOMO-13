function readBooleanEnv(name: string): boolean | undefined {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") return undefined;

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;

  return undefined;
}

export function isCronEnabled(): boolean {
  const explicitCronEnabled = readBooleanEnv("CRON_ENABLED");
  if (explicitCronEnabled !== undefined) return explicitCronEnabled;

  return readBooleanEnv("IS_LOCAL_RUN") !== true;
}
