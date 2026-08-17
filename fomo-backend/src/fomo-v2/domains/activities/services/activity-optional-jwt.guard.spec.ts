import { FomoV2ActivityOptionalJwtGuard } from "./activity-optional-jwt.guard";

describe("FomoV2ActivityOptionalJwtGuard", () => {
  const configService = {
    get: jest.fn().mockReturnValue("test-secret"),
  };

  const contextFor = (request: Record<string, any>) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    } as any);

  it("attaches a fully verified principal", () => {
    const payload = {
      _id: "507f1f77bcf86cd799439011",
      wallet: "0xabc",
      is2FAEnabled: true,
      is2FAVerified: true,
    };
    const jwtService = { verify: jest.fn().mockReturnValue(payload) };
    const guard = new FomoV2ActivityOptionalJwtGuard(
      jwtService as any,
      configService as any,
    );
    const request: Record<string, any> = {
      headers: { authorization: "Bearer valid" },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.user).toEqual(payload);
  });

  it("treats a pre-2FA token as anonymous and clears existing request state", () => {
    const jwtService = {
      verify: jest.fn().mockReturnValue({
        _id: "507f1f77bcf86cd799439011",
        wallet: "0xabc",
        is2FAEnabled: true,
        is2FAVerified: false,
      }),
    };
    const guard = new FomoV2ActivityOptionalJwtGuard(
      jwtService as any,
      configService as any,
    );
    const request: Record<string, any> = {
      headers: { authorization: "Bearer pending" },
      user: { wallet: "must-not-survive" },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.user).toBeUndefined();
  });

  it("keeps public reads anonymous when token verification fails", () => {
    const jwtService = {
      verify: jest.fn().mockImplementation(() => {
        throw new Error("invalid token");
      }),
    };
    const guard = new FomoV2ActivityOptionalJwtGuard(
      jwtService as any,
      configService as any,
    );
    const request: Record<string, any> = {
      headers: { authorization: "Bearer invalid" },
      user: { wallet: "must-not-survive" },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.user).toBeUndefined();
  });
});
