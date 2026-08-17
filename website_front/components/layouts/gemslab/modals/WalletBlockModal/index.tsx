import React, { FC } from "react";
import { useTimer } from "../../../../../hooks/useTimer";
import {
  ActionButton,
  ActionName,
  ActionTimer,
  ActionTitle,
  LockImage,
  ModalWrapper,
  Wrapper,
} from "./styles";

interface Props {
  onClose: () => void;
  onSubmit: () => void;
}

const WalletBlockModal: FC<Props> = ({ onClose, onSubmit }) => {
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
        <LockImage fill="rgba(115, 128, 148, 0.24)" />
        <ActionTitle>Connect your wallet to participate</ActionTitle>
        <ActionButton
          onClick={() => {
            onSubmit();
            onClose();
          }}
        >
          Connect wallet
        </ActionButton>
      </Wrapper>
    </ModalWrapper>
  );
};

export default WalletBlockModal;
