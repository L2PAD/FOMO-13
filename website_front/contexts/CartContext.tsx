import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

const CART_STORAGE_KEY = "fomoland-cart-items";
export type CartCurrency = "ETH" | "USDC";

export interface CartItem {
  id: string;
  entityId?: string;
  collectionId?: string;
  nftId?: number;
  orderId?: number | null;
  tokenAddress?: string;
  ownerWallet?: string;
  ownerId?: string;
  name: string;
  description: string;
  price: number;
  image: any;
  quantity: number;
  currency?: CartCurrency;
  usdPrice?: number;
  isEth: boolean;
  isUsdc: boolean;
  hasDiscount?: boolean;
  originalPrice?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  mergeItems: (items: Array<Omit<CartItem, "quantity"> | CartItem>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

const normalizeItem = (item: Omit<CartItem, "quantity"> | CartItem): CartItem => {
  const quantity = 1;
  const currency = item.currency || (item.isUsdc ? "USDC" : "ETH");

  return {
    ...item,
    quantity,
    currency,
    isEth: currency === "ETH",
    isUsdc: currency === "USDC",
  };
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedItems = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!savedItems) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsedItems = JSON.parse(savedItems);

      if (!Array.isArray(parsedItems)) {
        setIsHydrated(true);
        return;
      }

      setItems(parsedItems.map(normalizeItem));
    } catch (error) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [isHydrated, items]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setItems((prevItems) => {
      const normalizedItem = normalizeItem(item);
      const existingItem = prevItems.find((i) => i.id === normalizedItem.id);

      if (existingItem) {
        return prevItems;
      }

      return [...prevItems, normalizedItem];
    });
  };

  const mergeItems = (nextItems: Array<Omit<CartItem, "quantity"> | CartItem>) => {
    setItems((prevItems) => {
      const itemsMap = new Map<string, CartItem>();

      prevItems.forEach((item) => {
        itemsMap.set(item.id, normalizeItem(item));
      });

      nextItems.forEach((item) => {
        const normalizedItem = normalizeItem(item);

        itemsMap.set(normalizedItem.id, normalizedItem);
      });

      return Array.from(itemsMap.values());
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: 1 } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        mergeItems,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
