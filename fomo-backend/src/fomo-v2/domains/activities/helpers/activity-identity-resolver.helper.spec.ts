import { ConflictException } from "@nestjs/common";
import { resolveActivityByIdentity } from "./activity-identity-resolver.helper";

describe("resolveActivityByIdentity", () => {
  it("keeps ObjectId/slug/legacy identities ahead of compatibility parser ids", async () => {
    const stable = { _id: "stable" };
    const fetch = jest
      .fn()
      .mockResolvedValueOnce([stable])
      .mockResolvedValueOnce([{ _id: "parser" }]);

    await expect(resolveActivityByIdentity("campaign", fetch)).resolves.toBe(
      stable
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([{ slug: "campaign" }]),
      }),
      1
    );
  });

  it("returns one compatibility parserActivityId match with a limit-two read", async () => {
    const parser = { _id: "provider-row" };
    const fetch = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([parser]);

    await expect(resolveActivityByIdentity("42", fetch)).resolves.toBe(parser);
    expect(fetch).toHaveBeenNthCalledWith(2, { parserActivityId: "42" }, 2);
  });

  it("throws a structured 409 when parserActivityId is ambiguous", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { _id: "dropstab-row" },
        { _id: "icodrops-row" },
      ]);

    let conflict: any;
    try {
      await resolveActivityByIdentity("42", fetch);
    } catch (error) {
      conflict = error;
    }

    expect(conflict).toBeInstanceOf(ConflictException);
    expect(conflict.getStatus()).toBe(409);
    expect(conflict.getResponse()).toEqual(
      expect.objectContaining({
        code: "AMBIGUOUS_ACTIVITY_PARSER_ID",
        parserActivityId: "42",
        candidateActivityIds: ["dropstab-row", "icodrops-row"],
      })
    );
  });
});
