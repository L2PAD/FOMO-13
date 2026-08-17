import getAccessToken from '../utils/getAccessToken';
import { configureUrl } from './config';

export interface IcoProject {
  _id?: string;
  slug: string;
  name: string;
  symbol?: string;
  ticker?: string;
  logo?: string;
  status?: string;
  type?: string;
  categories?: string[];
  ecosystems?: string[];
  launchpads?: string[];
  interestLevel?: {
    raw?: string;
    normalized?: string;
    score?: number;
  };
  fundraising?: {
    totalRaised?: number;
    raw?: Record<string, unknown>;
  };
  marketData?: Record<string, unknown>;
  detailUrl?: string;
  lastParsedAt?: string;
  rawDetailData?: Record<string, unknown>;
  saleRounds?: unknown[];
  investors?: unknown[];
  links?: Record<string, unknown>;
}

export interface IcoProjectListResponse {
  items: IcoProject[];
  total: number;
  limit: number;
  offset: number;
}

export interface IcoParserError {
  _id?: string;
  scope?: string;
  slug?: string;
  url?: string;
  message?: string;
  status?: number;
  createdAt?: string;
}

export interface IcoParserErrorsResponse {
  items: IcoParserError[];
  total: number;
  limit: number;
  offset: number;
}

export interface IcoParserRunPayload {
  mode: 'active' | 'upcoming' | 'ended' | 'full';
  dryRun?: boolean;
  limit?: number;
  maxListPages?: number;
}

const authHeaders = (): HeadersInit => ({
  Authorization: `Bearer ${getAccessToken()}`,
  'Content-Type': 'application/json',
});

const toQuery = (params: Record<string, string | number | boolean | undefined>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const fetchIcoProjects = async (
  params: Record<string, string | number | undefined>,
): Promise<IcoProjectListResponse> => {
  const response = await fetch(configureUrl(`ico-projects${toQuery(params)}`), {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load ICO projects');
  }

  return response.json();
};

export const fetchIcoProject = async (id: string): Promise<IcoProject> => {
  const response = await fetch(configureUrl(`ico-projects/${id}`), {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load ICO project');
  }

  return response.json();
};

export const fetchIcoStats = async (): Promise<Record<string, unknown>> => {
  const response = await fetch(configureUrl('ico-projects/stats'), {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load ICO stats');
  }

  return response.json();
};

export const runIcoParser = async (payload: IcoParserRunPayload): Promise<Record<string, unknown>> => {
  const response = await fetch(configureUrl('ico-projects/parse/run'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to run ICO parser');
  }

  return data;
};

export const fetchIcoParserErrors = async (
  params: Record<string, string | number | undefined>,
): Promise<IcoParserErrorsResponse> => {
  const response = await fetch(configureUrl(`ico-projects/parser-errors${toQuery(params)}`), {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load parser errors');
  }

  return response.json();
};
