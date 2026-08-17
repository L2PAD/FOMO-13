import { BigNumber, BigNumberish, Contract, ethers, providers } from "ethers";
import { getAccount, getWalletClient, switchChain } from "@wagmi/core";
import { ERC20_ABI, NFT_SALE_ABI, SPECIAL_NFT_ABI } from "./abi";
import { wagmiAdapter } from "../config/web3";
import {
  BSC_TESTNET_CHAIN_ID,
  FOMO_LAUNCHPAD_USDT_ADDRESS,
  FOMO_NFT_MARKET_ADDRESS,
  FOMO_STAKING_NFT_ADDRESS,
} from "./launchpad/constants";

export const tokenAddress: string = FOMO_LAUNCHPAD_USDT_ADDRESS;
export const nftAddress: string = FOMO_STAKING_NFT_ADDRESS;
export const marketAddress: string = FOMO_NFT_MARKET_ADDRESS;

const BSC_TESTNET_CHAIN_HEX = `0x${BSC_TESTNET_CHAIN_ID.toString(16)}`;
const BSC_TESTNET_RPC_URL = process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL
  || "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
let bscReadProvider: providers.JsonRpcProvider | null = null;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type InjectedProvider = providers.ExternalProvider & {
  request?: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

export type ReferralRewards = {
  totalPrice: BigNumber;
  level1: string;
  level2: string;
  level3: string;
  reward1: BigNumber;
  reward2: BigNumber;
  reward3: BigNumber;
  ownerAmount: BigNumber;
};

export type SaleState = {
  paymentToken: string;
  nftContract: string;
  price: BigNumber;
  totalMinted: BigNumber;
  salePaused: boolean;
  maxSupply: BigNumber;
  maxPerWallet: BigNumber;
};

export enum Rarity {
  Shard = 0,
  PreMint_Uncommon = 1,
  PreMint_Epic = 2,
  PreMint_Legendary = 3,
  Uncommon = 4,
  Rare = 5,
  Epic = 6,
  Legendary = 7,
  FOMOGold = 8,
}

export type TokenInfo = {
  tokenId: BigNumber;
  tokenIdNumber: number;
  owner: string;
  rarityId: number;
  rarityName: string;
  tokenUri: string;
};

type TokenMetadataSnapshot = {
  owner: string;
  rarityId: number;
  rarityName: string;
  tokenUri: string;
};

function isZeroAddress(addr: string): boolean {
  return addr.toLowerCase() === ZERO_ADDRESS;
}

function rarityEnumToName(rarityId: number): string {
  switch (rarityId) {
    case Rarity.Shard:
      return "Shard";
    case Rarity.PreMint_Uncommon:
      return "PreMint_Uncommon";
    case Rarity.PreMint_Epic:
      return "PreMint_Epic";
    case Rarity.PreMint_Legendary:
      return "PreMint_Legendary";
    case Rarity.Uncommon:
      return "Uncommon";
    case Rarity.Rare:
      return "Rare";
    case Rarity.Epic:
      return "Epic";
    case Rarity.Legendary:
      return "Legendary";
    case Rarity.FOMOGold:
      return "FOMOGold";
    default:
      return `Unknown(${rarityId})`;
  }
}

function bigNumberToSafeNumber(value: BigNumberish): number {
  try {
    return BigNumber.from(value).toNumber();
  } catch {
    throw new Error(`Value ${BigNumber.from(value).toString()} is too large for safe JS number`);
  }
}

async function getTokenMetadataSnapshot(
  specialNftContract: Contract,
  tokenId: BigNumberish,
  fallbackOwner = ""
): Promise<TokenMetadataSnapshot> {
  const [ownerResult, rarityIdResult, rarityNameResult, tokenUriResult] =
    await Promise.allSettled([
      specialNftContract.ownerOf(tokenId),
      specialNftContract.tokenRarities(tokenId),
      specialNftContract.getRarity(tokenId),
      specialNftContract.tokenURI(tokenId),
    ]);

  const rarityId =
    rarityIdResult.status === "fulfilled"
      ? bigNumberToSafeNumber(rarityIdResult.value)
      : 0;

  return {
    owner:
      ownerResult.status === "fulfilled"
        ? String(ownerResult.value || "")
        : String(fallbackOwner || ""),
    rarityId,
    rarityName:
      rarityNameResult.status === "fulfilled" && String(rarityNameResult.value || "").trim()
        ? String(rarityNameResult.value)
        : rarityEnumToName(rarityId),
    tokenUri:
      tokenUriResult.status === "fulfilled" ? String(tokenUriResult.value || "") : "",
  };
}

function getInjectedEthereum(): InjectedProvider {
  if (typeof window === "undefined") {
    throw new Error("window is undefined");
  }

  const eth = (window as Window & { ethereum?: InjectedProvider }).ethereum;
  if (!eth) {
    throw new Error("window.ethereum not found");
  }

  return eth;
}

const getConnectedAppKitAccount = () => {
  try {
    const account = getAccount(wagmiAdapter.wagmiConfig);
    return account.isConnected && account.address ? account : null;
  } catch {
    return null;
  }
};

export async function getSpaceportWalletAddress(requestIfMissing = false): Promise<string> {
  const appKitAccount = getConnectedAppKitAccount();
  if (appKitAccount?.address) return appKitAccount.address;
  if (typeof window === "undefined") return "";

  const ethereum = (window as Window & { ethereum?: InjectedProvider }).ethereum;
  if (!ethereum || typeof ethereum.request !== "function") return "";

  const selected = String((ethereum as any).selectedAddress || "").trim();
  if (selected) return selected;

  const method = requestIfMissing ? "eth_requestAccounts" : "eth_accounts";
  const accounts = await ethereum.request({ method });
  return Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : "";
}

const getAppKitWeb3Provider = async (): Promise<providers.Web3Provider | null> => {
  const account = getConnectedAppKitAccount();
  if (!account?.address) return null;

  if (account.chainId !== BSC_TESTNET_CHAIN_ID) {
    await switchChain(wagmiAdapter.wagmiConfig, { chainId: BSC_TESTNET_CHAIN_ID });
  }
  const walletClient = await getWalletClient(wagmiAdapter.wagmiConfig, {
    chainId: BSC_TESTNET_CHAIN_ID,
  });
  const transport = walletClient?.transport as unknown as InjectedProvider | undefined;
  if (!walletClient || !transport || typeof transport.request !== "function") return null;

  return new ethers.providers.Web3Provider(transport, {
    chainId: BSC_TESTNET_CHAIN_ID,
    name: "bsc-testnet",
  });
};

const ensureBscTestnet = async (
  ethereum: InjectedProvider,
  allowSwitch: boolean
): Promise<void> => {
  if (typeof ethereum.request !== "function") {
    throw new Error("Injected provider does not support network requests.");
  }
  const current = String(await ethereum.request({ method: "eth_chainId" })).toLowerCase();
  if (current === BSC_TESTNET_CHAIN_HEX) return;
  if (!allowSwitch) {
    throw new Error("Switch the connected wallet to BSC Testnet (chain 97).");
  }
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_TESTNET_CHAIN_HEX }],
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error
      ? Number((error as { code?: unknown }).code)
      : 0;
    if (code !== 4902) throw error;
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: BSC_TESTNET_CHAIN_HEX,
        chainName: "BSC Testnet",
        nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
        rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
        blockExplorerUrls: ["https://testnet.bscscan.com"],
      }],
    });
  }
};

async function getInjectedWeb3Provider(requestAccounts = false): Promise<providers.Web3Provider> {
  const appKitProvider = await getAppKitWeb3Provider();
  if (appKitProvider) return appKitProvider;

  const eth = getInjectedEthereum();

  if (requestAccounts) {
    if (typeof eth.request !== "function") {
      throw new Error("Injected provider does not support request() method");
    }
    await eth.request({ method: "eth_requestAccounts" });
  }

  await ensureBscTestnet(eth, requestAccounts);

  return new ethers.providers.Web3Provider(eth);
}

function getBscReadProvider(): providers.JsonRpcProvider {
  if (!bscReadProvider) {
    bscReadProvider = new ethers.providers.JsonRpcProvider(
      BSC_TESTNET_RPC_URL,
      { chainId: BSC_TESTNET_CHAIN_ID, name: "bsc-testnet" }
    );
  }
  return bscReadProvider;
}

async function getSaleReadContract(contractAddress = marketAddress) {
  const provider = getBscReadProvider();
  const saleContract = new Contract(contractAddress, NFT_SALE_ABI, provider);
  return { provider, saleContract };
}

async function getSaleWriteContract(contractAddress = marketAddress) {
  const provider = await getInjectedWeb3Provider(true);
  const saleContract = new Contract(contractAddress, NFT_SALE_ABI, provider);
  const signer = provider.getSigner();
  const saleContractWithSigner = saleContract.connect(signer);
  return { provider, saleContract, signer, saleContractWithSigner };
}

async function getNftReadContract(contractAddress = nftAddress) {
  const provider = getBscReadProvider();
  const specialNftContract = new Contract(contractAddress, SPECIAL_NFT_ABI, provider);
  return { provider, specialNftContract };
}

async function getNftWriteContract(contractAddress = nftAddress) {
  const provider = await getInjectedWeb3Provider(true);
  const specialNftContract = new Contract(contractAddress, SPECIAL_NFT_ABI, provider);
  const signer = provider.getSigner();
  const specialNftContractWithSigner = specialNftContract.connect(signer);
  return { provider, specialNftContract, signer, specialNftContractWithSigner };
}

async function getErc20ReadContract(erc20Address = tokenAddress) {
  const provider = getBscReadProvider();
  const erc20Contract = new Contract(erc20Address, ERC20_ABI, provider);
  return { provider, erc20Contract };
}

async function getErc20WriteContract(erc20Address = tokenAddress) {
  const provider = await getInjectedWeb3Provider(true);
  const erc20Contract = new Contract(erc20Address, ERC20_ABI, provider);
  const signer = provider.getSigner();
  const erc20ContractWithSigner = erc20Contract.connect(signer);
  return { provider, erc20Contract, signer, erc20ContractWithSigner };
}

export function priceFromTokenUnits(amount: string, decimals = 18): BigNumber {
  return ethers.utils.parseUnits(amount, decimals);
}

// Sale read
export async function getSaleOwner(contractAddress = marketAddress): Promise<string> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.owner();
}

export async function getSalePaymentToken(contractAddress = marketAddress): Promise<string> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.paymentToken();
}

export async function getSaleNftContract(contractAddress = marketAddress): Promise<string> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.nftContract();
}

export async function getSalePrice(contractAddress = marketAddress): Promise<BigNumber> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.price();
}

export async function getSaleTotalMinted(contractAddress = marketAddress): Promise<BigNumber> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.totalMinted();
}

export async function getSalePaused(contractAddress = marketAddress): Promise<boolean> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.salePaused();
}

export async function getSaleMaxSupply(contractAddress = marketAddress): Promise<BigNumber> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.MAX_SUPPLY();
}

export async function getSaleMaxPerWallet(contractAddress = marketAddress): Promise<BigNumber> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.MAX_PER_WALLET();
}

export async function getSaleState(contractAddress = marketAddress): Promise<SaleState> {
  const [paymentToken, nftContractAddr, price, totalMinted, salePaused, maxSupply, maxPerWallet] =
    await Promise.all([
      getSalePaymentToken(contractAddress),
      getSaleNftContract(contractAddress),
      getSalePrice(contractAddress),
      getSaleTotalMinted(contractAddress),
      getSalePaused(contractAddress),
      getSaleMaxSupply(contractAddress),
      getSaleMaxPerWallet(contractAddress),
    ]);

  return {
    paymentToken,
    nftContract: nftContractAddr,
    price,
    totalMinted,
    salePaused,
    maxSupply,
    maxPerWallet,
  };
}

export async function getSaleReferrerOf(
  user: string,
  contractAddress = marketAddress
): Promise<string | null> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  const ref = await saleContract.referrers(user);
  return isZeroAddress(ref) ? null : ref;
}

export async function getSalePurchasedBy(
  user: string,
  contractAddress = marketAddress
): Promise<BigNumber> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.purchased(user);
}

export async function getSalePurchasedByRef(
  user: string,
  contractAddress = marketAddress
): Promise<BigNumber> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.purchased_by_ref(user);
}

export async function getSaleReferralDiscount(
  user: string,
  contractAddress = marketAddress
): Promise<number> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  const value = await saleContract.getReferralDiscount(user);
  return bigNumberToSafeNumber(value);
}

export async function getSaleBaseTotalPrice(
  amount: BigNumberish,
  contractAddress = marketAddress
): Promise<BigNumber> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.getBaseTotalPrice(amount);
}

export async function getSaleFinalPrice(
  user: string,
  amount: BigNumberish,
  contractAddress = marketAddress
): Promise<BigNumber> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  return await saleContract.getFinalPrice(user, amount);
}

export async function getSaleReferralLevels(
  user: string,
  contractAddress = marketAddress
): Promise<{ level1: string | null; level2: string | null; level3: string | null }> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  const [level1, level2, level3] = await saleContract.getReferralLevels(user);

  return {
    level1: isZeroAddress(level1) ? null : level1,
    level2: isZeroAddress(level2) ? null : level2,
    level3: isZeroAddress(level3) ? null : level3,
  };
}

export async function getSaleReferralRewards(
  user: string,
  amount: BigNumberish,
  contractAddress = marketAddress
): Promise<ReferralRewards> {
  const { saleContract } = await getSaleReadContract(contractAddress);
  const result = await saleContract.getReferralRewards(user, amount);

  return {
    totalPrice: result[0],
    level1: result[1],
    level2: result[2],
    level3: result[3],
    reward1: result[4],
    reward2: result[5],
    reward3: result[6],
    ownerAmount: result[7],
  };
}

// Sale write
export async function buyFromSale(
  amount: BigNumberish,
  ref?: string | null,
  contractAddress = marketAddress
) {
  const { saleContractWithSigner } = await getSaleWriteContract(contractAddress);
  const refAddress = ref ?? ZERO_ADDRESS;
  const tx = await saleContractWithSigner.buy(amount, refAddress);
  return await tx.wait();
}

export async function setSalePaused(
  paused: boolean,
  contractAddress = marketAddress
) {
  const { saleContractWithSigner } = await getSaleWriteContract(contractAddress);
  const tx = await saleContractWithSigner.setSalePaused(paused);
  return await tx.wait();
}

export async function setSalePrice(
  newPrice: BigNumberish,
  contractAddress = marketAddress
) {
  const { saleContractWithSigner } = await getSaleWriteContract(contractAddress);
  const tx = await saleContractWithSigner.setPrice(newPrice);
  return await tx.wait();
}

export async function setSalePaymentToken(
  paymentToken: string,
  contractAddress = marketAddress
) {
  const { saleContractWithSigner } = await getSaleWriteContract(contractAddress);
  const tx = await saleContractWithSigner.setPaymentToken(paymentToken);
  return await tx.wait();
}

export async function setSaleNftContract(
  contractNftAddress: string,
  contractAddress = marketAddress
) {
  const { saleContractWithSigner } = await getSaleWriteContract(contractAddress);
  const tx = await saleContractWithSigner.setNFTContract(contractNftAddress);
  return await tx.wait();
}

export async function rescueSaleTokens(
  rescueTokenAddress: string,
  to: string,
  amount: BigNumberish,
  contractAddress = marketAddress
) {
  const { saleContractWithSigner } = await getSaleWriteContract(contractAddress);
  const tx = await saleContractWithSigner.rescueTokens(rescueTokenAddress, to, amount);
  return await tx.wait();
}

export async function rescueSaleNative(
  to: string,
  amount: BigNumberish,
  contractAddress = marketAddress
) {
  const { saleContractWithSigner } = await getSaleWriteContract(contractAddress);
  const tx = await saleContractWithSigner.rescueNative(to, amount);
  return await tx.wait();
}

// NFT read
export async function getNftBalanceOf(
  owner: string,
  contractAddress = nftAddress
): Promise<BigNumber> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.balanceOf(owner);
}

export async function getNftOwnerOf(
  tokenId: BigNumberish,
  contractAddress = nftAddress
): Promise<string> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.ownerOf(tokenId);
}

export async function getNftTokenURI(
  tokenId: BigNumberish,
  contractAddress = nftAddress
): Promise<string> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.tokenURI(tokenId);
}

export async function getNftApproved(
  tokenId: BigNumberish,
  contractAddress = nftAddress
): Promise<string> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.getApproved(tokenId);
}

export async function isNftApprovedForAll(
  owner: string,
  operator: string,
  contractAddress = nftAddress
): Promise<boolean> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.isApprovedForAll(owner, operator);
}

export async function getNftTokenOfOwnerByIndex(
  owner: string,
  index: BigNumberish,
  contractAddress = nftAddress
): Promise<BigNumber> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.tokenOfOwnerByIndex(owner, index);
}

export async function getNftTotalSupply(contractAddress = nftAddress): Promise<BigNumber> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.totalSupply();
}

export async function getNftTokenByIndex(
  index: BigNumberish,
  contractAddress = nftAddress
): Promise<BigNumber> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.tokenByIndex(index);
}

export async function getNftNextTokenId(contractAddress = nftAddress): Promise<BigNumber> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.nextTokenId();
}

export async function getNftBaseURI(contractAddress = nftAddress): Promise<string> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.baseURI();
}

export async function getNftActiveTokens(contractAddress = nftAddress): Promise<BigNumber> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.active_tokens();
}

export async function getNftMergeStartTime(contractAddress = nftAddress): Promise<BigNumber> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.mergeStartTime();
}

export async function getNftRarityId(
  tokenId: BigNumberish,
  contractAddress = nftAddress
): Promise<number> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  const rarity = await specialNftContract.tokenRarities(tokenId);
  return bigNumberToSafeNumber(rarity);
}

export async function getNftRarityName(
  tokenId: BigNumberish,
  contractAddress = nftAddress
): Promise<string> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.getRarity(tokenId);
}

export async function isNftAllowedMinter(
  user: string,
  contractAddress = nftAddress
): Promise<boolean> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  return await specialNftContract.allowedMinters(user);
}

export async function getNftTokenInfo(
  tokenId: BigNumberish,
  contractAddress = nftAddress
): Promise<TokenInfo> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  const tokenIdBig = BigNumber.from(tokenId);
  const snapshot = await getTokenMetadataSnapshot(specialNftContract, tokenId);

  return {
    tokenId: tokenIdBig,
    tokenIdNumber: bigNumberToSafeNumber(tokenIdBig),
    owner: snapshot.owner,
    rarityId: snapshot.rarityId,
    rarityName: snapshot.rarityName,
    tokenUri: snapshot.tokenUri,
  };
}

export async function getNftOwnerTokenIds(
  owner: string,
  contractAddress = nftAddress
): Promise<BigNumber[]> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  const balance = await specialNftContract.balanceOf(owner);
  const balanceNum = bigNumberToSafeNumber(balance);

  return await Promise.all(
    Array.from({ length: balanceNum }, (_, i) =>
      specialNftContract.tokenOfOwnerByIndex(owner, i)
    )
  );
}

export async function getNftOwnerTokens(
  owner: string,
  contractAddress = nftAddress
): Promise<TokenInfo[]> {
  const { specialNftContract } = await getNftReadContract(contractAddress);
  const tokenIds = await getNftOwnerTokenIds(owner, contractAddress);

  return await Promise.all(
    tokenIds.map(async (tokenId) => {
      const snapshot = await getTokenMetadataSnapshot(
        specialNftContract,
        tokenId,
        owner
      );

      return {
        tokenId,
        tokenIdNumber: bigNumberToSafeNumber(tokenId),
        owner: snapshot.owner || owner,
        rarityId: snapshot.rarityId,
        rarityName: snapshot.rarityName,
        tokenUri: snapshot.tokenUri,
      };
    })
  );
}

export async function getAllNftTokens(contractAddress = nftAddress): Promise<TokenInfo[]> {
  const supply = await getNftTotalSupply(contractAddress);
  const supplyNum = bigNumberToSafeNumber(supply);

  const tokenIds = await Promise.all(
    Array.from({ length: supplyNum }, (_, i) => getNftTokenByIndex(i, contractAddress))
  );

  return await Promise.all(tokenIds.map((id) => getNftTokenInfo(id, contractAddress)));
}

// NFT write
export async function mintNft(
  to: string,
  rarity: Rarity,
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.mint(to, rarity);
  return await tx.wait();
}

export async function batchMintNft(
  to: string,
  rarities: Rarity[],
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.batchMint(to, rarities);
  return await tx.wait();
}

export async function setNftMinter(
  minter: string,
  allowed: boolean,
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.setMinter(minter, allowed);
  return await tx.wait();
}

export async function setNftBaseURI(
  newBaseURI: string,
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.setBaseURI(newBaseURI);
  return await tx.wait();
}

export async function setNftMergeStartTime(
  timestamp: BigNumberish,
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.setMergeStartTime(timestamp);
  return await tx.wait();
}

export async function approveNft(
  tokenId: BigNumberish,
  spender = nftAddress,
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.approve(spender, tokenId);
  return await tx.wait();
}

export async function setNftApprovalForAll(
  operator: string,
  approved: boolean,
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.setApprovalForAll(operator, approved);
  return await tx.wait();
}

export async function openPreMintNft(
  tokenId: BigNumberish,
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.openPreMint(tokenId);
  return await tx.wait();
}

export async function mergePreMintNfts(
  tokenId1: BigNumberish,
  tokenId2: BigNumberish,
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.mergePreMintNFTs(tokenId1, tokenId2);
  return await tx.wait();
}

export async function mergeUpgradableNfts(
  tokenId1: BigNumberish,
  tokenId2: BigNumberish,
  contractAddress = nftAddress
) {
  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.mergeUpgradableNFTs(tokenId1, tokenId2);
  return await tx.wait();
}

export async function mergeNftShards(
  tokenIds: Array<BigNumberish>,
  contractAddress = nftAddress
) {
  if (tokenIds.length !== 4) {
    throw new Error("mergeShards requires exactly 4 tokenIds");
  }

  const { specialNftContractWithSigner } = await getNftWriteContract(contractAddress);
  const tx = await specialNftContractWithSigner.mergeShards(tokenIds);
  return await tx.wait();
}

// ERC20
export async function approveErc20(spender: string, amount: BigNumberish): Promise<any>;
export async function approveErc20(
  erc20Address: string,
  spender: string,
  amount: BigNumberish
): Promise<any>;
export async function approveErc20(
  arg1: string,
  arg2: string | BigNumberish,
  arg3?: BigNumberish
) {
  const erc20Address = arg3 !== undefined ? arg1 : tokenAddress;
  const spender = arg3 !== undefined ? (arg2 as string) : arg1;
  const amount = arg3 !== undefined ? arg3 : (arg2 as BigNumberish);

  const { erc20ContractWithSigner } = await getErc20WriteContract(erc20Address);
  const tx = await erc20ContractWithSigner.approve(spender, amount);
  return await tx.wait();
}

export async function getErc20Allowance(owner: string, spender: string): Promise<BigNumber>;
export async function getErc20Allowance(
  erc20Address: string,
  owner: string,
  spender: string
): Promise<BigNumber>;
export async function getErc20Allowance(
  arg1: string,
  arg2: string,
  arg3?: string
): Promise<BigNumber> {
  const erc20Address = arg3 !== undefined ? arg1 : tokenAddress;
  const owner = arg3 !== undefined ? arg2 : arg1;
  const spender = arg3 !== undefined ? arg3 : arg2;

  const { erc20Contract } = await getErc20ReadContract(erc20Address);
  return await erc20Contract.allowance(owner, spender);
}

export async function getErc20Balance(owner: string): Promise<BigNumber>;
export async function getErc20Balance(
  erc20Address: string,
  owner: string
): Promise<BigNumber>;
export async function getErc20Balance(
  arg1: string,
  arg2?: string
): Promise<BigNumber> {
  const erc20Address = arg2 !== undefined ? arg1 : tokenAddress;
  const owner = arg2 !== undefined ? arg2 : arg1;

  const { erc20Contract } = await getErc20ReadContract(erc20Address);
  return await erc20Contract.balanceOf(owner);
}

export async function getErc20Decimals(
  erc20Address = tokenAddress
): Promise<number> {
  const { erc20Contract } = await getErc20ReadContract(erc20Address);
  const decimals = await erc20Contract.decimals();
  return Number(decimals.toString());
}

type StakingSingleTxResult =
  | { ok: true; txHash: string; tokenId: BigNumberish }
  | { ok: false; error: string };

type StakingBatchTxResult =
  | { ok: true; txHash: string; tokenIds: BigNumberish[] }
  | { ok: false; error: string };

type NftStakeBooleanResult =
  | { ok: true; tokenId: BigNumberish; isStaked: boolean }
  | { ok: false; error: string };

type NftStakeTimeResult =
  | { ok: true; tokenId: BigNumberish; stakedAt: number; stakedAtRaw: string }
  | { ok: false; error: string };

type NftStakeOwnerResult =
  | { ok: true; tokenId: BigNumberish; stakeOwner: string }
  | { ok: false; error: string };

type NftStakeDaysResult =
  | { ok: true; tokenId: BigNumberish; days: number; daysRaw: string }
  | { ok: false; error: string };

type NftStakeSecondsResult =
  | { ok: true; tokenId: BigNumberish; seconds: number; secondsRaw: string }
  | { ok: false; error: string };

type NftStakeInfoResult =
  | {
    ok: true;
    tokenId: BigNumberish;
    isStaked: boolean;
    stakedAt: number;
    stakedAtRaw: string;
    stakeOwner: string;
    days: number;
    seconds: number;
  }
  | { ok: false; error: string };

export type NftStakeProbeResult = {
  ok: boolean;
  tokenId: string;
  owner?: string | null;
  rarityId?: number | null;
  rarityName?: string | null;
  isStaked?: boolean | null;
  stakedAt?: number | null;
  stakeOwner?: string | null;
  lockedTokens?: boolean | null;
  isLocked?: boolean | null;
  estimateGas?: string | null;
  error?: string;
};

function getProvider(): providers.Provider {
  return getBscReadProvider();
}

async function getSigner(requestAccounts = true): Promise<providers.JsonRpcSigner> {
  const provider = await getInjectedWeb3Provider(requestAccounts);
  return provider.getSigner();
}

export function getSpecialNftRead(
  addressNft: string,
  provider: providers.Provider | null = null
): Contract {
  const p = provider || getProvider();
  return new ethers.Contract(addressNft, SPECIAL_NFT_ABI, p);
}

/**
 * Возвращает контракт с signer для транзакций
 */
export async function getSpecialNftWrite(
  addressNft: string,
  signer: ethers.Signer | null = null
): Promise<Contract> {
  const s = signer || await getSigner(true);
  return new ethers.Contract(addressNft, SPECIAL_NFT_ABI, s);
}

/**
 * Преобразует BigNumber / число / строку в обычное число.
 * Осторожно: для очень больших uint лучше использовать toString().
 */
export function bnToNumber(value: BigNumberish): number {
  return bigNumberToSafeNumber(value);
}

/**
 * Преобразует BigNumber / число / строку в строку.
 */
export function bnToString(value: BigNumberish): string {
  return BigNumber.from(value).toString();
}

/**
 * Унифицированный разбор ошибки ethers/metamask/revert.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";

  if (isRecord(err) && typeof err.reason === "string" && err.reason) return err.reason;

  if (isRecord(err) && isRecord(err.data) && typeof err.data.message === "string" && err.data.message) {
    return err.data.message;
  }

  if (isRecord(err) && isRecord(err.error) && typeof err.error.message === "string" && err.error.message) {
    return err.error.message;
  }

  if (isRecord(err) && typeof err.message === "string" && err.message) return err.message;

  return String(err);
}

/* =========================================================
   STAKING WRITE
========================================================= */

/**
 * Застейкать 1 NFT
 */
export async function stakeNft(
  addressNft: string,
  tokenId: BigNumberish
): Promise<StakingSingleTxResult> {
  try {
    const contract = await getSpecialNftWrite(addressNft);
    const tx = await contract.stake(tokenId);
    const rc = await tx.wait();

    return {
      ok: true,
      txHash: rc.transactionHash,
      tokenId
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

/**
 * Застейкать несколько NFT
 */
export async function stakeNftBatch(
  addressNft: string,
  tokenIds: BigNumberish[]
): Promise<StakingBatchTxResult> {
  try {
    const contract = await getSpecialNftWrite(addressNft);
    const tx = await contract.stakeBatch(tokenIds);
    const rc = await tx.wait();

    return {
      ok: true,
      txHash: rc.transactionHash,
      tokenIds
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

/**
 * Снять 1 NFT со стейкинга
 */
export async function unstakeNft(
  addressNft: string,
  tokenId: BigNumberish
): Promise<StakingSingleTxResult> {
  try {
    const contract = await getSpecialNftWrite(addressNft);
    const tx = await contract.unstake(tokenId);
    const rc = await tx.wait();

    return {
      ok: true,
      txHash: rc.transactionHash,
      tokenId
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

/**
 * Снять несколько NFT со стейкинга
 */
export async function unstakeNftBatch(
  addressNft: string,
  tokenIds: BigNumberish[]
): Promise<StakingBatchTxResult> {
  try {
    const contract = await getSpecialNftWrite(addressNft);
    const tx = await contract.unstakeBatch(tokenIds);
    const rc = await tx.wait();

    return {
      ok: true,
      txHash: rc.transactionHash,
      tokenIds
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

/* =========================================================
   STAKING READ
========================================================= */

/**
 * Проверка: застейкана ли NFT
 */
export async function isNftStaked(
  addressNft: string,
  tokenId: BigNumberish
): Promise<NftStakeBooleanResult> {
  try {
    const contract = getSpecialNftRead(addressNft);
    const value = await contract.isStaked(tokenId);

    return {
      ok: true,
      tokenId,
      isStaked: Boolean(value)
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

/**
 * Вернуть timestamp начала стейкинга
 */
export async function getNftStakedAt(
  addressNft: string,
  tokenId: BigNumberish
): Promise<NftStakeTimeResult> {
  try {
    const contract = getSpecialNftRead(addressNft);
    const value = await contract.stakedAt(tokenId);

    return {
      ok: true,
      tokenId,
      stakedAt: bnToNumber(value),
      stakedAtRaw: bnToString(value)
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

/**
 * Вернуть адрес владельца стейка
 */
export async function getNftStakeOwner(
  addressNft: string,
  tokenId: BigNumberish
): Promise<NftStakeOwnerResult> {
  try {
    const contract = getSpecialNftRead(addressNft);
    const value = await contract.stakeOwner(tokenId);

    return {
      ok: true,
      tokenId,
      stakeOwner: String(value)
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

/**
 * Вернуть число полных дней в стейкинге
 * Работает, если такая функция есть в контракте.
 */
export async function getNftStakedDays(
  addressNft: string,
  tokenId: BigNumberish
): Promise<NftStakeDaysResult> {
  try {
    const contract = getSpecialNftRead(addressNft);
    const value = await contract.getStakedDays(tokenId);

    return {
      ok: true,
      tokenId,
      days: bnToNumber(value),
      daysRaw: bnToString(value)
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

/**
 * Вернуть число секунд в стейкинге
 * Работает, если такая функция есть в контракте.
 */
export async function getNftStakedSeconds(
  addressNft: string,
  tokenId: BigNumberish
): Promise<NftStakeSecondsResult> {
  try {
    const contract = getSpecialNftRead(addressNft);
    const value = await contract.getStakedSeconds(tokenId);

    return {
      ok: true,
      tokenId,
      seconds: bnToNumber(value),
      secondsRaw: bnToString(value)
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

/**
 * Удобная агрегирующая функция:
 * сразу вернуть весь staking-статус NFT.
 */
export async function getNftStakeInfo(
  addressNft: string,
  tokenId: BigNumberish
): Promise<NftStakeInfoResult> {
  try {
    const contract = getSpecialNftRead(addressNft);

    const [isStakedValue, stakedAtValue, stakeOwnerValue] = await Promise.all([
      contract.isStaked(tokenId),
      contract.stakedAt(tokenId),
      contract.stakeOwner(tokenId)
    ]);

    let days = 0;
    let seconds = 0;

    // Пытаемся взять кастомные view-функции из контракта.
    // Если их нет или они ревертят для unstaked NFT — просто игнорируем.
    try {
      const daysValue = await contract.getStakedDays(tokenId);
      days = bnToNumber(daysValue);
    } catch (_) { }

    try {
      const secValue = await contract.getStakedSeconds(tokenId);
      seconds = bnToNumber(secValue);
    } catch (_) { }

    return {
      ok: true,
      tokenId,
      isStaked: isStakedValue,
      stakedAt: bnToNumber(stakedAtValue),
      stakedAtRaw: bnToString(stakedAtValue),
      stakeOwner: stakeOwnerValue,
      days,
      seconds
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: getErrorMessage(err)
    };
  }
}

export async function probeNftStake(
  addressNft: string,
  tokenId: BigNumberish
): Promise<NftStakeProbeResult> {
  const tokenKey = BigNumber.from(tokenId).toString();

  const safeRead = async <T,>(cb: () => Promise<T>): Promise<T | null> => {
    try {
      return await cb();
    } catch {
      return null;
    }
  };

  try {
    const readContract = getSpecialNftRead(addressNft);
    const writeContract = await getSpecialNftWrite(addressNft);

    const [
      owner,
      rarityIdRaw,
      rarityName,
      isStaked,
      stakedAtRaw,
      stakeOwner,
      lockedTokens,
      isLocked,
    ] = await Promise.all([
      safeRead(() => readContract.ownerOf(tokenId)),
      safeRead(() => readContract.tokenRarities(tokenId)),
      safeRead(() => readContract.getRarity(tokenId)),
      safeRead(() => readContract.isStaked(tokenId)),
      safeRead(() => readContract.stakedAt(tokenId)),
      safeRead(() => readContract.stakeOwner(tokenId)),
      safeRead(() => readContract.lockedTokens(tokenId)),
      safeRead(() => readContract.isLocked(tokenId)),
    ]);

    const estimateGasRaw = await safeRead(() => writeContract.estimateGas.stake(tokenId));

    return {
      ok: true,
      tokenId: tokenKey,
      owner: owner ? String(owner) : null,
      rarityId: rarityIdRaw !== null ? bigNumberToSafeNumber(rarityIdRaw as BigNumberish) : null,
      rarityName: rarityName ? String(rarityName) : null,
      isStaked: typeof isStaked === "boolean" ? isStaked : null,
      stakedAt: stakedAtRaw !== null ? bigNumberToSafeNumber(stakedAtRaw as BigNumberish) : null,
      stakeOwner: stakeOwner ? String(stakeOwner) : null,
      lockedTokens: typeof lockedTokens === "boolean" ? lockedTokens : null,
      isLocked: typeof isLocked === "boolean" ? isLocked : null,
      estimateGas:
        estimateGasRaw !== null ? BigNumber.from(estimateGasRaw as BigNumberish).toString() : null,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      tokenId: tokenKey,
      error: getErrorMessage(err),
    };
  }
}
