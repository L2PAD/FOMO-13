import { buildDefaultRatingEntitiesConfig } from "./rating.defaults";
import { RatingRecalculationService } from "./rating-recalculation.service";

describe("RatingRecalculationService safeguards", () => {
  function createService(configService: any = {}) {
    return new RatingRecalculationService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      configService
    );
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fails a run when every scanned record failed calculation", () => {
    const service = createService();

    expect(() =>
      (service as any).assertRunCalculatedRecords("users", {
        scanned: 3,
        updated: 0,
        errors: 3,
      })
    ).toThrow("could not calculate any users records (3/3 failed)");

    expect(() =>
      (service as any).assertRunCalculatedRecords("users", {
        scanned: 3,
        updated: 2,
        errors: 1,
      })
    ).not.toThrow();
  });

  it("handles a rejected detached execution without an unhandled rejection", async () => {
    const configService = {
      getSnapshot: jest.fn().mockResolvedValue({
        version: 4,
        updatedAt: new Date(),
        entities: buildDefaultRatingEntitiesConfig(),
      }),
      acquireLease: jest.fn().mockResolvedValue({
        acquired: true,
        runtime: { fence: 2, startedAt: new Date() },
      }),
    };
    const service = createService(configService);
    jest
      .spyOn(service as any, "execute")
      .mockRejectedValue(new Error("status persistence unavailable"));
    const errorLog = jest
      .spyOn((service as any).logger, "error")
      .mockImplementation(() => undefined);

    await service.start("projects", "manual");
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining("status persistence unavailable"),
      expect.any(String)
    );
  });
});
