import React, { FC, useContext, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { ArrowUpFromLine, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import MainModal from "../common/MainModal";
import { AuthContext } from "../Layout";
import { MoneyBalance, requestMoneyWithdrawal, confirmMoneyWithdrawalWeb3, fmtUsdc } from "../../../http/money";
import { withdrawUSD } from "../../../smart/smartOTCP2P";

/**
 * MoneyWithdrawModal (H5) — USER-SIGNED withdrawal. Funds are reserved on the
 * MoneyLedger, then the user signs withdrawUSD(amount) in THEIR OWN wallet and
 * the backend RPC-verifies the tx. No server-side withdrawal signer is used.
 * `Available` is read STRICTLY from the Money API.
 */

type WStatus = "idle" | "reserving" | "signing" | "confirming" | "done" | "failed";

const Body = styled.div` display: flex; flex-direction: column; gap: 16px; padding: 4px 2px 2px; min-width: 340px; `;
const AvailBox = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  background: var(--color-primary-soft); border: 1px solid var(--color-primary-soft-strong);
  border-radius: 12px; padding: 12px 14px;
`;
const AvailLabel = styled.div` font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; color: var(--color-primary-dark); font-weight: 700; `;
const AvailVal = styled.div` font-size: 18px; font-weight: 700; color: var(--color-primary-dark); `;
const Field = styled.div` display: flex; flex-direction: column; gap: 6px; `;
const FLabel = styled.label` font-size: 12px; font-weight: 700; color: var(--color-text-secondary); `;
const Input = styled.input`
  width: 100%; border: 1px solid var(--color-border); border-radius: 12px; padding: 13px 14px;
  font-size: 15px; font-weight: 600; color: var(--color-text-primary); background: var(--color-surface);
  &:focus-visible { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
`;
const MaxBtn = styled.button` align-self: flex-end; font-size: 11.5px; font-weight: 700; color: var(--color-primary-dark); background: none; border: none; cursor: pointer; `;
const Err = styled.div` font-size: 12px; color: var(--color-danger, #d9534f); font-weight: 600; `;
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
const spin = { animation: "spin 1s linear infinite" } as const;

const short = (h: string) => (h && h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h);

interface Props { isVisible: boolean; balance: MoneyBalance; onClose: () => void; onRequested: () => Promise<void> | void; }

const MoneyWithdrawModal: FC<Props> = ({ isVisible, balance, onClose, onRequested }) => {
  const auth = useContext(AuthContext);
  const walletDefault: string = auth?.userData?.wallet || "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState<number>(0);
  const [destination, setDestination] = useState<string>(walletDefault);
  const [status, setStatus] = useState<WStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [withdrawalId, setWithdrawalId] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  const available = balance.available;

  const reset = () => { setStep(1); setAmount(0); setStatus("idle"); setErrorMsg(""); setDestination(walletDefault); setWithdrawalId(""); setTxHash(""); };
  const handleClose = () => { onClose(); setTimeout(reset, 400); };

  const amountError =
    amount <= 0 ? "" : amount > available ? `Exceeds available (${fmtUsdc(available)} USDC)` : "";
  const destError = destination && destination.length < 10 ? "Invalid address" : "";

  const proceed = () => {
    if (amount <= 0) { toast.error("Enter an amount"); return; }
    if (amount > available) { toast.error("Amount exceeds available balance"); return; }
    if (!destination || destination.length < 10) { toast.error("Enter a valid destination address"); return; }
    setStep(2);
  };

  // USER-SIGNED withdrawal: reserve → sign withdrawUSD in the user's wallet → confirm on-chain.
  // NOTE: no global page loader here — the modal shows a single, in-context step spinner.
  const submit = async () => {
    setStep(3); setErrorMsg("");
    try {
      // 1) Reserve on the ledger (reuse an existing reservation on retry).
      let wid = withdrawalId;
      if (!wid) {
        setStatus("reserving");
        const res = await requestMoneyWithdrawal({ amount, destination, asset: "USDC", network: "ZKSYNC" });
        if (!res.ok || !res.withdrawalId) throw new Error(res.error || "Withdrawal request failed");
        wid = res.withdrawalId;
        setWithdrawalId(wid);
      }

      // 2) User signs withdrawUSD(amount) in their OWN wallet (funds go to the signer).
      setStatus("signing");
      const sig = await withdrawUSD(amount);
      if (!sig.ok || !sig.txHash) throw new Error(sig.error || "Wallet signature was rejected");
      setTxHash(sig.txHash);

      // 3) Backend RPC-verifies the tx and finalizes the ledger debit.
      setStatus("confirming");
      const fin = await confirmMoneyWithdrawalWeb3(wid, sig.txHash);
      if (!fin.ok) throw new Error(fin.error || "On-chain confirmation failed");

      setStatus("done");
      await onRequested();
    } catch (e: any) {
      setStatus("failed");
      setErrorMsg(e?.message || "Withdrawal failed");
    }
  };

  const title = step === 3 ? "Withdrawal status" : step === 2 ? "Review withdrawal" : "Withdraw USDC";

  return (
    <MainModal isVisible={isVisible} title={title} variant="deal" className="money-withdraw-modal" onClose={handleClose}>
      {step === 1 && (
        <Body data-testid="money-withdraw-step1">
          <AvailBox>
            <AvailLabel>Available</AvailLabel>
            <AvailVal data-testid="money-withdraw-available">{fmtUsdc(available)} USDC</AvailVal>
          </AvailBox>
          <Field>
            <FLabel>Amount (USDC)</FLabel>
            <Input
              type="number" min={0} step="0.01" placeholder="0.00" value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))} data-testid="money-withdraw-amount"
            />
            <MaxBtn type="button" onClick={() => setAmount(available)} data-testid="money-withdraw-max">Use max</MaxBtn>
            {amountError ? <Err data-testid="money-withdraw-amount-error">{amountError}</Err> : null}
          </Field>
          <Field>
            <FLabel>Destination address</FLabel>
            <Input
              type="text" placeholder="0x…" value={destination}
              onChange={(e) => setDestination(e.target.value.trim())} data-testid="money-withdraw-destination"
            />
            {destError ? <Err>{destError}</Err> : null}
          </Field>
          <Hint>Withdrawals reserve funds immediately and are executed on the zkSync USDC rail. Available reflects your internal FOMO Balance only.</Hint>
          <CTA onClick={proceed} data-testid="money-withdraw-continue"><ArrowUpFromLine size={16} /> Continue</CTA>
        </Body>
      )}

      {step === 2 && (
        <Body data-testid="money-withdraw-step2">
          <Review>
            <RRow><RKey>Amount</RKey><RVal>{fmtUsdc(amount)} USDC</RVal></RRow>
            <RRow><RKey>Network</RKey><RVal>zkSync</RVal></RRow>
            <RRow><RKey>Destination</RKey><RVal style={{ fontFamily: "var(--font-mono, monospace)" }}>{short(destination)}</RVal></RRow>
            <RRow><RKey>Available after</RKey><RVal>{fmtUsdc(available - amount)} USDC</RVal></RRow>
          </Review>
          <Hint>{fmtUsdc(amount)} USDC is reserved, then you sign the payout with your own wallet. Funds are sent on-chain to your connected address — no custodial signer.</Hint>
          <CTA onClick={submit} data-testid="money-withdraw-submit"><ShieldCheck size={16} /> Sign & withdraw</CTA>
          <CTA ghost onClick={() => setStep(1)}>Back</CTA>
        </Body>
      )}

      {step === 3 && (
        <Body data-testid="money-withdraw-status">
          <StatusWrap>
            {(status === "reserving" || status === "signing" || status === "confirming") && (
              <>
                <StatusIco tone="info"><Loader2 size={30} color="var(--color-info)" style={spin} /></StatusIco>
                <StatusTitle>
                  {status === "reserving" ? "Reserving funds…" : status === "signing" ? "Confirm in your wallet…" : "Confirming on-chain…"}
                </StatusTitle>
                <StatusText>
                  {status === "reserving"
                    ? `Moving ${fmtUsdc(amount)} USDC into reserve.`
                    : status === "signing"
                      ? `Sign withdrawUSD(${fmtUsdc(amount)}) in your wallet to release the payout.`
                      : `Verifying ${txHash ? short(txHash) : "your transaction"} on zkSync Era.`}
                </StatusText>
              </>
            )}
            {status === "done" && (
              <>
                <StatusIco tone="ok"><CheckCircle2 size={32} color="var(--color-primary-dark)" /></StatusIco>
                <StatusTitle data-testid="money-withdraw-success">Withdrawal complete</StatusTitle>
                <StatusText>{fmtUsdc(amount)} USDC was sent to your wallet{txHash ? ` · ${short(txHash)}` : ""}. Your FOMO Balance has been updated.</StatusText>
                <CTA onClick={handleClose} data-testid="money-withdraw-done">Done</CTA>
              </>
            )}
            {status === "failed" && (
              <>
                <StatusIco tone="err"><XCircle size={32} color="var(--color-danger, #d9534f)" /></StatusIco>
                <StatusTitle data-testid="money-withdraw-failed">Withdrawal failed</StatusTitle>
                <StatusText>{errorMsg || "Could not complete the withdrawal."}</StatusText>
                <CTA onClick={submit} data-testid="money-withdraw-retry">Try again</CTA>
                <CTA ghost onClick={handleClose}>Close</CTA>
              </>
            )}
          </StatusWrap>
        </Body>
      )}
    </MainModal>
  );
};

export default MoneyWithdrawModal;
