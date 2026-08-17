import { ethers } from 'ethers';

const USDC_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

export class WalletService {
    private provider: ethers.providers.Web3Provider | null = null;
    private signer: ethers.Signer | null = null;
    private usdcContract: ethers.Contract | null = null;

    private readonly USDC_CONTRACT_ADDRESS = '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4';

    private async initialize(): Promise<void> {
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed!');
        }

        if (!this.provider) {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();

            this.usdcContract = new ethers.Contract(
                this.USDC_CONTRACT_ADDRESS,
                USDC_ABI,
                this.provider
            );
        }
    }

    getEthBalance = async (address?: string): Promise<string> => {
        try {
            await this.initialize();

            let walletAddress: string;

            if (address) {
                walletAddress = address;
            } else {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });

                if (accounts.length === 0) {
                    throw new Error('Connect wallet error!');
                }

                walletAddress = accounts[0];
            }

            const balanceWei = await this.provider!.getBalance(walletAddress);
            const balanceEth = ethers.utils.formatEther(balanceWei);

            return balanceEth;

        } catch (error) {
            console.error('ETH Balance error:', error);
            throw error;
        }
    }

    getUsdcBalance = async (address?: string): Promise<string> => {
        try {
            await this.initialize();

            let walletAddress: string;

            if (address) {
                walletAddress = address;
            } else {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });

                if (accounts.length === 0) {
                    throw new Error('Connect wallet error!');
                }

                walletAddress = accounts[0];
            }

            const balance = await this.usdcContract!.balanceOf(walletAddress);
            const decimals = await this.usdcContract!.decimals();
            const formattedBalance = ethers.utils.formatUnits(balance, decimals);

            return formattedBalance;

        } catch (error) {
            console.error('USDC Balance error:', error);
            throw error;
        }
    }

    getWalletAddress = async (): Promise<string> => {
        try {
            await this.initialize();

            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (accounts.length === 0) {
                throw new Error('No wallet connected');
            }

            return accounts[0];
        } catch (error) {
            console.error('Get wallet address error:', error);
            throw error;
        }
    }

    connectWallet = async (): Promise<string> => {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed!');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.provider = null;
            await this.initialize();

            return accounts[0];
        } catch (error) {
            console.error('Connect wallet error:', error);
            throw error;
        }
    }

    getNetwork = async (): Promise<string> => {
        try {
            await this.initialize();

            const network = await this.provider!.getNetwork();
            return network.name;
        } catch (error) {
            console.error('Get network error:', error);
            throw error;
        }
    }
}