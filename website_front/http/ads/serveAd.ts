import { API } from "../../config/api";

export interface ServedAd {
  filled: boolean;
  reason?: string;
  deliveryId?: string;
  campaignId?: string;
  creativeId?: string;
  mode?: string; // 'ads' | 'form' | 'rotate'
  rotateAdSeconds?: number;
  rotateFormSeconds?: number;
  placement?: { code: string; name?: string; group?: string; route?: string; format: string; aspectDesktop: string; aspectMobile: string; kind?: string };
  creative?: {
    type: string; brandName: string; logoUrl: string; imageUrl: string; mobileImageUrl: string;
    headline: string; description: string; ctaLabel: string; destinationUrl: string;
    sponsoredLabel: string; variant: string; displaySize?: string; alt: string;
    template?: string; progress?: number; progressLabel?: string;
    highlights?: { label: string; value: string; link?: string }[];
  };
}

export default async (
  placement: string,
  ctx: { device: string; loggedIn: boolean; session: string }
): Promise<ServedAd> => {
  try {
    const qs = new URLSearchParams({
      placement,
      device: ctx.device,
      loggedIn: String(ctx.loggedIn),
      session: ctx.session,
    }).toString();
    const res = await fetch(`${API}/ads/serve?${qs}`, { method: "GET" });
    if (res.status >= 300) return { filled: false };
    return await res.json();
  } catch (e) {
    return { filled: false };
  }
};
