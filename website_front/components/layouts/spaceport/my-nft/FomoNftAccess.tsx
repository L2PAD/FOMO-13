import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import SparklesIcon from "../../../global/Icons/SparklesIcon";
import NftBadgeIcon from "../../../global/Icons/NftBadgeIcon";
import CircleCheckIcon from "../../../global/Icons/CircleCheckIcon";
import ClockIcon from "../../../global/Icons/ClockIcon";
import { getMyNftAccess, activateNftBenefit, MyNftAccess, NftAccessToken } from "../../../../http/products";

/**
 * G27 — Personal FOMO AI Access surface, mounted inside Spaceport → My NFT.
 * Uses the EXISTING authenticated wallet (passed as `wallet`). No new wallet
 * provider. Styled with the FOMO design system (green primary + custom icons).
 * Always renders (shows a connect prompt when no wallet is connected).
 */

const Wrap = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-card);
`;
const Head = styled.div` display: flex; align-items: center; gap: 10px; margin-bottom: 6px; `;
const Title = styled.div` font-size: 19px; font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.01em; `;
const Sub = styled.div` font-size: 13.5px; color: var(--color-text-secondary); margin-bottom: 18px; max-width: 720px; line-height: 1.5; `;
const Eff = styled.div`
  font-size: 13px; color: var(--color-primary-dark); background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong); padding: 9px 14px; border-radius: 12px; margin-bottom: 18px;
  display: inline-flex; gap: 9px; align-items: center; font-weight: 600;
`;
const Toast = styled(Eff)` background: var(--color-primary-soft); border-color: var(--color-primary-soft-strong); color: var(--color-primary-dark); `;
const Grid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 16px; `;
const Card = styled.div<{ accent: string }>`
  border: 1px solid var(--color-border);
  border-top: 3px solid ${(p) => p.accent};
  border-radius: 16px; padding: 18px; background: var(--color-surface-raised);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  &:hover { box-shadow: var(--shadow-soft); transform: translateY(-2px); }
`;
const Row = styled.div` display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; `;
const NameWrap = styled.div` display: flex; align-items: center; gap: 10px; `;
const TokenName = styled.div` font-size: 15px; font-weight: 700; color: var(--color-text-primary); line-height: 1.25; `;
const Pill = styled.span<{ bg: string; fg: string; bd: string }>`
  font-size: 11px; font-weight: 700; padding: 4px 11px; border-radius: 999px; white-space: nowrap;
  background: ${(p) => p.bg}; color: ${(p) => p.fg}; border: 1px solid ${(p) => p.bd};
`;
const Meta = styled.div` font-size: 13px; color: var(--color-text-secondary); margin-top: 12px; line-height: 1.55; `;
const Strong = styled.b` color: var(--color-text-primary); font-weight: 700; `;
const Btn = styled.button`
  margin-top: 16px; width: 100%; border: none; background: var(--color-primary); color: #fff; font-weight: 700; font-size: 13.5px;
  padding: 12px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
  transition: background 0.15s ease;
  &:hover:not(:disabled) { background: var(--color-primary-hover); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const Util = styled.div`
  margin-top: 14px; padding-top: 13px; border-top: 1px dashed var(--color-border-subtle);
  font-size: 11.5px; color: var(--color-text-muted); display: flex; gap: 14px; flex-wrap: wrap;
`;
const UtilItem = styled.span` display: inline-flex; align-items: center; gap: 5px; &::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--color-primary); opacity: 0.55; } `;
const Empty = styled.div`
  font-size: 13.5px; color: var(--color-text-secondary); padding: 18px; text-align: center;
  background: var(--color-surface-subtle); border: 1px dashed var(--color-border); border-radius: 14px; line-height: 1.55;
`;
const DevTag = styled.span`
  font-size: 10px; font-weight: 700; color: var(--color-warning-dark); background: var(--color-warning-soft);
  border: 1px solid var(--color-warning); padding: 3px 9px; border-radius: 7px; margin-left: 6px; letter-spacing: 0.02em;
`;

const STATUS: Record<string, { label: string; bg: string; fg: string; bd: string; accent: string }> = {
  AVAILABLE: { label: "Available", bg: "var(--color-primary-soft)", fg: "var(--color-primary-dark)", bd: "var(--color-primary-soft-strong)", accent: "var(--color-primary)" },
  ACTIVE: { label: "Active", bg: "var(--color-primary-soft)", fg: "var(--color-primary-dark)", bd: "var(--color-primary-soft-strong)", accent: "var(--color-primary)" },
  TRANSFERRED: { label: "Transferred access", bg: "var(--color-info-soft)", fg: "var(--color-info)", bd: "var(--color-info-soft)", accent: "var(--color-info)" },
  EXPIRED: { label: "Benefit expired", bg: "var(--color-surface-muted)", fg: "var(--color-text-muted)", bd: "var(--color-border)", accent: "var(--color-border-strong)" },
  NOT_ELIGIBLE: { label: "Not eligible", bg: "var(--color-surface-muted)", fg: "var(--color-text-muted)", bd: "var(--color-border)", accent: "var(--color-border)" },
};
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—");

const TokenCard: React.FC<{ t: NftAccessToken; onActivate: (t: NftAccessToken) => void; busy: boolean }> = ({ t, onActivate, busy }) => {
  const s = STATUS[t.benefit.status] || STATUS.NOT_ELIGIBLE;
  const b = t.benefit;
  const active = b.status === "ACTIVE" || b.status === "TRANSFERRED";
  return (
    <Card accent={s.accent} data-testid={`nft-access-token-${t.tokenId}`}>
      <Row>
        <NameWrap>
          <NftBadgeIcon fill={active ? "#04A584" : "#B5BCC7"} isActive={active} />
          <TokenName>{t.collection.name} #{t.tokenId}</TokenName>
        </NameWrap>
        <Pill bg={s.bg} fg={s.fg} bd={s.bd} data-testid={`nft-access-status-${t.tokenId}`}>{s.label}</Pill>
      </Row>

      {b.status === "AVAILABLE" && (
        <>
          <Meta><Strong>Included with your NFT</Strong> — {b.durationDays} days of FOMO AI.<br />Your access period starts immediately after activation.</Meta>
          <Btn disabled={!b.canActivate || busy} data-testid={`nft-activate-${t.tokenId}`} onClick={() => onActivate(t)}>
            <SparklesIcon size="small" stroke="#ffffff" /> {busy ? "Activating…" : `Activate ${b.durationDays}-day access`}
          </Btn>
        </>
      )}
      {b.status === "ACTIVE" && (
        <Meta><CircleCheckIcon fill="#04A584" /> Access activated {fmt(b.activatedAt)}<br />Valid until <Strong>{fmt(b.expiresAt)}</Strong> · {b.remainingDays} days remaining</Meta>
      )}
      {b.status === "TRANSFERRED" && (
        <Meta>This NFT already includes an active FOMO AI access period.<br />Valid until <Strong>{fmt(b.expiresAt)}</Strong> · {b.remainingDays} days remaining</Meta>
      )}
      {b.status === "EXPIRED" && (
        <Meta>This NFT&apos;s included access ended on <Strong>{fmt(b.expiresAt)}</Strong>.<br />The NFT still retains its Web3 utilities.
          {b.canActivate ? <Btn disabled={busy} data-testid={`nft-activate-${t.tokenId}`} onClick={() => onActivate(t)}><SparklesIcon size="small" stroke="#ffffff" /> Re-activate</Btn> : null}
        </Meta>
      )}

      <Util>
        <UtilItem>Launchpad: independent</UtilItem>
        <UtilItem>SpacePort: independent</UtilItem>
        <UtilItem>Market: independent</UtilItem>
      </Util>
    </Card>
  );
};

const FomoNftAccess: React.FC<{ wallet?: string | null }> = ({ wallet }) => {
  const [data, setData] = useState<MyNftAccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyToken, setBusyToken] = useState<string>("");
  const [toast, setToast] = useState<string>("");

  // Dev/preview acceptance tool ONLY: ?fomoDevWallet= drives the panel when no
  // wallet is connected. Production always uses the connected wallet prop.
  const [devWallet, setDevWallet] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("fomoDevWallet");
      if (p) setDevWallet(p);
    }
  }, []);
  const effWallet = wallet || devWallet;

  const load = useCallback(() => {
    setLoading(true);
    getMyNftAccess().then(setData).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (effWallet) load(); }, [effWallet, load]);

  const activate = async (t: NftAccessToken) => {
    setBusyToken(t.tokenId); setToast("");
    const r = await activateNftBenefit({ chainId: t.chainId, contract: t.contractAddress, tokenId: t.tokenId });
    setBusyToken("");
    if (r?.success) { setToast(`FOMO AI access activated for #${t.tokenId}`); load(); }
    else setToast(r?.message || "Activation failed");
  };

  const tokens = data?.tokens || [];

  return (
    <Wrap data-testid="fomo-nft-access">
      <Head>
        <SparklesIcon size={22} stroke="#04A584" />
        <Title>FOMO AI Access</Title>
        {null /* DEV/TEST ownership badge removed — not shown in production */}
      </Head>
      <Sub>Eligible FOMO NFTs include a limited FOMO AI access period. Each token activates independently — the NFT keeps its Launchpad / SpacePort utilities regardless.</Sub>

      {!effWallet ? (
        <Empty data-testid="nft-access-connect">Connect your wallet to see eligible FOMO NFTs and activate the FOMO&nbsp;AI access included with your collection.</Empty>
      ) : (
        <>
          {data?.membership?.allowed ? (
            <Eff data-testid="nft-access-effective"><ClockIcon fill="#04A584" /> FOMO AI active — effective access until&nbsp;<Strong>{fmt(data.membership.effectiveUntil)}</Strong></Eff>
          ) : null}
          {toast ? <Toast data-testid="nft-access-toast"><CircleCheckIcon fill="#04A584" /> {toast}</Toast> : null}

          {loading && !data ? (
            <Empty>Loading your NFT access…</Empty>
          ) : tokens.length === 0 ? (
            <Empty data-testid="nft-access-empty">No eligible FOMO NFTs found for this wallet. Eligible NFTs from supported collections will appear here with their FOMO&nbsp;AI benefit.</Empty>
          ) : (
            <Grid>
              {tokens.map((t) => <TokenCard key={`${t.contractAddress}-${t.tokenId}`} t={t} onActivate={activate} busy={busyToken === t.tokenId} />)}
            </Grid>
          )}
        </>
      )}
    </Wrap>
  );
};

export default FomoNftAccess;
