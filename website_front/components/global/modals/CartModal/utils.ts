import mockCompany from "../../../../assets/images/nft/humans.png";
import { LOADER_API } from "../../../../config/api";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import {
  CartCurrency,
  CartItem as StoredCartItem,
} from "../../../../contexts/CartContext";

export const getImageDominantColor = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve("#ffffff");
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let r = 0;
        let g = 0;
        let b = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          pixelCount++;
        }

        r = Math.floor(r / pixelCount);
        g = Math.floor(g / pixelCount);
        b = Math.floor(b / pixelCount);

        resolve(
          `#${(255 - r).toString(16).padStart(2, "0")}${(255 - g)
            .toString(16)
            .padStart(2, "0")}${(255 - b).toString(16).padStart(2, "0")}`
        );
      } catch (error) {
        console.warn("Error extracting image color:", error);
        resolve("#ffffff");
      }
    };

    img.onerror = () => resolve("#ffffff");
    img.src = imageSrc;
  });
};

export const getItemCurrency = (
  item: Partial<StoredCartItem>
): CartCurrency => {
  if (item.currency) {
    return item.currency;
  }

  return item.isUsdc ? "USDC" : "ETH";
};

export const formatTokenPrice = (price: number, currency: CartCurrency) =>
  `${currency} ${clarifyAmount(Number(price || 0))}`;

export const resolveCartImage = (image: any) => {
  if (!image) {
    return mockCompany;
  }

  if (typeof image === "object" && image.src) {
    return image;
  }

  if (typeof image !== "string") {
    return mockCompany;
  }

  if (image.startsWith("http")) {
    return { src: image };
  }

  if (image.startsWith("/uploads")) {
    return { src: `${LOADER_API}${image}` };
  }

  if (image.startsWith("/")) {
    return { src: `${LOADER_API}/uploads${image}` };
  }

  return { src: `${LOADER_API}/uploads/${image}` };
};

export const normalizeInitialItem = (item: any): StoredCartItem | null => {
  if (!item) {
    return null;
  }

  if (item.id && item.name && item.image) {
    const currency = getItemCurrency(item);

    return {
      ...item,
      quantity: 1,
      currency,
      isEth: currency === "ETH",
      isUsdc: currency === "USDC",
      image: resolveCartImage(item.image),
    };
  }

  const nft = item?.nftId || item;
  const currency = getItemCurrency(item);
  const entityId = String(nft?._id || item?._id || "");

  if (!entityId) {
    return null;
  }

  return {
    id: `${entityId}-${currency}`,
    entityId,
    collectionId: String(nft?.collectionId || item?.collectionId || ""),
    nftId: Number(nft?.nftId || item?.nftId || 0) || undefined,
    orderId: Number(nft?.orderId || item?.orderId || 0) || undefined,
    tokenAddress: String(nft?.tokenAddress || item?.tokenAddress || ""),
    ownerWallet: String(
      nft?.owner?.wallet || item?.ownerWallet || item?.owner?.wallet || ""
    ),
    ownerId: String(
      nft?.owner?._id || nft?.ownerId || item?.ownerId || item?.owner?._id || ""
    ),
    name: nft?.name || "NFT",
    description: nft?.collection?.name || "NFT Collection",
    price: Number(nft?.price || item?.price || 0),
    usdPrice: Number(item?.usdPrice || 0) || undefined,
    image: resolveCartImage(nft?.image || item?.image),
    quantity: 1,
    currency,
    isEth: currency === "ETH",
    isUsdc: currency === "USDC",
  };
};
