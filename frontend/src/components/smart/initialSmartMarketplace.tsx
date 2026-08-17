/* eslint-disable */
import { ethers, Contract } from "ethers";
import { number_to_bigNumber } from "./initialSmartMain";
import { abiMarket } from "./abi";

export const addressPool = '0xd88Bf310CB04d9415C5Ad689d3d07b2CcD582525';
export const addressNft = '0xaC5cf2161f0914f3d2DCcB3c8B83fbdA48126576';
export const ETH_DECIMALS = 18;
export const USDC_DECIMALS = 6;

const getMainContract = (): any => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()

    const contractPool = new Contract(addressPool, abiMarket, provider);
    const daiContractWithSignerPool = contractPool.connect(signer);

    return { contractPool, daiContractWithSignerPool }
}

export async function addCollection(adr: string, fee: number, creator: string, creatorFee: number): Promise<boolean> {
    try {
        const { daiContractWithSignerPool } = getMainContract()

        const feeBigInt = number_to_bigNumber(fee, 1)
        const creatorFeeBigInt = number_to_bigNumber(creatorFee, 1)

        await daiContractWithSignerPool.add_collection(adr, feeBigInt, creator, creatorFeeBigInt);

        return true
    } catch (err) {
        console.info('err in transaction', err);

        return false
    }
}

export async function changeFee(adr: string, fee: number): Promise<boolean> {
    try {
        const feeBigInt = number_to_bigNumber(fee, 1)

        const { daiContractWithSignerPool } = getMainContract()

        await daiContractWithSignerPool.change_fee(adr, feeBigInt);

        return true
    } catch (err) {
        console.info('err in transaction', err);

        return false
    }
}

export async function changeCreatorFee(adr: string, fee: number): Promise<boolean> {
    try {
        const feeBigInt = number_to_bigNumber(fee, 1)

        const { daiContractWithSignerPool } = getMainContract()

        await daiContractWithSignerPool.change_creator_fee(adr, feeBigInt);

        return true
    } catch (err) {

        return false
    }
}

export async function changeCreator(adr: string, creator: string): Promise<boolean> {
    try {
        const { daiContractWithSignerPool } = getMainContract()

        await daiContractWithSignerPool.creator(adr, creator);

        return true
    } catch (err) {
        console.info('err in transaction', err);

        return false
    }
}

export async function deleteCollectionSmart(adr: string): Promise<boolean> {
    try {
        const { daiContractWithSignerPool } = getMainContract()

        await daiContractWithSignerPool.delete_collection(adr);

        return true
    } catch (err) {
        console.info('err in transaction', err);

        return false
    }
}