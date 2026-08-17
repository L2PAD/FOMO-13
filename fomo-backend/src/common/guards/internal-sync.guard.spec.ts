import { ExecutionContext } from "@nestjs/common";
import { InternalSyncGuard } from "./internal-sync.guard";

describe("InternalSyncGuard", () => {
  const createHarness = (headers: Record<string, any> = {}) => {
    const request: any = { headers };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => "handler",
      getClass: () => "controller",
    } as unknown as ExecutionContext;
    const jwtService = {
      verify: jest.fn().mockReturnValue({
        _id: "admin-id",
        role: ["admin"],
        is2FAEnabled: true,
        is2FAVerified: true,
      }),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === "INTERNAL_SYNC_TOKEN") return "internal-secret";
        if (key === "JWT_SECRET_ACCESS") return "jwt-secret";
        return undefined;
      }),
    };
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["admin"]),
    };
    const guard = new InternalSyncGuard(
      jwtService as any,
      config as any,
      reflector as any,
    );

    return { guard, context, request, jwtService };
  };

  it("accepts a constant-time compatible internal token and sets admin context", () => {
    const { guard, context, request, jwtService } = createHarness({
      "x-internal-sync-token": "internal-secret",
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual({ role: ["admin"], internalSync: true });
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it("rejects an invalid internal token without falling back to JWT", () => {
    const { guard, context, jwtService } = createHarness({
      "x-internal-sync-token": "wrong-secret",
      authorization: "Bearer valid-jwt",
    });

    expect(guard.canActivate(context)).toBe(false);
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it("accepts only a strict Bearer header and uses the verified payload", () => {
    const valid = createHarness({ authorization: "Bearer valid-jwt" });
    expect(valid.guard.canActivate(valid.context)).toBe(true);
    expect(valid.jwtService.verify).toHaveBeenCalledWith("valid-jwt", {
      secret: "jwt-secret",
    });
    expect(valid.request.user).toEqual(
      expect.objectContaining({ _id: "admin-id", role: ["admin"] }),
    );

    const malformed = createHarness({ authorization: "Basic valid-jwt" });
    expect(malformed.guard.canActivate(malformed.context)).toBe(false);
    expect(malformed.jwtService.verify).not.toHaveBeenCalled();
  });
});
