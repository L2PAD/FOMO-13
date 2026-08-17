import getAccessToken from '../utils/getAccessToken';
import { configureUrl } from './config';

const jsonHeaders = () => ({
  Authorization: `Bearer ${getAccessToken()}`,
  'Content-Type': 'application/json',
});

const toQuery = (params: Record<string, any> = {}): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export type FomoV2MarketTier = 'HOT' | 'WARM' | 'COLD';

export interface FomoV2AdminMarketProject {
  _id: string;
  readModelId: string;
  canonicalProjectId?: string;
  marketAssetId?: string;
  coingeckoId?: string;
  name?: string;
  symbol?: string;
  logo?: string;
  niche?: string;
  tier?: FomoV2MarketTier;
  rank?: number;
  price?: number;
  priceChange?: number;
  marketCap?: number;
  volume24h?: number;
  marketDataUpdatedAt?: string;
  chart7dUpdatedAt?: string;
  chart7dPointsCount?: number;
  chart7dTrend?: string;
  performanceUpdatedAt?: string;
  historyPoints?: number;
  firstHistoryAt?: string;
  latestHistoryAt?: string;
  isSponsored?: boolean;
  isEralash?: boolean;
  eralashAdded?: string;
}

export interface FomoV2MarketProjectsResponse {
  source: string;
  total: number;
  limit: number;
  offset: number;
  page: number;
  projects: FomoV2AdminMarketProject[];
}

export interface FomoV2HistoryImportRun {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  activeTier?: FomoV2MarketTier;
  activeCoingeckoId?: string;
  activeAssetName?: string;
  progressPercent?: number;
  startedAt?: string;
  finishedAt?: string;
  lastHeartbeatAt?: string;
  durationMs?: number;
  options?: Record<string, any>;
  tiers?: Array<{
    tier: FomoV2MarketTier;
    days: number | 'max';
    status: string;
    totalAssets?: number;
    processedAssets?: number;
    historyRequests?: number;
    snapshotsWouldWrite?: number;
    snapshotsCreated?: number;
    snapshotsUpdated?: number;
    errorsCount?: number;
    startedAt?: string;
    finishedAt?: string;
    durationMs?: number;
    lastAsset?: {
      marketAssetId?: string;
      coingeckoId?: string;
      name?: string;
      symbol?: string;
    };
  }>;
  totals?: {
    totalAssets?: number;
    processedAssets?: number;
    historyRequests?: number;
    snapshotsWouldWrite?: number;
    snapshotsCreated?: number;
    snapshotsUpdated?: number;
    errorsCount?: number;
    progressPercent?: number;
  };
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchFomoV2MarketProjects = async (
  params: Record<string, any>,
): Promise<FomoV2MarketProjectsResponse> => {
  const response = await fetch(configureUrl(`admin/fomo-v2/market/projects${toQuery(params)}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load FOMO v2 market projects');
  }

  return response.json();
};

export const toggleFomoV2MarketProjectSponsored = async (
  id: string,
): Promise<{ success: boolean; project: FomoV2AdminMarketProject }> => {
  const response = await fetch(
    configureUrl(`admin/fomo-v2/market/projects/${encodeURIComponent(id)}/sponsored`),
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to update sponsored status');
  }

  return response.json();
};

export const toggleFomoV2MarketProjectEralash = async (
  id: string,
): Promise<{ success: boolean; project: FomoV2AdminMarketProject }> => {
  const response = await fetch(
    configureUrl(`admin/fomo-v2/market/projects/${encodeURIComponent(id)}/eralash`),
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to update eralash status');
  }

  return response.json();
};

export const fetchFomoV2HistoryImportLatest = async (): Promise<{ run: FomoV2HistoryImportRun | null }> => {
  const response = await fetch(configureUrl('admin/fomo-v2/market/history-import/latest'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load history import status');
  }

  return response.json();
};

export const startFomoV2HistoryImport = async (): Promise<{
  started: boolean;
  reason?: string;
  run: FomoV2HistoryImportRun;
}> => {
  const response = await fetch(configureUrl('admin/fomo-v2/market/history-import'), {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      tiers: [
        { tier: 'HOT', days: 'max' },
        { tier: 'WARM', days: 730 },
        { tier: 'COLD', days: 365 },
      ],
      delayMs: 1500,
      maxRetries: 5,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to start history import');
  }

  return response.json();
};
