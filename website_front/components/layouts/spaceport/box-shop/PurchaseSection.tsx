import React from "react";
import { ShoppingCart } from "lucide-react";
import {
  PurchaseWrapper,
  QuantitySelector,
  TotalPrice,
  PurchaseButton,
} from "./styles";
import { useTranslation } from "i18n";

interface BoxData {
  type: string;
  name: string;
  price: number;
}

interface PurchaseSectionProps {
  selectedBox: BoxData | null | undefined;
  quantity: number;
  maxQuantity: number;
  disabled?: boolean;
  isLoading?: boolean;
  isDataLoading?: boolean;
  totalPrice?: number;
  savingsAmount?: number;
  priceSymbol?: string;
  onQuantityChange: (quantity: number) => void;
  onPurchase: () => void;
}

const PurchaseSection: React.FC<PurchaseSectionProps> = ({
  selectedBox,
  quantity,
  maxQuantity,
  disabled = false,
  isLoading = false,
  isDataLoading = false,
  totalPrice,
  savingsAmount = 0,
  priceSymbol = "USDT",
  onQuantityChange,
  onPurchase,
}) => {
  const { t } = useTranslation();

  if (!selectedBox) {
    return null;
  }

  const totalPriceValue = Number.isFinite(Number(totalPrice))
    ? Number(totalPrice)
    : selectedBox.price * quantity;
  const safeSavingsAmount = Number.isFinite(Number(savingsAmount))
    ? Math.max(0, Number(savingsAmount))
    : 0;
  const formattedTotalPrice = Number(totalPriceValue.toFixed(6));
  const formattedSavings = Number(safeSavingsAmount.toFixed(6));
  const controlsDisabled = disabled || isDataLoading;
  const purchaseLabel =
    quantity === 1
      ? t("spaceport.boxShop.purchaseBox", { values: { count: quantity } })
      : t("spaceport.boxShop.purchaseBoxes", { values: { count: quantity } });

  return (
    <PurchaseWrapper>
      <QuantitySelector>
        <button
          type="button"
          aria-label={t("spaceport.boxShop.decreaseQuantity")}
          onClick={() => onQuantityChange(quantity - 1)}
          disabled={quantity <= 1 || controlsDisabled}
        >
          -
        </button>
        <input
          type="number"
          value={quantity}
          disabled={controlsDisabled}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value)) {
              onQuantityChange(value);
            }
          }}
          min="1"
          max={maxQuantity}
        />
        <button
          type="button"
          aria-label={t("spaceport.boxShop.increaseQuantity")}
          onClick={() => onQuantityChange(quantity + 1)}
          disabled={controlsDisabled || quantity >= maxQuantity}
        >
          +
        </button>
      </QuantitySelector>

      <TotalPrice>
        <span className="label">{t("spaceport.boxShop.totalPrice")}</span>
        <span className="price">
          {isDataLoading ? `-- ${priceSymbol}` : `${formattedTotalPrice} ${priceSymbol}`}
          {!isDataLoading && formattedSavings > 0 ? (
            <span className="savings">
              ({t("spaceport.boxShop.save", { values: { amount: formattedSavings, symbol: priceSymbol } })})
            </span>
          ) : null}
        </span>
      </TotalPrice>

      <PurchaseButton onClick={onPurchase} disabled={controlsDisabled}>
        <ShoppingCart />
        {isLoading
          ? t("spaceport.boxShop.purchasing")
          : isDataLoading
            ? t("spaceport.boxShop.loading")
            : purchaseLabel}
      </PurchaseButton>
    </PurchaseWrapper>
  );
};

export default PurchaseSection;
