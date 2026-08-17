import { Types } from "mongoose";
import { CryptoLinkingGraphService } from "./crypto-linking-graph.service";

function findOneQuery(value: any) {
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
}

function findQuery(value: any[]) {
  return {
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
}

describe("CryptoLinkingGraphService", () => {
  it("builds a project graph from active project back-references", async () => {
    const projectId = new Types.ObjectId();
    const fundId = new Types.ObjectId();
    const personId = new Types.ObjectId();
    const projectModel = {
      findOne: jest.fn().mockReturnValue(
        findOneQuery({
          _id: projectId,
          name: "Example",
          symbol: "EX",
          investors: [fundId],
          team: [personId],
        })
      ),
    };
    const fundsModel = {
      find: jest
        .fn()
        .mockReturnValue(
          findQuery([{ _id: fundId, name: "Example Ventures" }])
        ),
    };
    const personModel = {
      find: jest
        .fn()
        .mockReturnValue(
          findQuery([{ _id: personId, name: "Example Founder" }])
        ),
    };
    const service = new CryptoLinkingGraphService(
      projectModel as any,
      fundsModel as any,
      personModel as any,
      { resolve: jest.fn() } as any
    );

    const result = await service.graph("project", projectId.toHexString());

    expect(result.totalNodes).toBe(3);
    expect(result.graphData.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ relation: "linked_investor" }),
        expect.objectContaining({ relation: "linked_person" }),
      ])
    );
  });
});
