import { configureUrl } from '../../components/services/config';
import getAccessToken from '../../components/utils/getAccessToken';

const BASE = 'admin/entitlements';

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

// ---- Types (loose) ----
export interface Capability { key: string; name: string; domain: string; description?: string; accessType: string; eligibilityProvider?: string; active: boolean; }
export interface OfferItem { title: string; description?: string; icon?: string; active?: boolean; sortOrder?: number; linkedCapability?: string; }
export interface Plan { _id: string; code: string; name: string; description?: string; status: string; billingPeriod: string; durationDays: number; priceUsd: number; aiCreditsIncluded: number; capabilities: { capabilityKey: string }[]; gracePeriodHours?: number; creditRollover?: string; featured?: boolean; sortOrder?: number; version: number; isDemo?: boolean; productType?: string; subtitle?: string; slug?: string; aiCredits?: number | null; purchasable?: boolean; visible?: boolean; recommended?: boolean; offerItems?: OfferItem[]; checkoutConfig?: Record<string, any>; externalProductConfig?: Record<string, any> | null; }
export interface Subscription { _id: string; userId: string; status: string; source: string; currentPeriodStart?: string; currentPeriodEnd?: string; originWallet?: string; planSnapshot?: any; planVersion?: number; }
export interface AccessDecision { allowed: boolean; capability: string; accessType: string; source: string | null; validUntil?: string | null; accessAllowed?: boolean; eligibilityRequired?: boolean; eligibilityProvider?: string; legacySource?: boolean; reason: string | null; requirements: any[]; }

export const getOverview = () => request<any>(`${BASE}/overview`);
export const getCapabilities = () => request<{ items: Capability[]; total: number }>(`${BASE}/capabilities`);
export const getPlans = () => request<{ items: Plan[]; total: number }>(`${BASE}/plans`);
export const upsertPlan = (p: any) => request<any>(`${BASE}/plans`, { method: 'POST', body: JSON.stringify(p) });
export const deletePlan = (code: string) => request<any>(`${BASE}/plans/${encodeURIComponent(code)}`, { method: 'DELETE' });
export const getSubscriptions = (status?: string) => request<{ items: Subscription[]; total: number }>(`${BASE}/subscriptions${status ? `?status=${status}` : ''}`);
export const createSubscription = (b: { user: string; planCode?: string; source?: string; activate?: boolean }) => request<any>(`${BASE}/subscriptions`, { method: 'POST', body: JSON.stringify(b) });
export const subAction = (id: string, action: 'activate' | 'extend' | 'cancel' | 'revoke' | 'expire', body?: any) => request<any>(`${BASE}/subscriptions/${id}/${action}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
export const runExpiry = () => request<any>(`${BASE}/subscriptions/run-expiry`, { method: 'POST' });
export const createGrant = (b: { user: string; capabilityKey: string; reason?: string; validUntil?: string }) => request<any>(`${BASE}/grants`, { method: 'POST', body: JSON.stringify(b) });
export const listGrants = () => request<{ items: any[]; total: number }>(`${BASE}/grants`);
export const revokeGrant = (id: string) => request<any>(`${BASE}/grants/${id}/revoke`, { method: 'POST' });
export const getDiagnostics = (query: string) => request<any>(`${BASE}/diagnostics?query=${encodeURIComponent(query)}`);
export const getCreditRules = () => request<{ items: any[]; total: number }>(`${BASE}/credits/rules`);
export const getCreditBalance = (userId: string) => request<any>(`${BASE}/credits/balance?userId=${userId}`);
export const creditAdjust = (b: { user: string; delta: number; reason: string }) => request<any>(`${BASE}/credits/adjust`, { method: 'POST', body: JSON.stringify(b) });
export const creditTopup = (b: { user: string; amount: number }) => request<any>(`${BASE}/credits/topup`, { method: 'POST', body: JSON.stringify(b) });

// ---- AI Control Center (P2-P9) ----
export const getAiPricing = () => request<{ items: any[]; total: number }>(`${BASE}/ai/pricing`);
export const upsertAiPricing = (p: any) => request<any>(`${BASE}/ai/pricing`, { method: 'POST', body: JSON.stringify(p) });
export const setAiPriceActive = (id: string, active: boolean) => request<any>(`${BASE}/ai/pricing/${id}/active`, { method: 'POST', body: JSON.stringify({ active }) });
export const getAiSettings = () => request<any>(`${BASE}/ai/settings`);
export const updateAiSettings = (p: any) => request<any>(`${BASE}/ai/settings`, { method: 'POST', body: JSON.stringify(p) });
export const getAiUsage = (userId?: string, limit = 100) => request<{ items: any[]; total: number }>(`${BASE}/ai/usage?limit=${limit}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`);
export const getAiUsageSummary = (days = 30) => request<any>(`${BASE}/ai/usage/summary?days=${days}`);
export const getAiEconomics = () => request<any>(`${BASE}/ai/economics`);
export const simulateEconomics = (b: any) => request<any>(`${BASE}/ai/economics/simulate`, { method: 'POST', body: JSON.stringify(b) });
export const getAiUserAnalytics = (userId: string) => request<any>(`${BASE}/ai/user-analytics?userId=${encodeURIComponent(userId)}`);
export const gatewayEstimate = (userId: string, operation: string) => request<any>(`${BASE}/ai/gateway/estimate?userId=${encodeURIComponent(userId)}&operation=${encodeURIComponent(operation)}`);
export const gatewayExecute = (b: any) => request<any>(`${BASE}/ai/gateway/execute`, { method: 'POST', body: JSON.stringify(b) });

// ---- FOMO Knowledge Layer (P10-P13) ----
export const getKnowledgeHealth = () => request<{ items: any[]; connected: number; total: number }>(`${BASE}/ai/knowledge/health`);
export const getKnowledgeRegistry = () => request<{ items: any[]; connected: number; total: number }>(`${BASE}/ai/knowledge/registry`);
export const knowledgeTest = (domain: string, query: string) => request<any>(`${BASE}/ai/knowledge/test`, { method: 'POST', body: JSON.stringify({ domain, query }) });
export const aiAsk = (b: { userId?: string; operation: string; query: string; billingContext?: string }) => request<any>(`${BASE}/ai/ask`, { method: 'POST', body: JSON.stringify(b) });

// ---- Phase A-E: Economics Dashboard, analytics, users, health, providers ----
export const getEconomicsDashboard = (days = 30) => request<any>(`${BASE}/ai/economics/dashboard?days=${days}`);
export const getOperationAnalytics = (days = 30) => request<{ items: any[]; total: number }>(`${BASE}/ai/analytics/operations?days=${days}`);
export const getProviderAnalytics = (days = 30) => request<{ items: any[]; total: number }>(`${BASE}/ai/analytics/providers?days=${days}`);
export const getAiUsers = (limit = 100) => request<{ items: any[]; total: number }>(`${BASE}/ai/users?limit=${limit}`);
export const runCreditExpiry = () => request<any>(`${BASE}/ai/credits/run-expiry`, { method: 'POST' });
export const getAiHealth = () => request<any>(`${BASE}/ai/health`);
export const getProvidersStatus = () => request<any>(`${BASE}/ai/providers/status`);

// ---- Phase F: Provider Credentials Manager + per-user economics ----
export const listCredentials = () => request<{ items: any[]; activeProvider: string; activeCredentialId: string | null }>(`${BASE}/ai/provider-credentials`);
export const createCredential = (b: { provider: string; label: string; secret: string; baseUrl?: string; priority?: number }) => request<any>(`${BASE}/ai/provider-credentials`, { method: 'POST', body: JSON.stringify(b) });
export const patchCredential = (id: string, b: { label?: string; secret?: string; baseUrl?: string; priority?: number }) => request<any>(`${BASE}/ai/provider-credentials/${id}`, { method: 'PATCH', body: JSON.stringify(b) });
export const deleteCredential = (id: string) => request<any>(`${BASE}/ai/provider-credentials/${id}`, { method: 'DELETE' });
export const testCredential = (id: string) => request<any>(`${BASE}/ai/provider-credentials/${id}/test`, { method: 'POST' });
export const activateCredential = (id: string) => request<any>(`${BASE}/ai/provider-credentials/${id}/activate`, { method: 'POST' });
export const deactivateCredential = (id: string) => request<any>(`${BASE}/ai/provider-credentials/${id}/deactivate`, { method: 'POST' });
export const migrateAiEnvCredentials = () => request<any>(`${BASE}/ai/provider-credentials/migrate-env`, { method: 'POST' });
export const getUserEconomics = (userId: string) => request<any>(`${BASE}/ai/users/${userId}/economics`);

// ---- Phase H: Money Control Center (admin/money base) ----
const MONEY = 'admin/money';
export const getMoneyOverview = () => request<any>(`${MONEY}/overview`);
export const getOperatorOverview = () => request<any>(`${MONEY}/operator-overview`);
export const getRevenueAnalytics = () => request<any>(`${MONEY}/revenue-analytics`);
export const getMoneyBalances = (limit = 100) => request<{ items: any[]; total: number }>(`${MONEY}/balances?limit=${limit}`);
export const getUserMoney = (userId: string) => request<any>(`${MONEY}/users/${userId}`);
export const moneyAdjust = (userId: string, b: { amount: number; reason: string; reference?: string; asset?: string }) => request<any>(`${MONEY}/users/${userId}/adjust`, { method: 'POST', body: JSON.stringify(b) });
export const moneyExplain = (q: { userId?: string; txHash?: string; purchaseId?: string }) => request<any>(`${MONEY}/explain?${new URLSearchParams(q as any).toString()}`);
// Phase H (H24-H32): Finance Control Center read-models + operations
export const getMoneyStatistics = () => request<any>(`${MONEY}/statistics`);
export const getMoneyStatisticsTimeseries = (days = 30) => request<any>(`${MONEY}/statistics/timeseries?days=${days}`);
export const getMoneyFinanceUsers = (limit = 100) => request<{ items: any[]; total: number }>(`${MONEY}/statistics/users?limit=${limit}`);

// H3 — permissions (MONEY_*) + executor readiness
export const getMyMoneyPermissions = () => request<any>(`${MONEY}/permissions/me`);
export const getMoneyPermissionTemplates = () => request<any>(`${MONEY}/permissions/templates`);
export const getMoneyPermissionAdmins = () => request<{ items: any[] }>(`${MONEY}/permissions/admins`);
export const setMoneyPermissionAssignment = (userId: string, body: any) => request<any>(`${MONEY}/permissions/admins/${userId}`, { method: 'POST', body: JSON.stringify(body) });
export const getExecutorReadiness = (networkId = 'ZKSYNC_USDC') => request<any>(`${MONEY}/acquiring/executor/readiness?networkId=${networkId}`);
export const getDepositPolicy = () => request<any>(`${MONEY}/acquiring/deposit-verification/mode`);
export const getWithdrawalModel = (networkId = 'ZKSYNC_USDC') => request<any>(`${MONEY}/acquiring/withdrawal-model?networkId=${networkId}`);
export const migrateEnvSigner = (networkId = 'ZKSYNC_USDC') => request<any>(`${MONEY}/acquiring/credentials/migrate-env`, { method: 'POST', body: JSON.stringify({ networkId }) });
export const getMoneyReconciliation = () => request<any>(`${MONEY}/reconciliation`);
export const getMoneyDiagnostics = () => request<any>(`${MONEY}/diagnostics`);
export const getMoneyPurchases = (limit = 100, status?: string) => request<{ items: any[]; total: number }>(`${MONEY}/purchases?limit=${limit}${status ? `&status=${status}` : ''}`);
export const getPurchaseChain = (id: string) => request<any>(`${MONEY}/purchases/${id}/chain`);
// H4 — custody Purchase Saga (owner-signed settlement / refund) + status/manifest
export const ownerSettlePurchase = (id: string) => request<any>(`${MONEY}/purchases/${id}/owner-settle`, { method: 'POST' });
export const refundPurchase = (id: string) => request<any>(`${MONEY}/purchases/${id}/refund`, { method: 'POST' });
export const getOwnerSettlement = () => request<any>(`${MONEY}/custody/owner-settlement`);
// H5 — CLIENT-SIGNED owner settlement (operator connects owner wallet in CRM; no server key)
export const getCustodyConnectStatus = () => request<any>(`${MONEY}/custody/connect-status`);
export const prepareOwnerAction = (id: string) => request<any>(`${MONEY}/purchases/${id}/owner-prepare`, { method: 'POST' });
export const submitOwnerAction = (id: string, txHash: string, kind: 'createItem' | 'settle' | 'refund') =>
  request<any>(`${MONEY}/purchases/${id}/owner-submit`, { method: 'POST', body: JSON.stringify({ txHash, kind }) });
// H5 — settlement lot pool
export const getSettlementSummary = () => request<any>(`${MONEY}/settlement-items/summary`);
export const prepareSettlementItem = (price: number) => request<any>(`${MONEY}/settlement-items/prepare`, { method: 'POST', body: JSON.stringify({ price }) });
export const submitSettlementItem = (price: number, txHash: string) => request<any>(`${MONEY}/settlement-items/submit`, { method: 'POST', body: JSON.stringify({ price, txHash }) });
export const getMoneyStats = (days = 30) => request<any>(`${MONEY}/stats?days=${days}`);
export const getCustodyDecomposition = () => request<any>(`${MONEY}/custody/decomposition`);
export const getCustodyManifest = () => request<any>(`${MONEY}/custody/manifest`);
export const getUserCustodyReconcile = (userId: string) => request<any>(`${MONEY}/users/${userId}/custody-reconcile`);
export const getMoneyWithdrawals = (limit = 100) => request<{ items: any[]; total: number }>(`${MONEY}/withdrawals?limit=${limit}`);
export const executeWithdrawal = (id: string) => request<any>(`${MONEY}/withdrawals/${id}/execute`, { method: 'POST' });
export const confirmWithdrawal = (id: string, txHash?: string) => request<any>(`${MONEY}/withdrawals/${id}/confirm`, { method: 'POST', body: JSON.stringify({ txHash }) });
export const releaseWithdrawal = (id: string, reason?: string) => request<any>(`${MONEY}/withdrawals/${id}/release`, { method: 'POST', body: JSON.stringify({ reason }) });
export const getUserFinance = (userId: string) => request<any>(`${MONEY}/users/${userId}/finance`);

// Phase H2 — FOMO Acquiring Control Center
export const getAcqNetworks = () => request<{ items: any[] }>(`${MONEY}/acquiring/networks`);
export const getAcqNetwork = (id: string) => request<any>(`${MONEY}/acquiring/network/${id}`);
export const updateAcqNetwork = (id: string, body: any) => request<any>(`${MONEY}/acquiring/network/${id}`, { method: 'POST', body: JSON.stringify(body) });
export const getAcqCredentials = () => request<{ items: any[] }>(`${MONEY}/acquiring/credentials`);
export const createAcqCredential = (body: any) => request<any>(`${MONEY}/acquiring/credentials`, { method: 'POST', body: JSON.stringify(body) });
export const testAcqCredential = (id: string) => request<any>(`${MONEY}/acquiring/credentials/${id}/test`, { method: 'POST' });
export const setAcqCredentialStatus = (id: string, action: 'activate' | 'deactivate' | 'revoke') => request<any>(`${MONEY}/acquiring/credentials/${id}/${action}`, { method: 'POST' });
export const getAcqDeposits = (limit = 100) => request<{ items: any[] }>(`${MONEY}/acquiring/deposits?limit=${limit}`);
export const getAcqEvents = (limit = 100) => request<{ items: any[] }>(`${MONEY}/acquiring/events?limit=${limit}`);
export const getAcqAudit = (limit = 100) => request<{ items: any[] }>(`${MONEY}/acquiring/audit?limit=${limit}`);
export const getAcqDiagnostics = () => request<any>(`${MONEY}/acquiring/diagnostics`);
export const getAcqReconciliation = () => request<any>(`${MONEY}/acquiring/reconciliation`);

// ---- Phase G: Unified Access Engine (NFT Access + membership) ----
const AC = 'access/admin';
export const nftRules = () => request<any[]>(`${AC}/nft/rules`);
export const nftCreateRule = (b: any) => request<any>(`${AC}/nft/rules`, { method: 'POST', body: JSON.stringify(b) });
export const nftUpdateRule = (id: string, b: any) => request<any>(`${AC}/nft/rules/${id}`, { method: 'PATCH', body: JSON.stringify(b) });
export const nftActivations = (q = '') => request<any[]>(`${AC}/nft/activations${q}`);
export const nftTransfers = () => request<any[]>(`${AC}/nft/transfers`);
export const nftRevokeActivation = (id: string, reason?: string) => request<any>(`${AC}/nft/activations/${id}/revoke`, { method: 'POST', body: JSON.stringify({ reason }) });
export const nftDiagnostics = (q: { wallet?: string; chainId?: string; contract?: string; tokenId?: string }) => request<any>(`${AC}/nft/diagnostics?` + new URLSearchParams(q as any).toString());
export const nftSetOwnership = (b: any) => request<any>(`${AC}/nft/test/ownership`, { method: 'POST', body: JSON.stringify(b) });
export const nftTransfer = (b: any) => request<any>(`${AC}/nft/transfer`, { method: 'POST', body: JSON.stringify(b) });
export const nftRunExpiry = () => request<any>(`${AC}/nft/run-expiry`, { method: 'POST' });
export const accessGrant = (b: { userId: string; days: number; reason?: string; capabilityKey?: string }) => request<any>(`${AC}/grant`, { method: 'POST', body: JSON.stringify(b) });
export const accessExplain = (userId: string, capability: string) => request<any>(`${AC}/explain?userId=${encodeURIComponent(userId)}&capability=${encodeURIComponent(capability)}`);
export const accessEntitlements = (userId: string) => request<any[]>(`${AC}/entitlements?userId=${encodeURIComponent(userId)}`);

// G24/G25 — memberships selling-page CMS
export const getMembershipsPageCms = () => request<{ ok: boolean; config: any }>(`${BASE}/page/memberships`);
export const saveMembershipsPageCms = (config: any) => request<{ ok: boolean; config: any }>(`${BASE}/page/memberships`, { method: 'PUT', body: JSON.stringify(config) });

