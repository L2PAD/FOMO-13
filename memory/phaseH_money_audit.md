# Phase H — H0 Forensic Audit: existing OTC/P2P money path

## Verdict: SELF-CUSTODY WEB3 model. NO platform-held off-chain balance / ledger exists.

### Evidence
- **Balance is read on-chain, client-side** (`website_front/helpers/walletService.ts`):
  - ethers.js `balanceOf` on USDC contract `0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4`; ETH via `provider.getBalance`.
  - `hooks/useTotalBalance.ts`: balances come from wallet (BalanceContext), `escrowBalance = 0` (placeholder). Cached in localStorage.
- **OTC/P2P = per-deal on-chain escrow** (`deals/model/deal.model.ts`): fields `smartContract` (escrow address per deal), `isReservedFunds`, `section: otc|p2p`, `ticker: usd|eth`, `tokenAddress`, `transaction` (txHash), `decimals`, `isRefund/isReturnFunds`. Flow: buyer `approveUsd` + `confirmBuy` → funds locked in deal escrow → payment marked → release/refund with txHash. `OtcMember` only aggregates totals (totalUsdcSales etc), NOT a spendable balance.
- **Spaceport purchases = on-chain NFT sale contract** (`website_front/smart/abi.ts`: `buy(amount, ref)`, `paymentToken`, `price`) — self-custody, USDC payment.
- **Backend deposits/ (`deposits.service.ts`)**: records a Deposit (txHash unique, status=CONFIRMED, serviceFee/netAmount) — **does NOT credit any balance, no ledger, no $inc**. Pure history.
- **Backend withdraws/**: records withdraw requests (status/expiry) — **no balance mutation, no ledger**.
- No `getBalance` endpoint aggregating deposits−withdraws anywhere. No off-chain custody.

### Implication (contradicts the assumption)
The mental model "пополнил → деньги на смарт-контракт → начислялись внутренние цифры → торговал → выводил" is, in code, **self-custody**: the user's own wallet holds funds; deals escrow them per-trade on-chain. There is **no internal platform balance the backend credits/debits**. So "оплатить подписку остатком без новой транзакции" is NOT currently possible — that requires a platform-custodied off-chain balance that does not exist yet.

### What is actually reusable (~ the real %)
Reusable: web3 wallet connect (WalletConnect/Trust/MetaMask), on-chain balance read, USDC/ERC20 approve+transfer plumbing, deposit/withdraw **record** models + admin lists, per-deal escrow contract pattern, Products CMS + Subscriptions + AI economics (Phase A–F).
NOT existing: off-chain FOMO Money ledger, available/reserved balance, Purchase/Settlement, treasury custody, pay-with-balance, admin Money Control Center with ledger adjustments.

## Two viable architectures (decision required)

**Option 1 — On-chain checkout (matches current self-custody, smallest build).**
Buy Membership = user sends USDC on-chain to a platform TREASURY address (reuse approve+transfer). Backend watches/records the tx (reuse deposits pattern) → idempotent by txHash → on confirmation creates Purchase→Subscription→AiCreditGrant→economicsSnapshot → Realized Revenue becomes real. No internal balance. "Pay with leftover" only if leftover is in the user's own wallet (still an on-chain tx). No custody risk.

**Option 2 — Off-chain FOMO Money Layer (matches your H1–H14 vision, larger build).**
Introduce a treasury deposit address + blockchain watcher that credits a real MoneyLedger (available/reserved), so deposits become a spendable platform balance. Checkout debits balance (no new tx). Requires custody, reconciliation, withdrawals from treasury, security. This is essentially a new (though partially-scaffolded) money system — NOT 70–90% pre-built.

## Admin (needed in both): Money Control Center
Balances/records table, per-user drilldown into Customer 360, ledger-based ADMIN_ADJUSTMENT (never direct balance edit), permissions, audit.

## Production-close checklist (separate, not an epic): rotate exposed OpenAI key, remove dev admin bypass / test NFT / demo seeds, verify CREDENTIAL_ENC_KEY in prod, permissions on provider credentials, Mongo backup/restore, expiry cron after deploy, block mock provider in prod.
