import { API } from "../../config/api";

export type AdEventType =
  | "loaded" | "impression" | "viewable_impression"
  | "click" | "cta_click" | "expand" | "close" | "conversion";

export interface TrackPayload {
  deliveryId: string;
  campaignId?: string;
  creativeId?: string;
  placement: string;
  type: AdEventType;
  sessionId?: string;
  device?: string;
  loggedIn?: boolean;
  viewablePct?: number;
  dwellMs?: number;
}

export default async (payload: TrackPayload): Promise<void> => {
  try {
    // keepalive lets the beacon survive navigation on click events
    await fetch(`${API}/ads/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (e) {
    /* tracking must never break the page */
  }
};
