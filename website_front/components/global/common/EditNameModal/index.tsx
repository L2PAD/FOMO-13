import React, { FC, useState } from "react";
import { ModalRow, SubmitButton } from "./styles";
import { IProject } from "../../../../types/global_types";
import Modal from "../Modal";
import InputWithLabel from "../components_for_modals/input_with_label";

interface Props {
  onClose: () => void;
  project: IProject;
  updateProjectData: (values: any) => Promise<void>;
}

const EditNameModal: FC<Props> = ({ onClose, project, updateProjectData }) => {
  const [text, setText] = useState<string>(project.name || "");

  const confirmChanges = () => {
    updateProjectData({ name: text });
  };

  return (
    <Modal title="Name" onClose={onClose} variant="small">
      <ModalRow>
        <InputWithLabel
          value={text}
          label=""
          name="name"
          onChange={(value: any) => setText(value)}
        />
      </ModalRow>
      <SubmitButton variant="primary" onClick={confirmChanges}>
        Save changes
      </SubmitButton>
    </Modal>
  );
};

export default EditNameModal;
