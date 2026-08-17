# FOMO Acquiring — zkSync Custody Handoff (Phase H4)

> Purpose: start the next session from the current **understanding**, not just the
> current code. Acquiring is NOT finished — this doc captures the hard-won
> forensic + architecture so nobody re-discovers the contract logic the slow way.

Last verified state: **MoneyLedger balance = on-chain usdBalance = 2.00 USDC (diff 0, reconciled).**

---

## 1. System topology

- `fomo-backend/` — NestJS, canonical **MoneyLedger**, Purchase Engine, Subscriptions,
  AI Credits, Acquiring, `MoneyChainService` (zkSync/ethers v6). Runs on `:5000`,
  global prefix `/api` (supervisor program `fomo_nest`).
- `backend/` — FastAPI proxy `:8001`.
- `frontend/` — React CRM `:3000` (admin/acquiring/statistics/customer360).
- `website_front/` — Next.js public site `:3001` (deposit/withdraw UI, MetaMask, ethers **v5**).

Do NOT rewrite MoneyLedger / Purchase Engine / Subscription / AI Credits. Build AROUND them.

---

## 2. Canonical zkSync network config (source of truth)

Stored in Mongo `money_network_configs` (networkId `ZKSYNC_USDC`), CRM-managed & versioned.
Read everywhere via `MoneyChainService.netConfig()`.

```
Network            zkSync Era Mainnet
chainId            324
Token              USDC.e   0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4  (6 decimals)
Deposit receiver   0xc6b848CA645603521C81D439aC0C856dbDAaeD2F   (= the custody contract, NOT an EOA)
RPC (primary)      https://zksync.drpc.org        (http(s) ONLY — ws:// breaks ethers JsonRpcProvider)
Confirmations      12
depositFeeMode     NONE  (deposit credits 1:1)
```

Guards baked into code so a fresh deploy self-heals:
- `netConfig()` ignores any `ws(s)://` rpcUrl and falls back to the https default.
- `bootstrap.sh` writes MONEY_* env defaults + runs `scripts/seed-money-network.js`
  (idempotent: creates/repairs config incl. fee fields; never clobbers a valid operator config).
- Never hardcode `0x473999…` (an old wrong treasury EOA) anywhere in the prod path.

---

## 3. THE CONTRACT — `0xc6b848…` = "FOMO Custody Contract"

- NOT source-verified on explorer; forensic done from **runtime bytecode** (solc 0.8.20, EVM-like).
- Historically an OTC/P2P marketplace + custody contract. Owner controls it.

### Current on-chain settings (read live)
```
owner()       (storage slot 1) = 0xD128f1E3b2938eB005Bc5c750A66b82173f62857   (OPERATOR's address)
feeAccount()  (storage slot 2) = 0xD128f1E3b2938eB005Bc5c750A66b82173f62857
feePermille() (storage slot 3) = 50  -> 5%   (max 200 = 20%, onlyOwner setFeePermille)
slot 4 = secondary fee (only for items flagged "double fee"; max 500 = 50%)
usdBalance mapping = storage slot 7   (getter selector 0xf752549c)
ethBalance mapping = storage slot 6   (getter selector 0xd8f3790f)
```

### Function-by-function forensic (money functions)
| Function | Selector | usdBalance effect | Fee? | Fee recipient | FOMO use |
|---|---|---|---|---|---|
| `depositUSD(amount)` | 0xdd94cd41 | `+amount` payer (after USDC transferFrom) | **NONE** | — | Deposit rail ✅ |
| `withdrawUSD(amount)` | 0x159a71dc | `-amount` sender, USDC→sender | **NONE** | — | Withdraw rail ✅ (user-signed) |
| `usdBalance(addr)` | 0xf752549c | view | — | — | spendable read |
| `createItem(uint64,uint256,uint8,uint8,address,address,uint256)` | 0xd2e3c2ae | none | — | — | make platform product lot |
| `safeMoneyUSD(id,useInternal)` | 0xfb57e6a8 | `-price` buyer (escrow lock) | fee at resolve only | — | ✅ purchase step 1 (USER signs) |
| `purchaseDirectUSD(id,useInternal)` | 0xade578a8 | `-price` buyer, `+net` seller, `+fee` feeAccount | **YES feePermille** | feeAccount | ❌ DO NOT use for membership |
| `completeDealUSD(id)` | 0x69dbb57d | settle to seller w/ fee | **YES** | feeAccount | ❌ takes fee (seller-called) |
| `adminResolveUSD(id,refundToBuyer,takeFee)` | 0xe6d8c0f7 | settle seller (full if takeFee=false) OR refund buyer | **0 if takeFee=false** | feeAccount if takeFee | ✅ purchase step 2 (OWNER signs), fee-free |
| `setFeePermille(x)` | 0x6dc96068 | — | onlyOwner, max 200 | — | admin |
| `feeAccount()` / `owner()` | 0x65e17c9d / 0x8da5cb5b | view | — | — | — |

Fee applies ONLY in: `purchaseDirectUSD`, `completeDealUSD`, `adminResolveUSD(takeFee=true)`.
Fee does NOT apply in: `depositUSD`, `withdrawUSD`, `adminResolveUSD(takeFee=false)`, refund branch.
Access control (onlyOwner, slot1=0xD128): `setFeePermille`, `setFeeAccount`, `adminResolveUSD`, setUsdToken.

Events: DepositedUSD, WithdrawnUSD, ItemCreated(0x39e723ac…), Sold(0x…ee7…), Resolved(0x73cb2424…).

### KEY CONCLUSIONS
1. `withdrawUSD` is the native, fee-free, **user-signed** withdrawal → NO separate payout-EOA needed for user withdrawals.
2. `purchaseDirectUSD` is an OTC/marketplace primitive that ALWAYS charges 5% — **do not** use it for subscriptions and **do not** toggle global `feePermille` per purchase.
3. Fee-free custody-aware purchase = **escrow path**:
   ```
   createItem(price, escrow mode, tokenForSale=0, seller=owner)   // once per product
   user  -> safeMoneyUSD(itemId, useInternal=true)                 // usdBalance[user] -= price (MetaMask)
   owner -> adminResolveUSD(itemId, refundToBuyer=false, takeFee=false)  // seller += full price, 0 fee
   refund on provisioning fail: owner -> adminResolveUSD(itemId, true, false)  // buyer refunded
   ```
4. `adminResolveUSD` is onlyOwner → the ONE place a backend/platform signer (owner key 0xD128) is legitimately required. It is DISTINCT from user withdrawals.

### DOUBLE-SPEND RULE (critical invariant)
Because `withdrawUSD` lets a user pull their FULL on-chain `usdBalance` directly (bypassing our backend),
a purchase MUST reduce the on-chain `usdBalance` (via the escrow path above). Off-chain-only ledger
debits are unsafe. Canonical invariant:
```
MoneyLedger.available(user) + reserved  ==  on-chain usdBalance(user)  (minus settled purchases)
```

---

## 4. Canonical money model

```
Deposit:   wallet --depositUSD--> usdBalance += X  -->  MoneyLedger DEPOSIT += X   (fee = NONE)
Purchase:  MoneyLedger reserve --> safeMoneyUSD (user) --> custody lock
                                --> adminResolveUSD(false,false) (owner) --> MoneyLedger DEBIT
                                --> subscription + AI credits   (NO marketplace fee)
Withdraw:  withdrawUSD (user) --> wallet  -->  MoneyLedger WITHDRAWAL   (fee = NONE by default)
```
Fee policy is per-operation (Fee Policy Registry), never inherited:
DEPOSIT=NONE, PURCHASE=NONE, WITHDRAWAL=NONE(default), OTC_TRADE=5%(contract), P2P_TRADE=own rule.
The contract 5% `feePermille` is a **marketplace** fee → belongs to OTC/P2P settings, NOT Acquiring→Fees.

---

## 5. DONE so far (H3 + H4 P0/P1/P2/P5 + owner-settlement foundation)

- **Deposit fix**: real errors surfaced; preflight (network/balance/allowance/contract-code); modal retry
  re-credits same tx (no double-pay). Files: `website_front/components/global/money/MoneyDepositModal.tsx`,
  `website_front/smart/smartOTCP2P.tsx`.
- **RPC/treasury canonical (v6)**: https drpc + treasury=0xc6b848; `netConfig` ws:// guard; seed script;
  `bootstrap.sh` MONEY_* env. Files: `money-chain.service.ts`, `money-acquiring.service.ts`,
  `scripts/seed-money-network.js`, `bootstrap.sh`.
- **P0 deposit fee removed**: legacy `calculateServiceFee` (min 0.1 USDC floor → looked like 10% on $1)
  replaced by configurable policy (default NONE, 1:1). Stores gross/fee/net/feePolicySnapshot.
  File: `fomo-backend/src/deposits/deposits.service.ts`.
- **P5 deposit safety**: `confirmDeposit` now enforces on-chain sender == user wallet (`WRONG_SENDER`),
  plus existing idempotency/token/treasury/confirmations. File: `fomo-backend/src/money/money.service.ts`.
- **Owner-settlement foundation (H4)** in `money-chain.service.ts`:
  `custodyContract()`, `contractOwner()`, `usdBalanceOf()`, `resolveOwnerSecret()`,
  `ownerSettlementInfo()`, `verifyCustodyLockOnChain(tx,userWallet)`,
  `executeOwnerResolve(itemId,refundToBuyer)` (adminResolveUSD takeFee=false; throws
  `OWNER_SETTLEMENT_NOT_READY` until owner key active).
- **Credential purpose `CONTRACT_OWNER_SETTLEMENT`**: `testCredential` enforces derived address ==
  on-chain `owner()` before activation (verified: dummy random key rejected). Separate from `WITHDRAWAL_SIGNER`.
  File: `fomo-backend/src/money/money-acquiring.service.ts`.

### Fund corrections already applied (real money)
- Deposit tx `0x2b54…727212` credited 0.9 then +0.1 ADMIN_ADJUSTMENT (fee reversal) → 1.0.
- Deposit tx `0x4f34…f801` credited 1.0 (1:1, RPC_VERIFY).
- Result: FOMO Balance 2.00 == on-chain usdBalance 2.00.

---

## 6. TODO / remaining H4 (next passes)

- **P0 Purchase saga** (custody-aware): endpoints + state machine
  `CREATED→LEDGER_RESERVED→USER_TX_REQUIRED→USER_TX_SUBMITTED→CUSTODY_LOCKED→OWNER_SETTLEMENT_PENDING→OWNER_SETTLED→PROVISIONING→SETTLED`;
  errors `USER_TX_FAILED→RELEASED`, `OWNER_SETTLEMENT_FAILED→MANUAL_REVIEW/RETRY`, `PROVISIONING_FAILED→REFUND_PENDING→REFUNDED`.
  Idempotent by purchaseId / itemId / userTxHash / ownerTxHash. After safeMoneyUSD funds are custody-locked —
  never off-chain RELEASE; must refund on-chain via adminResolveUSD(refundToBuyer=true).
- **Platform product lot**: create once (escrow mode, tokenForSale=0, seller=owner); map product→itemId; price snapshot.
- **Frontend checkout**: MetaMask `safeMoneyUSD(itemId,true)`; backend `verifyCustodyLockOnChain` then owner settlement.
- **Web3 Withdraw** (P7-P9): preflight (ledger.available & usdBalance & network) → reserve → user `withdrawUSD` (MetaMask)
  → backend verify (WithdrawnUSD, caller==user, amount, confirmations, tx uniqueness) → ledger WITHDRAWAL → release.
  Failure before broadcast → RELEASE; after txHash → ONCHAIN_PENDING/VERIFY_LATER (never auto-release).
- **CRM**: rename OTC→"FOMO Custody Contract"; Deposit lifecycle states + "Re-verify" (no manual credit; compensation only via ADMIN_ADJUSTMENT);
  Purchases show user-lock tx + owner-settlement tx + status; owner credential shown masked + public address + owner() match.
- **Reconciliation**: per-user (usdBalance vs ledger available/reserved, settled purchases) + global custody decomposition
  (contract USDC assets, Σ user balances, platform-owned, pending) vs ledger liabilities + realized funds.
- **Fees UI**: Acquiring→Fees shows deposit/withdraw honestly (0); the 5% is marketplace (OTC/P2P).
- **Acceptance on real 2 USDC** (P15/P16): withdraw 0.10 then a cheap test-product purchase 0.10 (DO NOT change FOMO AI price).
  Then full E2E + negatives (dup deposit/purchase/withdraw, RPC down, insufficient balance/gas, provisioning fail).

### OPERATOR ACTION REQUIRED (unblocks purchase settlement)
Add the **owner key of `0xD128f1E3b2938eB005Bc5c750A66b82173f62857`** ONLY via
CRM → Эквайринг → Ключи, purpose `CONTRACT_OWNER_SETTLEMENT`, then Test (must show derived==owner) → Activate.
Never paste the key in chat. Until then `executeOwnerResolve` stays READY-gated.

---

## 7. Key endpoints & files

Backend:
- `GET /api/money/me/balance` — user FOMO Balance (presentation truth).
- `POST /api/money/deposits/confirm` — idempotent RPC-verified deposit credit (sender-checked).
- `GET/POST /api/admin/money/acquiring/network/:networkId` — versioned network config (fee fields incl.).
- `GET/POST /api/admin/money/acquiring/credentials[/:id/test|activate|deactivate|revoke]` — credentials (WITHDRAWAL_SIGNER, CONTRACT_OWNER_SETTLEMENT).
- `POST /api/admin/money/users/:id/adjust` — ADMIN_ADJUSTMENT (the only manual money correction).

Files: `fomo-backend/src/money/{money.service.ts, money-chain.service.ts, money-acquiring.service.ts, money.config.ts}`,
`fomo-backend/src/deposits/deposits.service.ts`, `fomo-backend/scripts/seed-money-network.js`,
`website_front/{components/global/money/MoneyDepositModal.tsx, smart/smartOTCP2P.tsx, smart/abi.ts, config/zksync.ts}`, `bootstrap.sh`.

## 8. Ops notes
- Backend build can OOM → always `NODE_OPTIONS="--max_old_space_size=4096" yarn build` (already in bootstrap).
- Mongo `fomo_dev`; collections: money_network_configs(+_history), money_credentials, money_ledger_entries,
  deposits, money_admin_audit.
- Crediting a stuck real deposit = call the real `/money/deposits/confirm` (idempotent, RPC-verified),
  NOT a manual ledger write.

---

## 9. H4.1 — Purchase Saga / Custody Checkout (реализовано в этой сессии)

> Всё строится на РЕАЛЬНОМ контракте `0xc6b848…` и проаудированных селекторах. Ничего не мокается;
> недостающие on-chain шаги честно гейтятся как `PENDING_OPERATOR` (owner-ключ + подпись MetaMask).

**Machine-readable manifest:** `src/money/contracts/zksync-custody.manifest.ts`
(chainId, address, owner, feePermille, per-function selectors/fee behavior, ABI subset, инварианты).
Эндпоинт: `GET /api/admin/money/custody/manifest`.

**Purchase model расширен (additive):** `flow: LEDGER|CUSTODY`, полный `custody{}` trace
(itemId, itemCreateTxHash, userLockTxHash/Block/ConfirmedAt, ownerAddress/ownerSettlementTxHash/Block/At,
refundTxHash, takeFee:false), `economicsSnapshot`, `productId`. Новые статусы саги
(CREATED→LEDGER_RESERVED→CUSTODY_ITEM_READY→USER_SIGNATURE_REQUIRED→USER_TX_SUBMITTED→CUSTODY_LOCKED
→OWNER_SETTLEMENT_PENDING→OWNER_SETTLING→OWNER_SETTLED→PROVISIONING→SETTLED + CANCELLED/RELEASED/
OWNER_SETTLEMENT_FAILED/MANUAL_REVIEW/PROVISIONING_FAILED/REFUND_*). Legacy LEDGER статусы сохранены.

**MoneyChainService (реальный контракт):** добавлены `custodyItemStrategy()` (PER_PURCHASE_ITEM,
seller=owner, tokenForSale=0, fee-free), `executeCreateItem(price)` (owner-signed createItem, парсит
ItemCreated→itemId; gated), `verifyWithdrawalOnChain(tx,wallet)` (withdrawUSD селектор + confirmations),
`custodyReconcile(...)` (custody-lock-aware: on-chain usdBalance ≈ ledger.total − custodyLocked).

**MoneySagaService** (`src/money/money-saga.service.ts`):
- `start` — резерв ledger + кросс-проверка on-chain usdBalance (иначе `BALANCE_RECONCILIATION_REQUIRED`,
  НЕ выбираем значение молча) + `executeCreateItem` (нет owner-ключа → `CUSTODY_ITEM_PENDING`, деньги не теряются).
- `confirmCustodyTx` — RPC-верификация safeMoneyUSD lock, idempotent (повтор с тем же tx не плодит lock).
- `settleOwner` — атомарный claim (CUSTODY_LOCKED→OWNER_SETTLING), 10 параллельных вызовов → 1 owner-tx;
  `adminResolveUSD(itemId,false,false)`; затем ledger DEBIT (idem key `purchase_settlement:{id}`) + provisioning через SubscriptionService.
- `refund` — pre-settlement `adminResolveUSD(itemId,true,false)`; post-settlement → `REFUND_MANUAL_REVIEW`.

**Endpoints:**
- USER: `POST /api/money/purchases` (start saga), `POST /api/money/purchases/:id/custody-confirm`,
  `GET /api/money/purchases/:id`, `POST /api/money/purchases/legacy` (старый ledger checkout),
  `POST /api/money/withdrawals/:id/confirm-web3` (user-signed withdrawUSD verify),
  `POST /api/money/deposits/recover`, `GET /api/money/me/custody-reconcile`.
- ADMIN: `POST /api/admin/money/purchases/:id/owner-settle`, `.../refund`,
  `GET /api/admin/money/custody/owner-settlement`, `GET /api/admin/money/custody/manifest`,
  `GET /api/admin/money/users/:id/custody-reconcile`. `purchaseChain` показывает custody-цепочку
  (user lock / owner settlement / refund tx + explorer + actor USER/PLATFORM_OWNER).

**CRM (админка, русский):** Эквайринг → «Ключи» — панель «FOMO Custody Owner» (on-chain owner, signer,
Match, статус, CONTRACT_OWNER_SETTLEMENT в select); «Покупки» → drawer с полной цепочкой + кнопки
Owner settle / Refund. Реконсиляция custody-lock-aware (пункт 8 ТЗ).

**Проверено live (localhost:5000, real RPC):** manifest ok; owner-settlement = NOT_CONFIGURED
(owner on-chain `0xD128…`, ready=false); reconcile IN_SYNC (ledger 0.51 == on-chain usdBalance 0.51);
saga.start корректно блокирует `BALANCE_RECONCILIATION_REQUIRED` при ledger>on-chain. `nest build` OK, backend RUNNING.

### DONE до owner-активации (пункт 18 ТЗ)
- Purchase state machine — ✅
- Platform item strategy — ✅ (PER_PURCHASE_ITEM, доказан по ABI/forensic)
- User safeMoneyUSD flow (verify) — ✅
- RPC custody-lock verification — ✅
- Idempotency (start/confirm/owner-settle atomic) — ✅
- Refund pre-settlement — ✅
- CRM Purchase chain — ✅
- Deposit recovery — ✅ (endpoint)
- User contract withdrawal (verify withdrawUSD) — ✅
- Custody reconciliation — ✅
- Owner settlement credential — ❗ NOT_CONFIGURED (нужен owner-ключ `0xD128…` через CRM)
- Live purchase settlement — ⏳ PENDING_OPERATOR_ACTIVATION

### Остаётся (следующий проход, требует оператора/подписи)
- Website (English) checkout: реальный MetaMask `safeMoneyUSD(itemId,true)` → `custody-confirm`
  (item создаётся owner-ключом, поэтому end-to-end включается только после активации owner-credential).
- Website (English) withdraw: MetaMask `withdrawUSD` → `confirm-web3` (можно на реальных 0.51: вывести 0.10).
- Публичный withdrawal readiness убрать зависимость от WITHDRAWAL_SIGNER (пункт 16) — вывод user-signed.
- Реальный E2E на owner-ключе: createItem → safeMoneyUSD → adminResolveUSD → subscription → reconciliation 0.

### Про «начислить 2 USDC»
On-chain `usdBalance(0xD128…)` сейчас = **0.51**, не 2. Начислять ledger=2 при on-chain=0.51 —
искусственный рассинхрон, который контракт-aware логика справедливо блокирует (инвариант п.7). Поэтому
ledger приведён к реальным **0.51** (ADMIN_ADJUSTMENT, reason «sync to on-chain»), reconcile IN_SYNC.
Для реальных 2 USDC нужны подтверждённые on-chain депозиты (реальные txHash) → `/money/deposits/confirm`.

---

## 10. H4.2 — реальные депозиты, CRM-таблицы, статистика (эта сессия)

**Реальный кошелёк-депозитор:** `0x94c862c0ef59828e74afd60ad985373fb9723f97` (роль user), НЕ 0xD128 (это owner).
Два реальных депозита по $1 (найдены через zkSync explorer API, on-chain usdBalance(0x94c8)=2.0):
- `0x4f34e25afa1e404faecf44eea132914f529890505c22f0be196b7cfb7b47f801`
- `0x2b54ebc542f2a84320f43ecee4481d6068e7d95c550350d187262bc85f727212`

**Deposit Recovery (code-driven, БЕЗ ручных правок):** `MoneyService.recoverDepositByTx(userId, txHash)` —
RPC-verify (from==wallet, to==treasury, USDC), upsert `deposits`, идемпотентный ledger CREDIT
(`deposit:{net}:{tx}`). Endpoints: `POST /api/money/deposits/recover` (user),
`POST /api/admin/money/users/:id/deposits/recover` (admin). Оба реальных депозита восстановлены →
FOMO Balance пользователя = 2.00 == on-chain, reconcile IN_SYNC. Все тестовые ADMIN_ADJUSTMENT удалены —
в истории ровно 2 реальные DEPOSIT-транзакции с txHash. Баланс ВСЕГДА выводится из реальных депозитов.

**CRM Эквайринг — редизайн под дизайн-систему:** табы с фиолетовым подчёркиванием (HeaderTab), кастомный
`AdminSelect` вместо нативных select, `SectionTitle` (фиолетовое подчёркивание секций), человекочитаемые
лейблы (`human()` — убраны UPPER_SNAKE / vN / жаргон MONEY_*/PENDING_OPERATOR/state machine).

**Универсальная таблица** `pages/Acquiring/DataTable.tsx` (поиск по кошельку/почте/…, сортировка по клику,
пагинация 25/50/100, скролл со «липкой» шапкой, фильтры-AdminSelect). Применена к Балансам, Депозитам,
Покупкам, Выводам. Балансы теперь отдают email/wallet для поиска.

**Статистика в «Обзоре»** (отдельной вкладки нет): `GET /api/admin/money/stats?days=30` +
`MoneyService.moneyStats()` — реальные суточные ряды (депозиты/выводы/покупки), KPI (в системе, на
смарт-контракте on-chain, чистый приток, дельта с контрактом), пончик распределения. Графики —
`pages/Acquiring/Charts.tsx` (Donut + TrendChart, SVG, стиль сайта). `MoneyChainService.contractTokenBalance()`
читает реальный USDC-баланс контракта.

