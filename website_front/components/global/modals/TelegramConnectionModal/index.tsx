import React, { FC } from "react";
import Modal from "../../common/Modal";
import { CheckIcon } from "../../Icons";
import {
  ActionsWrapper,
  CancelButton,
  Check,
  ContentWrapper,
  Description,
  List,
  ListItem,
  ListTitle,
  SubmitButton,
  Title,
} from "./styles";

interface Props {
  onClose: () => void;
}

const TelegramConnectionModal: FC<Props> = ({ onClose }) => {
  return (
    <Modal onClose={onClose} title="" variant="small">
      <ContentWrapper>
        <Title variant="p">Telegram connection</Title>
        <Description variant="p">
          A third-party program wants access to your Telegram account
        </Description>
        <ListTitle variant="p">
          Thanks to this we can get data such as:
        </ListTitle>
        <List>
          <ListItem>
            <Check>
              <CheckIcon fill="white" />
            </Check>
            <span>Access to your contact list</span>
          </ListItem>
          <ListItem>
            <Check>
              <CheckIcon fill="white" />
            </Check>
            <span>Access to your name and account information</span>
          </ListItem>
          <ListItem>
            <Check>
              <CheckIcon fill="white" />
            </Check>
            <span>List of your groups and chats</span>
          </ListItem>
        </List>
        <ActionsWrapper>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <SubmitButton>Connect</SubmitButton>
        </ActionsWrapper>
      </ContentWrapper>
    </Modal>
  );
};

export default TelegramConnectionModal;
