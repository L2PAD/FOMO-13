import {
  getOrderByNftId,
  getOrderUsdByNftId,
} from "../smart/initialSmartMarketplace";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const normalizeAddress = (value?: string) =>
  String(value || "").trim().toLowerCase();

export type MarketplaceOrderAccessStatus =
  | "available"
  | "reserved"
  | "not_found"
  | "unknown";

export interface MarketplaceOrderAccessResult {
  success: boolean;
  status: MarketplaceOrderAccessStatus;
  orderId: number;
  price: number;
  buyer: string;
  seller: string;
  isPublic: boolean;
  isReservedForConnectedWallet: boolean;
}

interface ResolveMarketplaceOrderAccessParams {
  currency: "ETH" | "USDC";
  nftId: number;
  tokenAddress: string;
  connectedWallet?: string;
}

export default async function resolveMarketplaceOrderAccess({
  currency,
  nftId,
  tokenAddress,
  connectedWallet,
}: ResolveMarketplaceOrderAccessParams): Promise<MarketplaceOrderAccessResult> {
  const normalizedAddress = normalizeAddress(tokenAddress);

  if (!normalizedAddress || !Number.isFinite(Number(nftId))) {
    return {
      success: false,
      status: "unknown",
      orderId: 0,
      price: 0,
      buyer: "",
      seller: "",
      isPublic: false,
      isReservedForConnectedWallet: false,
    };
  }

  const fetchOrder =
    currency === "USDC" ? getOrderUsdByNftId : getOrderByNftId;
  const response = await fetchOrder(Number(nftId), normalizedAddress);

  if (!response?.success) {
    return {
      success: false,
      status: "unknown",
      orderId: 0,
      price: 0,
      buyer: "",
      seller: "",
      isPublic: false,
      isReservedForConnectedWallet: false,
    };
  }

  const currentOrder = response?.currentOrder || {};
  const orderId = Math.trunc(Number(currentOrder?.orderId || 0));
  const price = Number(currentOrder?.orderPrice || 0);
  const buyer = normalizeAddress(currentOrder?.buyer);
  const seller = normalizeAddress(currentOrder?.orderSeller);
  const normalizedWallet = normalizeAddress(connectedWallet);
  const isPublic = !buyer || buyer === ZERO_ADDRESS;
  const isReservedForConnectedWallet = Boolean(
    !isPublic && normalizedWallet && buyer === normalizedWallet
  );

  if (!currentOrder?.available || orderId <= 0) {
    return {
      success: true,
      status: "not_found",
      orderId: 0,
      price: 0,
      buyer,
      seller,
      isPublic: false,
      isReservedForConnectedWallet: false,
    };
  }

  if (!isPublic && !isReservedForConnectedWallet) {
    return {
      success: true,
      status: "reserved",
      orderId,
      price,
      buyer,
      seller,
      isPublic: false,
      isReservedForConnectedWallet: false,
    };
  }

  return {
    success: true,
    status: "available",
    orderId,
    price,
    buyer,
    seller,
    isPublic,
    isReservedForConnectedWallet,
  };
}
