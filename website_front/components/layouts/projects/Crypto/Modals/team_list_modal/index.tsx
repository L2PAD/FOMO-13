import React, { FC } from "react";
import Modal from "../../../../../global/common/Modal";
import { InvestorsHeader } from "../../../../../global/modals/creating_fund/styles";
import { ModalRow } from "../exchange_settings/styles";
import { SubmitButton } from "../../../modals/ListForBuyModal/styles";
import { Investor, IProject } from "../../../../../../types/global_types";
import { ParticipantsKeys } from "../../Project";
import UsersListWindow from "../../../../../global/common/users_window";

interface Props {
  data: IProject;
  label: string;
  items: Array<any>;
  participantsHandler: (key: string, items: Array<any>) => void;
  onClose: () => void;
  hideModal: () => void;
  onConfirm: () => void;
}

const TeamListModal: FC<Props> = ({
  items,
  label,
  participantsHandler,
  onClose,
  hideModal,
  data,
  onConfirm,
}) => {
  return (
    <Modal title={`${label} modal`} onClose={onClose} variant="small">
      <ModalRow>
        <InvestorsHeader>
          <p>Investors</p>
          <button onClick={hideModal}>+ Add</button>
        </InvestorsHeader>
        <UsersListWindow
          data={data}
          inputName={label.toLowerCase()}
          investors={items}
          inputsHandler={(value: any, key: string) => {
            participantsHandler(key, value);
          }}
        />
      </ModalRow>

      <SubmitButton
        onClick={() =>
          //@ts-ignore
          onConfirm(label.toLowerCase())
        }
      >
        Save changes
      </SubmitButton>
    </Modal>
  );
};

export default TeamListModal;
