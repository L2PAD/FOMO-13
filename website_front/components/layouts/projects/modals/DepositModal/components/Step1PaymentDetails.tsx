import React, { useContext, useEffect, useState } from "react";
import * as S from "../styles";
import ModalDropdown from "../ModalDropdown";
import Button from "../../../../../global/common/Button";
import { AuthContext } from "../../../../../global/Layout";
import sliceAddress from "../../../../../../helpers/sliceAddress";
import { MetamaskIcon } from "../../../../../global/Icons";
import { WalletService } from "../../../../../../helpers/walletService";

export const formatNumberWithCommas = (
    value: number | string,
    decimalPlaces: number = 2,
    locale: string = 'en-US'
): string => {
    if (value === '' || value === null || value === undefined) return '';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '';

    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    }).format(numValue);
};

interface Step1PaymentDetailsProps {
    balance: number
    userWallet: string
    paymentMethods: any[];
    currencies: any[];
    networks: any[];
    selectedPaymentMethod: any;
    selectedCurrency: any;
    selectedNetwork: any;
    amount: number;
    exchangeRate: number;
    minDeposit: number;
    onAmountChange: (value: number) => void
    onPaymentMethodChange: (value: any) => void;
    onCurrencyChange: (value: any) => void;
    onNetworkChange: (value: any) => void;
    onProceed: () => void;
    onWidthraw: () => void
}

export const Step1PaymentDetails: React.FC<Step1PaymentDetailsProps> = ({
    paymentMethods,
    balance,
    userWallet,
    currencies,
    networks,
    selectedPaymentMethod,
    selectedCurrency,
    selectedNetwork,
    amount,
    exchangeRate,
    onAmountChange,
    onPaymentMethodChange,
    onCurrencyChange,
    onNetworkChange,
    onProceed,
    onWidthraw
}) => {

    return (
        <S.StepContent>
            <S.FormGroup>
                <S.Label>Payment method</S.Label>
                {/* <ModalDropdown
                    options={paymentMethods}
                    onChange={onPaymentMethodChange}
                    value={selectedPaymentMethod}
                /> */}
                <S.PaymentMethod>
                    <div className="wallet-wrapper">
                        <MetamaskIcon />
                        <div className="wallet">
                            {sliceAddress(userWallet)}
                        </div>
                    </div>
                    <div className="balance">
                        <span>{balance.toFixed(4)}</span>
                        <span>{selectedCurrency.name}</span>
                    </div>
                </S.PaymentMethod>
            </S.FormGroup>

            <S.FormGroup>
                <S.Label>Currency</S.Label>
                <ModalDropdown
                    isSuccessIcon={false}
                    options={currencies}
                    onChange={onCurrencyChange}
                    value={selectedCurrency}
                />
                <S.ExchangeRate>
                    Exchange rate: -
                    {/* 1 {selectedCurrency.name} ≈ {exchangeRate} UAH */}
                </S.ExchangeRate>
            </S.FormGroup>

            <S.FormGroup>
                <S.Label>Network</S.Label>
                <ModalDropdown
                    options={networks}
                    onChange={onNetworkChange}
                    value={selectedNetwork}
                    showFee={false}
                />
            </S.FormGroup>

            <S.FormGroup>
                <S.AmountInputWrapper>
                    <S.AmountInput
                        type="number"
                        value={amount}
                        onChange={(e: any) => onAmountChange(e.target.value)}
                    />
                    <S.AmountLabel>
                        Amount to deposit in {selectedCurrency.name}
                    </S.AmountLabel>
                </S.AmountInputWrapper>

                <S.WithdrawLink>
                    Want to withdraw instead? – <button onClick={() => onWidthraw()}>Withdraw</button>
                </S.WithdrawLink>
            </S.FormGroup>

            <S.ButtonWrapper>
                <Button variant="primary" onClick={onProceed}>
                    Proceed to Checkout
                </Button>
            </S.ButtonWrapper>
        </S.StepContent>
    );
};