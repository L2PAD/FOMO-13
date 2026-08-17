import { configureUrl } from '../../components/services/config';
import getAccessToken from '../../components/utils/getAccessToken';

const BASE = 'admin/spaceport-cc';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(configureUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || res.statusText || 'Request failed';
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return data as T;
}

export const getRegistry = () => request<any>(`${BASE}/registry`);
export const getOverview = () => request<any>(`${BASE}/overview`);
export const getCollections = () => request<any>(`${BASE}/collections`);
export const getSales = () => request<any>(`${BASE}/sales`);
export const getHolders = () => request<any>(`${BASE}/holders`);
export const getTokens = (search?: string) =>
  request<any>(`${BASE}/tokens${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const getTokenDetail = (tokenId: number) => request<any>(`${BASE}/tokens/${tokenId}`);
export const getReveal = () => request<any>(`${BASE}/reveal`);
export const getTransfers = (wallet?: string) =>
  request<any>(`${BASE}/transfers${wallet ? `?wallet=${encodeURIComponent(wallet)}` : ''}`);
export const getContractControl = () => request<any>(`${BASE}/contract-control`);
export const getFusion = () => request<any>(`${BASE}/fusion`);
export const getCustomer = (userId: string) => request<any>(`${BASE}/customer/${userId}`);
export const prepareControl = (body: any) =>
  request<any>(`${BASE}/contract-control/prepare`, { method: 'POST', body: JSON.stringify(body) });
export const recordControl = (body: any) =>
  request<any>(`${BASE}/contract-control/record`, { method: 'POST', body: JSON.stringify(body) });
export const getAudit = () => request<any>(`${BASE}/contract-control/audit`);
export const getDiagnostics = () => request<any>(`${BASE}/diagnostics`);
export const syncIndexer = (force = false) =>
  request<any>(`${BASE}/sync${force ? '?force=true' : ''}`, { method: 'POST' });
