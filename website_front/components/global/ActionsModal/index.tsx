import React, { FC, ReactNode } from "react";
import { Wrapper, Action } from "./styles";
import { Overlay } from "../../layouts/projects/Calendar/styles";

interface IAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

interface IProps {
  isVisible: boolean;
  onClose: () => void;
  actions: IAction[];
}

const ActionsModal: FC<IProps> = ({ isVisible, onClose, actions }) => {
  return (
    <>
      <Wrapper isVisible={isVisible} className="actions-modal">
        {actions.map((action, index) => (
          <Action key={index} onClick={action.onClick}>
            {action.icon}
            {action.label}
          </Action>
        ))}
      </Wrapper>

      {isVisible && <Overlay onClick={onClose} />}
    </>
  );
};

export default ActionsModal;
