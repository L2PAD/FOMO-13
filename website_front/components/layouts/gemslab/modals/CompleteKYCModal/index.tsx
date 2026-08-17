import React, { FC } from "react";
import { useTimer } from "../../../../../hooks/useTimer";
import {
  VerifyImage,
  ActionsListItem,
  ActionsListWrapper,
  ActionButton,
  ActionName,
  ActionTimer,
  ModalWrapper,
  Wrapper,
} from "./styles";

interface Props {
  onClose: () => void;
  onSubmit: () => void;
}

const CompleteKYCModal: FC<Props> = ({ onClose, onSubmit }) => {
  const { days, hours, minutes, seconds } = useTimer(
    "Tue Jun 28 2023 22:23:55 GMT+0300 (Eastern European Summer Time)"
  );

  return (
    <ModalWrapper onClose={onClose} variant="small-medium" title="">
      <Wrapper>
        <ActionName>Contribution Closes</ActionName>
        <ActionTimer>
          {days}d {hours}h {minutes}m {seconds}s
        </ActionTimer>
        <VerifyImage big fill="rgba(115, 128, 148, 0.24)" />
        <ActionsListWrapper>
          <ActionsListItem>
            <div />
            <span>
              This sale requires you to pass KYC. Your identity is tied to the
              connected wallet you use during KYC.
            </span>
          </ActionsListItem>
          <ActionsListItem>
            <div />
            <span>
              You must hold at least 25 IF or 15 IDIA in your wallet to proceed
              with the KYC.
            </span>
          </ActionsListItem>
          <ActionsListItem>
            <div />
            <span>
              You can only use a wallet that has passed KYC to subscribe, get
              allocation, purchase and claim
            </span>
          </ActionsListItem>
          <ActionsListItem>
            <div />
            <span>
              KYC is not open to users from U.S., China and sanctioned
              countries.
            </span>
          </ActionsListItem>
        </ActionsListWrapper>
        <ActionButton
          onClick={() => {
            onSubmit();
            onClose();
          }}
        >
          Verify
        </ActionButton>
      </Wrapper>
    </ModalWrapper>
  );
};

export default CompleteKYCModal;
