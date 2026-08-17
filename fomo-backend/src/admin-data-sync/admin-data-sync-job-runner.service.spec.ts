import { ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AdminDataSyncConfigService } from "./admin-data-sync-config.service";
import { AdminDataSyncJobRunnerService } from "./admin-data-sync-job-runner.service";

const makeConfig = (env: Record<string, string> = {}) =>
  new AdminDataSyncConfigService(
    new ConfigService({
      ADMIN_DATA_SYNC_ENABLED: "true",
      ADMIN_DATA_SYNC_PROD_DB_NAME: "fomo_live",
      ADMIN_DATA_SYNC_DEV_DB_NAME: "fomo_dev",
      ...env,
    })
  );

describe("AdminDataSyncJobRunnerService", () => {
  it("blocks prod to dev run when run mode is disabled", async () => {
    const service = new AdminDataSyncJobRunnerService(
      {} as any,
      {} as any,
      makeConfig({ ADMIN_DATA_SYNC_PROD_TO_DEV_RUN_MODE: "disabled" })
    );

    await expect(service.queueProdToDevJob("admin-1")).rejects.toThrow(
      ServiceUnavailableException
    );
  });

  it("queues host-runner jobs without executing shell or Docker commands", async () => {
    const job = {
      _id: "job-1",
      status: "queued",
      sourceDb: "fomo_live",
      targetDb: "fomo_dev",
      collections: [],
    };
    const jobModel = {
      findOne: jest.fn(() => ({ lean: async () => null })),
      create: jest.fn(async (doc: any) => ({ ...job, ...doc })),
    };
    const auditModel = { create: jest.fn(async (doc: any) => doc) };
    const service = new AdminDataSyncJobRunnerService(
      jobModel as any,
      auditModel as any,
      makeConfig({ ADMIN_DATA_SYNC_PROD_TO_DEV_RUN_MODE: "host-runner" })
    );

    const result = await service.queueProdToDevJob("admin-1");

    expect(result).toEqual({
      jobId: "job-1",
      status: "queued",
      runMode: "host-runner",
    });
    expect(jobModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "queued",
        sourceDb: "fomo_live",
        targetDb: "fomo_dev",
      })
    );
    expect(auditModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "prod_to_dev_job_queued",
        details: expect.objectContaining({ runMode: "host-runner" }),
      })
    );
  });
});

