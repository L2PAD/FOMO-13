import React, { useContext } from "react";
import * as S from "../styles";
import Button from "../../../../../global/common/Button";
import { CopyIcon } from "../../../../../global/Icons";
import sliceAddress from "../../../../../../helpers/sliceAddress";
import { addressOtc } from "../../../../../../smart/smartOTCP2P";
import { QRCodeCanvas } from "qrcode.react";
import { AuthContext } from "../../../../../global/Layout";

interface Step2CheckoutProps {
    timeLeft: number;
    selectedCurrency: "USDC" | "ETH";
    minDeposit: number;
    copied: boolean;
    amount: number;
    detectedAmount: number;
    isMonitoring: boolean;
    onCopyToClipboard: () => void;
    onConfirm: () => void;
}

export const Step2Checkout: React.FC<Step2CheckoutProps> = ({
    selectedCurrency,
    timeLeft,
    minDeposit,
    copied,
    amount,
    detectedAmount,
    isMonitoring,
    onCopyToClipboard,
    onConfirm,
}) => {
    const { userData } = useContext(AuthContext);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const normalizedDetectedAmount = Math.max(0, detectedAmount || 0);
    const remainingAmount = Math.max(0, Number(amount || 0) - normalizedDetectedAmount);

    return (
        <S.StepContent>
            <S.Info>
                {selectedCurrency === "ETH" ? (
                    <>
                        <S.Timer>{formatTime(timeLeft)}</S.Timer>
                        <S.QRCodeWrapper>
                            <QRCodeCanvas
                                value={`ethereum:${addressOtc}?value=${amount}`}
                                size={128}
                                level="H"
                                bgColor="#ffffff"
                                fgColor="#000000"
                            />
                        </S.QRCodeWrapper>
                    </>
                ) : (
                    <></>
                )}

                <S.CredentialsGrid>
                    <S.CredentialRow>
                        <S.CredentialLabel>Wallet address</S.CredentialLabel>
                        <S.CredentialValue>
                            {sliceAddress(addressOtc)}
                            <S.CopyButton onClick={onCopyToClipboard}>
                                {copied ? "Copied" : <CopyIcon />}
                            </S.CopyButton>
                        </S.CredentialValue>
                    </S.CredentialRow>

                    <S.CredentialRow>
                        <S.CredentialLabel>Network</S.CredentialLabel>
                        <S.CredentialValue>zkSync (ERC20)</S.CredentialValue>
                    </S.CredentialRow>

                    <S.CredentialRow>
                        <S.CredentialLabel>Amount</S.CredentialLabel>
                        <S.CredentialValue>{amount || 0} {selectedCurrency}</S.CredentialValue>
                    </S.CredentialRow>
                </S.CredentialsGrid>
            </S.Info>

            <S.InfoBox>
                <S.InfoText>Min deposit amount: {minDeposit} {selectedCurrency}</S.InfoText>

                {selectedCurrency === "ETH" && normalizedDetectedAmount > 0 && (
                    <S.InfoText style={{ color: "var(--main-green)" }}>
                        Deposited: {normalizedDetectedAmount.toFixed(6)} ETH
                    </S.InfoText>
                )}
                {selectedCurrency === "ETH" && remainingAmount > 0 && (
                    <S.InfoText>
                        Remaining: {remainingAmount.toFixed(5)} ETH
                    </S.InfoText>
                )}
                {selectedCurrency === "ETH" && (
                    <S.InfoText style={{ marginTop: "6px" }}>
                        You can deposit ETH in two ways: scan the QR code in any wallet, or use the button below to send from your connected wallet.
                    </S.InfoText>
                )}
                {selectedCurrency === "ETH" && (
                    <S.InfoText style={{ marginTop: "8px", color: "var(--main-green)" }}>
                        {isMonitoring
                            ? "Monitoring balance for transfers to this address. Deposit will be confirmed automatically when the full amount is detected."
                            : "Preparing balance monitoring..."}
                    </S.InfoText>
                )}

                {selectedCurrency === "ETH" && (
                    <S.InfoText style={{ marginTop: "6px", color: "#ff5858" }}>
                        Important: send ETH only from your authorized wallet {sliceAddress(userData?.wallet || "")}.
                    </S.InfoText>
                )}
            </S.InfoBox>

            <S.ButtonWrapper>
                <Button variant="primary" onClick={onConfirm}>
                    {selectedCurrency === "ETH" ? "Deposit From Connected Wallet" : "Confirm Deposit"}
                </Button>
            </S.ButtonWrapper>
        </S.StepContent>
    );
};
