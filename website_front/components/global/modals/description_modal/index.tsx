import React, { FC, useState } from "react";
import { ModalRow, SubmitButton } from "./styles";
import updateProject from "../../../../http/projects/updateProject";
import { IProject } from "../../../../types/global_types";
import Modal from "../../common/Modal";
import useProjectPath from "../../../../hooks/useProjectPath";

interface Props {
  onClose: () => void;
  project: IProject;
  updateProjectData: (values: any) => Promise<void>;
}

const DescriptionModal: FC<Props> = ({
  onClose,
  project,
  updateProjectData,
}) => {
  const [text, setText] = useState<string>(project.bio || "");

  const confirmChanges = () => {
    updateProjectData({ bio: text });
  };

  return (
    <Modal title="BIO" onClose={onClose} variant="small">
      <ModalRow>
        <p>BIO</p>
        <textarea onChange={(e) => setText(e.target.value)} value={text} />
      </ModalRow>
      <SubmitButton variant="primary" onClick={confirmChanges}>
        Save changes
      </SubmitButton>
    </Modal>
  );
};

export default DescriptionModal;
