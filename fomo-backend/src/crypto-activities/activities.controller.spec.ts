import { ActivitiesController } from "./activities.controller";

describe("ActivitiesController optional authentication", () => {
  const buildController = (payload: Record<string, any>) => {
    const jwtService = {
      verify: jest.fn().mockReturnValue(payload),
    };
    const controller = new ActivitiesController(
      {} as any,
      {} as any,
      {} as any,
      jwtService as any,
      { get: jest.fn().mockReturnValue("secret") } as any,
      {} as any,
      {} as any
    );

    return { controller, jwtService };
  };

  const request = {
    headers: { authorization: "Bearer access-token" },
  } as any;

  it("treats a pre-2FA access token as anonymous", () => {
    const { controller } = buildController({
      _id: "user-id",
      is2FAEnabled: true,
      is2FAVerified: false,
    });

    expect((controller as any).getOptionalUser(request)).toBeUndefined();
  });

  it("accepts a fully verified 2FA access token", () => {
    const payload = {
      _id: "user-id",
      is2FAEnabled: true,
      is2FAVerified: true,
    };
    const { controller } = buildController(payload);

    expect((controller as any).getOptionalUser(request)).toBe(payload);
  });

  it("keeps non-2FA access tokens valid", () => {
    const payload = { _id: "user-id", is2FAEnabled: false };
    const { controller } = buildController(payload);

    expect((controller as any).getOptionalUser(request)).toBe(payload);
  });
});
