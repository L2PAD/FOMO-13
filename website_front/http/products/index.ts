import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

const authHeaders = () => {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export interface ProductOffer { title: string; description?: string; icon?: string }
export interface Product {
  code: string;
  productType: "FOMO_AI" | "FOMO_INTEL";
  name: string;
  subtitle: string;
  description: string;
  priceUsd: number;
  durationDays: number;
  aiCredits: number | null;
  recommended: boolean;
  purchasable: boolean;
  offerItems: ProductOffer[];
  capabilities: string[];
  checkout: { enabled: boolean; status: string; methods: string[]; acceptedAssets: string[]; networks: string[] };
  externalUrl: string | null;
}
export interface MembershipStatus {
  productType: string;
  name: string;
  subtitle: string;
  subscribed: boolean;
  status: string;
  currentPeriodEnd: string | null;
  priceUsd: number;
  externalUrl: string | null;
  credits: { available: number; total: number } | null;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const res = await fetch(`${API}/products`);
    if (!res.ok) return [];
    return (await res.json()).items || [];
  } catch { return []; }
};

export const getMyMemberships = async (): Promise<{ fomoAi: MembershipStatus; fomoIntel: MembershipStatus } | null> => {
  try {
    const res = await fetch(`${API}/products/my`, { headers: authHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};

export interface MembershipSource { type: string; expiresAt: string | null; tokenId?: string; plan?: string | null; }
export interface MembershipState { active: boolean; expiresAt: string | null; sources: MembershipSource[]; }

export interface NftAccessToken {
  chainId: string; contractAddress: string; tokenId: string;
  collection: { name: string; image?: string | null };
  ownership: { verified: boolean; wallet: string };
  benefit: {
    eligible: boolean; durationDays: number; benefitType: string;
    status: "AVAILABLE" | "ACTIVE" | "TRANSFERRED" | "EXPIRED" | "NOT_ELIGIBLE";
    activatedAt: string | null; expiresAt: string | null; remainingDays: number | null; canActivate: boolean;
  };
  utilities: { launchpad: string; spaceport: string; market: string };
}
export interface MyNftAccess {
  success: boolean;
  membership: { allowed: boolean; effectiveUntil: string | null; sources: MembershipSource[] };
  providerMode: string;
  tokens: NftAccessToken[];
}

// G27 — personal NFT access surface (current authenticated wallet).
export const getMyNftAccess = async (): Promise<MyNftAccess | null> => {
  try {
    const res = await fetch(`${API}/me/nft-access`, { headers: authHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};
export const activateNftBenefit = async (t: { chainId: string; contract: string; tokenId: string }): Promise<any> => {
  const res = await fetch(`${API}/me/nft-access/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(t),
  });
  return res.json();
};

// G28 — canonical membership (unified access engine): sources + effective window.
export interface ValueProp { icon: string; title: string; text: string; }
export interface Faq { q: string; a: string; }
export interface MembershipsPage {
  heroBadge: string; heroTitle: string; heroSubtitle: string;
  valueProps: ValueProp[]; faqTitle: string; faq: Faq[];
  nftOfferTitle: string; nftOfferText: string; nftOfferCta: string; footnote: string;
}
export const getMembershipsPage = async (): Promise<MembershipsPage | null> => {
  try {
    const res = await fetch(`${API}/products/page/memberships`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};

export const getMembership = async (): Promise<MembershipState | null> => {
  try {
    const res = await fetch(`${API}/access/membership`, { headers: authHeaders() });
    if (!res.ok) return null;
    const j = await res.json();
    return j?.data || null;
  } catch { return null; }
};
