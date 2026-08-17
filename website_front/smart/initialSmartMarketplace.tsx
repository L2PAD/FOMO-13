import { ethers, Contract } from "ethers";
import {
  bigNumber_to_number,
  number_to_bigNumber,
  numberToBigNumber,
} from "./initialSmartMain";
import getDateInterval from "../helpers/getDateInterval";
import { IProject } from "../types/global_types";
import { abiMarket, abiNft, abiUsd } from "./abi";

export const addressPool = "0xd88Bf310CB04d9415C5Ad689d3d07b2CcD582525";
const addressUsd = "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4";
export const addressNft = "0xaC5cf2161f0914f3d2DCcB3c8B83fbdA48126576";
export const marketDecimals = 6;

export const ETH_DECIMALS = 18;
export const USDC_DECIMALS = marketDecimals; // 6
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const isMarketplaceOrderAvailable = (order: any): boolean =>
  Boolean(order?.available ?? order?.Available);

export type MarketplaceCheckoutCurrency = "ETH" | "USDC";

export interface MarketplaceCheckoutItem {
  orderId: number;
  price: number;
}

const getMainSmart = async (): Promise<{
  contractPool: any;
  daiContractWithSignerPool: any;
}> => {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const contractPool = new Contract(addressPool, abiMarket, provider);
  const daiContractWithSignerPool = contractPool.connect(signer);

  return { contractPool, daiContractWithSignerPool };
};

const getUsdContract = async (): Promise<any> => {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const contract_usd = new Contract(addressUsd, abiUsd, provider);
  const daiContractWithSigner_usd = contract_usd.connect(signer);

  return { contract_usd, daiContractWithSigner_usd };
};

/**
 * Safely converts a human-readable price (e.g. 0.05 ETH, 100.5 USDC)
 * into a BigNumber with the specified decimal precision.
 *
 * Uses ethers.utils.parseUnits under the hood — this avoids floating-point
 * arithmetic bugs that the manual getCurrentMarketDecimal + numberToBigNumber
 * approach is susceptible to (e.g. 1.005 * 1000 → 1004.9999…).
 */
export function priceToBigNumber(
  price: number,
  decimals: number
): ethers.BigNumber {
  const priceStr = price.toFixed(decimals);
  return ethers.utils.parseUnits(priceStr, decimals);
}

const parseMarketItemCreatedEventId = (receipt: any): number | null => {
  try {
    const marketInterface = new ethers.utils.Interface(abiMarket as any);
    const poolAddress = String(addressPool).toLowerCase();
    const logs = Array.isArray(receipt?.logs) ? receipt.logs : [];

    for (const log of logs) {
      if (String(log?.address || "").toLowerCase() !== poolAddress) continue;

      try {
        const parsed = marketInterface.parseLog(log);
        if (parsed?.name !== "ItemCreated") continue;

        const itemIdValue = parsed?.args?.itemId ?? parsed?.args?.id;
        if (!itemIdValue) continue;

        return Number(
          typeof itemIdValue?.toString === "function"
            ? itemIdValue.toString()
            : itemIdValue
        );
      } catch {
        // skip non-marketplace logs
      }
    }
  } catch (error) {
    console.info("err in parse marketplace logs");
  }

  return null;
};

export function getCurrentMarketDecimal(
  number: number,
  decimals: number = marketDecimals
): {
  currentDecimals: number;
  currentNumber: number;
} {
  const numberStr = String(number);
  let multi = "1";
  let currentDecimals = 0;

  if (numberStr.includes(".")) {
    for (let i = 0; i < numberStr.split(".")[1].length; i++) {
      multi = multi + "0";
      currentDecimals++;
    }
  } else {
    return { currentDecimals: decimals, currentNumber: number };
  }

  currentDecimals = decimals - currentDecimals;
  const currentNumber = number * Number(multi);

  return { currentNumber, currentDecimals };
}

export function getMarketTokenAmount(
  price: number,
  decimals: number = marketDecimals
) {
  const { currentDecimals, currentNumber } = getCurrentMarketDecimal(
    price,
    decimals
  );

  return ethers.utils.parseUnits(String(currentNumber), currentDecimals);
}

async function getConnectedWalletAddress(
  provider?: ethers.providers.Web3Provider,
  requestIfMissing = false
): Promise<string> {
  const selectedAddress = String(window?.ethereum?.selectedAddress || "").trim();
  if (selectedAddress) {
    return selectedAddress;
  }

  const availableAccounts = provider
    ? await provider.listAccounts()
    : await window.ethereum.request({ method: "eth_accounts" });

  if (Array.isArray(availableAccounts) && availableAccounts[0]) {
    return String(availableAccounts[0]);
  }

  if (requestIfMissing) {
    const requestedAccounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (Array.isArray(requestedAccounts) && requestedAccounts[0]) {
      return String(requestedAccounts[0]);
    }
  }

  throw new Error("Wallet account is not connected");
}

export async function approveUsd(sum: number) {
  const sumBigNumber = priceToBigNumber(sum, USDC_DECIMALS);

  try {
    const { daiContractWithSigner_usd } = await getUsdContract();
    const ok_ok = await daiContractWithSigner_usd.approve(
      addressPool,
      sumBigNumber
    );

    return { success: true };
  } catch (err: any) {
    console.info("err in approve", err.message);

    return { success: false };
  }
}

///////////////////////////////// Создать ордер на продажу для определённого адреса
// endTime(int) - юникс время конца возможности покупки
// token_id(int) - ID NFT токена
// token_address(str) - адрес NFT коллекции
// price(bigNumber) - цена установленная продавцом
// adrby(str) - адрес покупателя
export async function createItemForSm(
  endTime: number,
  token_id: number,
  token_address: string,
  price: number,
  adrby: string
) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { daiContractWithSignerPool } = await getMainSmart();

    const priceBigNumber = priceToBigNumber(price, ETH_DECIMALS);

    const hash = await daiContractWithSignerPool.createItem_for_sm(
      endTime,
      token_id,
      token_address,
      priceBigNumber,
      adrby
    );
    const receipt = await provider.waitForTransaction(hash.hash);
    const id = parseMarketItemCreatedEventId(receipt);
    return { success: true, id };
  } catch (err: any) {
    console.log(err);
    return { success: false, id: null };
  }
}

///////////////////////////////// Создать ордер на продажу
// endTime(int) - юникс время конца возможности покупки
// token_id(int) - ID NFT токена
// token_address(str) - адрес NFT коллекции
// price(bigNumber) - цена установленная продавцом
export async function createOrder(
  endTime: number,
  token_id: number,
  token_address: string,
  price: any
) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const { daiContractWithSignerPool } = await getMainSmart();

    const hash = await daiContractWithSignerPool.createItem(
      endTime,
      token_id,
      token_address,
      price
    );
    const receipt = await provider.waitForTransaction(hash.hash);
    const id = parseMarketItemCreatedEventId(receipt);
    return { success: true, id };
  } catch (err: any) {
    console.info("err in transaction", err.message);

    return { success: false, id: null };
  }
}

//// response (int - ID NFT, str - адрес коллекции,int - цена, str - адрес продавца )
export async function getItemById(item_id: number) {
  try {
    const { daiContractWithSignerPool } = await getMainSmart();

    const response = await daiContractWithSignerPool.get_item_by_id(item_id);

    return "";
  } catch (err: any) {
    console.info("err", err.message);
  }
}
///////////////////////////////// Купить NFT
// item_id(int) - ID ордера на продажу
export async function purchaseItem(item_id: number, price: number) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { daiContractWithSignerPool } = await getMainSmart();
    const priceValue = getMarketTokenAmount(price, ETH_DECIMALS);

    const tx = await daiContractWithSignerPool.purchaseItem(item_id, {
      value: priceValue,
    });
    const receipt = await provider.waitForTransaction(tx.hash);

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err: any) {
    console.info("err in transaction", err.message);

    return { success: false, txHash: "", blockNumber: 0 };
  }
}

///////////  массив всех ордеров
//// response (массив ордеров)
export async function getAllAvailableItems() {
  try {
    const { daiContractWithSignerPool } = await getMainSmart();

    const allOrders = await daiContractWithSignerPool.get_all_Available_items();

    return { success: true, allOrders };
  } catch (err: any) {
    console.info("err", err.message);

    return { success: false, allOrders: [] };
  }
}

export async function getOrderByNftId(nftId: number, address: string) {
  try {
    const { allOrders } = await getAllAvailableItems();

    const currentOrder: any = {};
    const normalizedAddress = String(address || "").toLowerCase();

    for (let i = 0; i < allOrders.length; i++) {
      const order = allOrders[i];
      const orderNftId = Number(bigNumber_to_number(order.token_id, 0));
      const isMatchedCollection =
        String(order.token_address || "").toLowerCase() === normalizedAddress;
      const normalizedBuyer = String(order?.buyer || "").toLowerCase();
      const isPublicOrder = !normalizedBuyer || normalizedBuyer === ZERO_ADDRESS;

      if (
        orderNftId === Number(nftId) &&
        isMatchedCollection &&
        isMarketplaceOrderAvailable(order) &&
        isPublicOrder
      ) {
        currentOrder.orderId = Number(bigNumber_to_number(order.item_id, 0));
        currentOrder.orderPrice = Number(
          bigNumber_to_number(order.price, marketDecimals)
        );
        currentOrder.timeEnd = Number(bigNumber_to_number(order.endTime, 0));
        currentOrder.orderSeller = order.seller;
        currentOrder.orderAddress = order.token_address;
        currentOrder.available = isMarketplaceOrderAvailable(order);
        currentOrder.buyer = order.buyer;
        break;
      }
    }

    return { success: true, currentOrder };
  } catch (error) {
    console.log(error);

    return { success: false };
  }
}

//////////////// Всё то-же самое только для $
///////////////////////////////// Создать ордер на продажу для определённого адреса
// endTime(int) - юникс время конца возможности покупки
// token_id(int) - ID NFT токена
// token_address(str) - адрес NFT коллекции
// price(bigNumber) - цена установленная продавцом
// adrby(str) - адрес покупателя
export async function createItemForSmUsd(
  endTime: number,
  token_id: number,
  token_address: string,
  price: number,
  adrby: string
) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { daiContractWithSignerPool } = await getMainSmart();
    const priceBigNumber = priceToBigNumber(price, USDC_DECIMALS);

    const hash = await daiContractWithSignerPool.createItem_for_sm_usd(
      endTime,
      token_id,
      token_address,
      priceBigNumber,
      adrby
    );

    const receipt = await provider.waitForTransaction(hash.hash);
    const id = parseMarketItemCreatedEventId(receipt);

    return { success: true, id };
  } catch (err: any) {
    console.info("err in transaction", err.message);
    return { success: false, id: null };
  }
}

///////////////////////////////// Создать ордер на продажу
// endTime(int) - юникс время конца возможности покупки
// token_id(int) - ID NFT токена
// token_address(str) - адрес NFT коллекции
// price(bigNumber) - цена установленная продавцом
export async function createOrderUsd(
  endTime: number,
  token_id: number,
  token_address: string,
  price: any
) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const { daiContractWithSignerPool } = await getMainSmart();

    const hash = await daiContractWithSignerPool.createItem_usd(
      endTime,
      token_id,
      token_address,
      price
    );
    const receipt = await provider.waitForTransaction(hash.hash);
    const id = parseMarketItemCreatedEventId(receipt);

    return { success: true, id };
  } catch (err: any) {
    console.info("err in transaction", err.message);

    return { success: false, id: null };
  }
}

//// response (int - ID NFT, str - адрес коллекции,int - цена, str - адрес продавца )
// async function get_item_by_id_usd(item_id) {
//  try {
//   response =  await daiContractWithSignerPool.get_item_by_id_usd(item_id);
//   return (response,'200')
//  }
//  catch (err:any) {
//   console.info('err', err.message);
//   return (0,err.message)
//  }
// }

///////////////////////////////// Купить NFT
// item_id(int) - ID ордера на продажу
export async function purchaseItemUsd(item_id: number, price?: number) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { daiContractWithSignerPool } = await getMainSmart();
    const { contract_usd, daiContractWithSigner_usd } = await getUsdContract();
    const userAddress = await getConnectedWalletAddress(provider, true);

    if (Number(price || 0) > 0) {
      const allowance = await contract_usd.allowance(
        userAddress,
        addressPool
      );
      const spendAmount = getMarketTokenAmount(Number(price || 0));

      if (allowance.lt(spendAmount)) {
        const approveTx = await daiContractWithSigner_usd.approve(
          addressPool,
          spendAmount
        );
        await provider.waitForTransaction(approveTx.hash);
      }
    }

    const tx = await daiContractWithSignerPool.purchaseItem_usd(item_id);
    const receipt = await provider.waitForTransaction(tx.hash);

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err: any) {
    console.info("err in transaction", err.message);

    return { success: false, txHash: "", blockNumber: 0 };
  }
}

/////////// Получить массив всех ордеров
//// response (массив ордеров)
export async function getAllAvailableItemsUsd() {
  try {
    const { daiContractWithSignerPool } = await getMainSmart();

    const allOrders =
      await daiContractWithSignerPool.get_all_Available_items_usd();

    return { success: true, allOrders };
  } catch (err: any) {
    console.info("err", err.message);

    return { success: false, allOrders: [] };
  }
}

export async function getOrderUsdByNftId(nftId: number, address: string) {
  try {
    const { allOrders } = await getAllAvailableItemsUsd();

    const currentOrder: any = {};
    const normalizedAddress = String(address || "").toLowerCase();

    for (let i = 0; i < allOrders.length; i++) {
      const order = allOrders[i];
      const orderNftId = Number(bigNumber_to_number(order.token_id, 0));
      const isMatchedCollection =
        String(order.token_address || "").toLowerCase() === normalizedAddress;
      const normalizedBuyer = String(order?.buyer || "").toLowerCase();
      const isPublicOrder = !normalizedBuyer || normalizedBuyer === ZERO_ADDRESS;

      if (
        orderNftId === Number(nftId) &&
        isMatchedCollection &&
        isMarketplaceOrderAvailable(order) &&
        isPublicOrder
      ) {
        currentOrder.orderId = Number(bigNumber_to_number(order.item_id, 0));
        currentOrder.orderPrice = Number(
          bigNumber_to_number(order.price, marketDecimals)
        );
        currentOrder.timeEnd = Number(bigNumber_to_number(order.endTime, 0));
        currentOrder.orderSeller = order.seller;
        currentOrder.orderAddress = order.token_address;
        currentOrder.available = isMarketplaceOrderAvailable(order);
        currentOrder.buyer = order.buyer;
        break;
      }
    }

    return { success: true, currentOrder };
  } catch (error) {
    console.log(error);

    return { success: false };
  }
}

// Получить кол-во NFT у юзера (user(str) - адрес пользователя) достаёт длинну массива NFT у юзера
export async function getNFTBalance(address_nft: string, user: string) {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const contract_nft_nn = new Contract(address_nft, abiNft, provider);
  const daiContractWithSigner_nft_nn = contract_nft_nn.connect(signer);

  try {
    const sum = await contract_nft_nn.balanceOf(user);

    const nftsValue = sum ? Number(bigNumber_to_number(sum, 0)) : 0;

    return { success: true, nfts: nftsValue };
  } catch (err: any) {
    console.info("err in approve", err.message);

    return { success: false, nfts: 0 };
  }
}

// Получить ID NFT по индексу в массиве NFT юзера
export async function getNftId(
  address_nft: string,
  user: string,
  index: number
) {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract_nft_nn = new Contract(address_nft, abiNft, provider);
  const daiContractWithSigner_nft_nn = contract_nft_nn.connect(signer);
  try {
    const nftId = await contract_nft_nn.tokenOfOwnerByIndex(user, index);

    const numberId = nftId ? Number(bigNumber_to_number(nftId, 0)) : 0;

    return { success: true, nftId: numberId };
  } catch (err: any) {
    return { success: false, nftId: null };
  }
}

const getUserNftIdsFromTransferEvents = async (
  address_nft: string,
  user: string
): Promise<number[]> => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract_nft_nn = new Contract(address_nft, abiNft, provider);
    const normalizedUser = user.toLowerCase();

    const [incomingTransfers, outgoingTransfers] = await Promise.all([
      contract_nft_nn.queryFilter(contract_nft_nn.filters.Transfer(null, user)),
      contract_nft_nn.queryFilter(contract_nft_nn.filters.Transfer(user, null)),
    ]);

    const userTokenIds = new Set<string>();

    for (const transfer of incomingTransfers) {
      const tokenId = transfer?.args?.tokenId;
      const to = String(transfer?.args?.to || "").toLowerCase();

      if (to === normalizedUser && tokenId) {
        userTokenIds.add(tokenId.toString());
      }
    }

    for (const transfer of outgoingTransfers) {
      const tokenId = transfer?.args?.tokenId;
      const from = String(transfer?.args?.from || "").toLowerCase();

      if (from === normalizedUser && tokenId) {
        userTokenIds.delete(tokenId.toString());
      }
    }

    const confirmedTokenIds: number[] = [];

    for (const tokenId of Array.from(userTokenIds)) {
      try {
        const owner = await contract_nft_nn.ownerOf(tokenId);
        if (String(owner).toLowerCase() === normalizedUser) {
          confirmedTokenIds.push(Number(tokenId));
        }
      } catch (ownerError) {
        // token may be burned or inaccessible in non-standard contracts
      }
    }

    return confirmedTokenIds.sort((a, b) => a - b);
  } catch (err: any) {
    console.info("err in transfer events fallback", err.message);
    return [];
  }
};

export const getUserNftIds = async (
  collectionAddress: string,
  walletAddress: string
): Promise<{ success: boolean; tokenIds: number[] }> => {
  const { success, nfts } = await getNFTBalance(collectionAddress, walletAddress);

  if (!success || !nfts) {
    return { success: !!success, tokenIds: [] };
  }

  const tokenIds: number[] = [];

  for (let i = 0; i < nfts; i++) {
    console.log(collectionAddress)
    const { nftId } = await getNftId(collectionAddress, walletAddress, i);

    if (nftId === null) {
      const fromEvents = await getUserNftIdsFromTransferEvents(
        collectionAddress,
        walletAddress
      );
      return { success: fromEvents.length > 0, tokenIds: fromEvents };
    }
    tokenIds.push(nftId);
  }

  return { success: true, tokenIds };
};

// Получить ссылку на метадату по ID (id_nft(int))
export async function getNftMetaData(address_nft: string, id_nft: number) {
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract_nft_nn = new Contract(address_nft, abiNft, provider);
    const daiContractWithSigner_nft_nn = contract_nft_nn.connect(signer);

    const data = await contract_nft_nn.tokenURI(id_nft);

    return { success: true, nftData: data };
  } catch (err: any) {
    console.info("err in approve", err.message);

    return { success: false, nftData: null };
  }
}

const toIpfsGatewayUrl = (uri: string): string => {
  const ipfsPath = uri
    .replace(/^ipfs:\/\//i, "")
    .replace(/^ipfs\//i, "");
  return `https://ipfs.io/ipfs/${ipfsPath}`;
};

const resolveMetadataUri = (
  rawUri: string,
  tokenId: number,
  metadataBaseLink?: string
): string => {
  let uri = String(rawUri || "").trim();
  const baseLink = String(metadataBaseLink || "").trim().replace(/\/+$/, "");
  const isNumericOnly = /^\d+$/.test(uri);

  if (isNumericOnly && baseLink) {
    return `${baseLink}/${uri}`;
  }

  if (!uri && baseLink) {
    return `${baseLink}/${tokenId}`;
  }

  if (uri.includes("{id}")) {
    const hexId = tokenId.toString(16).padStart(64, "0");
    uri = uri.replace("{id}", hexId);
  }

  if (/^ipfs:\/\//i.test(uri)) {
    return toIpfsGatewayUrl(uri);
  }

  if (/^ar:\/\//i.test(uri)) {
    return `https://arweave.net/${uri.replace(/^ar:\/\//i, "")}`;
  }

  if (/^https?:\/\//i.test(uri) || /^data:/i.test(uri)) {
    return uri;
  }

  return toIpfsGatewayUrl(`ipfs://${uri}`);
};

const parseDataUriJson = (uri: string): any | null => {
  if (!/^data:application\/json/i.test(uri)) {
    return null;
  }

  const [head, payload] = uri.split(",", 2);
  if (!payload) return null;

  const decoded = /;base64/i.test(head)
    ? atob(payload)
    : decodeURIComponent(payload);

  return JSON.parse(decoded);
};

const fetchMetadataByTokenUri = async (
  tokenUri: string,
  tokenId: number,
  metadataBaseLink?: string
): Promise<any | null> => {
  if (!tokenUri && !metadataBaseLink) return null;

  try {
    const inlineJson = parseDataUriJson(tokenUri);
    if (inlineJson) return inlineJson;
  } catch { }

  const resolvedUri = resolveMetadataUri(tokenUri, tokenId, metadataBaseLink);

  try {
    const response = await fetch(resolvedUri);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

// const parseMetaDataLink = (link) => {
// 	const updatedUrl = link.replace(/\/\d+$/, "");

// 	return updatedUrl
// }

/////////////////////////////////Изменение комиссии создателя в коллекции(adr(address) - адрес коллекции, fee(int) - % новой комиссии(задаётся в виде 1 decimal пример 25 = 2.5% комиссии))
export async function changeCreatorFee(collectionAddress: string, fee: number) {
  try {
    const { daiContractWithSignerPool } = await getMainSmart();

    await daiContractWithSignerPool.change_creator_fee(collectionAddress, fee);

    return { success: true };
  } catch (err: any) {
    console.info("err in transaction", err.message);

    return { success: false };
  }
}

/////////////////////////////////Изменение адреса создателя в коллекции(collectionAddress(address) - адрес коллекции, creator(str) - адрес)
export async function changeCreator(
  collectionAddress: string,
  creator: string
) {
  try {
    const { daiContractWithSignerPool } = await getMainSmart();

    await daiContractWithSignerPool.creator(collectionAddress, creator);

    return { success: true };
  } catch (err: any) {
    console.info("err in transaction", err.message);

    return { success: false };
  }
}

export const getUserNfts = async (
  address: string,
  user: string,
  metadataBaseLink?: string
) => {
  try {
    const nftsDataMetaData = [];
    const nftsData = [];
    const { success, tokenIds: userNftIds } = await getUserNftIds(address, user);
    if (!success) return { success: false, nftsData: [] };

    for (let i = 0; i < userNftIds.length; i++) {
      const nftId = userNftIds[i];
      const { nftData } = await getNftMetaData(address, nftId || 0);
      nftsDataMetaData.push({ link: nftData || "", nftId, nftIndex: i });
    }

    for (let i = 0; i < nftsDataMetaData.length; i++) {
      const tokenUri = String(nftsDataMetaData[i].link || "");
      const nftId = Number(nftsDataMetaData[i].nftId || 0);
      const metadata = await fetchMetadataByTokenUri(
        tokenUri,
        nftId,
        metadataBaseLink
      );

      if (metadata) {
        nftsData.push({
          ...metadata,
          nftId: nftsDataMetaData[i].nftId,
          nftIndex: nftsDataMetaData[i].nftIndex,
        });
        continue;
      }

      nftsData.push({
        nftId: nftsDataMetaData[i].nftId,
        nftIndex: nftsDataMetaData[i].nftIndex,
        metaError: true,
        tokenURI: tokenUri,
        resolvedTokenURI: resolveMetadataUri(tokenUri, nftId, metadataBaseLink),
      });
    }

    return { success: true, nftsData };
  } catch (error) {
    console.log(error);

    return { success: false, nftsData: [] };
  }
};

export async function approveNFT(address_nft: string, id_nft: any) {
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address_pool = addressPool;
    const contract_nft_nn = new Contract(address_nft, abiNft, provider);
    const daiContractWithSigner_nft_nn = contract_nft_nn.connect(signer);

    const response = await daiContractWithSigner_nft_nn.approve(
      address_pool,
      id_nft
    );
  } catch (err: any) {
    console.info("err in approve", err.message);
  }
}
export async function getFloorPriceUsdc(collectionAddress: string) {
  try {
    const { allOrders } = await getAllAvailableItemsUsd();
    const availableOrders = allOrders.filter((order: any) => {
      return (
        isMarketplaceOrderAvailable(order) &&
        order.token_address === collectionAddress
      );
    });
    let floorPrice = 0;

    for (let i = 0; i < availableOrders.length; i++) {
      const order = availableOrders[i];
      const price = Number(bigNumber_to_number(order.price, marketDecimals));

      if (price < floorPrice || i === 0) {
        floorPrice = price;
      }
    }

    return { success: true, floorPriceUsdc: Number(floorPrice) };
  } catch (error) {
    console.info(error);
    return { success: false, floorPriceUsdc: 0 };
  }
}

export async function getFloorPriceEth(collectionAddress: string) {
  try {
    const { allOrders } = await getAllAvailableItems();

    const availableOrders = allOrders.filter((order: any) => {
      return (
        isMarketplaceOrderAvailable(order) &&
        order.token_address === collectionAddress
      );
    });
    let floorPrice = 0;

    for (let i = 0; i < availableOrders.length; i++) {
      const order = availableOrders[i];
      const price = Number(bigNumber_to_number(order.price, marketDecimals));

      if (price < floorPrice || i === 0) {
        floorPrice = price;
      }
    }

    return { success: true, floorPriceEth: Number(floorPrice) };
  } catch (error) {
    console.info(error);
    return { success: false, floorPriceEth: 0 };
  }
}

export async function getListedNfts(collectionAddress: string) {
  try {
    const usdOrders = await getAllAvailableItemsUsd();
    const ethOrders = await getAllAvailableItems();
    const nftsId = {};

    const allOrders = [...usdOrders.allOrders, ...ethOrders.allOrders];

    const availableOrders = allOrders.filter((order) => {
      if (
        isMarketplaceOrderAvailable(order) &&
        String(order.token_address).toLowerCase() ===
        String(collectionAddress).toLowerCase() &&
        // @ts-ignore
        !nftsId[bigNumber_to_number(order.token_id, 0)]
      ) {
        // @ts-ignore
        nftsId[bigNumber_to_number(order.token_id, 0)] = bigNumber_to_number(
          order.token_id,
          0
        );

        return true;
      }
    });

    return {
      success: true,
      listed: availableOrders.length || 0,
      availableOrders: availableOrders,
      allOrders,
    };
  } catch (error) {
    console.log(error);

    return { success: false, listed: 0 };
  }
}
// @ts-ignore
export const getDateIntervalPrice = async (interval, ethExchange) => {
  try {
    const usdOrders = await getAllAvailableItemsUsd();
    const ethOrders = await getAllAvailableItems();

    let totalPrice = 0;
    let actualOrders = 0;
    let minPrice = 0;
    let maxPrice = 0;

    const intervalDate = getDateInterval(interval);

    for (let i = 0; i < usdOrders.allOrders.length; i++) {
      const order = usdOrders.allOrders[i];
      const orderNumberDate = new Date(
        Number(bigNumber_to_number(order.endTime, 0))
      ).getTime();
      const intervalNumberDate = new Date(intervalDate).getTime();
      const isActual = intervalNumberDate < orderNumberDate;

      if (!isActual) continue;

      let currentPrice = Number(
        bigNumber_to_number(order.price, marketDecimals)
      );

      actualOrders++;
      totalPrice = totalPrice + currentPrice;
      if (currentPrice > maxPrice) {
        maxPrice = Number(currentPrice.toFixed(2));
      }
      if (minPrice > currentPrice || minPrice === 0) {
        minPrice = Number(currentPrice.toFixed(2));
      }
    }

    for (let i = 0; i < ethOrders.allOrders.length; i++) {
      const order = ethOrders.allOrders[i];

      const orderNumberDate = new Date(
        Number(bigNumber_to_number(order.endTime, 0))
      ).getTime();
      const intervalNumberDate = new Date(intervalDate).getTime();
      const isActual = intervalNumberDate < orderNumberDate;
      if (!isActual) continue;
      const currentPrice =
        Number(bigNumber_to_number(order.price, marketDecimals)) *
        Number(ethExchange);

      actualOrders++;
      totalPrice = totalPrice + currentPrice;
      if (currentPrice > maxPrice) {
        maxPrice = Number(currentPrice.toFixed(2));
      }
      if (minPrice > currentPrice || minPrice === 0) {
        minPrice = Number(currentPrice.toFixed(2));
      }
    }

    const middlePrice = Number(Number(totalPrice / actualOrders).toFixed(2));

    return { minPrice, maxPrice, middlePrice };
  } catch (error) {
    return { success: false };
  }
};

export const getNftIntervalPrice = async (
  interval: string,
  ethExchange: number,
  nftId: number
): Promise<{ minPrice: number; maxPrice: number }> => {
  try {
    const usdOrders = await getAllAvailableItemsUsd();
    const ethOrders = await getAllAvailableItems();

    let minPrice = 0;
    let maxPrice = 0;

    const intervalDate = getDateInterval(interval);

    for (let i = 0; i < usdOrders.allOrders.length; i++) {
      const order = usdOrders.allOrders[i];
      const orderNumberDate = new Date(
        Number(bigNumber_to_number(order.endTime, 0))
      ).getTime();
      const intervalNumberDate = new Date(intervalDate).getTime();
      const isActual = intervalNumberDate < orderNumberDate;

      if (
        !isActual ||
        Number(bigNumber_to_number(order.token_id, 0)) !== Number(nftId)
      ) {
        continue;
      }

      let currentPrice = Number(
        bigNumber_to_number(order.price, marketDecimals)
      );

      if (currentPrice > maxPrice) {
        maxPrice = Number(currentPrice.toFixed(2));
      }
      if (minPrice > currentPrice || minPrice === 0) {
        minPrice = Number(currentPrice.toFixed(2));
      }
    }

    for (let i = 0; i < ethOrders.allOrders.length; i++) {
      const order = ethOrders.allOrders[i];

      const orderNumberDate = new Date(
        Number(bigNumber_to_number(order.endTime, 0))
      ).getTime();
      const intervalNumberDate = new Date(intervalDate).getTime();
      const isActual = intervalNumberDate < orderNumberDate;

      if (
        !isActual ||
        Number(bigNumber_to_number(order.token_id, 0)) !== Number(nftId)
      ) {
        continue;
      }

      const currentPrice =
        Number(bigNumber_to_number(order.price, marketDecimals)) *
        Number(ethExchange);

      if (currentPrice > maxPrice) {
        maxPrice = Number(currentPrice.toFixed(2));
      }
      if (minPrice > currentPrice || minPrice === 0) {
        minPrice = Number(currentPrice.toFixed(2));
      }
    }

    return { minPrice, maxPrice };
  } catch (error) {
    return { minPrice: 0, maxPrice: 0 };
  }
};

export const getNftFloorPrice = async (
  collectionAddress: string,
  nftId: number,
  currency: "ETH" | "USDC"
) => {
  try {
    const allOrders =
      currency === "ETH"
        ? (await getAllAvailableItems()).allOrders
        : (await getAllAvailableItemsUsd()).allOrders;

    let floorPrice = 0;

    for (let i = 0; i < allOrders.length; i++) {
      const order = allOrders[i];
      const price = Number(bigNumber_to_number(order.price, marketDecimals));
      const currentNftId = Number(bigNumber_to_number(order.token_id, 0));

      if (
        String(order.token_address).toLowerCase() !==
        String(collectionAddress).toLowerCase() ||
        currentNftId !== Number(nftId)
      )
        continue;

      if (floorPrice > price || floorPrice === 0) {
        floorPrice = price;
      }
    }

    return { floorPrice };
  } catch (error) {
    return { success: false };
  }
};

export const getCollectionData = async (
  collectionAddress: string,
  currency: string,
  ethExchange: number,
  projectData: IProject | undefined
): Promise<{
  totalVolume: number;
  totalVolumeEth: number;
  totalVolumeUsd: number;
  minPrice: number;
  maxPrice: number;
  marketCap: number;
  supply: number;
}> => {
  try {
    const usdOrders = await getAllAvailableItemsUsd();
    const ethOrders = await getAllAvailableItems();
    let minPrice = 0;
    let maxPrice = 0;
    let totalPrice = 0;
    const { listed } = await getListedNfts(collectionAddress);

    for (let i = 0; i < usdOrders.allOrders.length; i++) {
      const order = usdOrders.allOrders[i];

      if (
        collectionAddress !== order.token_address ||
        !isMarketplaceOrderAvailable(order)
      )
        continue;

      let price = Number(bigNumber_to_number(order.price, marketDecimals));

      if (price > maxPrice) {
        maxPrice = Number(price.toFixed(2));
      }

      if (minPrice > price || i === 0) {
        minPrice = Number(price.toFixed(2));
      }

      totalPrice = totalPrice + price;
    }

    for (let i = 0; i < ethOrders.allOrders.length; i++) {
      const order = ethOrders.allOrders[i];

      if (
        collectionAddress !== order.token_address ||
        !isMarketplaceOrderAvailable(order)
      )
        continue;

      let price =
        Number(bigNumber_to_number(order.price, marketDecimals)) *
        Number(ethExchange);

      if (price > maxPrice) {
        maxPrice = Number(price.toFixed(2));
      }

      if (minPrice > price || i === 0) {
        minPrice = Number(price.toFixed(2));
      }

      totalPrice = totalPrice + price;
    }

    const totalUsdc = await getTotalVolumeUsd();
    const totalEth = await getTotalVolumeEth();
    const supply = projectData?.totalSupply || 0;
    // @ts-ignore
    const marketCap = Number(
      Number(totalPrice + (supply - listed) * minPrice).toFixed(2)
    );
    // @ts-ignore
    const totalVolume = totalEth.value * Number(ethExchange) + totalUsdc.value;

    return {
      totalVolume: Number(totalVolume.toFixed(2)),
      totalVolumeEth: Number(totalEth.value || 0),
      totalVolumeUsd: Number(totalUsdc.value || 0),
      minPrice,
      maxPrice,
      marketCap,
      supply,
    };
  } catch (error) {
    console.log(error);

    return {
      totalVolume: 0,
      totalVolumeEth: 0,
      totalVolumeUsd: 0,
      minPrice: 0,
      maxPrice: 0,
      marketCap: 0,
      supply: projectData?.totalSupply || 0,
    };
  }
};
// @ts-ignore
export async function getOwnerCount(address_nft) {
  try {
    if (typeof window === "undefined" || !window.ethereum || !address_nft) {
      return { success: false, owners: [] };
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const nftContract = new Contract(address_nft, abiNft, provider);
    const totalSupplyRaw = await nftContract.totalSupply();
    const totalSupply = Number(totalSupplyRaw?.toString?.() || 0);

    if (!Number.isFinite(totalSupply) || totalSupply <= 0) {
      return { success: true, owners: [] };
    }

    const tokenIds = await Promise.all(
      Array.from({ length: totalSupply }, (_, index) => nftContract.tokenByIndex(index))
    );
    const ownerAddresses = await Promise.all(
      tokenIds.map((tokenId) => nftContract.ownerOf(tokenId))
    );
    const owners = Array.from(
      new Set(
        ownerAddresses
          .map((owner) => String(owner || "").toLowerCase())
          .filter(Boolean)
      )
    );

    return { success: true, owners };
  } catch (err: any) {
    console.info("err in get owners", err.message);
    return { success: false, owners: [] };
  }
}

export async function getTotalVolumeEth() {
  try {
    const { daiContractWithSignerPool } = await getMainSmart();

    const response = await daiContractWithSignerPool.total_volume_eth();

    const value = Number(bigNumber_to_number(response, ETH_DECIMALS));

    return { success: true, value };
  } catch (err: any) {
    console.info("err", err.message);
    return { success: false };
  }
}

export async function getTotalVolumeUsd() {
  try {
    const { daiContractWithSignerPool } = await getMainSmart();

    const response = await daiContractWithSignerPool.total_volume_usd();

    const value = Number(bigNumber_to_number(response, marketDecimals));

    return { success: true, value };
  } catch (err: any) {
    console.info("err", err.message);

    return { success: false };
  }
}
// @ts-ignore
export async function getPriceForWeek(nftId, ethExchange) {
  try {
    // @ts-ignore
    const dates = getDatesFromToday();
    const minDate = dates[dates.length - 1];
    const usdOrders = await getAllAvailableItemsUsd();
    const ethOrders = await getAllAvailableItems();
    const data = [];
    const uniqueDates = {};

    for (let i = 0; i < usdOrders.allOrders.length; i++) {
      const order = usdOrders.allOrders[i];
      const orderDate = Number(bigNumber_to_number(order.endTime, 0));
      const isValidDate = orderDate > minDate;
      const id = Number(bigNumber_to_number(order.token_id, 0));

      if (isValidDate && Number(nftId) === id) {
        const price = Number(
          bigNumber_to_number(order.price, marketDecimals)
        ).toFixed(2);
        // @ts-ignore
        uniqueDates[orderDate] = true;
        data.push({ date: orderDate, "": Number(price) });
        // @ts-ignore
        if (!uniqueDates[orderDate]) {
          // @ts-ignore
          uniqueDates[orderDate] = true;
          data.push({ date: orderDate, "": Number(price) });
        }
      }
    }
    for (let i = 0; i < ethOrders.allOrders.length; i++) {
      const order = ethOrders.allOrders[i];
      const orderDate = Number(bigNumber_to_number(order.endTime, 0));
      const isValidDate = orderDate > minDate;
      const id = Number(bigNumber_to_number(order.token_id, 0));

      if (isValidDate && Number(nftId) === id) {
        const price = (
          Number(bigNumber_to_number(order.price, marketDecimals)) *
          Number(ethExchange)
        ).toFixed(2);
        // @ts-ignore
        if (!uniqueDates[orderDate]) {
          // @ts-ignore
          uniqueDates[orderDate] = true;
          data.push({ date: orderDate, "": Number(price) });
        }
      }
    }

    const sortedData = data
      .sort((a, b) => a.date - b.date)
      .map((item) => {
        return {
          ...item,
          date: `${new Date(item.date).getMonth() + 1}.${new Date(item.date).getDate()}.${new Date(item.date).getFullYear()}`,
        };
      })
      .slice(0, dates.length);

    return sortedData;
  } catch (error) {
    console.log(error);
    return { success: false };
  }
}
// @ts-ignore
export async function getBuyNftAccess(
  userAddress: string,
  nftId: number,
  isEth: boolean,
  tokenAddress?: string
) {
  try {
    let isAvailable = false;
    const { allOrders } = isEth
      ? await getAllAvailableItems()
      : await getAllAvailableItemsUsd();
    const normalizedUserAddress = String(userAddress || "").toLowerCase();
    const normalizedTokenAddress = String(tokenAddress || "").toLowerCase();

    for (let i = 0; i < allOrders.length; i++) {
      const order = allOrders[i];
      const orderTokenAddress = String(order?.token_address || "").toLowerCase();
      const isMatchedTokenAddress =
        !normalizedTokenAddress || orderTokenAddress === normalizedTokenAddress;

      if (!isMarketplaceOrderAvailable(order)) continue;
      if (!isMatchedTokenAddress) continue;

      isAvailable =
        String(order?.buyer).toLowerCase() ===
        normalizedUserAddress &&
        Number(bigNumber_to_number(order.token_id, 0)) === Number(nftId);

      if (isAvailable) {
        const orderData = {
          price: Number(bigNumber_to_number(order.price, marketDecimals)),
          orderId: Number(bigNumber_to_number(order.item_id, 0)),
          seller: order.seller,
          buyer: order.buyer,
          tokenAddress: order.token_address,
        };
        return { success: isAvailable, isAvailable, order: orderData };
      }
    }

    return { success: true, isAvailable, order: null };
  } catch (error) {
    console.log(error);

    return { success: false, isAvailable: false, order: null };
  }
}
// @ts-ignore
export async function checkNftOwner(smartAddress, nftId) {
  try {
    const { nftsData } = await getUserNfts(
      smartAddress,
      window.ethereum.selectedAddress
    );

    if (!nftsData.length) return { success: true, isOwner: false };

    const isOwner = !!nftsData.find((item) => item.nftId === nftId);

    return { success: true, isOwner };
  } catch (error) {
    console.log(error);

    return { success: false, isOwner: false };
  }
}


///////////////////////////////// Отмена ордера за ETH
// item_id(int) - ID ордера
export async function cancelItem(
  item_id: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { daiContractWithSignerPool } = await getMainSmart();

    const tx = await daiContractWithSignerPool.cancelItem(item_id);
    await tx.wait();

    return { success: true, message: "200" };
  } catch (err: any) {
    console.info("err in transaction cancelItem", err.message);

    return { success: false, message: err.message };
  }
}

///////////////////////////////// Отмена ордера за USD
// item_id(int) - ID ордера
export async function cancelItemUsd(
  item_id: number
): Promise<{ success: boolean; message: string }> {
  try {
    const { daiContractWithSignerPool } = await getMainSmart();

    const tx = await daiContractWithSignerPool.cancelItem_usd(item_id);
    await tx.wait();

    return { success: true, message: "200" };
  } catch (err: any) {
    console.info("err in transaction cancelItem_usd", err.message);

    return { success: false, message: err.message };
  }
}

///////////////////////////////// Batch Purchase (Partial)

/**
 * Decode BuyFailed.reason (bytes) into a readable string.
 * Falls back to hex representation if not valid UTF-8.
 */
export function decodeReasonBytes(reasonBytes: any): string {
  try {
    const hex = ethers.utils.hexlify(reasonBytes);
    return ethers.utils.toUtf8String(hex);
  } catch {
    try {
      return ethers.utils.hexlify(reasonBytes);
    } catch {
      return "failed";
    }
  }
}

/**
 * Parse receipt logs from the market contract and produce a report:
 * - successIds: from BatchResult
 * - sold: from Sold
 * - failed: from BuyFailed
 */
export function parseMarketBatchReceipt(
  receipt: any,
  marketContract: Contract
): {
  successIds: string[];
  sold: Array<{ itemId: string; price: string; isUsd: boolean }>;
  failed: Array<{ itemId: string; isUsd: boolean; buyer: string; reason: string }>;
} {
  const sold: Array<{ itemId: string; price: string; isUsd: boolean }> = [];
  const failed: Array<{ itemId: string; isUsd: boolean; buyer: string; reason: string }> = [];
  let successIds: string[] = [];

  for (const log of receipt.logs) {
    let parsed: any;
    try {
      parsed = marketContract.interface.parseLog(log);
    } catch {
      continue;
    }

    if (parsed.name === "Sold") {
      const { itemId, price, isUsd } = parsed.args;
      sold.push({
        itemId: itemId.toString(),
        price: price.toString(),
        isUsd: Boolean(isUsd),
      });
    }

    if (parsed.name === "BuyFailed") {
      const { itemId, isUsd, buyer, reason } = parsed.args;
      failed.push({
        itemId: itemId.toString(),
        isUsd: Boolean(isUsd),
        buyer,
        reason: decodeReasonBytes(reason),
      });
    }

    if (parsed.name === "BatchResult") {
      const { successItemIds } = parsed.args;
      successIds = successItemIds.map((x: any) => x.toString());
    }
  }

  return { successIds, sold, failed };
}

/**
 * ETH batch partial buy.
 * @param itemIds - array of market item IDs to purchase
 * @param valueWei - total ETH to send (sum of item prices), as BigNumber or hex string
 */
export async function purchaseItemsPartialETH(
  itemIds: Array<number | string>,
  valueWei: any
): Promise<{
  success: boolean;
  txHash: string;
  blockNumber: number;
  report: ReturnType<typeof parseMarketBatchReceipt>;
  pendingRefundWei: string;
}> {
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const market = new Contract(addressPool, abiMarket, signer);
    const userAddress = await getConnectedWalletAddress(provider, true);

    const tx = await market.purchaseItemsPartial(itemIds, { value: valueWei });
    const receipt = await tx.wait();

    const report = parseMarketBatchReceipt(receipt, market);

    let pendingRefundWei = ethers.BigNumber.from(0);
    try {
      pendingRefundWei = await market.pendingRefundEth(userAddress);
    } catch {
      // ignore
    }

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      report,
      pendingRefundWei: pendingRefundWei.toString(),
    };
  } catch (err: any) {
    console.info("err in purchaseItemsPartialETH", err.message);
    return {
      success: false,
      txHash: "",
      blockNumber: 0,
      report: { successIds: [], sold: [], failed: [] },
      pendingRefundWei: "0",
    };
  }
}

/**
 * USD (ERC20) batch partial buy.
 * Approves the market contract to spend `maxSpend` tokens, then calls purchaseItemsPartial_usd.
 *
 * @param itemIds - array of market item IDs to purchase
 * @param maxSpend - amount to approve (in token smallest units), as BigNumber or hex string
 */
export async function purchaseItemsPartialUSD(
  itemIds: Array<number | string>,
  maxSpend: any
): Promise<{
  success: boolean;
  txHash: string;
  blockNumber: number;
  report: ReturnType<typeof parseMarketBatchReceipt>;
}> {
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const user = await getConnectedWalletAddress(provider, true);

    const market = new Contract(addressPool, abiMarket, signer);
    const erc20 = new Contract(addressUsd, abiUsd, signer);

    // Ensure allowance
    const allowance = await erc20.allowance(user, addressPool);
    if (allowance.lt(maxSpend)) {
      const approveTx = await erc20.approve(addressPool, maxSpend);
      await approveTx.wait();
    }

    const tx = await market.purchaseItemsPartial_usd(itemIds);
    const receipt = await tx.wait();

    const report = parseMarketBatchReceipt(receipt, market);

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      report,
    };
  } catch (err: any) {
    console.info("err in purchaseItemsPartialUSD", err.message);
    return {
      success: false,
      txHash: "",
      blockNumber: 0,
      report: { successIds: [], sold: [], failed: [] },
    };
  }
}

export function getSuccessfulOrderIdsFromBatchReport(
  report: ReturnType<typeof parseMarketBatchReceipt>
): string[] {
  const successfulOrderIds = new Set<string>();

  for (const id of report?.successIds || []) {
    successfulOrderIds.add(String(id));
  }

  for (const soldItem of report?.sold || []) {
    successfulOrderIds.add(String(soldItem.itemId));
  }

  return Array.from(successfulOrderIds);
}

export async function checkoutMarketplaceItems(
  items: MarketplaceCheckoutItem[],
  currency: MarketplaceCheckoutCurrency
): Promise<{
  success: boolean;
  txHash: string;
  blockNumber: number;
  pendingRefundWei?: string;
  successfulOrderIds: string[];
  report: ReturnType<typeof parseMarketBatchReceipt>;
}> {
  const normalizedItems = Array.from(
    new Map(
      (items || [])
        .map((item) => {
          const orderId = Math.trunc(Number(item?.orderId || 0));
          const price = Number(item?.price || 0);

          if (orderId <= 0 || !Number.isFinite(price) || price <= 0) {
            return null;
          }

          return [String(orderId), { orderId, price }] as const;
        })
        .filter(Boolean) as Array<readonly [string, MarketplaceCheckoutItem]>
    ).values()
  );

  if (!normalizedItems.length) {
    return {
      success: false,
      txHash: "",
      blockNumber: 0,
      successfulOrderIds: [],
      report: { successIds: [], sold: [], failed: [] },
    };
  }

  const orderIds = normalizedItems.map((item) => item.orderId);

  if (currency === "ETH") {
    const totalValueWei = normalizedItems.reduce(
      (acc, item) => acc.add(getMarketTokenAmount(item.price, ETH_DECIMALS)),
      ethers.BigNumber.from(0)
    );
    const result = await purchaseItemsPartialETH(orderIds, totalValueWei);

    return {
      ...result,
      successfulOrderIds: getSuccessfulOrderIdsFromBatchReport(result.report),
    };
  }

  const maxSpend = normalizedItems.reduce(
    (acc, item) => acc.add(getMarketTokenAmount(item.price, USDC_DECIMALS)),
    ethers.BigNumber.from(0)
  );
  const result = await purchaseItemsPartialUSD(orderIds, maxSpend);

  return {
    ...result,
    successfulOrderIds: getSuccessfulOrderIdsFromBatchReport(result.report),
  };
}

/**
 * Withdraw pending ETH refund if pendingRefundEth(user) > 0.
 */
export async function withdrawPendingRefundETH(): Promise<{
  success: boolean;
  txHash: string;
  blockNumber: number;
}> {
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const market = new Contract(addressPool, abiMarket, signer);

    const tx = await market.withdrawRefundEth();
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err: any) {
    console.info("err in withdrawPendingRefundETH", err.message);
    return { success: false, txHash: "", blockNumber: 0 };
  }
}
