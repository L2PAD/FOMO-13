import { LOADER_API } from "../config/api";

export default (path: string | undefined | null, origin?: string): string => {
  const normalizedPath =
    typeof path === "string" ? path.trim() : path === undefined || path === null ? "" : String(path);

  if (!normalizedPath || normalizedPath === "undefined" || normalizedPath === "null") {
    return "";
  }

  if (origin) {
    return `${origin}${normalizedPath}`;
  }

  if (/^(data|blob):/i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (/^\/static\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath.includes("coinmarketcap")) return normalizedPath;
  if (normalizedPath.includes("twimg")) return normalizedPath;
  if (normalizedPath.includes("dropsearn")) return normalizedPath;
  if (normalizedPath.includes("dropstab")) return normalizedPath;
  if (normalizedPath.includes("cdn.sanity.io")) return normalizedPath;
  if (normalizedPath.includes("cryptorank.io")) return normalizedPath;
  if (normalizedPath.includes("zycrypto")) return normalizedPath;
  if (normalizedPath.includes("icodrops")) return normalizedPath;
  if (normalizedPath.includes("cdn")) return normalizedPath;
  if (normalizedPath.includes("cryptobriefing")) return normalizedPath;
  if (normalizedPath.includes("static.news.bitcoin")) return normalizedPath;
  if (normalizedPath.includes("cryptopotato")) return normalizedPath;
  if (normalizedPath.includes("cryptoslate")) return normalizedPath;

  if (/^\/?uploads(?:\/|$)/i.test(normalizedPath)) {
    const filePath = normalizedPath.replace(/^\/?uploads\/?/i, "");
    return filePath ? `${LOADER_API}/uploads/${filePath}` : `${LOADER_API}/uploads`;
  }

  if (normalizedPath.startsWith("/")) {
    return `${LOADER_API}/uploads${normalizedPath}`;
  }

  return `${LOADER_API}/uploads/${normalizedPath}`;
};
