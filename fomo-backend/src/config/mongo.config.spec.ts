import {
  assertParserMongoConfiguration,
  buildParserMongoUri,
} from "./mongo.config";

describe("parser Mongo configuration", () => {
  it("keeps the legacy primary URI fallback outside production", () => {
    const uri = buildParserMongoUri({
      NODE_ENV: "development",
      DB_URL: "mongodb://localhost:27017/main",
      DB_NAME: "main",
      DB_PARSER_NAME: "parser_dev",
    } as NodeJS.ProcessEnv);

    expect(uri).toBe("mongodb://localhost:27017/parser_dev?authSource=admin");
  });

  it("uses an explicit parser URI and database", () => {
    const uri = buildParserMongoUri({
      DB_PARSER_URI: "mongodb://parser-readonly@parser.internal:27017/ignored?replicaSet=rs0",
      DB_PARSER_NAME: "parser_data",
    } as NodeJS.ProcessEnv);

    expect(uri).toBe(
      "mongodb://parser-readonly@parser.internal:27017/parser_data?replicaSet=rs0&authSource=admin"
    );
  });

  it("preserves an explicit parser URI database outside production", () => {
    expect(
      buildParserMongoUri({
        NODE_ENV: "development",
        DB_PARSER_URI: "mongodb://localhost:27017/parser_from_uri",
      } as NodeJS.ProcessEnv)
    ).toBe("mongodb://localhost:27017/parser_from_uri?authSource=admin");
  });

  it("requires explicit parser URI and database in production", () => {
    expect(() =>
      assertParserMongoConfiguration({
        NODE_ENV: "production",
        DB_URL: "mongodb://primary:27017/main",
        DB_NAME: "main",
      } as NodeJS.ProcessEnv)
    ).toThrow("DB_PARSER_URI and DB_PARSER_NAME");
  });

  it("rejects the primary Mongo target even when credentials differ", () => {
    expect(() =>
      assertParserMongoConfiguration({
        NODE_ENV: "production",
        DB_URL: "mongodb://writer@mongo.internal:27017/main",
        DB_NAME: "main",
        DB_PARSER_URI: "mongodb://reader@mongo.internal:27017/ignored",
        DB_PARSER_NAME: "main",
      } as NodeJS.ProcessEnv)
    ).toThrow("must not target the primary database");
  });

  it("normalizes the default Mongo port when comparing targets", () => {
    expect(() =>
      assertParserMongoConfiguration({
        NODE_ENV: "production",
        DB_URL: "mongodb://writer@mongo.internal/main",
        DB_NAME: "main",
        DB_PARSER_URI: "mongodb://reader@mongo.internal:27017/ignored",
        DB_PARSER_NAME: "main",
      } as NodeJS.ProcessEnv)
    ).toThrow("must not target the primary database");
  });

  it("accepts a separate production parser target", () => {
    expect(() =>
      assertParserMongoConfiguration({
        NODE_ENV: "production",
        DB_URL: "mongodb://writer@mongo.internal:27017/main",
        DB_NAME: "main",
        DB_PARSER_URI: "mongodb://reader@mongo.internal:27017/parser_data",
        DB_PARSER_NAME: "parser_data",
      } as NodeJS.ProcessEnv)
    ).not.toThrow();
  });
});
