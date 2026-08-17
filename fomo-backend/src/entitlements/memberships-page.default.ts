/**
 * G24/G25 — Memberships selling-page content, editable from the CRM
 * (Access & Monetization → Страница продаж). Products themselves come from the
 * Product CMS; this file only holds page-level marketing copy defaults.
 */
export const MEMBERSHIPS_PAGE_KEY = "memberships";

export const MEMBERSHIPS_PAGE_DEFAULT = {
  key: MEMBERSHIPS_PAGE_KEY,
  heroBadge: "FOMO Intelligence",
  heroTitle: "Choose your FOMO intelligence layer",
  heroSubtitle:
    "Two independent products on top of the always-free FOMO platform. Subscribe to one, both, or neither — upgrade only for the intelligence you actually need.",
  valueProps: [
    { icon: "sparkles", title: "Ask FOMO, anything", text: "Chat with an AI trained on FOMO's own crypto dataset." },
    { icon: "analytics", title: "Deep research", text: "Project, fund and person breakdowns generated in seconds." },
    { icon: "rocket", title: "EarlyLand Prime", text: "Curated early activities across new chains, verified." },
    { icon: "shield", title: "Yours, or by NFT", text: "Subscribe monthly, or activate an eligible FOMO NFT benefit." },
  ],
  faqTitle: "Common questions",
  faq: [
    { q: "Can I use both products?", a: "Yes. FOMO AI and FOMO Intel are independent — subscribe to either or both. The core FOMO platform stays free either way." },
    { q: "What are AI credits?", a: "Credits meter AI operations inside FOMO AI (chat, deep research, analysis). Each plan includes a monthly allowance; they are not money and not access." },
    { q: "Do I need a subscription if I own an NFT?", a: "No. Eligible FOMO NFTs include a limited FOMO AI access period you can activate for free. A subscription is simply the always-available path." },
  ],
  nftOfferTitle: "Prefer Web3 access?",
  nftOfferText: "Eligible FOMO NFTs include a limited FOMO AI access period and keep their Launchpad / SpacePort utility.",
  nftOfferCta: "Explore FOMO NFTs",
  footnote: "The free FOMO platform always stays open. Prices are managed in the Product CMS.",
};
