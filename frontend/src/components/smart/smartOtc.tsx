/* eslint-disable */
import { ethers } from "ethers";
import { Contract } from "ethers";
import { bigNumber_to_number, number_to_bigNumber, numberToBigNumber } from "./initialSmartMain"
    ;
const addressDeals = '0xc6b848CA645603521C81D439aC0C856dbDAaeD2F';
const abiPool = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_usdToken",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "SafeERC20FailedOperation",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "DepositedETH",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "DepositedUSD",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum UnifiedMShopVault.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "useInternal",
                "type": "bool"
            }
        ],
        "name": "Invested",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint64",
                "name": "endTime",
                "type": "uint64"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum UnifiedMShopVault.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "enum UnifiedMShopVault.Mode",
                "name": "mode",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "tokenForSale",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "tokenAmount",
                "type": "uint256"
            }
        ],
        "name": "ItemCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "refundToBuyer",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "takeFee",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "enum UnifiedMShopVault.Currency",
                "name": "currency",
                "type": "uint8"
            }
        ],
        "name": "Resolved",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "fee",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum UnifiedMShopVault.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "escrow",
                "type": "bool"
            }
        ],
        "name": "Sold",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "WithdrawnETH",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "WithdrawnUSD",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "refundToBuyer",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "takeFee",
                "type": "bool"
            }
        ],
        "name": "adminResolveETH",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "refundToBuyer",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "takeFee",
                "type": "bool"
            }
        ],
        "name": "adminResolveUSD",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "completeDealETH",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "completeDealUSD",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "endTime",
                "type": "uint64"
            },
            {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "internalType": "enum UnifiedMShopVault.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "internalType": "enum UnifiedMShopVault.Mode",
                "name": "mode",
                "type": "uint8"
            },
            {
                "internalType": "address",
                "name": "whitelistBuyer",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "tokenForSale",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenAmount",
                "type": "uint256"
            }
        ],
        "name": "createItem",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "endTime",
                "type": "uint64"
            },
            {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "internalType": "enum UnifiedMShopVault.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "internalType": "enum UnifiedMShopVault.Mode",
                "name": "mode",
                "type": "uint8"
            },
            {
                "internalType": "address",
                "name": "whitelistBuyer",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "tokenForSale",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenAmount",
                "type": "uint256"
            }
        ],
        "name": "createSponsoredItem",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "depositETH",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "depositUSD",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "ethBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "feeAccount",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "feePermille",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "feeSponsored",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "getItem",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "endTime",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "seller",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "buyer",
                        "type": "address"
                    },
                    {
                        "internalType": "bool",
                        "name": "available",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "banked",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "completed",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "sponsored",
                        "type": "bool"
                    },
                    {
                        "internalType": "enum UnifiedMShopVault.Currency",
                        "name": "currency",
                        "type": "uint8"
                    },
                    {
                        "internalType": "enum UnifiedMShopVault.Mode",
                        "name": "mode",
                        "type": "uint8"
                    },
                    {
                        "internalType": "address",
                        "name": "tokenForSale",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "bankedAmount",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct UnifiedMShopVault.Item",
                "name": "out",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "items",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "endTime",
                "type": "uint64"
            },
            {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "available",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "banked",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "completed",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "sponsored",
                "type": "bool"
            },
            {
                "internalType": "enum UnifiedMShopVault.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "internalType": "enum UnifiedMShopVault.Mode",
                "name": "mode",
                "type": "uint8"
            },
            {
                "internalType": "address",
                "name": "tokenForSale",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "bankedAmount",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "lastId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "useInternal",
                "type": "bool"
            }
        ],
        "name": "purchaseDirectETH",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "useInternal",
                "type": "bool"
            }
        ],
        "name": "purchaseDirectUSD",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "useInternal",
                "type": "bool"
            }
        ],
        "name": "safeMoneyETH",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "useInternal",
                "type": "bool"
            }
        ],
        "name": "safeMoneyUSD",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "newFeeAccount",
                "type": "address"
            }
        ],
        "name": "setFeeAccount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "newFee",
                "type": "uint256"
            }
        ],
        "name": "setFeePermille",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "newFee",
                "type": "uint256"
            }
        ],
        "name": "setFeeSponsored",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newUsd",
                "type": "address"
            }
        ],
        "name": "setUsdToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "usdBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "usdToken",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdrawETH",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdrawUSD",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
]

const getMainSmart = (): { contractPool: any, daiContractWithSignerPool: any } => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()

    const contractPool = new Contract(addressDeals, abiPool, provider);
    const daiContractWithSignerPool = contractPool.connect(signer);

    return { contractPool, daiContractWithSignerPool }
}


export async function adminCompleteDealETH(itemId: number, returning: boolean, takeFee: boolean = false): Promise<{ isSuccess: boolean; txHash?: string }> {
    try {
        const { daiContractWithSignerPool } = getMainSmart()

        const tx = await daiContractWithSignerPool.adminResolveETH(itemId, returning, takeFee);

        return {
            isSuccess: true,
            txHash: tx?.hash,
        }
    } catch (err) {
        console.info('err in transaction', err);

        return {
            isSuccess: false,
        }
    }
}

export async function adminCompleteDealUSDC(itemId: number, returning: boolean, takeFee: boolean = false): Promise<{ isSuccess: boolean; txHash?: string }> {
    try {
        const { daiContractWithSignerPool } = getMainSmart()
        
        const tx = await daiContractWithSignerPool.adminResolveUSD(itemId, returning, takeFee);

        return {
            isSuccess: true,
            txHash: tx?.hash,
        }
    } catch (err) {
        console.info('err in transaction', err);

        return {
            isSuccess: false,
        }
    }
}
