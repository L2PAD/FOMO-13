import React, { FC, useState } from "react";
import Modal from "../../../../../global/common/Modal";
import styled from "styled-components";
import { SubmitButton } from "../../../modals/AddFundsModal/styles";
import { IProject } from "../../../../../../types/global_types";
import updateProject from "../../../../../../http/projects/updateProject";
import InputWithLabel from "../../../../../global/common/components_for_modals/input_with_label";
import useProjectPath from "../../../../../../hooks/useProjectPath";

interface Props {
  onClose: () => void;
  project: IProject;
  updateProjectData: (values: any) => Promise<void>;
}

interface IVolume {
  volume: number;
  volumeGrowth: number;
}

export const FlexRow = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 12px;
`;

const Volume24HModal: FC<Props> = ({ onClose, project, updateProjectData }) => {
  const location: string = useProjectPath() || "projects";

  const [values, setValues] = useState<IVolume>({
    volume: project.volume || 0,
    volumeGrowth: project.volumeGrowth || 0,
  });

  const inputHandler = (value: number, name?: string): void => {
    name && setValues({ ...values, [name]: value });
  };

  const confirmChanges = async (): Promise<void> => {
    const editedProject = {
      volume: values.volume,
      volumeGrowth: values.volumeGrowth,
    };
    await updateProjectData(editedProject);
  };
  return (
    <Modal title="Volume 24H" onClose={onClose} variant="small">
      <FlexRow>
        <InputWithLabel
          type="number"
          name="volume"
          label="Volume ($ M)"
          value={values.volume}
          onChange={inputHandler}
        />
        <InputWithLabel
          type="number"
          name="volumeGrowth"
          label="% change"
          value={values.volumeGrowth}
          onChange={inputHandler}
        />
      </FlexRow>
      <SubmitButton onClick={confirmChanges}>Save changes</SubmitButton>
    </Modal>
  );
};

export default Volume24HModal;
