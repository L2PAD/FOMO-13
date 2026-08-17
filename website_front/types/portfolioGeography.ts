export type PortfolioGeographyRegion =
  | "North America"
  | "Europe"
  | "Asia-Pacific"
  | "Middle East"
  | "Latin America"
  | "Africa"
  | "Offshore/Caribbean"
  | "Unknown";

export interface PortfolioGeographySummary {
  portfolioProjects: number;
  projectsWithCoInvestors: number;
  totalCoInvestors: number;
  investorsWithLocation: number;
  investorsWithoutLocation: number;
  regionCoveragePercent: number;
}

export interface PortfolioGeographyRegionCount {
  region: PortfolioGeographyRegion | string;
  investorsCount: number;
  percent: number;
  coInvestorsPreview?: Array<PortfolioGeographyPreviewItem>;
}

export interface PortfolioGeographyRegionSummary {
  region: PortfolioGeographyRegion | string;
  coInvestorCount: number;
  projectCount: number;
  percent: number;
}

export interface PortfolioGeographyProject {
  projectSlug: string;
  projectName: string;
  logo: string;
  symbol?: string;
  category?: string;
  coInvestorCount: number;
  regionCounts: Array<PortfolioGeographyRegionCount>;
}

export interface PortfolioGeographyPreviewItem {
  id?: string;
  name: string;
  slug?: string;
  logo?: string;
  image?: string;
  symbol?: string;
  category?: string;
}

export interface PortfolioGeographyRound {
  id?: string;
  name: string;
  type?: string;
  date?: string;
  amount?: number;
  valuation?: number;
  tokenPrice?: number;
  roi?: number;
  roiDisplay?: string;
  role?: string;
  isLead?: boolean;
  status?: string;
}

export interface PortfolioGeographyInvestor {
  slug: string;
  name: string;
  logo: string;
  category?: string;
  country: string | null;
  region: PortfolioGeographyRegion | string;
  matchedBy: string;
  portfolioProjectsCount: number;
  portfolioProjectsPreview?: Array<PortfolioGeographyPreviewItem>;
  coInvestmentsCount: number;
  coInvestorsPreview?: Array<PortfolioGeographyPreviewItem>;
  rounds?: Array<PortfolioGeographyRound>;
  roundCount?: number;
  additionalRoundsCount?: number;
  roundId?: string;
  roundName?: string;
  roundDate?: string;
  roundAmount?: number;
  roundValuation?: number;
  roundRoi?: number;
  roundRoiDisplay?: string;
  roundRole?: string;
  roundIsLead?: boolean;
}

export interface PortfolioGeographyResponse {
  ok: boolean;
  error?: string;
  investor: {
    slug: string;
    name: string;
    logo: string;
  };
  summary: PortfolioGeographySummary;
  regions: Array<PortfolioGeographyRegionSummary>;
  projects: Array<PortfolioGeographyProject>;
  selected: {
    projectSlug: string | null;
    region: string | null;
    investors: Array<PortfolioGeographyInvestor>;
  };
  dataQuality: PortfolioGeographySummary;
}
