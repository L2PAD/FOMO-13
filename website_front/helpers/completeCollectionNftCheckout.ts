import completeCollectionNftCheckout, {
  CheckoutCurrency,
} from "../http/collections/completeCollectionNftCheckout";
import {
  checkoutMarketplaceItems,
  MarketplaceCheckoutItem,
} from "../smart/initialSmartMarketplace";

export interface CollectionNftCheckoutCandidate
  extends MarketplaceCheckoutItem {
  collectionNftId: string;
  nftId: number;
  tokenAddress: string;
  currency: CheckoutCurrency;
  cartItemId?: string;
}

export interface CollectionNftCheckoutResult {
  success: boolean;
  chainSuccess: boolean;
  backendSuccess: boolean;
  txHash: string;
  blockNumber: number;
  processedItems: CollectionNftCheckoutCandidate[];
  failedItems: CollectionNftCheckoutCandidate[];
  failedChainItems: Array<{ itemId: string; reason: string }>;
}

export default async (
  items: CollectionNftCheckoutCandidate[],
  currency: CheckoutCurrency
): Promise<CollectionNftCheckoutResult> => {
  const normalizedItems = (items || []).filter((item) => {
    return (
      item?.collectionNftId &&
      Number(item?.orderId || 0) > 0 &&
      Number(item?.nftId || 0) >= 0 &&
      !!String(item?.tokenAddress || "").trim()
    );
  });

  if (!normalizedItems.length) {
    return {
      success: false,
      chainSuccess: false,
      backendSuccess: false,
      txHash: "",
      blockNumber: 0,
      processedItems: [],
      failedItems: [],
      failedChainItems: [],
    };
  }

  const chainResult = await checkoutMarketplaceItems(
    normalizedItems.map((item) => ({
      orderId: item.orderId,
      price: item.price,
    })),
    currency
  );

  const successfulOrderIds = new Set(
    (chainResult.successfulOrderIds || []).map((item) => String(item))
  );
  const processedItems = normalizedItems.filter((item) =>
    successfulOrderIds.has(String(item.orderId))
  );
  const failedItems = normalizedItems.filter(
    (item) => !successfulOrderIds.has(String(item.orderId))
  );

  if (!chainResult.success || !processedItems.length) {
    return {
      success: false,
      chainSuccess: false,
      backendSuccess: false,
      txHash: chainResult.txHash,
      blockNumber: chainResult.blockNumber,
      processedItems,
      failedItems,
      failedChainItems: (chainResult.report?.failed || []).map((item) => ({
        itemId: String(item.itemId),
        reason: String(item.reason || "failed"),
      })),
    };
  }

  const backendResult = await completeCollectionNftCheckout({
    txHash: chainResult.txHash,
    blockNumber: chainResult.blockNumber,
    items: processedItems.map((item) => ({
      collectionNftId: item.collectionNftId,
      orderId: item.orderId,
      nftId: item.nftId,
      tokenAddress: item.tokenAddress,
      price: item.price,
      currency: item.currency,
    })),
  });

  return {
    success: backendResult.isSuccess && backendResult.success,
    chainSuccess: true,
    backendSuccess: backendResult.isSuccess && backendResult.success,
    txHash: chainResult.txHash,
    blockNumber: chainResult.blockNumber,
    processedItems,
    failedItems,
    failedChainItems: (chainResult.report?.failed || []).map((item) => ({
      itemId: String(item.itemId),
      reason: String(item.reason || "failed"),
    })),
  };
};
