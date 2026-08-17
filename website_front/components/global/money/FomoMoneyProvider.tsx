import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../Layout";
import { getMoneyBalance, MoneyBalance } from "../../../http/money";
import MoneyDepositModal from "./MoneyDepositModal";
import MoneyWithdrawModal from "./MoneyWithdrawModal";
import MoneyTransactionsModal from "./MoneyTransactionsModal";
import MembershipCheckoutModal from "./MembershipCheckoutModal";

/** Product passed to the checkout flow (kept UI-only; backend snapshots price). */
export interface CheckoutProduct {
  productCode: string;
  planCode?: string;
  name: string;
  priceUsd: number;
  durationDays: number;
  aiCredits: number | null;
}

interface FomoMoneyContextType {
  balance: MoneyBalance;
  loading: boolean;
  refetch: () => Promise<void>;
  openDeposit: () => void;
  openWithdraw: () => void;
  openTransactions: () => void;
  openCheckout: (product: CheckoutProduct) => void;
}

const DEFAULT_BALANCE: MoneyBalance = { asset: "USDC", network: "ZKSYNC", available: 0, reserved: 0, total: 0 };

export const FomoMoneyContext = createContext<FomoMoneyContextType>({
  balance: DEFAULT_BALANCE,
  loading: false,
  refetch: async () => {},
  openDeposit: () => {},
  openWithdraw: () => {},
  openTransactions: () => {},
  openCheckout: () => {},
});

export const useFomoMoney = () => useContext(FomoMoneyContext);

const FomoMoneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);
  const isAuth = !!auth?.isAuth;

  const [balance, setBalance] = useState<MoneyBalance>(DEFAULT_BALANCE);
  const [loading, setLoading] = useState<boolean>(false);

  const [isDeposit, setIsDeposit] = useState(false);
  const [isWithdraw, setIsWithdraw] = useState(false);
  const [isTransactions, setIsTransactions] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<CheckoutProduct | null>(null);

  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const refetch = useCallback(async () => {
    if (!isAuth) { setBalance(DEFAULT_BALANCE); return; }
    setLoading(true);
    const b = await getMoneyBalance("USDC");
    if (mounted.current) { setBalance(b); setLoading(false); }
  }, [isAuth]);

  useEffect(() => { refetch(); }, [refetch]);

  const openDeposit = useCallback(() => setIsDeposit(true), []);
  const openWithdraw = useCallback(() => setIsWithdraw(true), []);
  const openTransactions = useCallback(() => setIsTransactions(true), []);
  const openCheckout = useCallback((product: CheckoutProduct) => setCheckoutProduct(product), []);

  return (
    <FomoMoneyContext.Provider
      value={{ balance, loading, refetch, openDeposit, openWithdraw, openTransactions, openCheckout }}
    >
      {children}

      <MoneyDepositModal
        isVisible={isDeposit}
        onClose={() => setIsDeposit(false)}
        onCredited={refetch}
      />
      <MoneyWithdrawModal
        isVisible={isWithdraw}
        balance={balance}
        onClose={() => setIsWithdraw(false)}
        onRequested={refetch}
      />
      <MoneyTransactionsModal
        isVisible={isTransactions}
        onClose={() => setIsTransactions(false)}
        onChanged={refetch}
      />
      <MembershipCheckoutModal
        product={checkoutProduct}
        balance={balance}
        onClose={() => setCheckoutProduct(null)}
        onDepositRequest={() => { setCheckoutProduct(null); setTimeout(() => setIsDeposit(true), 180); }}
        onSettled={refetch}
      />
    </FomoMoneyContext.Provider>
  );
};

export default FomoMoneyProvider;
