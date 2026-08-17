import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

/**
 * FOMO Money layer (Phase H) — public client for the canonical off-chain
 * MoneyLedger built on top of the existing zkSync/USDC rail.
 *
 * IMPORTANT: FOMO Money (USDC) ≠ AI Credits ≠ Wallet balance. These are three
 * separate economies. This client only talks to the internal Money layer.
 */

const authHeaders = (): Record<string, string> => {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export interface MoneyBalance {
  asset: string;
  network: string;
  available: number;
  reserved: number;
  total: number;
}

export type MoneyTxType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "PURCHASE"
  | "REFUND"
  | "ADMIN_ADJUSTMENT"
  | "OTC_RESERVE"
  | "OTC_RELEASE"
  | "OTC_SETTLEMENT"
  | "P2P_RESERVE"
  | "P2P_RELEASE"
  | "P2P_SETTLEMENT";

export interface MoneyTransaction {
  _id: string;
  asset: string;
  network: string;
  type: MoneyTxType;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  referenceType: string;
  referenceId: string;
  txHash: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface CheckoutResult {
  ok: boolean;
  purchase?: {
    id: string;
    productCode: string;
    planCode: string;
    amount: number;
    asset: string;
    status: string;
    subscriptionId: string;
    aiCreditsGranted: number;
    settledAt: string | null;
  };
  balance?: MoneyBalance;
  error?: string;
}

const ZERO_BALANCE: MoneyBalance = { asset: "USDC", network: "ZKSYNC", available: 0, reserved: 0, total: 0 };

/** GET /api/money/me/balance — canonical FOMO Balance (available / reserved / total). */
export const getMoneyBalance = async (asset = "USDC"): Promise<MoneyBalance> => {
  try {
    const res = await fetch(`${API}/money/me/balance?asset=${encodeURIComponent(asset)}`, { headers: authHeaders() });
    if (!res.ok) return ZERO_BALANCE;
    const j = await res.json();
    return {
      asset: j.asset || asset,
      network: j.network || "ZKSYNC",
      available: Number(j.available) || 0,
      reserved: Number(j.reserved) || 0,
      total: Number(j.total) || 0,
    };
  } catch {
    return ZERO_BALANCE;
  }
};

/** GET /api/money/me/transactions — money ledger history (newest first). */
export const getMoneyTransactions = async (limit = 100): Promise<MoneyTransaction[]> => {
  try {
    const res = await fetch(`${API}/money/me/transactions?limit=${limit}`, { headers: authHeaders() });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.items || []) as MoneyTransaction[];
  } catch {
    return [];
  }
};

/**
 * POST /api/money/deposits/confirm — credits the FOMO ledger from an EXISTING
 * confirmed on-chain deposit record (idempotent by network+txHash). Call this
 * AFTER the on-chain deposit + POST /api/deposits record has been created.
 */
export const confirmMoneyDeposit = async (
  txHash: string,
  network = "ZKSYNC",
): Promise<{ ok: boolean; duplicate?: boolean; credited?: number; balance?: MoneyBalance; error?: string }> => {
  try {
    const res = await fetch(`${API}/money/deposits/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ txHash, network }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (j && (j.message as string)) || `Error ${res.status}` };
    return j;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
};

/** POST /api/money/withdrawals — reserve funds & open a withdrawal request. */
export const requestMoneyWithdrawal = async (body: {
  amount: number;
  destination: string;
  asset?: string;
  network?: string;
}): Promise<{ ok: boolean; withdrawalId?: string; balance?: MoneyBalance; error?: string }> => {
  try {
    const res = await fetch(`${API}/money/withdrawals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (j && (j.message as string)) || `Error ${res.status}` };
    return j;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
};

/**
 * POST /api/money/withdrawals/:id/confirm-web3 — finalize a USER-SIGNED withdrawal.
 * The user signs withdrawUSD(amount) in their OWN wallet; the backend RPC-verifies
 * the txHash. NO server-side withdrawal signer is involved.
 */
export const confirmMoneyWithdrawalWeb3 = async (
  withdrawalId: string,
  txHash: string,
): Promise<{ ok: boolean; status?: string; balance?: MoneyBalance; error?: string }> => {
  try {
    const res = await fetch(`${API}/money/withdrawals/${withdrawalId}/confirm-web3`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ txHash }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (j && (j.message as string)) || `Error ${res.status}` };
    return { ok: true, ...j };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
};

export interface RecoverableDeposit { txHash: string; amount: number; blockNumber: number; }

/** GET /api/money/me/recoverable-deposits — auto-discover uncredited on-chain deposits. */
export const scanRecoverableDeposits = async (): Promise<{ wallet: string | null; items: RecoverableDeposit[] }> => {
  try {
    const res = await fetch(`${API}/money/me/recoverable-deposits`, { headers: authHeaders() });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { wallet: null, items: [] };
    return { wallet: j.wallet || null, items: j.items || [] };
  } catch { return { wallet: null, items: [] }; }
};

/** POST /api/money/deposits/recover — RPC-verify a deposit txHash and credit (idempotent). */
export const recoverDeposit = async (txHash: string): Promise<{ ok: boolean; credited?: number; duplicate?: boolean; balance?: MoneyBalance; error?: string }> => {
  try {
    const res = await fetch(`${API}/money/deposits/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ txHash }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (j && (j.message as string)) || `Error ${res.status}` };
    return { ok: true, ...j };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
};

/**
 * POST /api/money/purchases — atomic Purchase paid from FOMO Balance.
 * Backend chain: reserve → settle → money debit → Subscription → AI credits.
 * `idempotencyKey` guarantees a double-click never creates a second purchase.
 */
export const checkoutMembership = async (body: {
  productCode?: string;
  planCode?: string;
  idempotencyKey?: string;
}): Promise<CheckoutResult> => {
  try {
    // Instant "Pay from FOMO Balance" — legacy ledger checkout (debit + provision,
    // no extra wallet tx). The custody on-chain saga lives at /money/purchases.
    const res = await fetch(`${API}/money/purchases/legacy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (j && (j.message as string)) || `Error ${res.status}` };
    return j as CheckoutResult;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
};

export const fmtUsdc = (n: number | undefined | null): string => {
  const v = Number(n) || 0;
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/* =====================================================================
 * H5 — Public custody Purchase Saga (on-chain, MetaMask-signed).
 * Flow: start (reserve + owner-provisioned item) → user signs safeMoneyUSD
 * → backend RPC-verifies lock → owner settlement → membership provisioned.
 * ===================================================================== */

export interface CustodyAction {
  contract: string;
  method: string;   // "safeMoneyUSD"
  itemId: string;
  useInternal: boolean;
  amount: string;   // fixed(6)
}

export interface PurchaseState {
  purchaseId: string;
  status: string;
  flow?: string;
  amount?: number;
  asset?: string;
  custodyAction: CustodyAction | null;
  custody?: {
    contract?: string; itemId?: string | null;
    userLockTxHash?: string | null; ownerSettlementTxHash?: string | null;
  };
  subscriptionId?: string | null;
  aiCreditsGranted?: number;
  operatorPending?: boolean;
  failReason?: string;
  error?: string;
}

const postMoney = async (path: string, body?: any): Promise<any> => {
  const res = await fetch(`${API}/money${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j && (j.message as string)) || `Error ${res.status}`);
  return j;
};

/** POST /api/money/purchases — start the custody saga (returns custodyAction when ready to sign). */
export const startCustodyPurchase = (body: { productCode?: string; planCode?: string; idempotencyKey?: string }): Promise<PurchaseState> =>
  postMoney("/purchases", body);

/** POST /api/money/purchases/:id/custody-confirm — submit the user's safeMoneyUSD txHash. */
export const confirmCustodyLock = (purchaseId: string, txHash: string): Promise<PurchaseState> =>
  postMoney(`/purchases/${purchaseId}/custody-confirm`, { txHash });

/** GET /api/money/purchases/:id — poll purchase state. */
export const getPurchaseState = async (purchaseId: string): Promise<PurchaseState> => {
  const res = await fetch(`${API}/money/purchases/${purchaseId}`, { headers: authHeaders() });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j && (j.message as string)) || `Error ${res.status}`);
  return j;
};

export interface CheckoutReadiness {
  moneyEngineHealthy: boolean;
  custodyReachable: boolean;
  ownerSettlementReady: boolean;
  minStock: number;
  globalStatus: "READY" | "UNAVAILABLE";
  lots: Record<string, { price: number; available: number; reserved: number; consumed: number; minStock: number; status: "READY" | "LOW" | "OUT" | "UNAVAILABLE"; publicMessage: string; adminReason: string }>;
}

/** GET /api/money/checkout/readiness — preflight so a user never starts a half-flow. */
export const getCheckoutReadiness = async (): Promise<CheckoutReadiness | null> => {
  try {
    const res = await fetch(`${API}/money/checkout/readiness`, { headers: authHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};
