import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';

/*
 * Global CRM wallet connection (ONE place for the whole admin panel).
 *
 * The operator connects a wallet once; every on-chain feature across the CRM
 * (FOMO Custody owner settlement, OTC/P2P, launchpad, any future contract)
 * reads the same connection from this context and signs in the operator's own
 * wallet. No private keys are ever stored on the server.
 *
 * ethers v5 (CRM ships ethers ^5.7.2) + injected provider (MetaMask).
 */

export interface WalletContextValue {
  address: string; // lowercase, '' when not connected
  chainId: number; // 0 when unknown
  connecting: boolean;
  isConnected: boolean;
  hasProvider: boolean; // window.ethereum present
  connect: (opts?: { chainIdHex?: string; addParam?: any }) => Promise<{ address: string; chainId: number }>;
  disconnect: () => void;
  ensureChain: (chainIdHex: string, addParam?: any) => Promise<void>;
  getProvider: () => ethers.providers.Web3Provider;
  getSigner: () => ethers.providers.JsonRpcSigner;
  getContract: (address: string, abi: any) => ethers.Contract;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const useWallet = (): WalletContextValue => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>');
  return ctx;
};

const getEth = (): any => {
  const eth = (window as any)?.ethereum;
  if (!eth) throw new Error('Кошелёк не найден. Установите MetaMask (или совместимый) и обновите страницу.');
  return eth;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [connecting, setConnecting] = useState<boolean>(false);
  const hasProvider = typeof window !== 'undefined' && !!(window as any).ethereum;

  // Restore an already-authorised connection silently + listen for changes.
  useEffect(() => {
    const eth = (window as any)?.ethereum;
    if (!eth) return;
    (async () => {
      try {
        const accts: string[] = await eth.request({ method: 'eth_accounts' });
        if (accts && accts[0]) setAddress(String(accts[0]).toLowerCase());
        const cid = await eth.request({ method: 'eth_chainId' });
        if (cid) setChainId(parseInt(cid, 16));
      } catch { /* noop */ }
    })();
    const onAccounts = (a: string[]) => setAddress((a && a[0] ? String(a[0]) : '').toLowerCase());
    const onChain = (c: string) => { try { setChainId(parseInt(c, 16)); } catch { /* noop */ } };
    eth.on?.('accountsChanged', onAccounts);
    eth.on?.('chainChanged', onChain);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, []);

  const ensureChain = useCallback(async (chainIdHex: string, addParam?: any) => {
    const eth = getEth();
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
    } catch (e: any) {
      if (e?.code === 4902 && addParam) {
        await eth.request({ method: 'wallet_addEthereumChain', params: [addParam] });
      } else if (e?.code !== 4902) {
        throw e;
      }
    }
  }, []);

  const connect = useCallback(async (opts?: { chainIdHex?: string; addParam?: any }) => {
    setConnecting(true);
    try {
      const eth = getEth();
      await eth.request({ method: 'eth_requestAccounts' });
      if (opts?.chainIdHex) await ensureChain(opts.chainIdHex, opts.addParam);
      const provider = new ethers.providers.Web3Provider(eth, 'any');
      const signer = provider.getSigner();
      const addr = (await signer.getAddress()).toLowerCase();
      const net = await provider.getNetwork();
      setAddress(addr);
      setChainId(Number(net.chainId));
      return { address: addr, chainId: Number(net.chainId) };
    } finally {
      setConnecting(false);
    }
  }, [ensureChain]);

  // Injected wallets cannot be force-disconnected programmatically; we clear
  // local state so the CRM treats the session as disconnected.
  const disconnect = useCallback(() => { setAddress(''); }, []);

  const getProvider = useCallback(() => new ethers.providers.Web3Provider(getEth(), 'any'), []);
  const getSigner = useCallback(() => new ethers.providers.Web3Provider(getEth(), 'any').getSigner(), []);
  const getContract = useCallback((addr: string, abi: any) => {
    const provider = new ethers.providers.Web3Provider(getEth(), 'any');
    return new ethers.Contract(addr, abi, provider.getSigner());
  }, []);

  const value = useMemo<WalletContextValue>(() => ({
    address, chainId, connecting, isConnected: !!address, hasProvider,
    connect, disconnect, ensureChain, getProvider, getSigner, getContract,
  }), [address, chainId, connecting, hasProvider, connect, disconnect, ensureChain, getProvider, getSigner, getContract]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
