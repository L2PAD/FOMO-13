import React, { FC, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import { CheckCircle2, Clock, Loader2, ShieldCheck, Sparkles, Wallet, XCircle } from "lucide-react";
import MainModal from "../common/MainModal";
import {
  MoneyBalance,
  fmtUsdc,
  startCustodyPurchase,
  confirmCustodyLock,
  getPurchaseState,
  PurchaseState,
} from "../../../http/money";
import { safeMoneyUSD } from "../../../smart/smartOTCP2P";
import type { CheckoutProduct } from "./FomoMoneyProvider";

/**
 * MembershipCheckoutModal — ON-CHAIN custody purchase (H5 "CORE FLOW CLOSE").
 *
 * A membership purchase MUST reduce the buyer's on-chain usdBalance, otherwise a
 * direct withdrawUSD() could pull funds already committed to a purchase
 * (double-spend). So checkout runs the proven fee-free escrow path:
 *
 *   1) start   → backend reserves the FOMO Balance + claims a settlement lot
 *   2) sign    → USER signs safeMoneyUSD(itemId, useInternal=true) in MetaMask
 *                → on-chain usdBalance[buyer] -= price (escrow lock)
 *   3) confirm → backend RPC-verifies the lock, then owner settles fee-free
 *   4) finish  → MoneyLedger DEBIT + subscription + AI credits provisioned
 *
 * A stable idempotencyKey + submit lock guarantees a double-click can never
 * create a second purchase or a second on-chain lock.
 */

const Body = styled.div` display: flex; flex-direction: column; gap: 16px; min-width: 360px; padding: 4px 2px 2px; `;
const Head = styled.div` display: flex; align-items: center; gap: 12px; `;
const Ico = styled.div` width: 46px; height: 46px; border-radius: 13px; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; `;
const PName = styled.div` font-size: 18px; font-weight: 700; color: var(--color-text-primary); `;
const PSub = styled.div` font-size: 12.5px; color: var(--color-text-muted); margin-top: 1px; `;
const Table = styled.div` display: grid; gap: 2px; background: var(--color-surface-muted); border: 1px solid var(--color-border); border-radius: 14px; padding: 8px 14px; `;
const TRow = styled.div<{ strong?: boolean }>` display: flex; align-items: center; justify-content: space-between; padding: 10px 0; font-size: 13.5px; border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: none; } font-weight: ${(p) => (p.strong ? 700 : 400)}; `;
const TKey = styled.span` color: var(--color-text-muted); font-weight: 600; `;
const TVal = styled.span` color: var(--color-text-primary); font-weight: 700; `;
const Includes = styled.div` display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 700; color: var(--color-primary-dark); background: var(--color-primary-soft); border: 1px solid var(--color-primary-soft-strong); padding: 8px 12px; border-radius: 10px; align-self: flex-start; `;
const SignNote = styled.div` display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: var(--color-text-muted); line-height: 1.5; background: var(--color-info-soft); border: 1px solid var(--color-border); border-radius: 10px; padding: 9px 12px; `;
const CTA = styled.button<{ ghost?: boolean }>`
  width: 100%; border: ${(p) => (p.ghost ? "1px solid var(--color-border)" : "none")};
  background: ${(p) => (p.ghost ? "transparent" : "var(--color-primary)")}; color: ${(p) => (p.ghost ? "var(--color-text-secondary)" : "#fff")};
  font-weight: 700; font-size: 14.5px; padding: 13px; border-radius: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px; transition: filter 0.15s ease;
  &:hover:not(:disabled) { filter: brightness(0.96); } &:disabled { opacity: 0.55; cursor: not-allowed; }
`;
const Insuff = styled.div` display: flex; flex-direction: column; gap: 10px; `;
const NeedLine = styled.div` font-size: 13.5px; color: var(--color-text-secondary); display: flex; justify-content: space-between; `;
const NeedStrong = styled.div` font-size: 15px; font-weight: 700; color: var(--color-danger, #d9534f); display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px dashed var(--color-border); `;
const StatusWrap = styled.div` display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 12px 4px 4px; `;
const StatusIco = styled.div<{ tone: "info" | "ok" | "err" | "warn" }>`
  width: 62px; height: 62px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: ${(p) =>
    p.tone === "ok" ? "var(--color-primary-soft)"
    : p.tone === "err" ? "var(--color-danger-soft, #fdecec)"
    : p.tone === "warn" ? "var(--color-warning-soft, #fff4e5)"
    : "var(--color-info-soft)"};
`;
const StatusTitle = styled.div` font-size: 18px; font-weight: 700; color: var(--color-text-primary); `;
const StatusText = styled.div` font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; max-width: 330px; `;
const spin = { animation: "spin 1s linear infinite" } as const;

type Stage =
  | "confirm"
  | "insufficient"
  | "starting"
  | "signing"
  | "verifying"
  | "settling"
  | "done"
  | "pending_activation"
  | "unavailable"
  | "failed";

const OK_STATUS = "SETTLED";
const FAIL_STATES = ["FAILED", "REFUNDED", "MANUAL_REVIEW", "PROVISIONING_FAILED", "REFUND_MANUAL_REVIEW", "REFUND_REQUIRED", "RELEASED"];
const PENDING_STATES = ["CUSTODY_LOCKED", "USER_TX_SUBMITTED", "OWNER_SETTLEMENT_PENDING", "OWNER_SETTLING", "OWNER_SETTLED", "PROVISIONING"];

interface Props {
  product: CheckoutProduct | null;
  balance: MoneyBalance;
  onClose: () => void;
  onDepositRequest: () => void;
  onSettled: () => Promise<void> | void;
}

const MembershipCheckoutModal: FC<Props> = ({ product, balance, onClose, onDepositRequest, onSettled }) => {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("confirm");
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<PurchaseState | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const idemRef = useRef<string>("");
  const purchaseIdRef = useRef<string>("");
  const aliveRef = useRef<boolean>(true);

  const isVisible = !!product;
  const price = product?.priceUsd || 0;
  const available = balance.available;
  const sufficient = available >= price;

  useEffect(() => {
    aliveRef.current = true;
    if (product) {
      idemRef.current = `custody:${product.productCode}:${product.planCode || ""}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      purchaseIdRef.current = "";
      setStage(sufficient ? "confirm" : "insufficient");
      setState(null); setErrorMsg(""); setSubmitting(false);
    }
    return () => { aliveRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const handleClose = () => { aliveRef.current = false; onClose(); };

  const finishTerminal = async (s: PurchaseState) => {
    setState(s);
    if (s.status === OK_STATUS) setStage("done");
    else setStage("pending_activation");
    await onSettled(); // refresh FOMO Balance (available/reserved)
  };

  // Poll the saga until it settles (owner settlement + provisioning) or the
  // polling window closes — funds are already locked on-chain either way.
  const pollSettlement = async () => {
    const id = purchaseIdRef.current;
    if (!id) return;
    for (let i = 0; i < 20 && aliveRef.current; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      if (!aliveRef.current) return;
      try {
        const s = await getPurchaseState(id);
        setState(s);
        if (s.status === OK_STATUS) { await finishTerminal(s); return; }
        if (FAIL_STATES.includes(s.status)) {
          setErrorMsg(s.failReason || `Purchase ${s.status}`);
          setStage("failed");
          await onSettled();
          return;
        }
      } catch {
        /* transient RPC/network — keep polling */
      }
    }
    // Still settling after the window: funds are safely locked, membership will
    // activate automatically once the operator/worker completes settlement.
    if (aliveRef.current) {
      setStage("pending_activation");
      await onSettled();
    }
  };

  const routeState = async (s: PurchaseState) => {
    setState(s);
    if (s.status === OK_STATUS) { await finishTerminal(s); return; }
    if (FAIL_STATES.includes(s.status)) {
      setErrorMsg(s.failReason || s.error || `Purchase ${s.status}`);
      setStage("failed");
      return;
    }
    if (PENDING_STATES.includes(s.status)) { setStage("settling"); await pollSettlement(); return; }
    // Anything unexpected → poll a bit before deciding.
    setStage("settling");
    await pollSettlement();
  };

  const confirm = async () => {
    if (submitting || !product) return; // submit lock — no duplicate purchase / lock
    if (!sufficient) { setStage("insufficient"); return; }
    setSubmitting(true);
    setErrorMsg("");
    setStage("starting");
    try {
      // 1) Start the custody saga (reserve FOMO Balance + claim settlement lot).
      const started = await startCustodyPurchase({
        productCode: product.productCode,
        planCode: product.planCode,
        idempotencyKey: idemRef.current,
      });
      purchaseIdRef.current = started.purchaseId;
      setState(started);

      if (started.error) throw new Error(started.error);
      if (started.status === OK_STATUS) { await finishTerminal(started); setSubmitting(false); return; }

      // No settlement lot available for this price → operator must provision.
      if (started.status === "CUSTODY_ITEM_PENDING" || (started.operatorPending && !started.custodyAction)) {
        setStage("unavailable");
        setSubmitting(false);
        return;
      }

      const action = started.custodyAction;
      if (!action || !action.itemId) {
        // Already locked / mid-flight (idempotent re-entry) → resume polling.
        await routeState(started);
        setSubmitting(false);
        return;
      }

      // 2) USER signs safeMoneyUSD(itemId, useInternal=true) → on-chain lock.
      setStage("signing");
      const sig = await safeMoneyUSD(Number(action.itemId), { useInternal: true, price: Number(action.amount) });
      if (!sig.ok || !sig.txHash) {
        // Nothing was locked on-chain if the signature was rejected.
        setErrorMsg(sig.error || "Wallet signature was rejected. No funds were moved.");
        setStage("failed");
        setSubmitting(false);
        return;
      }

      // 3) Backend RPC-verifies the lock, then settles + provisions.
      setStage("verifying");
      const confirmed = await confirmCustodyLock(started.purchaseId, sig.txHash);
      await routeState(confirmed);
      setSubmitting(false);
    } catch (e: any) {
      setErrorMsg(e?.message || "Purchase failed");
      setStage("failed");
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const activeUntil = new Date(Date.now() + (product.durationDays || 30) * 86400000)
    .toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const creditsGranted = state?.aiCreditsGranted ?? product.aiCredits ?? 0;
  const remaining = Math.max(available - price, 0);

  const title =
    stage === "done" ? "Membership activated"
    : stage === "pending_activation" ? "Payment locked"
    : stage === "insufficient" ? "Add funds to continue"
    : stage === "unavailable" ? "Temporarily unavailable"
    : stage === "failed" ? "Purchase failed"
    : "Confirm purchase";

  const processingTitle =
    stage === "starting" ? "Preparing purchase…"
    : stage === "signing" ? "Confirm in your wallet…"
    : stage === "verifying" ? "Verifying on-chain lock…"
    : "Finalizing membership…";
  const processingText =
    stage === "starting" ? `Reserving ${fmtUsdc(price)} USDC from your FOMO Balance and preparing the on-chain lock.`
    : stage === "signing" ? `Sign safeMoneyUSD in your wallet to lock ${fmtUsdc(price)} USDC on-chain for this purchase.`
    : stage === "verifying" ? "Confirming your lock transaction on zkSync Era."
    : "Settling on-chain and provisioning your access. This can take a moment.";

  const isProcessing = stage === "starting" || stage === "signing" || stage === "verifying" || stage === "settling";

  return (
    <MainModal isVisible={isVisible} title={title} variant="deal" className="membership-checkout-modal" onClose={handleClose}>
      {stage === "confirm" && (
        <Body data-testid="checkout-confirm">
          <Head>
            <Ico><Sparkles size={22} color="var(--color-primary-dark)" /></Ico>
            <div><PName>{product.name}</PName><PSub>{product.durationDays} days membership</PSub></div>
          </Head>
          <Table>
            <TRow><TKey>Price</TKey><TVal data-testid="checkout-price">{fmtUsdc(price)} USDC</TVal></TRow>
            <TRow><TKey>Your FOMO Balance</TKey><TVal>{fmtUsdc(available)} USDC</TVal></TRow>
            <TRow strong><TKey>Balance after purchase</TKey><TVal data-testid="checkout-balance-after">{fmtUsdc(available - price)} USDC</TVal></TRow>
          </Table>
          {product.aiCredits ? <Includes><Sparkles size={14} /> Includes {product.aiCredits} AI credits</Includes> : null}
          <SignNote data-testid="checkout-sign-note">
            <ShieldCheck size={15} style={{ marginTop: 1, flexShrink: 0 }} color="var(--color-info)" />
            <span>You&apos;ll sign one wallet transaction to lock the funds on-chain. This keeps your balance safe from double-spend — nothing is charged if you cancel.</span>
          </SignNote>
          <CTA onClick={confirm} disabled={submitting} data-testid="checkout-confirm-btn">
            <Wallet size={16} /> Confirm &amp; sign
          </CTA>
          <CTA ghost onClick={handleClose}>Cancel</CTA>
        </Body>
      )}

      {stage === "insufficient" && (
        <Body data-testid="checkout-insufficient">
          <Insuff>
            <NeedLine><span>Your FOMO Balance</span><b>{fmtUsdc(available)} USDC</b></NeedLine>
            <NeedLine><span>Required</span><b>{fmtUsdc(price)} USDC</b></NeedLine>
            <NeedStrong><span>You need</span><span data-testid="checkout-need-more">{fmtUsdc(price - available)} USDC more</span></NeedStrong>
          </Insuff>
          <CTA onClick={onDepositRequest} data-testid="checkout-deposit-cta"><Wallet size={16} /> Deposit USDC</CTA>
          <CTA ghost onClick={handleClose}>Cancel</CTA>
        </Body>
      )}

      {isProcessing && (
        <Body data-testid="checkout-processing">
          <StatusWrap>
            <StatusIco tone="info"><Loader2 size={30} color="var(--color-info)" style={spin} /></StatusIco>
            <StatusTitle data-testid="checkout-processing-title">{processingTitle}</StatusTitle>
            <StatusText>{processingText}</StatusText>
          </StatusWrap>
        </Body>
      )}

      {stage === "done" && (
        <Body data-testid="checkout-result">
          <StatusWrap>
            <StatusIco tone="ok"><CheckCircle2 size={32} color="var(--color-primary-dark)" /></StatusIco>
            <StatusTitle data-testid="checkout-success-title">Membership activated</StatusTitle>
            <StatusText>{product.name} · active until {activeUntil}</StatusText>
          </StatusWrap>
          <Table>
            <TRow><TKey>AI credits added</TKey><TVal>{creditsGranted}</TVal></TRow>
            <TRow strong><TKey>Remaining FOMO Balance</TKey><TVal data-testid="checkout-remaining-balance">{fmtUsdc(remaining)} USDC</TVal></TRow>
          </Table>
          <CTA onClick={() => { handleClose(); router.push("/utility/ai"); }} data-testid="checkout-open-ai"><Sparkles size={16} /> Open FOMO AI</CTA>
          <CTA ghost onClick={handleClose}>Close</CTA>
        </Body>
      )}

      {stage === "pending_activation" && (
        <Body data-testid="checkout-pending">
          <StatusWrap>
            <StatusIco tone="warn"><Clock size={30} color="var(--color-warning, #d98c1f)" /></StatusIco>
            <StatusTitle data-testid="checkout-pending-title">Payment locked on-chain</StatusTitle>
            <StatusText>
              {product.name} · {fmtUsdc(price)} USDC is locked on-chain and deducted from your available balance. Your
              membership activates automatically once settlement completes — no further action needed.
            </StatusText>
          </StatusWrap>
          <CTA ghost onClick={handleClose} data-testid="checkout-pending-close">Close</CTA>
        </Body>
      )}

      {stage === "unavailable" && (
        <Body data-testid="checkout-unavailable">
          <StatusWrap>
            <StatusIco tone="warn"><Clock size={30} color="var(--color-warning, #d98c1f)" /></StatusIco>
            <StatusTitle>Checkout temporarily unavailable</StatusTitle>
            <StatusText>
              We&apos;re provisioning settlement capacity for this plan. No funds were moved. Please try again shortly.
            </StatusText>
          </StatusWrap>
          <CTA onClick={() => setStage("confirm")} data-testid="checkout-unavailable-retry">Try again</CTA>
          <CTA ghost onClick={handleClose}>Close</CTA>
        </Body>
      )}

      {stage === "failed" && (
        <Body data-testid="checkout-failed">
          <StatusWrap>
            <StatusIco tone="err"><XCircle size={32} color="var(--color-danger, #d9534f)" /></StatusIco>
            <StatusTitle>Purchase failed</StatusTitle>
            <StatusText data-testid="checkout-error-text">{errorMsg || "No funds were debited."}</StatusText>
          </StatusWrap>
          {(errorMsg || "").toLowerCase().includes("insufficient") ? (
            <CTA onClick={onDepositRequest} data-testid="checkout-deposit-cta"><Wallet size={16} /> Deposit USDC</CTA>
          ) : (
            <CTA onClick={() => setStage(sufficient ? "confirm" : "insufficient")} data-testid="checkout-retry">Try again</CTA>
          )}
          <CTA ghost onClick={handleClose}>Close</CTA>
        </Body>
      )}
    </MainModal>
  );
};

export default MembershipCheckoutModal;
