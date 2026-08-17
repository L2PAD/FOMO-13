import { useState, useEffect } from "react";
import authByWallet from "../http/auth/authByWallet";
import { IUser } from "../types/global_types";

export function useConnectWallet() {
  const [accounts, setAccounts] = useState<string[]>([]);

  const connectWallet = async (): Promise<{
    isSuccess: boolean;
    user: IUser | null;
  }> => {
    try {
      if (!window?.ethereum) {
        alert("Please install MetaMask!");
        return { isSuccess: false, user: null };
      }

      const ethereum = window.ethereum as any;

      const connectedAccounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = connectedAccounts?.[0]?.toLowerCase();
      if (!address) {
        return { isSuccess: false, user: null };
      }

      setAccounts([address]);

      if (!ethereum._hasListeners) {
        ethereum.on("accountsChanged", (newAccounts: string[]) => {
          setAccounts(newAccounts.map((a) => a.toLowerCase()));
        });

        ethereum.on("chainChanged", () => {
          window.location.reload();
        });

        ethereum._hasListeners = true;
      }

      const authData = await authByWallet(address);

      return {
        isSuccess: !!authData?.token,
        user: authData?.user || null,
      };
    } catch (error) {
      console.error("connectWallet error:", error);
      return { isSuccess: false, user: null };
    }
  };

  const checkWalletConnect = async (): Promise<void> => {
    try {
      if (!window?.ethereum) return;

      const ethereum = window.ethereum as any;

      const isFomoAuth = Boolean(localStorage.getItem("fomo-token"));
      const connectedAccounts: string[] = await ethereum.request({
        method: "eth_accounts",
      });

      const address = connectedAccounts?.[0]?.toLowerCase();

      if (address && isFomoAuth) {
        setAccounts([address]);
      }

      if (address) {
        const authData = await authByWallet(address);
      }
      
      if (!ethereum._hasListeners) {
        ethereum.on("accountsChanged", (newAccounts: string[]) => {
          setAccounts(newAccounts.map((a) => a.toLowerCase()));
        });

        ethereum.on("chainChanged", () => {
          window.location.reload();
        });

        ethereum._hasListeners = true;
      }
    } catch (error) {
      console.error("checkWalletConnect error:", error);
    }
  };

  useEffect(() => {
    checkWalletConnect();
  }, []);

  return { accounts, connectWallet };
}
