import { Withdraw } from "../../../../../http/deals/withdrawActions";
import { UserDealsBalance } from "../../../../global/DealsBalanceComponent";
import { Currency, Network } from "../DepositModal";

export type WithdrawStep = 1 | 2 | 3;
export type WithdrawStatus = "pending" | "confirmed" | "rejected" | "cancelled" | null;

export interface WithdrawModalProps {
    balance: UserDealsBalance
    isVisible: boolean;
    onClose: () => void;
}

export interface Step1ContentProps {
    amount: number
    selectedCurrency: Currency;
    selectedNetwork: Network;
    withdrawAddress: string;
    addressError: string;
    currencies: Currency[];
    networks: Network[];
    setSelectedCurrency: (currency: Currency) => void;
    setSelectedNetwork: (network: Network) => void;
    setWithdrawAddress: (address: string) => void;
    setAddressError: (error: string) => void;
    handleContinue: () => void;
    onAmountChange: (value: number) => void
}

export interface Step2ContentProps {
    amount: number
    withdrawAddress: string
    selectedNetwork: Network;
    selectedCurrency: Currency;
    handleRequestWithdrawal: () => void;
}

export interface Step3ContentProps {
    withdrawStatus: WithdrawStatus;
    showTransactionDetails: boolean;
    setShowTransactionDetails:any
    timeLeft: number;
    selectedCurrency: Currency;
    selectedNetwork: Network;
    withdrawAddress: string;
    setIsMinimized: any
    activeWithdraw: Withdraw | null
    confirmWithdraw: () => Promise<void>;
    onClose: () => void;
    setStep: (step: WithdrawStep) => void;
    handleCancelRequest: () => void;
    formatTime: (seconds: number) => string;
}

export interface MinimizedBarProps {
    withdrawStatus: WithdrawStatus;
    timeLeft: number;
    formatTime: (seconds: number) => string;
    handleMinimize: () => void;
}