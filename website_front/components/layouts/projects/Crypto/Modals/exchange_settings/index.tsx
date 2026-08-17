import React, { FC } from "react";
import Modal from "../../../../../global/common/Modal";
import { CheckboxWrapper, ModalRow } from "./styles";
import InputWithLabel from "../../../../../global/common/components_for_modals/input_with_label";
import Checkbox from "../../../../../global/common/Checkbox";
import { SubmitButton } from "../../../modals/CreateTopicModal/styles";

interface Props {
  onClose: () => void;
}

const ExchangeSettings: FC<Props> = ({ onClose }) => {
  return (
    <Modal title="Exchange settings" onClose={onClose} variant="small">
      <ModalRow>
        <InputWithLabel
          label="API key"
          value=""
          onChange={(value) => console.log(value)}
        />
      </ModalRow>
      <CheckboxWrapper>
        <p>Exchage platforms</p>
        <div>
          <Checkbox checked onChange={() => console.log(1)} label="Name1" />
          <Checkbox checked onChange={() => console.log(1)} label="Name2" />
          <Checkbox checked onChange={() => console.log(1)} label="Name2" />
        </div>
      </CheckboxWrapper>
      <SubmitButton onClick={onClose}>Save changes</SubmitButton>
    </Modal>
  );
};

export default ExchangeSettings;
