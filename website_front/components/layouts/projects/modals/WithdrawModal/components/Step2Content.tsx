import React from "react";
import * as S from "../styles";
import { Button } from "../../../../../global/common/Button";
import ModalDropdown from "../../DepositModal/ModalDropdown";
import { Step2ContentProps } from "../types";
import sliceAddress from "../../../../../../helpers/sliceAddress";

const Step2Content: React.FC<Step2ContentProps> = ({
    amount,
    withdrawAddress,
    selectedNetwork,
    selectedCurrency,
    handleRequestWithdrawal,
}) => {
    return (
        <S.StepContent>
            <S.DetailsGrid>
                <S.DetailRow>
                    <S.DetailLabel>Withdraw to</S.DetailLabel>
                    <S.DetailValue>{sliceAddress(withdrawAddress)}</S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                    <S.DetailLabel>Network</S.DetailLabel>
                    <S.DetailValue>{selectedNetwork.name}</S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                    <S.DetailLabel>Amount</S.DetailLabel>
                    <S.DetailValue>{amount} {selectedCurrency.name}</S.DetailValue>
                </S.DetailRow>
            </S.DetailsGrid>

            <S.WarningBox>
                <S.WarningText>
                    You've selected the {selectedNetwork.name} network. Make sure your
                    withdrawal address supports {selectedNetwork.value.toUpperCase()} — otherwise, the funds may be
                    lost forever.
                </S.WarningText>
            </S.WarningBox>

            <S.InfoBox>
                <S.InfoText>
                    Withdrawal requests are manually reviewed by our moderation team.
                    You'll be notified once approved.
                </S.InfoText>
            </S.InfoBox>

            <S.ButtonWrapper>
                <Button variant="primary" onClick={handleRequestWithdrawal}>
                    Request Withdrawal
                </Button>
            </S.ButtonWrapper>
        </S.StepContent>
    );
};

export default Step2Content;