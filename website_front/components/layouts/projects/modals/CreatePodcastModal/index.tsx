import React, { FC, useState } from "react";
import Modal from "../../../../global/common/Modal";
import Checkbox from "../../../../global/common/Checkbox";
import {
  DateWrapper,
  MessageWrapper,
  SubmitButton,
  ThemeWrapper,
} from "./styles";

interface Props {
  onClose: () => void;
}

const CreatePodcastModal: FC<Props> = ({ onClose }) => {
  const [checkChoice, setCheckChoice] = useState(true);

  return (
    <Modal onClose={onClose} title="Create podcast">
      <br />
      <ThemeWrapper>
        <p>Broadcast name</p>
        <input type="text" placeholder="Enter the title" />
      </ThemeWrapper>
      <ThemeWrapper>
        <p>Amount</p>
        <input type="number" placeholder="0" />
      </ThemeWrapper>
      <DateWrapper>
        <p>Date and Time</p>
        <div>
          <input type="date" placeholder="08.08.2022" />
          <input type="time" placeholder="17:17" />
          <Checkbox
            checked={checkChoice}
            onChange={() => setCheckChoice(true)}
            label="Only on site"
          />
        </div>
      </DateWrapper>
      <MessageWrapper>
        <p>Description</p>
        <textarea placeholder="Description of deal" />
      </MessageWrapper>
      <SubmitButton onClick={onClose}>Create Deal</SubmitButton>
    </Modal>
  );
};

export default CreatePodcastModal;
