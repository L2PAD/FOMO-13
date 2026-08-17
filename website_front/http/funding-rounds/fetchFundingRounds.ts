import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

type FundingRoundInvestor = {
  id?: number;
  name?: string;
  investorSlug?: string;
  niche?: string;
  ventureType?: string;
  tier?: string;
  lead?: boolean;
  image?: string;
  rating?: number;
  fomoScore?: number;
};

type ProjectLink = {
  projectId?: string;
  projectType?: "market" | "project";
  confidence?: string;
  matchedBy?: string;
  reason?: string;
};

type FundingRoundApiItem = {
  _id: string;
  projectId?: string;
  projectLinks?: ProjectLink[];
  projectName?: string;
  coinSlug?: string;
  coinSymbol?: string;
  image?: string;
  logo?: string;
  stage?: string;
  fundsRaised?: number;
  preValuation?: number;
  investors?: FundingRoundInvestor[];
  category?: string;
  date?: string;
  hasToken?: boolean;
  rating?: string | number;
  fomoScore?: string | number;
  likes?: number | unknown[];
  redFlags?: number;
  redFlagsList?: any[];
  projectSnapshot?: {
    name?: string;
    slug?: string;
    symbol?: string;
    logo?: string;
    mainCategory?: any;
  };
};

export type FundingFeedItem = {
  _id: string;
  projectId?: string;
  projectLinks?: ProjectLink[];
  name: string;
  niche: string;
  logo: string;
  type: string;
  totalRaised: number;
  fundsRaised: number;
  valuation: number;
  preValuation: number;
  investors: FundingRoundInvestor[];
  mainCategory: { name: string };
  lastFunding: string;
  redFlagsList: any[];
  fomoScore: number;
  likes: number;
  hasToken: boolean;
  coinSlug?: string;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const likesCount = (value: FundingRoundApiItem["likes"]): number => {
  if (Array.isArray(value)) return value.length;
  return toNumber(value);
};

const normalizeSymbol = (value?: string): string =>
  String(value || "").trim().toUpperCase();

export default async ({
  limit,
  offset,
  search,
  mode,
  filters,
}: {
  limit: number;
  offset: number;
  search?: string;
  mode?: string;
  filters?: Record<string, string>;
}): Promise<{
  isSuccess: boolean;
  fundraising: FundingFeedItem[];
  total: number;
}> => {
  try {
    const accessToken = getAuthToken();
    const params = new URLSearchParams();

    params.set("limit", String(limit));
    params.set("offset", String(offset));

    if (search?.trim()) {
      params.set("search", search.trim());
    }

    if (mode && mode !== "all") {
      params.set("mode", mode);
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
    }

    const res = await fetch(`${API}/fomo-v2/funding-feed?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    const rounds: FundingRoundApiItem[] = data?.rounds || [];

    return {
      isSuccess: res.status < 300,
      fundraising: rounds.map((round) => {
        const redFlagsList = Array.isArray(round.redFlagsList)
          ? round.redFlagsList
          : Array.from({ length: toNumber(round.redFlags) }, () => ({}));
        const project = round.projectSnapshot || {};

        return {
          _id: round._id,
          projectId: round.projectId,
          projectLinks: Array.isArray(round.projectLinks) ? round.projectLinks : [],
          name: round.projectName || project.name || round.coinSlug || "Unknown Project",
          niche: normalizeSymbol(round.coinSymbol || project.symbol),
          logo: round.image || round.logo || project.logo || "",
          type: round.stage || "-",
          totalRaised: Number(round.fundsRaised || 0),
          fundsRaised: Number(round.fundsRaised || 0),
          valuation: Number(round.preValuation || 0),
          preValuation: Number(round.preValuation || 0),
          investors: Array.isArray(round.investors) ? round.investors : [],
          mainCategory: { name: round.category || project.mainCategory?.name || "-" },
          lastFunding: round.date || "",
          redFlagsList,
          fomoScore: toNumber(round.fomoScore ?? round.rating),
          likes: likesCount(round.likes),
          hasToken: Boolean(round.hasToken),
          coinSlug: round.coinSlug,
        };
      }),
      total: Number(data?.total || 0),
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      fundraising: [],
      total: 0,
    };
  }
};
