import React, { FC, useState, useEffect, useCallback, useContext, useRef } from "react";
import MainModal from "../../../../global/common/MainModal";
import { StepIndicator } from "./components/StepIndicator";
import { Step1PaymentDetails } from "./components/Step1PaymentDetails";
import { Step3Success } from "./components/Step3Success";
import { Step2Checkout } from "./components/Step2Checkout";
import MinimizedBar from "./components/MinimizedBar";
import { MetamaskIcon } from "../../../../global/Icons";
import * as S from "./styles";
import AllWalletsIcon from "../../../../global/Icons/Deals/AllWalletsIcon";
import PhantomIcon from "../../../../global/Icons/Deals/PhantomIcon";
import { addressOtc, depositETH, depositUSD, getEthBalance } from "../../../../../smart/smartOTCP2P";
import USDCIcon from "../../../../global/Icons/Deals/USDCIcon";
import ETHIcon from "../../../../global/Icons/Deals/ETHIcon";
import ZkSyncIcon from "../../../../global/Icons/Deals/zkSyncIcon";
import { AuthContext, LoadingContext } from "../../../../global/Layout";
import createDeposit, { BlockchainNetwork, CryptoCurrency } from "../../../../../http/deals/createDeposit";
import { toast } from "react-toastify";
import { WalletService } from "../../../../../helpers/walletService";
import { WithdrawContext } from "../../../../global/DealsBalanceComponent";
import { Minimize2 } from "lucide-react";

interface DepositModalProps {
  isVisible: boolean;
  onClose: (isWidthraw?: boolean) => void;
}

type PaymentMethod = {
  name: string;
  value: string;
  icon?: string | React.ReactNode;
};

export type Currency = {
  name: string;
  value: "USDC" | "ETH";
  available?: number;
  icon?: string | React.ReactNode;
};

export type Network = {
  name: string;
  value: string;
  fee: number;
  icon?: string | React.ReactNode;
};

const TIMER_DURATION = 585;
const EXCHANGE_RATE = 41.08;
const MIN_DEPOSIT = 0.00005;
const MIN_USDC_DEPOSIT = 0.1;
const ETH_POLL_INTERVAL = 5000;
const ETH_MONITORING_MAX_DURATION = 10 * 60 * 1000;
const ETH_COMPARISON_TOLERANCE = 0.00001;

const paymentMethods: PaymentMethod[] = [
  {
    name: "All wallets",
    value: "all_wallets",
    icon: <AllWalletsIcon />,
  },
  {
    name: "MetaMask",
    value: "metamask",
    icon: <MetamaskIcon />,
  },
  {
    name: "Phantom",
    value: "phantom",
    icon: <PhantomIcon />,
  },
];

export const currencies: Currency[] = [
  {
    name: "USDC",
    value: "USDC" as CryptoCurrency,
    icon: <USDCIcon />,
  },
  {
    name: "ETH",
    value: "ETH" as CryptoCurrency,
    icon: <ETHIcon />,
  },
];

export const networks: Network[] = [
  {
    name: "zkSync (ERC20)",
    value: "erc20",
    fee: 0,
    icon: <ZkSyncIcon />,
  },
];

const DepositModal: FC<DepositModalProps> = ({ isVisible, onClose }) => {
  const { toggleWithdrawModal } = useContext(WithdrawContext);
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(paymentMethods[0]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[0]);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [detectedEthAmount, setDetectedEthAmount] = useState(0);
  const [isEthMonitoring, setIsEthMonitoring] = useState(false);

  const initialEthBalanceRef = useRef<number | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const monitorStartTimeRef = useRef<number | null>(null);
  const isAutoConfirmingRef = useRef(false);
  const lastDetectedEthAmountRef = useRef(0);

  const shouldShowMinimizeButton = step === 2;
  const currentMinDeposit = selectedCurrency.value === "USDC" ? MIN_USDC_DEPOSIT : MIN_DEPOSIT;

  const stopEthMonitoring = useCallback(() => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    setIsEthMonitoring(false);
  }, []);

  const resetDepositState = useCallback(() => {
    stopEthMonitoring();
    setAmount(0);
    setSelectedPaymentMethod(paymentMethods[0]);
    setSelectedNetwork(networks[0]);
    setSelectedCurrency(currencies[0]);
    setStep(1);
    setTimeLeft(TIMER_DURATION);
    setIsMinimized(false);
    setDetectedEthAmount(0);
    setIsEthMonitoring(false);
    initialEthBalanceRef.current = null;
    monitorStartTimeRef.current = null;
    isAutoConfirmingRef.current = false;
    lastDetectedEthAmountRef.current = 0;
  }, [stopEthMonitoring]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(addressOtc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const confirmCreateDeposit = async (): Promise<void> => {
    const normalizedAmount = Number(amount || 0);

    if (normalizedAmount < currentMinDeposit) {
      toast.error(`Minimum deposit amount for ${selectedCurrency.value} is ${currentMinDeposit}`);
      return;
    }

    if (!userData?.wallet) {
      toast.error("Wallet address is required");
      return;
    }

    loadingStateHandler(true);

    const { ok, txHash } = selectedCurrency.value === "USDC"
      ? await depositUSD(String(normalizedAmount))
      : await depositETH(String(normalizedAmount));

    if (!ok || !txHash) {
      toast.error("Smart Contract error");
      loadingStateHandler(false);
      return;
    }

    const { isSuccess, errorMessage } = await createDeposit({
      currency: selectedCurrency.value as CryptoCurrency,
      amount: normalizedAmount,
      network: "ZKSYNC" as BlockchainNetwork,
      walletAddress: userData.wallet,
      transactionHash: txHash,
      fromAddress: userData.wallet,
      smartContractAddress: addressOtc,
    });

    const isDuplicateTx = (errorMessage || "").toLowerCase().includes("already exists");

    if (isSuccess || isDuplicateTx) {
      stopEthMonitoring();
      setIsMinimized(false);
      setStep((prevStep) => (prevStep + 1) as 1 | 2 | 3);
      if (isDuplicateTx) {
        toast.info("Deposit was already confirmed");
      }
    } else {
      toast.error(errorMessage || "Failed to create deposit record");
    }

    loadingStateHandler(false);
  };

  const confirmAutoDetectedDeposit = useCallback(async (): Promise<void> => {
    loadingStateHandler(true);

    try {
      const autoDetectedHash = `AUTO_DETECTED_${Date.now()}_${userData.wallet.slice(-8)}`;

      const { isSuccess, errorMessage } = await createDeposit({
        currency: selectedCurrency.value as CryptoCurrency,
        amount: Number(amount || 0),
        network: "ZKSYNC" as BlockchainNetwork,
        walletAddress: userData.wallet,
        transactionHash: autoDetectedHash,
        fromAddress: userData.wallet,
        smartContractAddress: addressOtc,
      });

      const isDuplicateTx = (errorMessage || "").toLowerCase().includes("already exists");

      if (isSuccess || isDuplicateTx) {
        toast.success("Deposit detected and confirmed automatically!");
        setIsMinimized(false);
        setStep(3);
      } else {
        toast.error(errorMessage || "Failed to create deposit record");
      }
    } catch (error) {
      console.error("[Auto Deposit] Error confirming auto-detected deposit:", error);
      toast.error("Failed to confirm deposit");
    }

    loadingStateHandler(false);
  }, [amount, selectedCurrency.value, userData.wallet, loadingStateHandler]);

  const onAmountChange = (value: number): void => {
    if (value > balance) return;
    setAmount(value);
  };

  const getModalTitle = useCallback((): string => {
    const titles = {
      1: "Deposit",
      2: "Payment credentials",
      3: "Deposit",
    };
    return titles[step];
  }, [step]);

  const formatMinimizedTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (step === 2) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }

    if (step === 1) {
      setTimeLeft(TIMER_DURATION);
    }
  }, [step]);

  useEffect(() => {
    const shouldMonitorEth =
      isVisible &&
      step === 2 &&
      selectedCurrency.value === "ETH" &&
      !!userData?.wallet &&
      Number(amount) > 0;

    if (!shouldMonitorEth) {
      stopEthMonitoring();
      return;
    }

    let isCancelled = false;

    const captureInitialBalance = async () => {
      try {
        setDetectedEthAmount(0);
        setIsEthMonitoring(false);
        isAutoConfirmingRef.current = false;
        lastDetectedEthAmountRef.current = 0;
        const balanceValue = await getEthBalance(userData.wallet);

        if (isCancelled) return;

        initialEthBalanceRef.current = balanceValue;
        monitorStartTimeRef.current = Date.now();
        setIsEthMonitoring(true);
      } catch (error) {
        console.error("[Deposit Monitor] Error capturing initial ETH balance:", error);
        setIsEthMonitoring(false);
      }
    };

    captureInitialBalance();

    return () => {
      isCancelled = true;
      stopEthMonitoring();
      initialEthBalanceRef.current = null;
      monitorStartTimeRef.current = null;
      isAutoConfirmingRef.current = false;
      lastDetectedEthAmountRef.current = 0;
      setDetectedEthAmount(0);
    };
  }, [isVisible, step, selectedCurrency.value, userData?.wallet, amount, stopEthMonitoring]);

  useEffect(() => {
    const canPoll =
      isVisible &&
      step === 2 &&
      selectedCurrency.value === "ETH" &&
      !!userData?.wallet &&
      Number(amount) > 0 &&
      isEthMonitoring &&
      initialEthBalanceRef.current !== null;

    if (!canPoll) return;

    monitorIntervalRef.current = setInterval(async () => {
      try {
        const elapsedTime = Date.now() - (monitorStartTimeRef.current || 0);

        if (elapsedTime > ETH_MONITORING_MAX_DURATION) {
          stopEthMonitoring();
          return;
        }

        const currentBalance = await getEthBalance(userData.wallet);
        const balanceDifference = Math.max(currentBalance - (initialEthBalanceRef.current || 0), 0);

        if (balanceDifference > lastDetectedEthAmountRef.current + ETH_COMPARISON_TOLERANCE) {
          const increment = balanceDifference - lastDetectedEthAmountRef.current;
          lastDetectedEthAmountRef.current = balanceDifference;
          setDetectedEthAmount(balanceDifference);
          toast.info(`ETH detected: +${increment.toFixed(6)} ETH`);
        }

        if (
          balanceDifference >= Number(amount) - ETH_COMPARISON_TOLERANCE &&
          balanceDifference > 0 &&
          !isAutoConfirmingRef.current
        ) {
          isAutoConfirmingRef.current = true;
          stopEthMonitoring();
          await confirmAutoDetectedDeposit();
        }
      } catch (error) {
        console.error("[Deposit Monitor] Error checking ETH balance:", error);
      }
    }, ETH_POLL_INTERVAL);

    return () => stopEthMonitoring();
  }, [
    isVisible,
    step,
    selectedCurrency.value,
    userData?.wallet,
    amount,
    isEthMonitoring,
    stopEthMonitoring,
    confirmAutoDetectedDeposit,
  ]);

  const handlePaymentMethodChange = useCallback((value: PaymentMethod) => {
    setSelectedPaymentMethod(value);
  }, []);

  const handleCurrencyChange = useCallback((value: Currency) => {
    setSelectedCurrency(value);
    setAmount(0);
  }, []);

  const handleNetworkChange = useCallback((value: Network) => {
    setSelectedNetwork(value);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const handleClose = (): void => {
    if (step === 2) {
      setIsMinimized(true);
      return;
    }

    onClose();
    setTimeout(() => {
      resetDepositState();
    }, 500);
  };

  const handleCheckBalance = () => {
    onClose(true);
    resetDepositState();

    setTimeout(() => {
      toggleWithdrawModal(true);
    }, 200);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Step1PaymentDetails
            balance={balance}
            userWallet={userData?.wallet || ""}
            minDeposit={currentMinDeposit}
            paymentMethods={paymentMethods}
            currencies={currencies}
            networks={networks}
            selectedPaymentMethod={selectedPaymentMethod}
            selectedCurrency={selectedCurrency}
            selectedNetwork={selectedNetwork}
            amount={amount}
            exchangeRate={EXCHANGE_RATE}
            onPaymentMethodChange={handlePaymentMethodChange}
            onCurrencyChange={handleCurrencyChange}
            onNetworkChange={handleNetworkChange}
            onProceed={() => {
              const normalizedAmount = Number(amount || 0);

              if (!normalizedAmount || normalizedAmount <= 0) {
                toast.error("Amount required!");
                return;
              }

              if (normalizedAmount < currentMinDeposit) {
                toast.error(`Minimum deposit amount for ${selectedCurrency.value} is ${currentMinDeposit}`);
                return;
              }

              setTimeLeft(TIMER_DURATION);
              setDetectedEthAmount(0);
              setIsMinimized(false);
              setStep(2);
            }}
            onAmountChange={onAmountChange}
            onWidthraw={() => {
              onClose(true);
              resetDepositState();
              setTimeout(() => {
                toggleWithdrawModal(true);
              }, 200);
            }}
          />
        );
      case 2:
        return (
          <Step2Checkout
            timeLeft={timeLeft}
            minDeposit={currentMinDeposit}
            copied={copied}
            onCopyToClipboard={copyToClipboard}
            onConfirm={confirmCreateDeposit}
            amount={amount}
            selectedCurrency={selectedCurrency.value}
            detectedAmount={detectedEthAmount}
            isMonitoring={isEthMonitoring}
          />
        );
      case 3:
        return (
          <Step3Success
            amount={amount}
            currency={selectedCurrency.name}
            onClose={handleClose}
            onCheckBalance={handleCheckBalance}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const walletService: WalletService = new WalletService();

    if (selectedCurrency?.name === "USDC") {
      walletService.getUsdcBalance().then((value) => {
        setBalance(Number(value));
      });
    } else {
      walletService.getEthBalance().then((value) => {
        setBalance(Number(value));
      });
    }
  }, [selectedCurrency]);

  useEffect(() => {
    if (!isVisible) {
      resetDepositState();
    }
  }, [isVisible, resetDepositState]);

  if (isVisible && isMinimized && step === 2) {
    return (
      <MinimizedBar
        timeLeft={timeLeft}
        formatTime={formatMinimizedTime}
        onExpand={handleMinimize}
      />
    );
  }

  return (
    <MainModal
      isCloseIcon={!shouldShowMinimizeButton}
      isVisible={isVisible}
      className="deposit-modal"
      title={getModalTitle()}
      variant="deal"
      onClose={handleClose}
    >
      {shouldShowMinimizeButton && (
        <S.MinimizeButton onClick={handleMinimize}>
          <Minimize2 size={20} />
        </S.MinimizeButton>
      )}
      <StepIndicator currentStep={step} />
      {renderStepContent()}
    </MainModal>
  );
};

export default DepositModal;
