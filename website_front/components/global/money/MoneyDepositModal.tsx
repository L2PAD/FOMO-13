import React, { FC, useContext, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { ArrowDownToLine, CheckCircle2, Copy, Loader2, ShieldCheck, XCircle } from "lucide-react";
import MainModal from "../common/MainModal";
import { AuthContext, LoadingContext } from "../Layout";
import { confirmMoneyDeposit, fmtUsdc } from "../../../http/money";
import createDeposit, { BlockchainNetwork, CryptoCurrency } from "../../../http/deals/createDeposit";
import { addressOtc, depositUSD } from "../../../smart/smartOTCP2P";

/**
 * MoneyDepositModal (Phase H / P2-P3) — reuses the EXISTING zkSync/USDC on-chain
 * deposit rail (depositUSD + POST /api/deposits) and then bridges the confirmed
 * on-chain deposit into the canonical FOMO MoneyLedger via
 * POST /api/money/deposits/confirm. Explicit status machine, never a bare spinner.
 */

type DepositStatus =
  | "idle"
  | "wallet_confirmation"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "already_processed"
  | "failed";

const MIN_USDC = 0.1;

const Body = styled.div` display: flex; flex-direction: column; gap: 16px; padding: 4px 2px 2px; min-width: 340px; `;
const Field = styled.div` display: flex; flex-direction: column; gap: 6px; `;
const FLabel = styled.label` font-size: 12px; font-weight: 700; color: var(--color-text-secondary); `;
const StaticRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  background: var(--color-surface-muted); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 12px 14px; font-size: 13.5px; color: var(--color-text-primary); font-weight: 600;
`;
const Input = styled.input`
  width: 100%; border: 1px solid var(--color-border); border-radius: 12px; padding: 13px 14px;
  font-size: 16px; font-weight: 700; color: var(--color-text-primary); background: var(--color-surface);
  &:focus-visible { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
`;
const Review = styled.div` display: grid; gap: 2px; background: var(--color-surface-muted); border: 1px solid var(--color-border); border-radius: 14px; padding: 8px 14px; `;
const RRow = styled.div` display: flex; align-items: center; justify-content: space-between; padding: 9px 0; font-size: 13px; border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: none; } `;
const RKey = styled.span` color: var(--color-text-muted); font-weight: 600; `;
const RVal = styled.span` color: var(--color-text-primary); font-weight: 700; `;
const Hint = styled.div` font-size: 11.5px; color: var(--color-text-muted); line-height: 1.5; `;
const CTA = styled.button<{ ghost?: boolean }>`
  width: 100%; border: ${(p) => (p.ghost ? "1px solid var(--color-border)" : "none")};
  background: ${(p) => (p.ghost ? "transparent" : "var(--color-primary)")}; color: ${(p) => (p.ghost ? "var(--color-text-secondary)" : "#fff")};
  font-weight: 700; font-size: 14.5px; padding: 13px; border-radius: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px; transition: filter 0.15s ease;
  &:hover:not(:disabled) { filter: brightness(0.96); } &:disabled { opacity: 0.55; cursor: not-allowed; }
`;
const StatusWrap = styled.div` display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 14px 4px 6px; `;
const StatusIco = styled.div<{ tone: "info" | "ok" | "err" }>`
  width: 62px; height: 62px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: ${(p) => (p.tone === "ok" ? "var(--color-primary-soft)" : p.tone === "err" ? "var(--color-danger-soft, #fdecec)" : "var(--color-info-soft)")};
`;
const StatusTitle = styled.div` font-size: 17px; font-weight: 700; color: var(--color-text-primary); `;
const StatusText = styled.div` font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; max-width: 320px; `;
const TxPill = styled.button`
  display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
  background: var(--color-surface-muted); border: 1px solid var(--color-border); border-radius: 999px;
  padding: 6px 12px; color: var(--color-text-secondary); cursor: pointer; font-family: var(--font-mono, monospace);
`;
const spin = { animation: "spin 1s linear infinite" } as const;

const short = (h: string) => (h && h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h);

interface Props { isVisible: boolean; onClose: () => void; onCredited: () => Promise<void> | void; }

const MoneyDepositModal: FC<Props> = ({ isVisible, onClose, onCredited }) => {
  const auth = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const wallet: string = auth?.userData?.wallet || "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<DepositStatus>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [credited, setCredited] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const reset = () => {
    setStep(1); setAmount(0); setStatus("idle"); setTxHash(""); setCredited(0); setErrorMsg("");
  };
  const handleClose = () => { onClose(); setTimeout(reset, 400); };

  const proceedReview = () => {
    if (!amount || amount < MIN_USDC) { toast.error(`Minimum deposit is ${MIN_USDC} USDC`); return; }
    if (!wallet) { toast.error("Connect a wallet first"); return; }
    setStep(2);
  };

  const runDeposit = async () => {
    setStep(3);
    setErrorMsg("");
    loadingStateHandler?.(true);
    try {
      // 1) On-chain USDC transfer (existing rail, MetaMask). Skip the send when
      //    this modal session already has a confirmed on-chain tx — a retry must
      //    re-credit the SAME payment, never trigger a second on-chain transfer.
      let hash = txHash;
      if (!hash) {
        setStatus("wallet_confirmation");
        const sent = await depositUSD(String(amount));
        if (!sent.ok || !sent.txHash) { throw new Error(sent.error || "Wallet transaction was rejected or failed"); }
        hash = sent.txHash;
        setTxHash(hash);
      }

      // 2) Record the on-chain deposit (backend marks it CONFIRMED + net of fee).
      setStatus("submitted");
      const rec = await createDeposit({
        currency: CryptoCurrency.USDC,
        amount: Number(amount),
        network: BlockchainNetwork.ZKSYNC,
        walletAddress: wallet,
        transactionHash: hash,
        fromAddress: wallet,
        smartContractAddress: addressOtc,
      });
      const dup = (rec.errorMessage || "").toLowerCase().includes("already exists");
      if (!rec.isSuccess && !dup) { throw new Error(rec.errorMessage || "Failed to record deposit"); }

      // 3) Bridge the confirmed deposit into the FOMO MoneyLedger (idempotent).
      setStatus("confirming");
      const res = await confirmMoneyDeposit(hash, "ZKSYNC");
      if (!res.ok) { throw new Error(res.error || "Failed to credit FOMO Balance"); }

      setCredited(Number(res.credited) || 0);
      setStatus(res.duplicate ? "already_processed" : "confirmed");
      await onCredited();
    } catch (e: any) {
      setStatus("failed");
      setErrorMsg(String(e?.message || e));
    } finally {
      loadingStateHandler?.(false);
    }
  };

  const copyTx = () => { if (txHash) { navigator.clipboard.writeText(txHash); toast.info("Transaction hash copied"); } };

  const title = step === 3 ? "Deposit status" : step === 2 ? "Review deposit" : "Deposit USDC";

  return (
    <MainModal isVisible={isVisible} title={title} variant="deal" className="money-deposit-modal" onClose={handleClose}>
      {step === 1 && (
        <Body data-testid="money-deposit-step1">
          <Field>
            <FLabel>Asset</FLabel>
            <StaticRow>USDC <span style={{ color: "var(--color-text-muted)" }}>Stablecoin</span></StaticRow>
          </Field>
          <Field>
            <FLabel>Network</FLabel>
            <StaticRow>zkSync (ERC-20) <span style={{ color: "var(--color-text-muted)" }}>Fee 0</span></StaticRow>
          </Field>
          <Field>
            <FLabel>Amount (USDC)</FLabel>
            <Input
              type="number" min={0} step="0.01" placeholder="0.00"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              data-testid="money-deposit-amount"
            />
          </Field>
          <Hint>Funds are sent on-chain to the FOMO treasury and credited to your internal FOMO Balance. This is separate from your wallet balance and from AI credits.</Hint>
          <CTA onClick={proceedReview} data-testid="money-deposit-continue"><ArrowDownToLine size={16} /> Continue</CTA>
        </Body>
      )}

      {step === 2 && (
        <Body data-testid="money-deposit-step2">
          <Review>
            <RRow><RKey>From</RKey><RVal style={{ fontFamily: "var(--font-mono, monospace)" }}>{short(wallet)}</RVal></RRow>
            <RRow><RKey>Network</RKey><RVal>zkSync</RVal></RRow>
            <RRow><RKey>Asset</RKey><RVal>USDC</RVal></RRow>
            <RRow><RKey>Amount</RKey><RVal>{fmtUsdc(amount)} USDC</RVal></RRow>
          </Review>
          <Hint>You will confirm one on-chain transaction in your wallet. After it settles, your FOMO Balance updates automatically.</Hint>
          <CTA onClick={runDeposit} data-testid="money-deposit-confirm"><ShieldCheck size={16} /> Confirm wallet transaction</CTA>
          <CTA ghost onClick={() => setStep(1)}>Back</CTA>
        </Body>
      )}

      {step === 3 && (
        <Body data-testid="money-deposit-status">
          <StatusWrap>
            {(status === "wallet_confirmation" || status === "submitted" || status === "confirming") && (
              <>
                <StatusIco tone="info"><Loader2 size={30} color="var(--color-info)" style={spin} /></StatusIco>
                <StatusTitle data-testid="money-deposit-status-title">
                  {status === "wallet_confirmation" && "Waiting for wallet confirmation"}
                  {status === "submitted" && "Transaction submitted"}
                  {status === "confirming" && "Waiting for network confirmation"}
                </StatusTitle>
                <StatusText>
                  {status === "wallet_confirmation" && "Approve the USDC transfer in your wallet to continue."}
                  {status === "submitted" && "Your transaction is on-chain. Recording the deposit…"}
                  {status === "confirming" && "Crediting your internal FOMO Balance."}
                </StatusText>
                {txHash ? <TxPill onClick={copyTx}><Copy size={13} /> {short(txHash)}</TxPill> : null}
              </>
            )}

            {(status === "confirmed" || status === "already_processed") && (
              <>
                <StatusIco tone="ok"><CheckCircle2 size={32} color="var(--color-primary-dark)" /></StatusIco>
                <StatusTitle data-testid="money-deposit-success">Deposit complete</StatusTitle>
                <StatusText>
                  {status === "already_processed"
                    ? "This transaction was already credited — your balance is unchanged."
                    : `${fmtUsdc(credited || amount)} USDC added to your FOMO Balance.`}
                </StatusText>
                {txHash ? <TxPill onClick={copyTx}><Copy size={13} /> {short(txHash)}</TxPill> : null}
                <CTA onClick={handleClose} data-testid="money-deposit-done">Done</CTA>
              </>
            )}

            {status === "failed" && (
              <>
                <StatusIco tone="err"><XCircle size={32} color="var(--color-danger, #d9534f)" /></StatusIco>
                <StatusTitle data-testid="money-deposit-failed">Deposit failed</StatusTitle>
                <StatusText>{errorMsg || "Something went wrong. No funds were credited."}</StatusText>
                {txHash ? (
                  <>
                    <TxPill onClick={copyTx}><Copy size={13} /> {short(txHash)}</TxPill>
                    <StatusText style={{ fontSize: 11.5 }}>
                      Your on-chain payment already went through. Retrying only re-credits this transaction — you will NOT pay again.
                    </StatusText>
                    <CTA onClick={runDeposit} data-testid="money-deposit-retry-credit">Retry crediting (no new payment)</CTA>
                  </>
                ) : (
                  <CTA onClick={() => setStep(2)} data-testid="money-deposit-retry">Try again</CTA>
                )}
                <CTA ghost onClick={handleClose}>Close</CTA>
              </>
            )}
          </StatusWrap>
        </Body>
      )}
    </MainModal>
  );
};

export default MoneyDepositModal;
