import { ExecutionContext } from "@nestjs/common";
import { CurrentRatingAdminGuard } from "./current-rating-admin.guard";

describe("CurrentRatingAdminGuard", () => {
  const userId = "507f1f77bcf86cd799439011";

  function createHarness(currentUser: any, claims: any = { _id: userId }) {
    const findOne = jest.fn().mockResolvedValue(currentUser);
    const collection = jest.fn().mockReturnValue({ findOne });
    const guard = new CurrentRatingAdminGuard({ db: { collection } } as any);
    const request: any = { user: claims };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    return { guard, context, collection, findOne };
  }

  it("allows an active current admin account", async () => {
    const { guard, context, collection, findOne } = createHarness({
      isActive: true,
      role: ["admin"],
      is2FAEnabled: false,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(collection).toHaveBeenCalledWith("users");
    expect(findOne.mock.calls[0][0]._id.toHexString()).toBe(userId);
  });

  it.each([
    ["inactive", { isActive: false, role: ["admin"] }],
    ["deleted", null],
    ["no longer an admin", { isActive: true, role: ["user"] }],
  ])("rejects a %s current account", async (_label, currentUser) => {
    const { guard, context } = createHarness(currentUser);

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it.each([
    [
      "pre-enrollment claims",
      { _id: userId, is2FAEnabled: false, is2FAVerified: true },
    ],
    [
      "unverified 2FA claims",
      { _id: userId, is2FAEnabled: true, is2FAVerified: false },
    ],
    ["missing 2FA claims", { _id: userId }],
  ])(
    "rejects %s when the current account requires 2FA",
    async (_label, claims) => {
      const { guard, context } = createHarness(
        { isActive: true, role: ["admin"], is2FAEnabled: true },
        claims
      );

      await expect(guard.canActivate(context)).resolves.toBe(false);
    }
  );

  it("accepts strictly verified claims when the current account requires 2FA", async () => {
    const { guard, context } = createHarness(
      { isActive: true, role: "admin", is2FAEnabled: true },
      { _id: userId, is2FAEnabled: true, is2FAVerified: true }
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("requires the signed _id claim and fails closed on database errors", async () => {
    const missingSignedId = createHarness(
      { isActive: true, role: ["admin"] },
      { id: userId }
    );
    await expect(
      missingSignedId.guard.canActivate(missingSignedId.context)
    ).resolves.toBe(false);
    expect(missingSignedId.collection).not.toHaveBeenCalled();

    const databaseFailure = createHarness({ isActive: true, role: ["admin"] });
    databaseFailure.findOne.mockRejectedValue(
      new Error("database unavailable")
    );
    await expect(
      databaseFailure.guard.canActivate(databaseFailure.context)
    ).resolves.toBe(false);
  });
});
