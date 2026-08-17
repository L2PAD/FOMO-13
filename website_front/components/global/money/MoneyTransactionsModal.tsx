import React, { FC, useEffect, useState } from "react";
import styled from "styled-components";
import { ArrowDownLeft, ArrowUpRight, RefreshCcw, Settings2, ShoppingBag, Receipt, ChevronLeft, Search, Loader2, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import MainModal from "../common/MainModal";
import { getMoneyTransactions, MoneyTransaction, fmtUsdc, recoverDeposit, scanRecoverableDeposits, RecoverableDeposit } from "../../../http/money";

const EXPLORER_TX = "https://explorer.zksync.io/tx/";

/**
 * MoneyTransactionsModal (Phase H / P11) — FOMO Balance → Transactions.
 * Categorised money ledger history for the signed-in user.
 */

const Body = styled.div` display: flex; flex-direction: column; gap: 4px; min-width: 380px; max-height: 60vh; overflow-y: auto; padding: 2px; `;
const Empty = styled.div` text-align: center; color: var(--color-text-muted); font-size: 13.5px; padding: 40px 10px; `;
const Row = styled.div` display: flex; align-items: center; gap: 12px; padding: 12px 6px; border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: none; } `;
const Ico = styled.div<{ credit: boolean }>`
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  background: ${(p) => (p.credit ? "var(--color-primary-soft)" : "var(--color-surface-muted)")};
  color: ${(p) => (p.credit ? "var(--color-primary-dark)" : "var(--color-text-secondary)")};
`;
const Mid = styled.div` flex: 1; min-width: 0; `;
const TType = styled.div` font-size: 13.5px; font-weight: 700; color: var(--color-text-primary); `;
const TMeta = styled.div` font-size: 11.5px; color: var(--color-text-muted); margin-top: 2px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; `;
const Ref = styled.span` font-family: var(--font-mono, monospace); `;
const Amt = styled.div<{ credit: boolean }>` font-size: 14.5px; font-weight: 700; white-space: nowrap; color: ${(p) => (p.credit ? "var(--color-primary-dark)" : "var(--color-text-primary)")}; `;
const Skeleton = styled.div` height: 62px; border-radius: 12px; background: var(--color-surface-muted); margin-bottom: 8px; opacity: 0.6; `;
const ClickRow = styled(Row)` cursor: pointer; border-radius: 10px; transition: background 160ms ease; &:hover { background: var(--color-surface-muted); } `;

// Recover panel
const RecoverBox = styled.div` border: 1px solid var(--color-border); border-radius: 12px; padding: 12px; margin-bottom: 10px; background: var(--color-surface-muted); `;
const RecoverHead = styled.button` display: flex; align-items: center; justify-content: space-between; width: 100%; background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 700; color: var(--color-text-primary); padding: 0; `;
const RInput = styled.input` width: 100%; margin-top: 10px; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 10px; font-family: var(--font-mono, monospace); font-size: 12.5px; `;
const RBtnRow = styled.div` display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; `;
const Btn = styled.button<{ ghost?: boolean }>`
  display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer;
  background: ${(p) => (p.ghost ? "transparent" : "var(--color-primary)")}; color: ${(p) => (p.ghost ? "var(--color-text-secondary)" : "#fff")};
  border: 1px solid ${(p) => (p.ghost ? "var(--color-border)" : "var(--color-primary)")};
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
const Found = styled.div` display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 4px; border-top: 1px dashed var(--color-border); font-size: 12.5px; `;

// Detail drawer
const Drawer = styled.div` display: flex; flex-direction: column; gap: 2px; min-width: 380px; `;
const BackBtn = styled.button` display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: var(--color-text-secondary); font-size: 13px; cursor: pointer; padding: 4px 0 12px; `;
const DHead = styled.div` display: flex; align-items: center; gap: 12px; margin-bottom: 10px; `;
const DAmt = styled.div<{ credit: boolean }>` font-size: 22px; font-weight: 800; color: ${(p) => (p.credit ? "var(--color-primary-dark)" : "var(--color-text-primary)")}; `;
const DField = styled.div` display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--color-border); font-size: 13px; &:last-child { border-bottom: none; } `;
const DKey = styled.span` color: var(--color-text-muted); `;
const DVal = styled.span` color: var(--color-text-primary); font-weight: 600; text-align: right; word-break: break-all; `;
const TxLink = styled.a` color: var(--color-primary-dark); font-family: var(--font-mono, monospace); display: inline-flex; align-items: center; gap: 4px; text-decoration: none; &:hover { text-decoration: underline; } `;

const LABELS: Record<string, string> = {
  DEPOSIT: "Deposit", WITHDRAWAL: "Withdrawal", PURCHASE: "Purchase", REFUND: "Refund",
  ADMIN_ADJUSTMENT: "Adjustment",
  OTC_RESERVE: "OTC reserve", OTC_RELEASE: "OTC release", OTC_SETTLEMENT: "OTC settlement",
  P2P_RESERVE: "P2P reserve", P2P_RELEASE: "P2P release", P2P_SETTLEMENT: "P2P settlement",
};

const iconFor = (t: string, credit: boolean) => {
  if (t === "DEPOSIT") return <ArrowDownLeft size={18} />;
  if (t === "WITHDRAWAL") return <ArrowUpRight size={18} />;
  if (t === "PURCHASE") return <ShoppingBag size={18} />;
  if (t === "REFUND") return <RefreshCcw size={18} />;
  if (t === "ADMIN_ADJUSTMENT") return <Settings2 size={18} />;
  return credit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />;
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
const short = (h: string) => (h && h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h);
const purchaseName = (tx: MoneyTransaction) => {
  const pc = tx.metadata?.productCode || tx.metadata?.planCode;
  if (tx.type === "PURCHASE" && pc) return pc === "FOMO_AI" ? "FOMO AI Membership" : String(pc);
  return LABELS[tx.type] || tx.type;
};

interface Props { isVisible: boolean; onClose: () => void; onChanged?: () => void; }

const MoneyTransactionsModal: FC<Props> = ({ isVisible, onClose, onChanged }) => {
  const [items, setItems] = useState<MoneyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MoneyTransaction | null>(null);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [txInput, setTxInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState<RecoverableDeposit[] | null>(null);

  const load = () => { setLoading(true); getMoneyTransactions(200).then((rows) => { setItems(rows); setLoading(false); }); };
  useEffect(() => { if (!isVisible) return; setSelected(null); setRecoverOpen(false); setFound(null); setTxInput(""); load(); }, [isVisible]);

  const doRecover = async (hash: string) => {
    const h = (hash || "").trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(h)) { toast.error("Enter a valid transaction hash"); return; }
    setBusy(true);
    const r = await recoverDeposit(h);
    setBusy(false);
    if (!r.ok) { toast.error(r.error || "Recovery failed"); return; }
    if (r.duplicate) toast.info("Already credited (+0)");
    else toast.success(`Deposit recovered · +${fmtUsdc(r.credited || 0)} USDC`);
    setTxInput("");
    setFound((prev) => (prev ? prev.filter((x) => x.txHash.toLowerCase() !== h.toLowerCase()) : prev));
    load();
    onChanged?.();
  };

  const doScan = async () => {
    setScanning(true);
    const r = await scanRecoverableDeposits();
    setScanning(false);
    setFound(r.items);
    if (!r.items.length) toast.info("No uncredited deposits found for your wallet");
  };

  return (
    <MainModal isVisible={isVisible} title={selected ? "Transaction" : "FOMO Balance — Activity"} variant="deal" className="money-tx-modal" onClose={onClose}>
      {selected ? (
        <Drawer data-testid="money-tx-detail">
          <BackBtn onClick={() => setSelected(null)} data-testid="money-tx-back"><ChevronLeft size={16} /> Back to activity</BackBtn>
          <DHead>
            <Ico credit={selected.direction === "CREDIT"}>{iconFor(selected.type, selected.direction === "CREDIT")}</Ico>
            <div>
              <TType>{purchaseName(selected)}</TType>
              <TMeta><span>{fmtDate(selected.createdAt)}</span></TMeta>
            </div>
          </DHead>
          <DAmt credit={selected.direction === "CREDIT"}>{selected.direction === "CREDIT" ? "+" : "−"}{fmtUsdc(selected.amount)} {selected.asset}</DAmt>
          <div style={{ marginTop: 12 }}>
            <DField><DKey>Status</DKey><DVal>Completed</DVal></DField>
            <DField><DKey>Type</DKey><DVal>{LABELS[selected.type] || selected.type}</DVal></DField>
            <DField><DKey>Paid from</DKey><DVal>FOMO Balance</DVal></DField>
            <DField><DKey>Network</DKey><DVal>zkSync Era</DVal></DField>
            {selected.txHash ? (
              <DField><DKey>{selected.type === "PURCHASE" ? "Wallet payment" : selected.type === "WITHDRAWAL" ? "Withdrawal tx" : "Transaction"}</DKey>
                <DVal><TxLink href={`${EXPLORER_TX}${selected.txHash}`} target="_blank" rel="noreferrer">{short(selected.txHash)} <ExternalLink size={12} /></TxLink></DVal></DField>
            ) : null}
            {selected.metadata?.ownerSettlementTxHash ? (
              <DField><DKey>Platform settlement</DKey><DVal><TxLink href={`${EXPLORER_TX}${selected.metadata.ownerSettlementTxHash}`} target="_blank" rel="noreferrer">{short(selected.metadata.ownerSettlementTxHash)} <ExternalLink size={12} /></TxLink></DVal></DField>
            ) : null}
            {selected.metadata?.aiCredits || selected.metadata?.aiCreditsGranted ? (
              <DField><DKey>AI Credits</DKey><DVal>+{selected.metadata.aiCredits || selected.metadata.aiCreditsGranted}</DVal></DField>
            ) : null}
            {selected.referenceId ? <DField><DKey>Reference</DKey><DVal><Ref>{selected.referenceId}</Ref></DVal></DField> : null}
          </div>
        </Drawer>
      ) : (
        <Body data-testid="money-transactions-list">
          <RecoverBox data-testid="money-recover-box">
            <RecoverHead onClick={() => setRecoverOpen((v) => !v)} data-testid="money-recover-toggle">
              <span>Missing a deposit?</span>
              <span style={{ color: "var(--color-primary-dark)", fontSize: 12 }}>{recoverOpen ? "Hide" : "Recover"}</span>
            </RecoverHead>
            {recoverOpen ? (
              <>
                <RInput placeholder="0x… transaction hash" value={txInput} onChange={(e) => setTxInput(e.target.value)} data-testid="money-recover-input" />
                <RBtnRow>
                  <Btn onClick={() => doRecover(txInput)} disabled={busy} data-testid="money-recover-submit">{busy ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCcw size={15} />} Recover deposit</Btn>
                  <Btn ghost onClick={doScan} disabled={scanning} data-testid="money-recover-scan">{scanning ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={15} />} Scan my recent deposits</Btn>
                </RBtnRow>
                {found && found.length > 0 ? found.map((f) => (
                  <Found key={f.txHash} data-testid="money-recover-found">
                    <span><b>+{fmtUsdc(f.amount)} USDC</b> · <Ref>{short(f.txHash)}</Ref></span>
                    <Btn onClick={() => doRecover(f.txHash)} disabled={busy}>Credit</Btn>
                  </Found>
                )) : found ? <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 8 }}>Nothing uncredited found in your recent on-chain history.</div> : null}
              </>
            ) : null}
          </RecoverBox>

          {loading ? (
            <><Skeleton /><Skeleton /><Skeleton /></>
          ) : items.length === 0 ? (
            <Empty data-testid="money-transactions-empty">
              <Receipt size={26} style={{ opacity: 0.5, marginBottom: 8 }} />
              <div>No transactions yet.</div>
            </Empty>
          ) : (
            items.map((tx) => {
              const credit = tx.direction === "CREDIT";
              const ref = tx.txHash ? short(tx.txHash) : tx.referenceId ? short(tx.referenceId) : "";
              return (
                <ClickRow key={tx._id} onClick={() => setSelected(tx)} data-testid={`money-tx-row-${tx.type}`}>
                  <Ico credit={credit}>{iconFor(tx.type, credit)}</Ico>
                  <Mid>
                    <TType>{purchaseName(tx)}</TType>
                    <TMeta>
                      <span>{fmtDate(tx.createdAt)}</span>
                      <span>· Completed</span>
                      {ref ? <Ref>· {ref}</Ref> : null}
                    </TMeta>
                  </Mid>
                  <Amt credit={credit}>{credit ? "+" : "−"}{fmtUsdc(tx.amount)} {tx.asset}</Amt>
                </ClickRow>
              );
            })
          )}
        </Body>
      )}
    </MainModal>
  );
};

export default MoneyTransactionsModal;
