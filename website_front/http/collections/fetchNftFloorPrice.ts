import { API } from "../../config/api";

type ListingCurrency = "ETH" | "USDC";

interface IFloorPriceResponse {
  isSuccess: boolean;
  floorPrice: number | null;
  hasFloorPrice: boolean;
  currency: ListingCurrency;
}

export default async (
  tokenAddress: string,
  nftId: number,
  currency: ListingCurrency
): Promise<IFloorPriceResponse> => {
  try {
    const query = new URLSearchParams();
    query.set("currency", currency);

    const queryString = query.toString();
    const url = `${API}/collectionNft/floor/${encodeURIComponent(
      tokenAddress
    )}/${encodeURIComponent(String(nftId))}${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
    });

    const data = await res.json();
    const floorPrice =
      data?.floorPrice === null || data?.floorPrice === undefined
        ? null
        : Number(data.floorPrice);

    return {
      isSuccess: res.status < 300,
      floorPrice,
      hasFloorPrice: Boolean(data?.hasFloorPrice) && floorPrice !== null,
      currency: data?.currency === "USDC" ? "USDC" : "ETH",
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      floorPrice: null,
      hasFloorPrice: false,
      currency,
    };
  }
};
