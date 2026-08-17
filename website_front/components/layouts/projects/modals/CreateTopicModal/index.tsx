import React, { FC, useState } from "react";
import Modal from "../../../../global/common/Modal";
import {
  MessageWrapper,
  ModalContainer,
  SubmitButton,
  ThemeWrapper,
} from "./styles";

interface Props {
  addTopic: (
    text: string,
    isTopic?: boolean,
    topicName?: string
  ) => Promise<void>;
  onClose: () => void;
}

const CreateTopicModal: FC<Props> = ({ onClose, addTopic }) => {
  const [topicName, setTopicName] = useState<string>("");
  const [topicMessage, setTopicMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!topicName.trim() || !topicMessage.trim() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await addTopic(topicMessage.trim(), true, topicName.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalContainer>
      <Modal
        onClose={onClose}
        title="Create topic"
        variant="medium"
        className=""
      >
        <ThemeWrapper>
          <p>Topic name</p>
          <input
            value={topicName}
            disabled={isSubmitting}
            onChange={(e: any) => setTopicName(e.target.value)}
            type="text"
            placeholder="Enter the title"
          />
        </ThemeWrapper>
        <MessageWrapper>
          <p>Description</p>
          <textarea
            value={topicMessage}
            disabled={isSubmitting}
            onChange={(e: any) => setTopicMessage(e.target.value)}
            placeholder="Your message... "
          />
        </MessageWrapper>
        <SubmitButton
          disabled={isSubmitting || !topicName.trim() || !topicMessage.trim()}
          onClick={handleSubmit}
        >
          Send message
        </SubmitButton>
      </Modal>
    </ModalContainer>
  );
};

export default CreateTopicModal;
