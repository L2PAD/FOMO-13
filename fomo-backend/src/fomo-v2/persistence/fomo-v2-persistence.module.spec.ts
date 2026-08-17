import { MODULE_METADATA } from "@nestjs/common/constants";
import { MongooseModule } from "@nestjs/mongoose";
import { FomoV2PersistenceModule } from "./fomo-v2-persistence.module";

describe("FomoV2PersistenceModule", () => {
  it("exports primary model providers through MongooseModule", () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      FomoV2PersistenceModule
    );
    const exports = Reflect.getMetadata(
      MODULE_METADATA.EXPORTS,
      FomoV2PersistenceModule
    );

    expect(imports).toHaveLength(1);
    expect(imports[0]).toEqual(
      expect.objectContaining({ module: MongooseModule })
    );
    expect(exports).toEqual([MongooseModule]);
  });
});
