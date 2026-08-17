import React, { FC } from "react";
import { Minus, Plus } from "lucide-react";
import { CartItem as StoredCartItem } from "../../../../../contexts/CartContext";
import {
  CartButton,
  CartItem,
  CartItemInfo,
  CartQuantityControls,
  Items,
} from "../styles";
import Checkbox from "../../../common/Checkbox";
import { formatTokenPrice, getItemCurrency } from "../utils";

interface Props {
  items: StoredCartItem[];
  selectedItems: string[];
  onSelectItem: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

const CartItemsList: FC<Props> = ({
  items,
  selectedItems,
  onSelectItem,
  onRemove,
}) => {
  return (
    <Items>
      {items.map((item) => (
        <CartItem key={item.id}>
          <Checkbox
            checked={selectedItems.includes(item.id)}
            onChange={() => onSelectItem(item.id)}
          />
          <img src={item.image.src} alt={item.name} />
          <CartItemInfo>
            <div className="name">{item.name}</div>
            <div className="description">{item.description}</div>
            <div className="price">
              {item.hasDiscount && (
                <span className="original-price">
                  {formatTokenPrice(
                    Number(item.originalPrice || 0),
                    getItemCurrency(item)
                  )}
                </span>
              )}
              <span className="current-price">
                {formatTokenPrice(item.price, getItemCurrency(item))}
              </span>
            </div>
          </CartItemInfo>
          <CartButton>
            <button onClick={() => onRemove(item.id)}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 6H5H21M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6V20C19 20.55 18.55 21 18 21H6C5.45 21 5 20.55 5 20V6H19Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </CartButton>
        </CartItem>
      ))}
    </Items>
  );
};

export default CartItemsList;
