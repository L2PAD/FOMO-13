/* eslint-disable */
import React, { FC, useState } from "react";
import { useDispatch } from "react-redux";
import { useConnectWallet } from "../../../../hooks/useConnectWallet";
import { toggleModal } from "../../../../store/slices/modalsSlice";
import { ContentWrapper } from "./styles";
import Modal from "../../common/Modal";
import ConnectedMetamaskContent from "./ConnectedMetamaskContent";
import DefaultContent from "./DefaultContent";
import ErrorWalletConnect from "./ErrorWalletConnect";
import OtherWalletContent from "./OtherWalletContent";
import ZkSync from "./ZkSync";

interface Props {
  onClose: () => void;
}

const ConnectWalletModal: FC<Props> = ({ onClose }) => {
  const [content, setContent] = useState<string>();
  const { connectWallet } = useConnectWallet();
  const dispatch = useDispatch();

  const connectStepsHandler = async () => {
    const isConnect = await connectWallet();

    if (isConnect) {
      onClose();
      dispatch(toggleModal({ modal: "isDiscord", value: true }));
    }
  };

  const getContent = () => {
    switch (content) {
      case "metamask":
        return <ConnectedMetamaskContent onClose={onClose} />;
      case "error-wallet":
        return <ErrorWalletConnect onClose={onClose} setContent={setContent} />;
      case "other-wallet":
        return <OtherWalletContent onClose={onClose} />;
      case "zkSync":
        return <ZkSync onClose={onClose} />;
      default:
        return <DefaultContent connectStepsHandler={connectStepsHandler} />;
    }
  };

  return (
    <Modal
      onClose={onClose}
      variant="small-medium"
      title={
        content === "other-wallet"
          ? "Access to FOMO DAO"
          : content === "zkSync"
            ? "Unsupported network"
            : "Connect wallet"
      }
    >
      <ContentWrapper>{getContent()}</ContentWrapper>
    </Modal>
  );
};

export default ConnectWalletModal;
