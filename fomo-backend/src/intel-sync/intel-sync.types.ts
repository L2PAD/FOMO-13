export type IntelSyncJobName =
  | "funds-intel-investors"
  | "dropstab-investors"
  | "crypto-activities-parser-sync";

export type IntelSyncTrigger = "startup" | "cron" | "manual";

export interface IntelSyncWorkerLaunchResult {
  trigger: IntelSyncTrigger;
  skipped: boolean;
  started: boolean;
  job: IntelSyncJobName;
  pid?: number;
  reason?: string;
  options?: Record<string, any>;
}
