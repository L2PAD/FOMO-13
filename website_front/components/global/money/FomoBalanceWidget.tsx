import React, { useContext } from "react";
import styled from "styled-components";
import { ArrowDownToLine, ArrowUpFromLine, Receipt, Wallet } from "lucide-react";
import { AuthContext } from "../Layout";
import { useFomoMoney } from "./FomoMoneyProvider";
import { fmtUsdc } from "../../../http/money";

/**
 * FomoBalanceWidget (Phase H / P1) — the single global surface for a user's
 * internal FOMO Balance. Deliberately kept SEPARATE from Wallet USDC and AI
 * Credits: this is spendable platform balance derived from the MoneyLedger.
 */

const Card = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 20px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 260px;
`;
const TopRow = styled.div` display: flex; align-items: center; gap: 10px; `;
const IconBox = styled.div`
  width: 38px; height: 38px; border-radius: 11px;
  background: var(--color-primary-soft);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;
const Label = styled.div`
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px;
  color: var(--color-text-muted); font-weight: 700;
`;
const Sub = styled.div` font-size: 12px; color: var(--color-text-muted); margin-top: 1px; `;
const Big = styled.div`
  font-size: 30px; font-weight: 700; letter-spacing: -0.02em; color: var(--color-text-primary);
  span { font-size: 14px; color: var(--color-text-muted); font-weight: 600; margin-left: 6px; }
`;
const Split = styled.div` display: flex; gap: 10px; `;
const Mini = styled.div`
  flex: 1; background: var(--color-surface-muted); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 10px 12px;
`;
const MiniLabel = styled.div` font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.3px; color: var(--color-text-muted); font-weight: 700; `;
const MiniVal = styled.div` font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-top: 2px; `;
const Actions = styled.div` display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; `;
const Btn = styled.button<{ variant?: "primary" | "ghost" }>`
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border-radius: 11px; padding: 10px 8px; font-size: 12.5px; font-weight: 700; cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  border: 1px solid ${(p) => (p.variant === "primary" ? "var(--color-primary)" : "var(--color-border)")};
  background: ${(p) => (p.variant === "primary" ? "var(--color-primary)" : "transparent")};
  color: ${(p) => (p.variant === "primary" ? "#fff" : "var(--color-text-secondary)")};
  &:hover:not(:disabled) { filter: brightness(0.97); border-color: var(--color-primary); color: ${(p) => (p.variant === "primary" ? "#fff" : "var(--color-primary-dark)")}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

interface Props { compact?: boolean; className?: string; }

const FomoBalanceWidget: React.FC<Props> = ({ className }) => {
  const auth = useContext(AuthContext);
  const isAuth = !!auth?.isAuth;
  const { balance, loading, openDeposit, openWithdraw, openTransactions } = useFomoMoney();

  if (!isAuth) return null;

  return (
    <Card className={className} data-testid="fomo-balance-widget">
      <TopRow>
        <IconBox><Wallet size={19} color="var(--color-primary-dark)" /></IconBox>
        <div>
          <Label>FOMO Balance</Label>
          <Sub>Internal USDC · zkSync</Sub>
        </div>
      </TopRow>

      <Big data-testid="fomo-balance-total">
        {loading ? "…" : fmtUsdc(balance.total)}<span>USDC</span>
      </Big>

      <Split>
        <Mini>
          <MiniLabel>Available</MiniLabel>
          <MiniVal data-testid="fomo-balance-available">{fmtUsdc(balance.available)}</MiniVal>
        </Mini>
        <Mini>
          <MiniLabel>Reserved</MiniLabel>
          <MiniVal data-testid="fomo-balance-reserved">{fmtUsdc(balance.reserved)}</MiniVal>
        </Mini>
      </Split>

      <Actions>
        <Btn variant="primary" onClick={openDeposit} data-testid="fomo-deposit-btn">
          <ArrowDownToLine size={15} /> Deposit
        </Btn>
        <Btn onClick={openWithdraw} disabled={balance.available <= 0} data-testid="fomo-withdraw-btn">
          <ArrowUpFromLine size={15} /> Withdraw
        </Btn>
        <Btn onClick={openTransactions} data-testid="fomo-transactions-btn">
          <Receipt size={15} /> History
        </Btn>
      </Actions>
    </Card>
  );
};

export default FomoBalanceWidget;
