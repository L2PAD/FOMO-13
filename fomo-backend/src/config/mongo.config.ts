export function getMongoDbName(env: NodeJS.ProcessEnv = process.env): string {
  const dbName = String(env.DB_NAME || "").trim();
  return dbName || "fomoland";
}

export function getMongoParserDbName(env: NodeJS.ProcessEnv = process.env): string {
  const parserDbName = String(env.DB_PARSER_NAME || "").trim();
  return parserDbName || getMongoDbName(env);
}

export function buildMongoUri(env: NodeJS.ProcessEnv = process.env): string {
  const dbUrl =
    String(env.DB_URL || env.MONGO_URL || env.MONGODB_URI || "").trim() ||
    "mongodb://localhost:27017";
  const explicitDbName = String(env.DB_NAME || "").trim();
  const dbName = explicitDbName || "fomoland";
  return buildMongoUriFromBase(dbUrl, dbName, Boolean(explicitDbName));
}

export function buildParserMongoUri(env: NodeJS.ProcessEnv = process.env): string {
  const parserDbName = getMongoParserDbName(env);
  const parserDbUrl = String(env.DB_PARSER_URI || "").trim();
  const explicitParserDbName = String(env.DB_PARSER_NAME || "").trim();

  if (!parserDbUrl) {
    return buildMongoUri({
      ...env,
      DB_NAME: parserDbName,
    });
  }

  return buildMongoUriFromBase(
    parserDbUrl,
    parserDbName,
    Boolean(explicitParserDbName)
  );
}

/**
 * Parser imports must never share the primary Mongo target in production.
 * Development and test keep the legacy fallback so existing local environments
 * continue to work while they migrate to DB_PARSER_URI.
 */
export function assertParserMongoConfiguration(
  env: NodeJS.ProcessEnv = process.env
): void {
  if (String(env.NODE_ENV || "").trim().toLowerCase() !== "production") return;

  const parserUri = String(env.DB_PARSER_URI || "").trim();
  const parserDbName = String(env.DB_PARSER_NAME || "").trim();
  if (!parserUri || !parserDbName) {
    throw new Error(
      "Production parser Mongo requires explicit DB_PARSER_URI and DB_PARSER_NAME."
    );
  }

  const primaryTarget = normalizeMongoTarget(buildMongoUri(env));
  const parserTarget = normalizeMongoTarget(buildParserMongoUri(env));
  if (primaryTarget === parserTarget) {
    throw new Error(
      "Production parser Mongo must not target the primary database. Configure a separate read-only DB_PARSER_URI/DB_PARSER_NAME."
    );
  }
}

function buildMongoUriFromBase(
  dbUrl: string,
  dbName: string,
  shouldOverridePathDb: boolean
): string {
  const [rawBase, ...queryParts] = dbUrl.split("?");
  const query = queryParts.join("?");
  const base = rawBase.replace(/\/+$/, "");
  const protocolMatch = base.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/i);

  if (!protocolMatch) {
    return withQuery(`${base}/${dbName}`, query);
  }

  const [, protocol, remainder] = protocolMatch;
  const pathIndex = remainder.indexOf("/");

  if (pathIndex === -1) {
    return withQuery(`${base}/${dbName}`, query);
  }

  if (!shouldOverridePathDb) {
    return withQuery(base, query);
  }

  const hostBase = `${protocol}${remainder.slice(0, pathIndex)}`;
  return withQuery(`${hostBase}/${dbName}`, query);
}

function withQuery(uri: string, query: string): string {
  const nextQuery = ensureAuthSource(query);
  return nextQuery ? `${uri}?${nextQuery}` : uri;
}

function ensureAuthSource(query: string): string {
  const cleanQuery = String(query || "").replace(/^\?+/, "");
  if (!cleanQuery) return "authSource=admin";
  if (/(^|&)authSource=/.test(cleanQuery)) return cleanQuery;
  return `${cleanQuery}&authSource=admin`;
}

function normalizeMongoTarget(uri: string): string {
  const raw = String(uri || "").trim();
  const withoutQuery = raw.split("?", 1)[0].replace(/\/+$/, "");
  const protocolMatch = withoutQuery.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/i);
  if (!protocolMatch) return withoutQuery.toLowerCase();

  const [, protocol, remainder] = protocolMatch;
  const pathIndex = remainder.indexOf("/");
  const authority = pathIndex === -1 ? remainder : remainder.slice(0, pathIndex);
  const database = pathIndex === -1 ? "" : remainder.slice(pathIndex + 1);
  const credentialSeparator = authority.lastIndexOf("@");
  const rawHosts =
    credentialSeparator === -1
      ? authority
      : authority.slice(credentialSeparator + 1);
  const hosts = normalizeMongoHosts(rawHosts, protocol.toLowerCase());

  return `${protocol.toLowerCase()}${hosts}/${database.toLowerCase()}`;
}

function normalizeMongoHosts(hosts: string, protocol: string): string {
  return hosts
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .map((host) => {
      if (!host || protocol === "mongodb+srv://") return host;
      if (host.startsWith("[")) {
        const closingBracket = host.indexOf("]");
        return closingBracket >= 0 && host.length === closingBracket + 1
          ? `${host}:27017`
          : host;
      }
      return host.includes(":") ? host : `${host}:27017`;
    })
    .sort()
    .join(",");
}
