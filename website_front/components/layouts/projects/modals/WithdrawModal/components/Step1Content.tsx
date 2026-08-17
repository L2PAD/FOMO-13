import React from "react";
import * as S from "../styles";
import { Button } from "../../../../../global/common/Button";
import ModalDropdown from "../../DepositModal/ModalDropdown";
import { Step1ContentProps } from "../types";

const Step1Content: React.FC<Step1ContentProps> = ({
    selectedCurrency,
    selectedNetwork,
    withdrawAddress,
    addressError,
    currencies,
    networks,
    amount,
    setSelectedCurrency,
    setSelectedNetwork,
    setWithdrawAddress,
    onAmountChange,
    setAddressError,
    handleContinue,
}) => {
    return (
        <S.StepContent>
            <S.FormGroup>
                <S.Label>Currency</S.Label>
                <ModalDropdown
                    isSuccessIcon={false}
                    options={currencies}
                    onChange={(value) => setSelectedCurrency(value as any)}
                    value={selectedCurrency}
                />
                <S.AvailableBalance>
                    Available: <span>{selectedCurrency.available || 0}</span>
                </S.AvailableBalance>
                {false && (
                    <S.ErrorText>
                        Looks like your balance here is empty. Please select another
                        currency to withdraw.
                    </S.ErrorText>
                )}
            </S.FormGroup>

            <S.FormGroup>
                <S.Label>Withdraw to</S.Label>
                <S.Input
                    placeholder="Enter address"
                    value={withdrawAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setAddressError("");
                    }}
                    error={!!addressError}
                />
                <S.HintText>
                    Double-check the network — sending to the wrong one may cause a
                    total loss of funds
                </S.HintText>
                {addressError && <S.ErrorText>{addressError}</S.ErrorText>}
            </S.FormGroup>

            <S.FormGroup>
                <S.Label>Network</S.Label>
                <ModalDropdown
                    options={networks}
                    onChange={(value) => setSelectedNetwork(value as any)}
                    value={selectedNetwork}
                    showFee={true}
                />
            </S.FormGroup>

            <S.AmountInputWrapper>
                <S.AmountInput
                    type="number"
                    value={amount}
                    onChange={(e: any) => onAmountChange(e.target.value)}
                />
            </S.AmountInputWrapper>

            <S.ButtonWrapper>
                <Button
                    variant="primary"
                    onClick={handleContinue}
                    disabled={!withdrawAddress || !!addressError || amount === 0}
                >
                    Continue
                </Button>
            </S.ButtonWrapper>
        </S.StepContent>
    );
};

export default Step1Content;