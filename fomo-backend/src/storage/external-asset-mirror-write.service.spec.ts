import axios from "axios";
import { ExternalAssetMirrorWriteService } from "./external-asset-mirror-write.service";

jest.mock("axios", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe("ExternalAssetMirrorWriteService", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uploads a new external image and records its managed URL", async () => {
    const mirrorModel = {
      findOne: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      }),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const storage = {
      writeFile: jest.fn().mockResolvedValue({
        key: "external/unknown/test.jpg",
        url: "https://assets.fomo.cx/external/unknown/test.jpg",
      }),
    };
    (axios.get as jest.Mock).mockResolvedValue({
      status: 200,
      data: jpeg,
      headers: { "content-type": "image/jpeg" },
    });
    const service = new ExternalAssetMirrorWriteService(
      mirrorModel as any,
      storage as any
    );

    await expect(
      service.mirrorUrl("https://8.8.8.8/activity.jpg", {
        collection: "activities",
        documentId: "activity-1",
        fieldPath: "currentDraft.logo",
      })
    ).resolves.toBe("https://assets.fomo.cx/external/unknown/test.jpg");
    expect(storage.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ buffer: jpeg, mimeType: "image/jpeg" })
    );
    expect(mirrorModel.updateOne).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $set: expect.objectContaining({
          publicUrl: "https://assets.fomo.cx/external/unknown/test.jpg",
          status: "ok",
        }),
      }),
      { upsert: true }
    );
  });

  it("reuses an existing mirror without downloading it again", async () => {
    const mirrorModel = {
      findOne: jest.fn().mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue({
            status: "ok",
            publicUrl: "https://assets.fomo.cx/existing.jpg",
          }),
        }),
      }),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const storage = { writeFile: jest.fn() };
    const service = new ExternalAssetMirrorWriteService(
      mirrorModel as any,
      storage as any
    );

    await expect(
      service.mirrorUrl("https://airdrops.io/existing.jpg", {
        collection: "activities",
        documentId: "activity-2",
        fieldPath: "currentDraft.logo",
      })
    ).resolves.toBe("https://assets.fomo.cx/existing.jpg");
    expect(axios.get).not.toHaveBeenCalled();
    expect(storage.writeFile).not.toHaveBeenCalled();
  });
});
