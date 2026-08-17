import { ethers } from 'ethers';

/*
 * H5 — FOMO Custody owner settlement signing helpers (client-side, no keys).
 * Connection is managed globally by WalletProvider (useWallet). These helpers
 * just sign createItem / adminResolveUSD in the operator's connected wallet.
 * ethers v5 + injected provider (MetaMask).
 */

const getEthereum = (): any => {
  const eth = (window as any)?.ethereum;
  if (!eth) throw new Error('Кошелёк не найден. Подключите кошелёк в панели.');
  return eth;
};

function contractWithSigner(address: string, abi: string[]): ethers.Contract {
  const provider = new ethers.providers.Web3Provider(getEthereum(), 'any');
  return new ethers.Contract(address, abi, provider.getSigner());
}

/** Owner signs createItem(...) — args come verbatim from the backend prepare call. Returns txHash. */
export async function signCreateItem(contract: string, abi: string[], args: any[]): Promise<string> {
  const c = contractWithSigner(contract, abi);
  const tx = await c.createItem(...args);
  return tx.hash as string;
}

/** Owner signs adminResolveUSD(itemId, refundToBuyer, takeFee=false). Returns txHash. */
export async function signAdminResolve(contract: string, abi: string[], itemId: string, refundToBuyer: boolean): Promise<string> {
  const c = contractWithSigner(contract, abi);
  const tx = await c.adminResolveUSD(itemId, refundToBuyer, false);
  return tx.hash as string;
}

/** Owner withdraws platform funds (their internal USD balance) via withdrawUSD(amount). Returns txHash. */
export async function signWithdrawUSD(contract: string, abi: string[], amount: number, decimals = 6): Promise<string> {
  const c = contractWithSigner(contract, abi);
  const value = ethers.utils.parseUnits(String(amount), decimals);
  const tx = await c.withdrawUSD(value);
  return tx.hash as string;
}
