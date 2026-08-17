/**
 * Canonical OTC/P2P custody-contract facts for the admin UI.
 * Mirrors fomo-backend/src/money/contracts/zksync-custody.manifest.ts (H4.1) —
 * the single source of truth the marketplace logic is built around.
 */
export const ZK_CONTRACT = {
  address: "0xc6b848CA645603521C81D439aC0C856dbDAaeD2F",
  owner: "0xD128f1E3b2938eB005Bc5c750A66b82173f62857",
  network: "zkSync Era Mainnet",
  chainId: 324,
  explorer: "https://explorer.zksync.io",
  sourceVerified: false,
  feePercent: 5, // feePermille 50 (max 200 = 20%)
  token: { symbol: "USDC.e", address: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4", decimals: 6 },
  functions: [
    { name: "depositUSD", access: "public", effect: "+amount плательщику", fee: "NONE", use: "Пополнение баланса (подпись пользователя)" },
    { name: "withdrawUSD", access: "public", effect: "−amount, USDC отправителю", fee: "NONE", use: "Вывод средств (подпись пользователя, без серверного подписанта)" },
    { name: "usdBalance", access: "public", effect: "view", fee: "NONE", use: "Чтение доступного on-chain баланса" },
    { name: "createItem", access: "public", effect: "нет", fee: "NONE", use: "Создание лота расчёта (сделки)" },
    { name: "safeMoneyUSD", access: "public", effect: "−price покупателю (эскроу-lock)", fee: "NONE", use: "Резерв средств покупателем — шаг 1 покупки" },
    { name: "purchaseDirectUSD", access: "public", effect: "−price покупателю, +net продавцу, +fee", fee: "feePermille", use: "Прямая покупка (всегда 5% — не для членства)" },
    { name: "completeDealUSD", access: "seller", effect: "расчёт продавцу с комиссией", fee: "feePermille", use: "Закрытие продавцом (с комиссией)" },
    { name: "adminResolveUSD", access: "onlyOwner", effect: "расчёт продавцу (full если takeFee=false) ИЛИ возврат покупателю", fee: "feePermille(if takeFee)", use: "Разрешение админом: расчёт/возврат — используется в апелляциях" },
    { name: "setFeePermille", access: "onlyOwner", effect: "—", fee: "NONE", use: "Установка комиссии рынка (админ)" },
    { name: "owner", access: "public", effect: "view", fee: "NONE", use: "Чтение владельца (= подписант расчётов)" },
  ],
} as const;

/**
 * NFT Marketplace (Pool) contract — forensic из реальной интеграции
 * (frontend/src/components/smart/initialSmartMarketplace.tsx + abi.ts).
 * Реальные методы; функций pause/blacklist/admin-cancel-order НЕТ (не выдумываем).
 */
export const NFT_CONTRACT = {
  poolAddress: "0xd88Bf310CB04d9415C5Ad689d3d07b2CcD582525",
  nftAddress: "0xaC5cf2161f0914f3d2DCcB3c8B83fbdA48126576",
  network: "zkSync Era Mainnet",
  chainId: 324,
  explorer: "https://explorer.zksync.io",
  ethDecimals: 18,
  usdcDecimals: 6,
  feeModel: "per-collection (change_fee / change_creator_fee)",
  functions: [
    { name: "add_collection", access: "onlyOwner", effect: "регистрация коллекции + fee/creator", fee: "—", use: "Добавить коллекцию в маркетплейс" },
    { name: "change_fee", access: "onlyOwner", effect: "—", fee: "set", use: "Изменить комиссию маркетплейса для коллекции" },
    { name: "change_creator_fee", access: "onlyOwner", effect: "—", fee: "set", use: "Изменить комиссию создателя коллекции" },
    { name: "change_creator", access: "onlyOwner", effect: "—", fee: "—", use: "Сменить получателя creator-комиссии" },
    { name: "delete_collection", access: "onlyOwner", effect: "снятие коллекции", fee: "—", use: "Удалить коллекцию из маркетплейса (единственный admin-remove)" },
    { name: "get_all_items_usd / _eth", access: "public", effect: "view", fee: "—", use: "Листинги коллекции (USDC/ETH)" },
    { name: "get_item_by_id(_usd)", access: "public", effect: "view", fee: "—", use: "Данные листинга/ордера по id" },
    { name: "total_volume_usd / _eth", access: "public", effect: "view", fee: "—", use: "Совокупный объём торгов" },
    { name: "owner / price / available", access: "public", effect: "view", fee: "—", use: "Владелец, цена, доступность" },
  ],
} as const;
