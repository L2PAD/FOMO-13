const ENABLED_VALUES = new Set(["true", "1", "yes", "on"]);

/**
 * Reminder delivery is an opt-in background worker. Keeping the default off
 * prevents an API process or a newly deployed replica from acquiring reminder
 * leases and writing notification state unless operations explicitly enables it.
 */
export function isFomoV2UnlockReminderWorkerEnabled(
  value = process.env.FOMO_V2_UNLOCK_REMINDER_WORKER_ENABLED
): boolean {
  return ENABLED_VALUES.has(String(value ?? "").trim().toLowerCase());
}
