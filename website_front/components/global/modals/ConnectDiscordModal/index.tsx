/* eslint-disable */
import React, { FC, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../../common/Modal";
import { ContentWrapper } from "./styles";
import { DISCORD_LINK } from "../../../../config/api";
import ConnectedDiscord from "./ConnectedDiscord";
import DefaultContent from "./DefaultContent";

interface Props {
  onClose: () => void;
}

const ConnectDiscordModal: FC<Props> = ({ onClose }) => {
  const [content, setContent] = useState<string>();
  const router = useRouter();

  const confirmConnect = async (): Promise<void> => {
    router.push(DISCORD_LINK);
  };

  const getContent = () => {
    switch (content) {
      case "connected":
        return <ConnectedDiscord onClose={onClose} />;
      default:
        return <DefaultContent confirmConnect={confirmConnect} />;
    }
  };

  return (
    <Modal onClose={onClose} variant="small-medium" title="Connect discord">
      <ContentWrapper>{getContent()}</ContentWrapper>
    </Modal>
  );
};

export default ConnectDiscordModal;
