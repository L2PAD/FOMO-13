# Spaceport / NFT — Deep Forensic (P0.1)

> Read-only forensic. No smart-contract changes. Network is BSC Testnet (chainId 97) and is treated
> as the current valid test rail. All "LIVE" rows were proven by a direct read-only RPC probe
> (`fomo-backend/scripts/spaceport-forensic-read.js`) against the public BSC Testnet RPC.

## 0. Sources of truth (code)
- `website_front/smart/launchpad/constants.ts` — addresses + chainId
- `website_front/smart/contractSpaceport.tsx` — read/write wrappers
- `website_front/smart/abi.ts` — `NFT_SALE_ABI`, `SPECIAL_NFT_ABI`, `ERC20_ABI`, `abiPool`, `abiMarket`
- `website_front/http/spaceport/*` — client HTTP layer
- `fomo-backend/src/spaceport*`, `entitlements/nft-access.service.ts` — backend records/entitlements

## 1. CONTRACT MAP (chainId 97 — BSC Testnet)
| Role | Address | Live facts |
|---|---|---|
| Payment token (USDT) | `0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948` | symbol `USDT`, **decimals 18** |
| Box Sale / Market | `0x40198F1A090d9893d7822F8804e5317E28C5A776` | owner `0xD22D…828a`, price 100 USDT, minted 2, paused false, MAX_SUPPLY 666, MAX_PER_WALLET 4 |
| Box NFT = SpecialNFT (also staking NFT) | `0x512C670006456D46679A67456eBe8564810C5609` | name `SpecialNFT` (`SNFT`), totalSupply 2, nextTokenId 5, active_tokens 2, baseURI "" (empty), owner `0xD22D…828a` |
| Launchpad pool | `0x0608B52aAC58E7313481d0809E8b4525BDD11d33` | separate investing pool that stakes the SpecialNFT |
| Genesis / 4444 main collection | — | **NOT_CONFIGURED** (no contract/config/ABI anywhere; live MAX_SUPPLY = 666, not 4444) |

**Single-collection model:** "Box" and the "revealed NFT" are the **same** contract (`SpecialNFT`).
There is no second Box/Genesis contract. Sale mints tokens; reveal mutates rarity in place.

## 2. Forensic matrix
| Item | Status | Evidence |
|---|---|---|
| BSC TESTNET NETWORK TRUTH | **VERIFIED (live)** | `provider.getNetwork().chainId = 97`; code forces chain 97, RPC `data-seed-prebsc-1-s1.bnbchain.org`. Not zkSync / not chain 1. |
| CONTRACT MAP | **VERIFIED (live)** | all addresses resolved + cross-checked: `sale.paymentToken`==USDT const, `sale.nftContract`==NFT const |
| BOX SALE OWNER | **VERIFIED (live)** | `sale.owner() = 0xD22D8d0368D80A4627d554cb9b70E31Bf7eC828a` (== NFT owner) |
| SALE WRITE CONTROL | **VERIFIED (ABI + event)** | `setSalePaused(bool)`, `setPrice(uint256)`, `setPaymentToken(address)`, `setNFTContract(address)`, `rescueTokens`, `rescueNative`, `buy`; events `SalePaused`, `PriceUpdated`, `PaymentTokenUpdated`, `NFTContractUpdated`, `Purchased`. Owner-gated (Ownable, `NotOwner`); must be signed by owner wallet `0xD22D…828a`. |
| PRICE CONTROL | **VERIFIED (ABI + live)** | `setPrice(uint256)` + `PriceUpdated`; current `price = 100 USDT` (100e18) |
| SUPPLY / PER-WALLET | **VERIFIED (live)** | MAX_SUPPLY 666, MAX_PER_WALLET 4, totalMinted 2 |
| BOX NFT | **VERIFIED (live)** | ERC721Enumerable; write set: `mint`, `batchMint`, `setMinter`, `setBaseURI`, `setMergeStartTime`, `openPreMint`, `mergePreMintNFTs`, `mergeUpgradableNFTs`, `mergeShards`, `stake/unstake`, lock controllers |
| REVEAL BEHAVIOR | **VERIFIED (topology)** | `openPreMint(tokenId)` on the **same** NFT contract. **No dedicated reveal event** (events: `Minted`, `PreMintMerged`, `StandardMerged`, `ShardsMerged`, `Staked/Unstaked`). Rarity enum `Shard=0, PreMint_Uncommon/Epic/Legendary=1..3, Uncommon..FOMOGold=4..8` ⇒ reveal converts a `PreMint_*` token to its revealed rarity **in place (same tokenId, no burn, no new token, no new contract)**. Merges DO burn (nextTokenId 5 vs totalSupply 2 confirms burns). |
| DISCOUNT | **VERIFIED (live)** | `getBaseTotalPrice` is **linear** (1→100, 4→400 USDT) ⇒ **no quantity discount**. Discount is **referral-only** via `getReferralDiscount(user)` / `getFinalPrice(user, amount)`. Corrects the "3–4 NFT discount" assumption. |
| GENESIS 4444 | **NOT_CONFIGURED** | no contract/config; on-chain supply is 666 |

## 3. Backend records (existing — reuse, do not duplicate)
- `spaceport_purchases` (`spaceport-purchases`): txHash **unique/idempotent**; fields incl. quantity, totalPrice(Raw), marketAddress, nftAddress, blockNumber, referralAddress. **Client-submitted** (authenticated POST), NOT chain-indexed. ⚠ `tokenDecimals` default **6** — live token is **18** (revenue-math risk).
- `spaceport_openings` (`spaceport-openings`): unique `(nftAddress, tokenId)`, idempotent upsert; metadata enriched via `MetadataService` (mock fallback because baseURI empty). Consistent with same-token reveal model.
- `spaceport-nft.service`: live `balanceOf` reader (ethers v6) via env RPC (`SPACEPORT_RPC_URL` / `FOMO_V2_LAUNCHPAD_RPC_URL` / `BSC_TESTNET_RPC_URL` …). RPC env may be unset ⇒ `integrationStatus=not_connected`; public BSC RPC works (proven).
- `spaceport` service: staking milestones + level ladder + XP (per-user, not multiplied). `entitlements/nft-access.service.ts`: NFT access benefit layer.

## 4. Gaps / NEEDS ATTENTION (feed into Control Center build)
1. **tokenDecimals mismatch** (backend default 6 vs on-chain 18) → normalize via chain decimals.
2. **No on-chain event indexer** (Purchased/Transfer/merge/openPreMint) → holders, transfers, real revenue and reveal-trace cannot be fully reconstructed from client-submitted records alone. Needs a config-driven indexer feeding canonical read-models (unique key `chainId+txHash+logIndex`, idempotent re-sync).
3. **baseURI empty** → tokenURI served off-chain; Token Explorer must tolerate this.
4. **RPC config-driven**: Control Center must use a versioned contract/network registry with the verified public default so BSC Testnet → production is a config swap, not a code rewrite.
5. **openPreMint has no event** → reveal detection relies on state diff (rarity change) or the tx receipt, not a log topic; index reveal via tokenRarities transition + tx.

## 5. Explicitly disproven assumptions
- ❌ zkSync / chain 1 for Spaceport → it is BSC Testnet 97.
- ❌ Genesis 4444 deployed → NOT_CONFIGURED (supply 666).
- ❌ Box→Genesis two-contract reveal / boxTokenId→revealedTokenId mapping → single contract, in-place rarity mutation.
- ❌ 3–4 NFT quantity discount on-chain → linear base price; only referral discount exists.
- ✅ Prior caution corrected: sale pause/price **can** be changed on-chain — write methods + events exist (owner-signed).
