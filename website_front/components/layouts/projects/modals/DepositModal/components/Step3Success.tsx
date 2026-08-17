import React from "react";
import * as S from "../styles";
import Button from "../../../../../global/common/Button";
import SuccessIcon from "../../../../../global/Icons/Deals/SuccessIcon";
import SuccessAstroIcon from "../../../../../global/Icons/Deals/SuccessAstroIcon";

interface Step3SuccessProps {
    amount: number;
    currency: string;
    onClose: () => void;
    onCheckBalance: () => void;
}

export const Step3Success: React.FC<Step3SuccessProps> = ({
    amount,
    currency,
    onClose,
    onCheckBalance,
}) => {
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
                    <strong>{amount} {currency}</strong> has been deposited to your account
                </S.SuccessMessage>
            </S.SuccessWrapper>

            <S.ButtonsRow>
                <S.CloseButton onClick={onClose}>Close</S.CloseButton>
                <Button variant="primary" onClick={onCheckBalance}>
                    Check Balance
                </Button>
            </S.ButtonsRow>
        </S.StepContent>
    );
};