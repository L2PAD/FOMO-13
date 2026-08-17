import { Types } from "mongoose";
import { SpaceportNftCountResponse } from "src/spaceport-nft/spaceport-nft.service";
import { FomoV2ActivityAccessPolicyService } from "../domains/activities/services/activity-access-policy.service";
import { FomoV2SpaceportActivityEntitlementService } from "./spaceport-activity-entitlement.service";

const userId = new Types.ObjectId().toHexString();

const nftResponse = (
  overrides: Partial<SpaceportNftCountResponse>,
): SpaceportNftCountResponse => ({
  isSuccess: true,
  status: "ready",
  walletAddress: "0xwallet",
  count: 1,
  source: "contract",
  ...overrides,
});

describe("FomoV2SpaceportActivityEntitlementService", () => {
  const createService = ({
    response = nftResponse({}),
    persistedWallet = "0xwallet",
  }: {
    response?: SpaceportNftCountResponse;
    persistedWallet?: string | null;
  } = {}) => {
    const getWalletNftCount = jest.fn().mockResolvedValue(response);
    const exec = jest.fn().mockResolvedValue(
      persistedWallet === null ? null : { wallet: persistedWallet },
    );
    const lean = jest.fn(() => ({ exec }));
    const findOne = jest.fn(() => ({ lean }));
    const service = new FomoV2SpaceportActivityEntitlementService(
      { getWalletNftCount } as any,
      { findOne } as any,
    );

    return { exec, findOne, getWalletNftCount, service };
  };

  it.each([
    ["wallet", { wallet: " 0xwallet " }, "0xwallet"],
    [
      "walletAddress",
      { walletAddress: " 0xwalletAddress " },
      "0xwalletaddress",
    ],
    ["address", { address: " 0xaddress " }, "0xaddress"],
  ])(
    "verifies the %s claim against the persisted wallet",
    async (_claim, walletClaim, persistedWallet) => {
      const { getWalletNftCount, service } = createService({ persistedWallet });

      await service.resolve({ _id: userId, ...walletClaim });

      expect(getWalletNftCount).toHaveBeenCalledWith(persistedWallet);
    },
  );

  it("prefers wallet over the fallback address claims", async () => {
    const { getWalletNftCount, service } = createService();

    await service.resolve({
      _id: userId,
      wallet: "0xwallet",
      walletAddress: "0xwalletAddress",
      address: "0xaddress",
    });

    expect(getWalletNftCount).toHaveBeenCalledWith("0xwallet");
  });

  it("grants entitlement when the verified wallet has a positive NFT count", async () => {
    const { service } = createService({
      response: nftResponse({ count: 2 }),
    });

    await expect(
      service.resolve({ _id: userId, wallet: "0xwallet" }),
    ).resolves.toEqual({
      entitled: true,
      available: true,
    });
  });

  it("returns an available but denied entitlement for a zero NFT count", async () => {
    const { service } = createService({
      response: nftResponse({ count: 0 }),
    });

    await expect(
      service.resolve({ _id: userId, wallet: "0xwallet" }),
    ).resolves.toEqual({
      entitled: false,
      available: true,
    });
  });

  it("marks the entitlement check unavailable when the NFT lookup fails", async () => {
    const { service } = createService({
      response: nftResponse({
        isSuccess: false,
        status: "unavailable",
        count: null,
      }),
    });

    await expect(
      service.resolve({ _id: userId, wallet: "0xwallet" }),
    ).resolves.toEqual({
      entitled: false,
      available: false,
    });
  });

  it("denies a valid principal with no wallet claim without calling the NFT RPC", async () => {
    const { findOne, getWalletNftCount, service } = createService();

    await expect(service.resolve({ _id: userId })).resolves.toEqual({
      entitled: false,
      available: true,
    });
    expect(findOne).not.toHaveBeenCalled();
    expect(getWalletNftCount).not.toHaveBeenCalled();
  });

  it("denies a wallet-only initial JWT without calling the database or NFT RPC", async () => {
    const { findOne, getWalletNftCount, service } = createService();

    await expect(service.resolve({ wallet: "0xwallet" })).resolves.toEqual({
      entitled: false,
      available: true,
    });
    expect(findOne).not.toHaveBeenCalled();
    expect(getWalletNftCount).not.toHaveBeenCalled();
  });

  it("denies a missing or banned database principal without calling the NFT RPC", async () => {
    const { findOne, getWalletNftCount, service } = createService({
      persistedWallet: null,
    });

    await expect(
      service.resolve({ _id: userId, wallet: "0xwallet" }),
    ).resolves.toEqual({
      entitled: false,
      available: true,
    });
    expect(findOne).toHaveBeenCalledWith(
      { _id: expect.any(Types.ObjectId), banned: { $ne: true } },
      { wallet: 1 },
    );
    expect(getWalletNftCount).not.toHaveBeenCalled();
  });

  it("denies a wallet claim that does not match the database wallet", async () => {
    const { getWalletNftCount, service } = createService({
      persistedWallet: "0xotherwallet",
    });

    await expect(
      service.resolve({ _id: userId, walletAddress: "0xwallet" }),
    ).resolves.toEqual({
      entitled: false,
      available: true,
    });
    expect(getWalletNftCount).not.toHaveBeenCalled();
  });

  it.each([
    ["nft_required", nftResponse({ count: 0 })],
    [
      "entitlement_unavailable",
      nftResponse({ isSuccess: false, status: "unavailable", count: null }),
    ],
  ] as const)(
    "maps a verified Spaceport denial to the %s access-policy reason",
    async (reason, response) => {
      const { service: entitlementResolver } = createService({ response });
      const accessPolicy = new FomoV2ActivityAccessPolicyService(
        entitlementResolver,
      );

      await expect(
        accessPolicy.resolve("prime", { _id: userId, wallet: "0xwallet" }),
      ).resolves.toEqual({
        allowed: false,
        contentRedacted: true,
        reason,
      });
    },
  );
});
