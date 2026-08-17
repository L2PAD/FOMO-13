import { API } from "../../config/api";

export type CryptoLinkingEntityType = "project" | "fund" | "person";

export interface CryptoLinkingSearchItem {
  _id: string;
  id: string;
  nodeId: string;
  type: CryptoLinkingEntityType;
  entityType: CryptoLinkingEntityType;
  name: string;
  slug?: string;
  symbol?: string;
  logo?: string;
  label?: string;
}

export interface CryptoLinkingSearchResponse {
  isSuccess: boolean;
  items: CryptoLinkingSearchItem[];
  total: number;
}

const fetchCryptoLinkingSearch = async (
  query: string,
  limit = 10
): Promise<CryptoLinkingSearchResponse> => {
  const value = query.trim();

  if (value.length < 2) {
    return { isSuccess: true, items: [], total: 0 };
  }

  try {
    const params = new URLSearchParams({
      q: value,
      limit: String(limit),
    });
    const response = await fetch(`${API}/crypto-linking/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to fetch crypto-linking search results");
    }

    const data = await response.json();

    return {
      isSuccess: data?.isSuccess !== false,
      items: data?.items || [],
      total: data?.total || 0,
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, items: [], total: 0 };
  }
};

export default fetchCryptoLinkingSearch;
