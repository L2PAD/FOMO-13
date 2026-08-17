import React from "react";
import * as S from "../styles";
import { Button } from "../../../../../global/common/Button";
import { Minimize2 } from "lucide-react";
import ClockIcon from "../../../../../global/Icons/Deals/ClockIcon";
import SuccessIcon from "../../../../../global/Icons/Deals/SuccessIcon";
import SuccessAstroIcon from "../../../../../global/Icons/Deals/SuccessAstroIcon";
import ErrorIcon from "../../../../../global/Icons/Deals/ErrorIcon";
import RejectedIcon from "../../../../../global/Icons/Deals/RejectedIcon";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { Step3ContentProps } from "../types";
import moment from "moment";
import { CopyIcon } from "../../../../../global/Icons";
import sliceAddress from "../../../../../../helpers/sliceAddress";
import copy from 'clipboard-copy'
import { toast } from "react-toastify";

const Step3Content: React.FC<Step3ContentProps> = ({
    activeWithdraw,
    withdrawStatus,
    showTransactionDetails,
    setShowTransactionDetails,
    timeLeft,
    selectedCurrency,
    selectedNetwork,
    withdrawAddress,
    confirmWithdraw,
    onClose,
    setStep,
    handleCancelRequest,
    formatTime,
    setIsMinimized
}) => {
    const getCurrentAmount = (): string => {
        return (Number(activeWithdraw?.amount) > 100 ? clarifyAmount(activeWithdraw?.amount) : activeWithdraw?.amount || 0).toString()
    }

    const copyValue = (value?: string): void => {
        if (!value) return

        copy(value)
        toast.success('Copied!')
    }

    if (withdrawStatus === "pending") {
        return (
            <S.StepContent>
                <div>
                    <S.StatusTitle style={{ fontSize: "14px", textAlign: "center" }}>
                        Estimated review time:
                    </S.StatusTitle>
                    <S.Timer>{formatTime(timeLeft)}</S.Timer>
                </div>

                <S.AstronautWrapper>
                    <S.ClockIllustration>
                        <ClockIcon />
                    </S.ClockIllustration>
                </S.AstronautWrapper>

                <S.StatusTitle>Withdrawal Request Submitted</S.StatusTitle>
                <S.StatusDescription>
                    Your withdrawal request is under review by our moderation team.
                    You'll receive a confirmation once it's approved.
                    <br />
                    If no action is taken within this time, the request will be
                    automatically canceled.
                </S.StatusDescription>

                <S.ButtonWrapper>
                    <S.CancelButton onClick={handleCancelRequest}>
                        Cancel Request
                    </S.CancelButton>
                </S.ButtonWrapper>
            </S.StepContent>
        );
    }

    if (withdrawStatus === "confirmed" && showTransactionDetails) {
        return (
            <S.StepContent>
                <S.TransactionDetailsGrid>
                    <S.DetailRow>
                        <S.DetailLabel>Status</S.DetailLabel>
                        <S.DetailValue style={{ color: "#04A584" }}>
                            Completed
                        </S.DetailValue>
                    </S.DetailRow>
                    <S.DetailRow>
                        <S.DetailLabel>Type</S.DetailLabel>
                        <S.DetailValue>Withdraw</S.DetailValue>
                    </S.DetailRow>
                    <S.DetailRow>
                        <S.DetailLabel>Date</S.DetailLabel>
                        <S.DetailValue>
                            {moment(activeWithdraw?.updatedAt).format('L')}
                        </S.DetailValue>
                    </S.DetailRow>
                    <S.DetailRow>
                        <S.DetailLabel>Time</S.DetailLabel>
                        <S.DetailValue>
                            {moment(activeWithdraw?.updatedAt).format('LT')}
                        </S.DetailValue>
                    </S.DetailRow>
                    <S.DetailRow>
                        <S.DetailLabel>Transaction ID</S.DetailLabel>
                        <S.DetailValue>
                            {sliceAddress(activeWithdraw?.transactionHash)}
                            <S.CopyIcon
                                onClick={() => copyValue(activeWithdraw?.transactionHash)}
                            >
                                <CopyIcon />
                            </S.CopyIcon>
                        </S.DetailValue>
                    </S.DetailRow>
                    <S.DetailRow>
                        <S.DetailLabel>Network</S.DetailLabel>
                        <S.DetailValue>zkSync ({activeWithdraw?.network.toUpperCase() || '-'})</S.DetailValue>
                    </S.DetailRow>
                    <S.DetailRow>
                        <S.DetailLabel>Wallet Address</S.DetailLabel>
                        <S.DetailValue>
                            {sliceAddress(activeWithdraw?.userWallet || '')}
                            <S.CopyIcon
                                onClick={() => copyValue(activeWithdraw?.userWallet)}
                            >
                                <CopyIcon />
                            </S.CopyIcon>
                        </S.DetailValue>
                    </S.DetailRow>
                    <S.DetailRow>
                        <S.DetailLabel>Amount</S.DetailLabel>
                        <S.DetailValue>{activeWithdraw?.amount || 0} {selectedCurrency.name}</S.DetailValue>
                    </S.DetailRow>
                    <S.DetailRow>
                        <S.DetailLabel>Total Sent</S.DetailLabel>
                        <S.DetailValue>
                            {activeWithdraw?.totalSend} {selectedCurrency.name}
                        </S.DetailValue>
                    </S.DetailRow>
                    <S.DetailRow>
                        <S.DetailLabel>Est. Confirmation Time</S.DetailLabel>
                        <S.DetailValue>{moment(activeWithdraw?.createdAt).fromNow()}</S.DetailValue>
                    </S.DetailRow>
                    <S.ExplorerLink
                        href={`https://etherscan.io/tx/${activeWithdraw?.transactionHash}`}
                        target={'_blank'}
                    >View on Explorer 🔗</S.ExplorerLink>
                </S.TransactionDetailsGrid>

                <S.ButtonWrapper>
                    <Button variant="primary" onClick={() => {
                        onClose()
                        setTimeout(() => {
                            setStep(1)
                            setShowTransactionDetails(false)
                        }, 400)
                    }}>
                        Done
                    </Button>
                </S.ButtonWrapper>
            </S.StepContent>
        );
    }

    if (withdrawStatus === "confirmed" && !showTransactionDetails) {
        return (
            <S.StepContent>
                <S.SuccessWrapper>
                    <S.SuccessIcon>
                        <SuccessIcon />
                    </S.SuccessIcon>
                    <S.SuccessTitle>Successful!</S.SuccessTitle>
                    <S.AstronautWrapper>
                        <SuccessAstroIcon />
                    </S.AstronautWrapper>
                    <S.SuccessMessage>
                        Your <strong>{getCurrentAmount()} {activeWithdraw?.currency || ''}</strong> withdrawal is approved 🚀! The final step is to confirm the transaction on the blockchain.
                    </S.SuccessMessage>
                </S.SuccessWrapper>

                <S.ButtonsRow>
                    <Button
                        variant="primary"
                        onClick={confirmWithdraw}
                    >
                        Confirm Withdraw
                    </Button>
                </S.ButtonsRow>
            </S.StepContent>
        );
    }

    if (withdrawStatus === "rejected") {
        return (
            <S.StepContent>
                <S.ErrorWrapper>
                    <ErrorIcon />
                    <S.ErrorTitle>Rejected</S.ErrorTitle>
                    <S.AstronautWrapper>
                        <RejectedIcon />
                    </S.AstronautWrapper>
                    <S.ErrorMessage>
                        Your withdrawal request was rejected
                    </S.ErrorMessage>
                    <S.ErrorReason>
                        <strong>Reason:</strong> The wallet address provided could not be
                        verified
                    </S.ErrorReason>
                </S.ErrorWrapper>

                <S.ButtonsRow>
                    <S.NewRequestButton onClick={() => setStep(1)}>
                        New Request
                    </S.NewRequestButton>
                    <Button variant="primary">Contact support</Button>
                </S.ButtonsRow>
            </S.StepContent>
        );
    }

    if (withdrawStatus === "cancelled" && !showTransactionDetails) {
        return (
            <S.StepContent>
                <S.ErrorWrapper>
                    <ErrorIcon />
                    <S.ErrorTitle>Cancelled</S.ErrorTitle>
                    <S.AstronautWrapper>
                        <RejectedIcon />
                    </S.AstronautWrapper>
                    <S.ErrorMessage>
                        Your withdrawal request was automatically cancelled because the
                        review time expired.
                    </S.ErrorMessage>
                </S.ErrorWrapper>

                <S.ButtonsRow>
                    <S.CloseTextButton onClick={onClose}>Close</S.CloseTextButton>
                    <Button variant="primary" onClick={() => setStep(1)}>
                        New Request
                    </Button>
                </S.ButtonsRow>
            </S.StepContent>
        );
    }

    return null;
};

export default Step3Content;