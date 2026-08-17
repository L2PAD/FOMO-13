import { JwtAuthGuard } from "./jwt.auth.guard";

function createContext(authorization = "Bearer token") {
  const request = {
    headers: { authorization },
  };

  return {
    request,
    context: {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any,
  };
}

describe("JwtAuthGuard role enforcement", () => {
  it("blocks non-admin roles from admin-only endpoints", () => {
    const { context } = createContext();
    const guard = new JwtAuthGuard(
      {
        verify: jest.fn(() => ({ role: ["moderator"] })),
        decode: jest.fn(() => ({
          _id: "admin-id",
          role: ["moderator"],
          is2FAEnabled: false,
        })),
      } as any,
      { get: jest.fn(() => "secret") } as any,
      { getAllAndOverride: jest.fn(() => ["admin"]) } as any
    );

    expect(guard.canActivate(context)).toBe(false);
  });
});

