import { FC, useState } from "react";
import { ModalRow, SubmitButton } from "./styles";
import useProjectPath from "../../../../hooks/useProjectPath";
import updateProject from "../../../../http/projects/updateProject";
import { IProject } from "../../../../types/global_types";
import Modal from "../../common/Modal";

interface Props {
  data: any;
  onClose: () => void;
  onChange: (data: any) => void;
}

const BioModal: FC<Props> = ({ onClose, onChange, data }) => {
  const location = useProjectPath();
  const [text, setText] = useState<string>(data?.bio || "");

  const confirmChanges = async (): Promise<void> => {
    const editedData: any = {
      ...data,
      bio: text,
    };
    onClose();
    await updateProject(`${location}/${data._id}`, editedData);
    onChange(editedData);
  };

  return (
    <Modal title="BIO" onClose={onClose} variant="small">
      <ModalRow>
        <p>BIO</p>
        <textarea onChange={(e) => setText(e.target.value)} value={text} />
      </ModalRow>
      <SubmitButton onClick={confirmChanges} variant="bordered">
        Save changes
      </SubmitButton>
    </Modal>
  );
};

export default BioModal;
