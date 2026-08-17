import React, { FC, useState } from "react";
import { ModalRow } from "../exchange_settings/styles";
import { SubmitButton } from "../../../modals/AddFundsModal/styles";
import { IProject } from "../../../../../../types/global_types";
import updateProject from "../../../../../../http/projects/updateProject";
import Modal from "../../../../../global/common/Modal";
import useProjectPath from "../../../../../../hooks/useProjectPath";
import ModalSelect from "../../../../../global/common/components_for_modals/modal_select";

interface Props {
  onClose: () => void;
  project: IProject;
  updateProjectData: (values: any) => Promise<void>;
}

const TypeModal: FC<Props> = ({ onClose, project, updateProjectData }) => {
  const location: string = useProjectPath() || "projects";

  const [type, setType] = useState<string>(project.type || "");

  const inputHandler = (value: string): void => {
    setType(value);
  };

  const confirmChanges = async (): Promise<void> => {
    await updateProjectData({ type });
  };

  return (
    <Modal title="Type" onClose={onClose} variant="small">
      <ModalRow>
        <ModalSelect
          label="Choose type"
          onChange={inputHandler}
          value={type}
          items={["Pre-seed", "Seed", "Private", "Public"]}
        />
      </ModalRow>
      <SubmitButton onClick={confirmChanges}>Save changes</SubmitButton>
    </Modal>
  );
};

export default TypeModal;
