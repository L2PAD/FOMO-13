import React, { FC, useState } from "react";
import { ActionsContentTitle, ActionsContentWrapper } from "../../Sale/styles";
import ElipsisIcon from "../../../../global/Icons/ElipsisIcon";
import Modal from "../../../../global/common/Modal";
import UserAvatar from "../../../../global/common/UserAvatar";
import {
  ActionsWrapper,
  AnimationDescription,
  AnimationTitle,
  CancelButton,
  ConfirmButton,
  ContentWrapper,
  ElipsisAnimation,
} from "./styles";

interface Props {
  onClose: () => void;
  onSubmit: () => void;
  isStake: boolean;
}

const StakeModal: FC<Props> = ({ isStake, onSubmit, onClose }) => {
  const [loading, setLoading] = useState(false);

  const onClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit();
      onClose();
    }, 2000);
  };

  return (
    <Modal
      onClose={onClose}
      variant="small-medium"
      title={isStake ? "Unstake" : "Stake"}
    >
      {loading ? (
        <ContentWrapper>
          <ElipsisAnimation>
            <ElipsisIcon />
          </ElipsisAnimation>
          <AnimationTitle>
            Confirm {isStake ? "Unstaking" : "Staking"}
          </AnimationTitle>
          <AnimationDescription>
            {!isStake && "Staking 10 IDIA"}
            <span>Confirm this transaction in your wallet</span>
          </AnimationDescription>
        </ContentWrapper>
      ) : (
        <ContentWrapper>
          <ActionsContentWrapper>
            <UserAvatar
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              name="name"
              variant="default"
              size="small"
            />
            <ActionsContentTitle variant="p">IDIA</ActionsContentTitle>
          </ActionsContentWrapper>
          <ActionsWrapper>
            <CancelButton onClick={onClose}>Cancel</CancelButton>
            <ConfirmButton onClick={onClick}>
              {isStake ? "Unstake" : "Stake"}
            </ConfirmButton>
          </ActionsWrapper>
        </ContentWrapper>
      )}
    </Modal>
  );
};

export default StakeModal;
