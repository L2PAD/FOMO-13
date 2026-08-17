import { useWallet } from '../wallet/WalletProvider';

declare global {
  interface Window {
    ethereum?: any;
  }
}

/*
 * Legacy hook kept for API-compatibility, now backed by the SINGLE global
 * CRM wallet connection (WalletProvider / useWallet). Every on-chain feature
 * across the CRM (OTC/P2P, launchpad, acquiring) shares this one connection —
 * the operator connects once (enforced by AdminWalletGate) and never again.
 */
export function useConnectWallet() {
  const { address, connect } = useWallet();

  const connectWallet = async (): Promise<boolean> => {
    try {
      const r = await connect();
      return !!r.address;
    } catch (error: any) {
      alert(error?.message || 'Please install MetaMask!');
      return false;
    }
  };

  return { accounts: [address], connectWallet };
}
