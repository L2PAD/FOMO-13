import React, { FC, useState } from "react";
import Modal from "../../../../../global/common/Modal";
import { ModalRow } from "../green_flags_modal/styles";
import { SubmitButton } from "../../../modals/CreateTopicModal/styles";
import { IProject } from "../../../../../../types/global_types";
import updateProject from "../../../../../../http/projects/updateProject";
import InputWithLabel from "../../../../../global/common/components_for_modals/input_with_label";
import useProjectPath from "../../../../../../hooks/useProjectPath";

interface Props {
  project: IProject;
  onClose: () => void;
  updateProjectData: (values: any) => Promise<void>;
}

const MarketCapModal: FC<Props> = ({ onClose, project, updateProjectData }) => {
  const location: string = useProjectPath() || "projects";

  const [value, setValue] = useState<number>(project.marketCap || 0);

  const inputHandler = (value: any): void => {
    setValue(value);
  };

  const confirmChanges = async (): Promise<void> => {
    await updateProjectData({ marketCap: value });
  };

  return (
    <Modal title="Market cap" onClose={onClose} variant="small">
      <ModalRow>
        <InputWithLabel
          value={String(value)}
          onChange={inputHandler}
          label="Market Cap ($ M)"
        />
      </ModalRow>
      <SubmitButton onClick={confirmChanges}>Save changes</SubmitButton>
    </Modal>
  );
};

export default MarketCapModal;
