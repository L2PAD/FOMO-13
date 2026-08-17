import { IDeal, IUser } from "../../../../../types/global_types";

/**
 * Get the seller from deal.
 * When deal.type === "sell", the creator is the seller.
 * Falls back to deal.creator if deal.seller is not populated.
 */
export const getDealSeller = (deal: IDeal | null): IUser | undefined => {
  if (!deal) return undefined;
  if (deal.seller) return deal.seller;
  if (deal.type === "sell") return deal.creator;
  if (deal.type === "buy") return deal.buyer;
  return undefined;
};

export interface PaymentDetails {
  holderName: string;
  cardLast4: string;
  cardNumber: string;
  iban: string;
  bankName: string;
  label: string;
}

/**
 * Extract detailed payment method data from deal.paymentMethods[0].
 * Handles both string and rich object formats.
 */
export const getPaymentDetails = (deal: IDeal | null): PaymentDetails => {
  const method = deal?.paymentMethods?.[0];
  if (!method) {
    return { holderName: "-", cardLast4: "-", cardNumber: "-", iban: "-", bankName: "-", label: "-" };
  }
  if (typeof method === "string") {
    return { holderName: "-", cardLast4: "-", cardNumber: "-", iban: "-", bankName: method, label: method };
  }
  const pm = method as any;

  const formatCardNumber = (cardNum: string): string => {
    if (!cardNum) return "-";
    const digits = cardNum.replace(/\s+/g, '');
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  return {
    holderName: pm.holderName || "-",
    cardLast4: pm.cardLast4 ? `**** **** **** ${pm.cardLast4}` : "-",
    cardNumber: pm.cardNumber,
    iban: pm.meta?.iban || "-",
    bankName: pm.bankName || pm.label || "-",
    label: pm.label || pm.bankName || "-",
  };
};

/**
 * Format ticker for display (uppercase).
 */
export const formatTicker = (ticker?: 'usd' | 'eth'): string => {
  return ticker === 'eth' ? 'ETH' : 'USDC'
}

/**
 * Format currency for display (uppercase).
 */
export const formatCurrency = (currency?: string): string => {
  return currency?.toUpperCase() || "";
};

/**
 * Parse p2pSaleTime (hh:mm) to seconds.
 * Falls back to 00:30 (1800s) when value is empty/invalid.
 */
export const parseP2PSaleTimeToSeconds = (p2pSaleTime?: string): number => {
  const fallbackSeconds = 30 * 60;
  if (!p2pSaleTime) return fallbackSeconds;

  const [rawHours = "", rawMinutes = ""] = p2pSaleTime.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 24 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallbackSeconds;
  }

  return hours * 60 * 60 + minutes * 60;
};


export const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const P2P_PAYMENT_DEADLINE_STORAGE_PREFIX = "p2p_payment_deadline_";

const getP2PPaymentDeadlineStorageKey = (dealId: string): string =>
  `${P2P_PAYMENT_DEADLINE_STORAGE_PREFIX}${dealId}`;

const getStoredP2PPaymentDeadline = (dealId: string): number | null => {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(getP2PPaymentDeadlineStorageKey(dealId));
  if (!rawValue) return null;

  const parsed = Number(rawValue);
  if (Number.isNaN(parsed) || parsed <= 0) return null;

  return parsed;
};

export const setStoredP2PPaymentDeadline = (dealId: string, deadlineMs: number): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getP2PPaymentDeadlineStorageKey(dealId), String(deadlineMs));
};

export const clearStoredP2PPaymentDeadline = (dealId?: string): void => {
  if (typeof window === "undefined" || !dealId) return;
  window.localStorage.removeItem(getP2PPaymentDeadlineStorageKey(dealId));
};

export const getOrCreateP2PPaymentDeadline = (deal: IDeal | null): number => {
  const fallbackDeadline = Date.now() + parseP2PSaleTimeToSeconds(deal?.p2pSaleTime) * 1000;
  if (!deal) return fallbackDeadline;

  const persistDeadline = (deadlineMs: number) => {
    if (deal._id && deadlineMs > Date.now()) {
      setStoredP2PPaymentDeadline(deal._id, deadlineMs);
    }
  };

  if (deal.p2pSaleTimeEnd) {
    const saleEndMs = new Date(deal.p2pSaleTimeEnd).getTime();
    if (!Number.isNaN(saleEndMs)) {
      persistDeadline(saleEndMs);
      return saleEndMs;
    }
  }

  if (deal.expectPaymentDate) {
    const expectDateMs = new Date(deal.expectPaymentDate).getTime();
    if (!Number.isNaN(expectDateMs)) {
      persistDeadline(expectDateMs);
      return expectDateMs;
    }
  }

  if (!deal.isReservedFunds || !deal._id) {
    return fallbackDeadline;
  }

  const storedDeadline = getStoredP2PPaymentDeadline(deal._id);
  if (storedDeadline && storedDeadline > Date.now()) {
    return storedDeadline;
  }

  setStoredP2PPaymentDeadline(deal._id, fallbackDeadline);
  return fallbackDeadline;
};

/**
 * Countdown source for P2P Buy modal timers.
 * Uses only p2pSaleTimeEnd.
 */
export const getRemainingP2PSaleTimeEndSeconds = (deal: IDeal | null): number => {
  if (!deal?.p2pSaleTimeEnd) return 0;

  const saleEndMs = new Date(deal.p2pSaleTimeEnd).getTime();
  if (Number.isNaN(saleEndMs)) return 0;

  return Math.max(0, Math.floor((saleEndMs - Date.now()) / 1000));
};

export const formatP2PSaleTimeLabel = (p2pSaleTime?: string): string => {
  const totalSeconds = parseP2PSaleTimeToSeconds(p2pSaleTime);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
};
