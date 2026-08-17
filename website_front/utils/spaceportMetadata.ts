import { API } from "../config/api";
import fetchCollections from "../http/collections/fetchCollections";

export type SpaceportNftMetadataAttribute = {
  trait_type?: string;
  value?: string | number | boolean;
};

export type SpaceportNftMetadata = {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: SpaceportNftMetadataAttribute[];
};

const toIpfsGatewayUrl = (uri: string): string => {
  const ipfsPath = uri.replace(/^ipfs:\/\//i, "").replace(/^ipfs\//i, "");
  return `https://ipfs.io/ipfs/${ipfsPath}`;
};

export const resolveMetadataUri = (
  rawUri: string,
  tokenId: number,
  metadataBaseLink?: string
): string => {
  let uri = String(rawUri || "").trim();
  const baseLink = String(metadataBaseLink || "").trim().replace(/\/+$/, "");
  const isNumericOnly = /^\d+$/.test(uri);

  if (isNumericOnly && baseLink) {
    return `${baseLink}/${uri}`;
  }

  if (!uri && baseLink) {
    return `${baseLink}/${tokenId}`;
  }

  if (uri.includes("{id}")) {
    const hexId = tokenId.toString(16).padStart(64, "0");
    uri = uri.replace("{id}", hexId);
  }

  if (/^ipfs:\/\//i.test(uri)) {
    return toIpfsGatewayUrl(uri);
  }

  if (/^ar:\/\//i.test(uri)) {
    return `https://arweave.net/${uri.replace(/^ar:\/\//i, "")}`;
  }

  if (/^https?:\/\//i.test(uri) || /^data:/i.test(uri)) {
    return uri;
  }

  return uri ? toIpfsGatewayUrl(`ipfs://${uri}`) : "";
};

export const resolveAssetUri = (rawUri: string): string => {
  return resolveMetadataUri(rawUri, 0, "");
};

const parseDataUriJson = (uri: string): SpaceportNftMetadata | null => {
  if (!/^data:application\/json/i.test(uri)) {
    return null;
  }

  const [head, payload] = uri.split(",", 2);
  if (!payload) {
    return null;
  }

  const decoded = /;base64/i.test(head)
    ? atob(payload)
    : decodeURIComponent(payload);

  return JSON.parse(decoded) as SpaceportNftMetadata;
};

export async function fetchMockMetadataImageByTokenId(
  tokenId: number
): Promise<string> {
  if (!Number.isFinite(tokenId) || tokenId <= 0) {
    return "";
  }

  try {
    const response = await fetch(`${API}/metadata/${tokenId}`);
    if (!response.ok) {
      return "";
    }

    const data = (await response.json()) as SpaceportNftMetadata;
    return resolveAssetUri(String(data?.image || ""));
  } catch {
    return "";
  }
}

export async function fetchMetadataByTokenUri(
  tokenUri: string,
  tokenId: number,
  metadataBaseLink?: string
): Promise<SpaceportNftMetadata | null> {
  if (!tokenUri && !metadataBaseLink) {
    return null;
  }

  try {
    const inline = parseDataUriJson(tokenUri);
    if (inline) {
      return inline;
    }
  } catch {
    // Ignore malformed inline metadata and try remote URL.
  }

  try {
    const resolvedUri = resolveMetadataUri(tokenUri, tokenId, metadataBaseLink);
    if (!resolvedUri) {
      return null;
    }

    const response = await fetch(resolvedUri);
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as SpaceportNftMetadata;
  } catch {
    return null;
  }
}

export async function getCollectionMetadataBaseLink(
  collectionSmartAddress: string
): Promise<string | undefined> {
  try {
    const { isSuccess, collections } = await fetchCollections();
    if (!isSuccess || !Array.isArray(collections)) {
      return undefined;
    }

    const normalizedSmart = String(collectionSmartAddress || "").toLowerCase();
    const match = collections.find(
      (item: any) => String(item?.smart || "").toLowerCase() === normalizedSmart
    );
    const metadataLink = String(match?.metadataLink || "").trim();

    return metadataLink || undefined;
  } catch {
    return undefined;
  }
}
