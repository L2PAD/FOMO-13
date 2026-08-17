import { API } from "../../config/api";
import {
  CryptoLinkingEntityType,
  CryptoLinkingSearchItem,
} from "./fetchCryptoLinkingSearch";

export type CryptoLinkingGraphEntityType =
  | CryptoLinkingEntityType
  | "investor"
  | "funding_round";
export type CryptoLinkingGraphEntityFilterKey =
  | "projects"
  | "funds"
  | "persons"
  | "exchanges"
  | "tokens"
  | "assets";
export type CryptoLinkingGraphRelationFilterKey =
  | "investedIn"
  | "coinvestedWith"
  | "founded"
  | "hasToken"
  | "tradedOn"
  | "worksAt";
export type CryptoLinkingGraphContextScopeKey =
  | "founder"
  | "investment"
  | "ecosystem"
  | "partnership"
  | "market"
  | "event"
  | "mention";

export interface CryptoLinkingGraphFilters {
  entityTypes?: CryptoLinkingGraphEntityFilterKey[];
  relationTypes?: CryptoLinkingGraphRelationFilterKey[];
  contextScopes?: CryptoLinkingGraphContextScopeKey[];
}

export interface CryptoLinkingGraphNode {
  id: string;
  entityId?: string;
  entityType: CryptoLinkingGraphEntityType;
  label: string;
  name: string;
  slug?: string;
  symbol?: string;
  logo?: string;
  size?: number;
  confidence?: string;
  matchedBy?: string;
  metadata?: Record<string, any>;
}

export interface CryptoLinkingGraphLink {
  source: string;
  target: string;
  value: number;
  relation: string;
  relationType?: CryptoLinkingGraphRelationFilterKey;
  contextScopes?: CryptoLinkingGraphContextScopeKey[];
  roundId?: string;
  roundStage?: string;
  date?: string;
  fundsRaised?: number;
  confidence?: string;
  matchedBy?: string;
  metadata?: Record<string, any>;
}

export interface CryptoLinkingGraphResponse {
  isSuccess: boolean;
  selectedEntity?: CryptoLinkingSearchItem;
  graphData: {
    nodes: CryptoLinkingGraphNode[];
    links: CryptoLinkingGraphLink[];
  };
  totalNodes: number;
  totalLinks: number;
}

const emptyGraphResponse: CryptoLinkingGraphResponse = {
  isSuccess: false,
  graphData: {
    nodes: [],
    links: [],
  },
  totalNodes: 0,
  totalLinks: 0,
};

const fetchCryptoLinkingGraph = async (
  entityType: CryptoLinkingEntityType,
  id: string,
  limit = 160,
  filters: CryptoLinkingGraphFilters = {}
): Promise<CryptoLinkingGraphResponse> => {
  try {
    const params = new URLSearchParams({
      entityType,
      id,
      limit: String(limit),
    });
    const appendFilter = (name: string, values?: string[]) => {
      if (Array.isArray(values)) {
        params.set(name, values.join(","));
      }
    };

    appendFilter("entityTypes", filters.entityTypes);
    appendFilter("relationTypes", filters.relationTypes);
    appendFilter("contextScopes", filters.contextScopes);

    const response = await fetch(
      `${API}/crypto-linking/graph?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch crypto-linking graph");
    }

    const data = await response.json();

    return {
      ...emptyGraphResponse,
      ...data,
      isSuccess: data?.isSuccess !== false,
      graphData: {
        nodes: data?.graphData?.nodes || [],
        links: data?.graphData?.links || [],
      },
      totalNodes: data?.totalNodes || 0,
      totalLinks: data?.totalLinks || 0,
    };
  } catch {
    return emptyGraphResponse;
  }
};

export default fetchCryptoLinkingGraph;
