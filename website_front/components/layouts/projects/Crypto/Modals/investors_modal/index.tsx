import React, { FC } from "react";
import Modal from "../../../../../global/common/Modal";
import { InvestorsHeader } from "../../../../../global/modals/creating_fund/styles";
import ModalSelect from "../../../../../global/common/components_for_modals/modal_select";
import { ModalRow } from "../exchange_settings/styles";
import UsersListWindow from "../../../../../global/common/users_window";
import { SubmitButton } from "../../../modals/AddFundsModal/styles";
import { IProject, Investor } from "../../../../../../types/global_types";
import { ParticipantsKeys } from "../../Project";

interface Props {
  data?: IProject;
  investors: Array<Investor>;
  inputsHandler?: (key: string, value: any) => void;
  onClose: () => void;
  hideModal: () => void;
  confirmUpdates: () => void;
}

const InvestorsModal: FC<Props> = ({
  onClose,
  hideModal,
  data,
  investors,
  inputsHandler,
  confirmUpdates,
}) => {
  return (
    <Modal title="Investors modal" onClose={onClose} variant="small">
      <ModalRow>
        <InvestorsHeader>
          <p>Investors</p>
          <button onClick={hideModal}>+ Add</button>
        </InvestorsHeader>
        <UsersListWindow
          data={data}
          inputName="investors"
          inputsHandler={(value: any, key: string) =>
            inputsHandler && inputsHandler(key, value)
          }
          investors={investors}
        />
      </ModalRow>
      <SubmitButton onClick={confirmUpdates}>Save changes</SubmitButton>
    </Modal>
  );
};

export default InvestorsModal;
