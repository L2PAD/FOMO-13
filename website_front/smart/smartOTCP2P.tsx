import { ethers } from "ethers";
import { Contract, BigNumber, ContractTransaction, providers, Signer } from "ethers";
import { Interface } from "ethers/lib/utils";
import { abiOtcP2p } from "./abi";
import {
    ZKSYNC_CHAIN_ID,
    ZKSYNC_CHAIN_ID_HEX,
    ZKSYNC_ADD_ETHEREUM_CHAIN_PARAMETER,
} from "../config/zksync";

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address account) external view returns (uint256)"
];

const usdTokenAddress = '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4'

export enum Currency {
    ETH = 0,
    USD = 1
}

export enum Mode {
    DIRECT = 0,
    ESCROW = 1
}

export interface Item {
    id: BigNumber;
    endTime: number;
    price: BigNumber;
    seller: string;
    buyer: string;
    available: boolean;
    banked: boolean;
    completed: boolean;
    currency: Currency;
    mode: Mode;
    tokenForSale: string;
    tokenAmount: BigNumber;
    bankedAmount: BigNumber;
}

export interface TransactionResult {
    ok: boolean;
    txHash?: string;
    error?: string;
}

function bigNumberToNumber(bign: BigNumber, decimals: number): string {
    return ethers.utils.formatUnits(bign, decimals);
}

function numberToBigNumber(value: number | string, decimals: number): BigNumber {
    const valueStr = parseFloat(value.toString()).toFixed(decimals);
    const [integer, fraction = ''] = valueStr.split('.');
    const fullNumber = integer + fraction.padEnd(decimals, '0');
    return BigNumber.from(fullNumber);
}

export function parseTransactionEvents(receipt: any) {
    const contractInterface = new Interface(abiOtcP2p);

    const result = {
        ourEvents: [] as any[],
        externalEvents: [] as any[],
        itemCreated: null as any,
        id: null as number | null
    };

    (receipt.logs || []).forEach((log: Log) => {
        const isOurContract = log?.address?.toLowerCase() === addressOtc.toLowerCase();

        if (isOurContract) {
            try {
                const parsed = contractInterface.parseLog(log);
                result.ourEvents.push(parsed);
                if (parsed.name === "ItemCreated") {
                    result.itemCreated = parsed;
                    result.id = Number(bigNumberToNumber(parsed.args.id, 0))
                }
            } catch (error) {
                console.warn(`Failed to parse our contract log: ${JSON.stringify(error) || ''}`);
            }
        } else {
            result.externalEvents.push({
                address: log.address,
                topics: log.topics,
                data: log.data
            });
        }
    });

    return result;
}

function toWei(ethAmount: string): BigNumber {
    return ethers.utils.parseEther(ethAmount);
}

function toUnits(amount: string, decimals: number): BigNumber {
    return ethers.utils.parseUnits(amount, decimals);
}

const getCurrencyValue = (currenyId: number): number => {
    return currenyId === 0 ? 18 : 6
}

const addressOtc = '0xc6b848CA645603521C81D439aC0C856dbDAaeD2F';

/**
 * Convert raw wallet / RPC errors into a short, human-readable message.
 * Prevents the UI from swallowing the real cause behind a generic string.
 */
function normalizeWeb3Error(err: any): string {
    const code = err?.code ?? err?.error?.code ?? err?.data?.originalError?.code;
    const raw = (
        err?.reason ||
        err?.data?.message ||
        err?.error?.message ||
        err?.info?.error?.message ||
        err?.message ||
        ""
    ).toString();

    if (code === 4001 || code === "ACTION_REJECTED" || /user rejected|user denied|rejected the request/i.test(raw)) {
        return "Transaction rejected in your wallet.";
    }
    if (code === 4902) {
        return "zkSync Era network is not added to your wallet. Please add it and retry.";
    }
    if (/insufficient funds/i.test(raw)) {
        return "Not enough ETH on zkSync Era to pay for gas. Top up a small amount of ETH and retry.";
    }
    if (/transfer amount exceeds balance|insufficient balance|erc20/i.test(raw)) {
        return "Insufficient USDC balance for this deposit.";
    }
    if (/underlying network changed|network changed/i.test(raw)) {
        return "Wallet network changed during the request. Please make sure you stay on zkSync Era and retry.";
    }
    return raw || "Unknown wallet error. Please retry.";
}

/**
 * Ensure the injected wallet is connected to zkSync Era (chainId 324).
 * Attempts an automatic switch (and add-chain fallback) when it is not.
 */
async function ensureZkSyncNetwork(eth: any): Promise<void> {
    const currentHex: string = await eth.request({ method: "eth_chainId" });
    if (typeof currentHex === "string" && parseInt(currentHex, 16) === ZKSYNC_CHAIN_ID) {
        return;
    }
    try {
        await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ZKSYNC_CHAIN_ID_HEX }],
        });
    } catch (error: any) {
        const shouldAddChain =
            error?.code === 4902 || error?.data?.originalError?.code === 4902;
        if (!shouldAddChain) {
            throw error;
        }
        await eth.request({
            method: "wallet_addEthereumChain",
            params: [ZKSYNC_ADD_ETHEREUM_CHAIN_PARAMETER],
        });
    }
}


const getContract = () => {
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const signer = provider.getSigner();

    const contract_OTC: Contract = new Contract(addressOtc, abiOtcP2p, provider);
    const contract_dial: Contract = contract_OTC.connect(signer);

    return { contract_dial, contract_OTC, provider, signer };
}

interface CreateItemParams {
    endTime: number;
    price: number;
    currency: Currency;
    mode: Mode;
    tokenForSale?: string;
    tokenAmount?: number;
    whitelist?: string;
    decimals?: number
    isSponsored?: boolean;
}

interface Log {
    topics: string[];
    data: string;
    address?: string;
}

async function createDealSmartContract(params: CreateItemParams): Promise<{ success: boolean; id: number | null }> {
    try {
        const { contract_dial, provider } = getContract();

        let hash;

        if (params.isSponsored) {
            hash = await contract_dial.createSponsoredItem(
                params.endTime,
                numberToBigNumber(params.price, getCurrencyValue(params.currency)),
                params.currency,
                params.mode,
                params.whitelist || '0x0000000000000000000000000000000000000000',
                params.tokenForSale || '0x0000000000000000000000000000000000000000',
                params.tokenAmount ? numberToBigNumber(params.tokenAmount, params.decimals || 18) : 0
            );
        } else {
            hash = await contract_dial.createItem(
                params.endTime,
                numberToBigNumber(params.price, getCurrencyValue(params.currency)),
                params.currency,
                params.mode,
                params.whitelist || '0x0000000000000000000000000000000000000000',
                params.tokenForSale || '0x0000000000000000000000000000000000000000',
                params.tokenAmount ? numberToBigNumber(params.tokenAmount, params.decimals || 18) : 0
            );
        }

        const receipt = await provider.waitForTransaction(hash.hash);
        const { id } = parseTransactionEvents(receipt)

        if (!id) {
            return { success: false, id: null };
        }

        return { success: true, id: id };
    } catch (err: any) {
        console.info("err in transaction", err.message);
        return { success: false, id: null };
    }
}

async function approveTokensForOTC(
    tokenAddress: string,
    tokenAmount: number | string,
    tokenDecimals?: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        const { signer } = getContract();
        const userAddress = await signer.getAddress();

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

        let decimals = tokenDecimals;
        if (!decimals) {
            decimals = await tokenContract.decimals();
        }

        const amountInWei = numberToBigNumber(tokenAmount, decimals || 0);

        const currentAllowance = await tokenContract.allowance(userAddress, addressOtc);

        if (currentAllowance.gte(amountInWei)) {
            return { success: true };
        }

        const approveTx = await tokenContract.approve(addressOtc, amountInWei);

        const receipt = await approveTx.wait();

        const newAllowance = await tokenContract.allowance(userAddress, addressOtc);

        return {
            success: true,
            txHash: receipt.transactionHash
        };

    } catch (error: any) {
        console.error('Approve failed:', error);
        return {
            success: false,
            error: error.message || 'Unknown error during approval'
        };
    }
}

async function createDealWithApproval(params: CreateItemParams): Promise<{ success: boolean; id: number | null }> {
    try {
        const isRealAsset: boolean = !!params.tokenForSale && !!params.tokenAmount && !!(params.tokenAmount > 0)

        if (isRealAsset) {
            const approveResult = await approveTokensForOTC(
                params.tokenForSale || '',
                params.tokenAmount || 0
            );

            if (!approveResult.success) {
                console.error('Token approval failed');
                return { success: false, id: null };
            }
        }

        const createResult = await createDealSmartContract({
            endTime: params.endTime,
            price: params.price,
            currency: params.currency,
            mode: params.mode,
            tokenForSale: params.tokenForSale,
            tokenAmount: params.tokenAmount,
            whitelist: params.whitelist,
            isSponsored: params.isSponsored
        });

        return createResult;

    } catch (error: any) {
        console.error('Create deal with approval failed:', error);
        return { success: false, id: null };
    }
}

async function getItem(id: number): Promise<Item> {
    const { contract_OTC } = getContract();
    return await contract_OTC.getItem(id);
}

async function getEthBalance(address: string): Promise<number> {
    const { contract_OTC } = getContract();
    const value: BigNumber = await contract_OTC.ethBalance(address)

    return Number(bigNumberToNumber(value, 18))
}

async function getUsdBalance(address: string): Promise<number> {
    const { contract_OTC } = getContract();
    const value: BigNumber = await contract_OTC.usdBalance(address)

    return Number(bigNumberToNumber(value, 6))
}

async function getUserTotalBalance(address: string): Promise<{ eth: number, usdc: number, isBalance: boolean }> {
    const eth: number = await getEthBalance(address)
    const usdc: number = await getUsdBalance(address)

    return { eth, usdc, isBalance: (eth > 0 || usdc > 0) }
}

async function depositETH(amountEthStr: string): Promise<TransactionResult> {
    try {
        const { contract_dial } = getContract();
        const tx: ContractTransaction = await contract_dial.depositETH({ value: toWei(amountEthStr) });
        return { ok: true, txHash: tx.hash };
    } catch (err: any) {
        return { ok: false, error: err.message };
    }
}

async function depositUSD(amountStr: string, usdDecimals: number = 6): Promise<TransactionResult> {
    try {
        const eth = (window as any).ethereum;
        if (!eth) {
            return { ok: false, error: "No wallet detected. Please install or unlock MetaMask, then reconnect." };
        }

        // 1) Make sure the wallet is actually connected / unlocked.
        let accounts: string[] = [];
        try {
            accounts = await eth.request({ method: "eth_requestAccounts" });
        } catch (e: any) {
            return { ok: false, error: normalizeWeb3Error(e) };
        }
        if (!accounts || accounts.length === 0) {
            return { ok: false, error: "Wallet is locked or not connected. Unlock MetaMask and try again." };
        }

        // 2) Make sure the wallet is on zkSync Era (chainId 324). Try to switch automatically.
        try {
            await ensureZkSyncNetwork(eth);
        } catch (e: any) {
            return { ok: false, error: normalizeWeb3Error(e) };
        }

        // 3) Build a fresh provider/signer AFTER the network is confirmed ("any" avoids
        //    the ethers v5 "underlying network changed" throw right after a switch).
        const provider = new ethers.providers.Web3Provider(eth, "any");
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();

        const amount: BigNumber = toUnits(amountStr, usdDecimals);

        // 4) Verify the USDC contract actually exists on the active chain. If code is
        //    empty, the user is almost certainly on the wrong network.
        const tokenCode = await provider.getCode(usdTokenAddress);
        if (!tokenCode || tokenCode === "0x") {
            return { ok: false, error: "USDC contract not found on the active network. Please switch your wallet to zkSync Era and retry." };
        }

        const erc20 = new ethers.Contract(usdTokenAddress, ERC20_ABI, signer);

        // 5) Balance guard — gives a precise message instead of a silent gas-estimation revert.
        const bal: BigNumber = await erc20.balanceOf(userAddress);
        if (bal.lt(amount)) {
            return {
                ok: false,
                error: `Insufficient USDC balance. You have ${ethers.utils.formatUnits(bal, usdDecimals)} USDC but tried to deposit ${amountStr} USDC.`,
            };
        }

        // 6) Approve only when the current allowance is not enough.
        const allowance: BigNumber = await erc20.allowance(userAddress, addressOtc);
        if (allowance.lt(amount)) {
            const approveTx = await erc20.approve(addressOtc, amount);
            await approveTx.wait();
        }

        // 7) Deposit into the OTC/treasury contract.
        const contract: Contract = new Contract(addressOtc, abiOtcP2p, signer);
        const tx: ContractTransaction = await contract.depositUSD(amount);

        return { ok: true, txHash: tx.hash };
    } catch (err: any) {
        return { ok: false, error: normalizeWeb3Error(err) };
    }
}

async function withdrawETH(amountEthStr: number): Promise<TransactionResult> {
    try {
        const { contract_dial } = getContract();
        const tx: ContractTransaction = await contract_dial.withdrawETH(toWei(String(amountEthStr)));
        return { ok: true, txHash: tx.hash };
    } catch (err: any) {
        return { ok: false, error: err.message };
    }
}

async function withdrawUSD(amountStr: number, usdDecimals: number = 6): Promise<TransactionResult> {
    try {
        const { contract_dial } = getContract();
        const tx: ContractTransaction = await contract_dial.withdrawUSD(toUnits(String(amountStr), usdDecimals));
        return { ok: true, txHash: tx.hash };
    } catch (err: any) {
        return { ok: false, error: err.message };
    }
}

// ========================
// DIRECT покупка
// ========================

interface PurchaseDirectETHParams {
    useInternal?: boolean;
    price?: number;
}

/**
 * DIRECT + ETH
 */
async function purchaseDirectETH(id: number, params: PurchaseDirectETHParams = {}): Promise<TransactionResult> {
    try {
        const { contract_dial } = getContract();
        const { useInternal = true, price = null } = params;
        const overrides = useInternal ? {} : { value: numberToBigNumber(Number(price), 18) };

        const tx: ContractTransaction = await contract_dial.purchaseDirectETH(id, useInternal, overrides);
        const rc = await tx.wait();
        return { ok: true, txHash: rc.transactionHash };
    } catch (err: any) {
        return { ok: false, error: err.message };
    }
}

interface PurchaseDirectUSDParams {
    useInternal?: boolean;
    usdTokenAddress?: string;
    price?: number | null;
}

/**
 * DIRECT + USD
 */
async function approveUSDC(value: number): Promise<{ ok: boolean }> {
    try {
        const { signer } = getContract();
        const erc20 = new ethers.Contract(
            usdTokenAddress,
            [
                "function approve(address,uint256) returns(bool)",
            ],
            signer
        );

        const amount = numberToBigNumber(value, 6);

        await erc20.approve(addressOtc, amount);
        console.log("Approve successful for amount:", amount.toString());

        return { ok: true };
    } catch (error: any) {
        console.error("Approve error:", error.message);
        return { ok: false };
    }
}

async function purchaseDirectUSD(id: number, params: PurchaseDirectUSDParams = {}): Promise<TransactionResult> {
    try {
        const { contract_dial, signer } = getContract();
        const { useInternal = true } = params;
        const tx: ContractTransaction = await contract_dial.purchaseDirectUSD(id, useInternal);
        const rc = await tx.wait();
        return { ok: true, txHash: rc.transactionHash };
    } catch (err: any) {
        return { ok: false, error: err.message };
    }
}

// ========================
// ESCROW: внесение и завершение
// ========================

interface SafeMoneyParams {
    useInternal: boolean;
    price: number;
}

/**
 * ESCROW + ETH: внесение
 */
async function safeMoneyETH(id: number, params: SafeMoneyParams): Promise<TransactionResult> {
    try {
        const { contract_dial } = getContract();
        const { useInternal, price } = params;
        const overrides = useInternal ? {} : { value: numberToBigNumber(price, 18) };
        const tx: ContractTransaction = await contract_dial.safeMoneyETH(id, useInternal, overrides);
        const rc = await tx.wait();
        return { ok: true, txHash: rc.transactionHash };
    } catch (err: any) {
        return { ok: false, error: err.message };
    }
}

interface SafeMoneyUSDParams {
    useInternal: boolean;
    price: number
}

/**
 * ESCROW + USD: внесение
 */
async function safeMoneyUSD(id: number, params: SafeMoneyUSDParams): Promise<TransactionResult> {
    try {
        const eth = (window as any).ethereum;
        if (!eth) {
            return { ok: false, error: "No wallet detected. Please install or unlock MetaMask, then reconnect." };
        }

        // 1) Make sure the wallet is actually connected / unlocked.
        let accounts: string[] = [];
        try {
            accounts = await eth.request({ method: "eth_requestAccounts" });
        } catch (e: any) {
            return { ok: false, error: normalizeWeb3Error(e) };
        }
        if (!accounts || accounts.length === 0) {
            return { ok: false, error: "Wallet is locked or not connected. Unlock MetaMask and try again." };
        }

        // 2) Ensure the wallet is on zkSync Era (chainId 324) — auto-switch.
        try {
            await ensureZkSyncNetwork(eth);
        } catch (e: any) {
            return { ok: false, error: normalizeWeb3Error(e) };
        }

        // 3) Fresh provider/signer AFTER the network is confirmed.
        const provider = new ethers.providers.Web3Provider(eth, "any");
        const signer = provider.getSigner();
        const { useInternal } = params;

        // 4) safeMoneyUSD(itemId, useInternal=true) locks the buyer's internal
        //    on-chain usdBalance into escrow (usdBalance[buyer] -= price). This is
        //    what reduces the spendable on-chain balance so a later withdrawUSD()
        //    can NOT pull already-committed funds (closes the double-spend gap).
        const contract: Contract = new Contract(addressOtc, abiOtcP2p, signer);
        const tx: ContractTransaction = await contract.safeMoneyUSD(id, useInternal);
        return { ok: true, txHash: tx.hash };
    } catch (err: any) {
        return { ok: false, error: normalizeWeb3Error(err) };
    }
}

async function completeDealETH(id: number): Promise<TransactionResult> {
    try {
        const { contract_dial } = getContract();

        const tx: ContractTransaction = await contract_dial.completeDealETH(id);
        const rc = await tx.wait();
        return { ok: true, txHash: rc.transactionHash };
    } catch (err: any) {
        return { ok: false, error: err.message };
    }
}

async function completeDealUSD(id: number): Promise<TransactionResult> {
    try {
        const { contract_dial } = getContract();
        const tx: ContractTransaction = await contract_dial.completeDealUSD(id);
        const rc = await tx.wait();

        return { ok: true, txHash: rc.transactionHash };
    } catch (err: any) {
        return { ok: false, error: err.message };
    }
}

async function getFeePermille(): Promise<number> {
    try {
        const { contract_dial } = getContract()

        const fee = await contract_dial.feePermille();
        return Number(bigNumberToNumber(fee, 0)) / 10;
    } catch (err) {
        console.info("err fee", err);
        return 0;
    }
}

/// @param refundToBuyer true — вернуть сумму покупателю на внутренний баланс; false — зачислить продавцу
/// @param takeFee       true — удержать комиссию в пользу feeAccount; false — без комиссии
// function adminResolveETH(uint256 id, bool refundToBuyer, bool takeFee)
// function adminResolveUSD(uint256 id, bool refundToBuyer, bool takeFee)

export {
    addressOtc,
    bigNumberToNumber,
    numberToBigNumber,
    toWei,
    toUnits,
    createDealWithApproval,
    getItem,
    getEthBalance,
    getUsdBalance,
    depositETH,
    depositUSD,
    withdrawETH,
    withdrawUSD,
    purchaseDirectETH,
    purchaseDirectUSD,
    safeMoneyETH,
    safeMoneyUSD,
    completeDealETH,
    completeDealUSD,
    approveUSDC,
    getUserTotalBalance,
    getFeePermille
};