import React, { FC, useState, useEffect, useContext, useRef } from "react";
import MainModal from "../../../../global/common/MainModal";
import * as S from "./styles";
import { Minimize2 } from "lucide-react";
import MinimizedBar from "./components/MinimizedBar";
import StepIndicator from "./components/StepIndicator";
import Step1Content from "./components/Step1Content";
import Step2Content from "./components/Step2Content";
import Step3Content from "./components/Step3Content";

import { WithdrawModalProps, WithdrawStep, WithdrawStatus } from "./types";
import { currencies, Currency, Network, networks } from "../DepositModal";
import { LoadingContext } from "../../../../global/Layout";
import useWithdraw from "../../../../../hooks/useWithdraw";

const WithdrawModal: FC<WithdrawModalProps> = ({ isVisible, balance, onClose }) => {
  const { loadingStateHandler } = useContext(LoadingContext)

  const {
    activeWithdraw,
    step,
    withdrawStatus,
    selectedCurrency,
    selectedNetwork,
    amount,
    withdrawAddress,
    addressError,
    timeLeft,
    isMinimized,
    showTransactionDetails,
    balanceCurrencies,
    setStep,
    setWithdrawAddress,
    setAddressError,
    setShowTransactionDetails,
    setSelectedNetwork,

    handleContinue,
    handleRequestWithdrawal,
    handleCancelRequest,
    handleMinimize,
    formatTime,
    onAmountChange,
    onCurrencyChange,
    handleClose,
    confirmWithdraw
  } = useWithdraw(balance, loadingStateHandler, onClose);

  const getModalTitle = () => {
    if (step === 3) {
      if (showTransactionDetails) return "Transaction Details";
      if (withdrawStatus === "pending") return "Pending Approval";
      if (withdrawStatus === "confirmed") return "Withdraw Funds";
      if (withdrawStatus === "rejected") return "Withdraw Funds";
      if (withdrawStatus === "cancelled") return "Withdraw Funds";
    }
    if (step === 2) return "Withdrawal Details";
    if (step === 1) return "Withdraw Funds";
    return "";
  };

  const shouldShowMinimizeButton = step === 3 && withdrawStatus === "pending" || step === 3 && withdrawStatus === 'confirmed';

  if (isMinimized) {
    return (
      <MinimizedBar
        withdrawStatus={withdrawStatus}
        timeLeft={timeLeft}
        formatTime={formatTime}
        handleMinimize={handleMinimize}
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

      {!showTransactionDetails && (
        <StepIndicator step={step} />
      )}

      {step === 1 && (
        <Step1Content
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={onCurrencyChange}
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={setSelectedNetwork}
          withdrawAddress={withdrawAddress}
          setWithdrawAddress={setWithdrawAddress}
          addressError={addressError}
          setAddressError={setAddressError}
          handleContinue={handleContinue}
          currencies={balanceCurrencies}
          networks={networks}
          amount={amount}
          onAmountChange={onAmountChange}
        />
      )}

      {step === 2 && (
        <Step2Content
          withdrawAddress={withdrawAddress}
          amount={amount}
          selectedNetwork={selectedNetwork}
          selectedCurrency={selectedCurrency}
          handleRequestWithdrawal={handleRequestWithdrawal}
        />
      )}

      {step === 3 && (
        <Step3Content
          activeWithdraw={activeWithdraw}
          setShowTransactionDetails={setShowTransactionDetails}
          setIsMinimized={() => { }}
          withdrawStatus={withdrawStatus}
          showTransactionDetails={showTransactionDetails}
          timeLeft={timeLeft}
          selectedCurrency={selectedCurrency}
          selectedNetwork={selectedNetwork}
          withdrawAddress={withdrawAddress}
          confirmWithdraw={confirmWithdraw}
          onClose={onClose}
          setStep={setStep}
          handleCancelRequest={handleCancelRequest}
          formatTime={formatTime}
        />
      )}
    </MainModal>
  );
};

export default WithdrawModal;