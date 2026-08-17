import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { currencies, networks } from '../components/layouts/projects/modals/DepositModal';
import { completeWithdraw, createWithdraw, deleteWithdraw, getWithdrawById, Withdraw } from '../http/deals/withdrawActions';
import { BlockchainNetwork } from '../http/deals/createDeposit';
import { Currency, Network } from '../components/layouts/projects/modals/DepositModal';
import { WithdrawStatus, WithdrawStep } from '../components/layouts/projects/modals/WithdrawModal/types';
import { withdrawETH, withdrawUSD } from '../smart/smartOTCP2P';
import { toast } from 'react-toastify';
import { WithdrawContext } from '../components/global/DealsBalanceComponent';

const TIME_LEFT = 60 * 5;

export interface WithdrawState {
    step: WithdrawStep;
    withdrawStatus: WithdrawStatus | null;
    selectedCurrency: Currency;
    selectedNetwork: Network;
    amount: number;
    withdrawAddress: string;
    addressError: string;
    timeLeft: number;
    currentWithdrawId: string | null;
    isMinimized: boolean;
    showTransactionDetails: boolean;
    balanceCurrencies: Currency[]
    activeWithdraw: Withdraw | null
}

export interface UseWithdrawReturn extends WithdrawState {
    setStep: (step: WithdrawStep) => void;
    setWithdrawStatus: (status: WithdrawStatus | null) => void;
    setSelectedCurrency: (currency: Currency) => void;
    setSelectedNetwork: (network: Network) => void;
    setAmount: (amount: number) => void;
    setWithdrawAddress: (address: string) => void;
    setAddressError: (error: string) => void;
    setIsMinimized: (minimized: boolean) => void;
    setShowTransactionDetails: (show: boolean) => void;

    validateAddress: (address: string) => boolean;
    handleContinue: () => void;
    handleRequestWithdrawal: () => Promise<void>;
    handleCancelRequest: () => Promise<void>;
    handleMinimize: () => void;
    formatTime: (seconds: number) => string;
    onAmountChange: (value: number) => void;
    onCurrencyChange: (currency: Currency) => void;
    handleClose: () => void;
    clearState: () => void;
    confirmWithdraw: () => Promise<void>
}

const useWithdraw = (
    balance: { eth: number; usdc: number },
    loadingStateHandler: (loading: boolean) => void,
    onClose?: () => void
): UseWithdrawReturn => {
    const { toggleWithdrawModal } = useContext(WithdrawContext)
    const [step, setStep] = useState<WithdrawStep>(1);
    const [withdrawStatus, setWithdrawStatus] = useState<WithdrawStatus | null>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
    const [balanceCurrencies, setBalanceCurrencies] = useState<Currency[]>(currencies)
    const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[0]);
    const [amount, setAmount] = useState<number>(0);
    const [withdrawAddress, setWithdrawAddress] = useState<string>('');
    const [addressError, setAddressError] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(TIME_LEFT);
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    const [showTransactionDetails, setShowTransactionDetails] = useState<boolean>(false);
    const [currentWithdrawId, setCurrentWithdrawId] = useState<string | null>(null);
    const [activeWithdraw, setActiveWithdraw] = useState<Withdraw | null>(null)

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const formatTime = useCallback((seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }, []);

    const validateAddress = useCallback((address: string): boolean => {
        if (!address) {
            setAddressError("Please enter recipient's address");
            return false;
        }
        if (address.length < 10) {
            setAddressError("Invalid address");
            return false;
        }
        setAddressError("");
        return true;
    }, []);

    const handleContinue = useCallback((): void => {
        if (step === 1) {
            if (!validateAddress(withdrawAddress)) {
                return;
            }

            if (!amount) return

            setStep(2);
        }
    }, [step, amount, withdrawAddress, validateAddress]);

    const confirmWithdraw = async (): Promise<void> => {
        if (!activeWithdraw) return

        loadingStateHandler(true)

        const { ok, txHash } = activeWithdraw.currency === 'USDC'
            ?
            await withdrawUSD(activeWithdraw.amount)
            :
            await withdrawETH(activeWithdraw.amount)

        if (!ok || !txHash) {
            toast.error('Smart Contract error!')
            return
        }

        const { isSuccess, message, withdraw } = await completeWithdraw(activeWithdraw._id, txHash)

        if (withdraw) setActiveWithdraw(withdraw)

        if (isSuccess) {
            setShowTransactionDetails(true)
            stopPolling()
            clearWithdrawFromLocalStorage()
            toast.success('Success! Your funds will arrive shortly')
        } else {
            toast.error(message)
        }

        loadingStateHandler(false)
    }

    const saveWithdrawToLocalStorage = useCallback((withdrawId: string, expireDate: string, status: 'pending' | 'confirmed'): void => {
        const withdrawData = {
            id: withdrawId,
            expireDate: expireDate,
            createdAt: new Date().toISOString(),
            status: status
        };
        localStorage.setItem('current_withdraw', JSON.stringify(withdrawData));
    }, []);

    const clearWithdrawFromLocalStorage = useCallback((): void => {
        localStorage.removeItem('current_withdraw');
    }, []);

    const stopPolling = useCallback((): void => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    const startPollingWithdrawStatus = useCallback((withdrawId: string): void => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        pollIntervalRef.current = setInterval(async () => {
            const result = await getWithdrawById(withdrawId);

            if (result.isSuccess && result.withdraw) {
                const status = Number(result.withdraw.status);
                console.log(`STATUS ${status}`)
                if (status === 5) {
                    setWithdrawStatus('confirmed');
                    setActiveWithdraw(result.withdraw)
                    saveWithdrawToLocalStorage(result.withdraw._id, result.withdraw.expireDate, 'confirmed')
                } else if (status === 2) {
                    setWithdrawStatus("rejected");
                    stopPolling();
                    clearWithdrawFromLocalStorage();
                } else if (status === 3) {
                    setWithdrawStatus('cancelled');
                    stopPolling();
                    clearWithdrawFromLocalStorage();
                } else if (status === 0) {
                    setWithdrawStatus('pending')
                    setStep(3)
                    toggleWithdrawModal(true)
                    const now = new Date()
                    const expireDate = new Date(result.withdraw.expireDate);
                    const timeDiff = Math.floor((expireDate.getTime() - now.getTime()) / 1000);
                    setTimeLeft(timeDiff);
                    setCurrentWithdrawId(result.withdraw._id);
                }
            } else {
                console.error('Ошибка при опросе статуса заявки:', result.message);
            }
        }, 5000);
    }, [stopPolling, clearWithdrawFromLocalStorage]);

    const handleExpiredWithdraw = useCallback(async (): Promise<void> => {
        setWithdrawStatus('cancelled');
        clearWithdrawFromLocalStorage();
        stopPolling();

        if (currentWithdrawId) {
            const result = await getWithdrawById(currentWithdrawId);

            if (result.isSuccess && result.withdraw?.status === 4) {
                console.log('Заявка автоматически отменена сервером');
            }
        }
    }, [currentWithdrawId, clearWithdrawFromLocalStorage, stopPolling]);

    const handleRequestWithdrawal = useCallback(async (): Promise<void> => {
        loadingStateHandler(true);

        try {
            const { isSuccess, withdraw, message } = await createWithdraw({
                currency: selectedCurrency.value,
                amount,
                network: selectedNetwork.value as BlockchainNetwork,
                userWallet: withdrawAddress,
                type: ''
            });

            if (isSuccess && withdraw) {
                saveWithdrawToLocalStorage(withdraw._id, withdraw.expireDate, 'pending');
                setCurrentWithdrawId(withdraw._id);
                setStep(3);
                setWithdrawStatus("pending");
                setTimeLeft(TIME_LEFT);
                startPollingWithdrawStatus(withdraw._id);
            } else {
                console.error('Ошибка создания заявки:', message);
            }
        } catch (error) {
            console.error('Исключение при создании заявки:', error);
        } finally {
            loadingStateHandler(false);
        }
    }, [selectedCurrency, amount, selectedNetwork, withdrawAddress, loadingStateHandler, saveWithdrawToLocalStorage, startPollingWithdrawStatus]);

    const handleCancelRequest = useCallback(async (): Promise<void> => {
        if (!currentWithdrawId) return;

        loadingStateHandler(true);

        try {
            const result = await deleteWithdraw(currentWithdrawId);

            if (result.isSuccess) {
                setStep(1);
                setWithdrawStatus(null);
                setCurrentWithdrawId(null);
                clearWithdrawFromLocalStorage();
                stopPolling();
                if (timerRef.current) clearInterval(timerRef.current);
            }
        } catch (error) {
            console.error('Ошибка при отмене заявки:', error);
        } finally {
            loadingStateHandler(false);
        }
    }, [currentWithdrawId, loadingStateHandler, clearWithdrawFromLocalStorage, stopPolling]);

    const handleMinimize = useCallback((): void => {
        setIsMinimized(!isMinimized);
    }, [isMinimized]);

    const onAmountChange = useCallback((value: number): void => {
        setAmount(prev => {
            // Проверяем что новое значение не превышает доступный баланс
            if (selectedCurrency.available && selectedCurrency.available < value) {
                return prev;
            }
            return value;
        });
    }, [selectedCurrency.available]);

    const onCurrencyChange = useCallback((currency: Currency): void => {
        setSelectedCurrency(currency);
        setAmount(currency.available || 0);
    }, []);

    const handleClose = useCallback((): void => {
        if (withdrawStatus === 'pending' || withdrawStatus === 'confirmed' && step === 3) {
            handleMinimize();
            return;
        }
        if (onClose) onClose();

        setTimeout(() => {
            setWithdrawStatus(null);
            setStep(1);
        }, 500);
    }, [withdrawStatus, step, handleMinimize, onClose]);

    const clearState = useCallback((): void => {
        setStep(1);
        setWithdrawStatus(null);
        setSelectedCurrency(currencies[0]);
        setSelectedNetwork(networks[0]);
        setAmount(0);
        setWithdrawAddress('');
        setAddressError('');
        setTimeLeft(TIME_LEFT);
        setIsMinimized(false);
        setShowTransactionDetails(false);
        setCurrentWithdrawId(null);
    }, []);

    useEffect(() => {
        const savedWithdraw: any = localStorage.getItem('current_withdraw');
        const withdrawData = savedWithdraw ? JSON.parse(savedWithdraw) : null;

        if (withdrawData) {
            startPollingWithdrawStatus(withdrawData.id)
        }

        if (withdrawData) {
            try {
                const expireDate = new Date(withdrawData.expireDate);
                const now = new Date();

                if (withdrawData.status === 'confirmed') {
                    setStep(3);
                    setCurrentWithdrawId(withdrawData.id)
                    setWithdrawStatus('confirmed');
                    toggleWithdrawModal(true)
                    setIsMinimized(true)
                }

                if (expireDate > now && withdrawData.status === 'pending') {
                    const expireDate = new Date(withdrawData.expireDate);
                    const timeDiff = Math.floor((expireDate.getTime() - now.getTime()) / 1000);
                    setTimeLeft(timeDiff);
                    setStep(3);
                    setWithdrawStatus("pending");
                    toggleWithdrawModal(true)
                    setIsMinimized(true)
                    setCurrentWithdrawId(withdrawData.id)
                }
            } catch (error) {
                console.error('Ошибка при парсинге сохраненной заявки:', error);
            }
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [startPollingWithdrawStatus]);

    useEffect(() => {
        if (timeLeft <= 0 || step !== 3) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleExpiredWithdraw();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, step, handleExpiredWithdraw]);

    useEffect(() => {
        const balanceValues: Currency[] = currencies.map((item: Currency) => {
            const key: 'eth' | 'usdc' = item.value.toLowerCase() as 'eth' | 'usdc'
            return ({
                ...item,
                available: balance[key]
            })
        })
        setBalanceCurrencies(balanceValues)

        // Обновляем selectedCurrency только если это первая загрузка (ещё не выбрано)
        setSelectedCurrency(prev => {
            const updatedCurrency = balanceValues.find(c => c.value === prev.value)
            return updatedCurrency || balanceValues[0]
        })

        // НЕ обновляем amount автоматически - пользователь сам вводит значение
        // Обновление только при смене валюты происходит в onCurrencyChange

        if (window?.ethereum?.selectedAddress && !withdrawAddress) {
            setWithdrawAddress(window?.ethereum?.selectedAddress)
        }
    }, [balance, withdrawAddress]);

    return {
        // State
        step,
        withdrawStatus,
        selectedCurrency,
        selectedNetwork,
        amount,
        withdrawAddress,
        addressError,
        timeLeft,
        currentWithdrawId,
        isMinimized,
        showTransactionDetails,
        balanceCurrencies,
        activeWithdraw,
        // Setters
        setStep,
        setWithdrawStatus,
        setSelectedCurrency,
        setSelectedNetwork,
        setAmount,
        setWithdrawAddress,
        setAddressError,
        setIsMinimized,
        setShowTransactionDetails,

        // Methods
        validateAddress,
        handleContinue,
        handleRequestWithdrawal,
        handleCancelRequest,
        handleMinimize,
        formatTime,
        onAmountChange,
        onCurrencyChange,
        handleClose,
        clearState,
        confirmWithdraw
    };
};

export default useWithdraw;