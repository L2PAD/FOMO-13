/* eslint-disable */
import React, { FC, useState } from "react";
import { useDispatch } from "react-redux";
import { connectWallet } from "../../../../store/slices/authSlice";
import {
  ZKSYNC_ADD_ETHEREUM_CHAIN_PARAMETER,
  ZKSYNC_CHAIN_ID_HEX,
} from "../../../../config/zksync";
import Button from "../../common/Button";

interface Props {
  onClose: () => void;
}

const ZkSync: FC<Props> = ({ onClose }) => {
  const dispatch = useDispatch();
  const [isSwitching, setIsSwitching] = useState(false);

  const switchToZkSync = async () => {
    try {
      if (!window?.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      setIsSwitching(true);

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ZKSYNC_CHAIN_ID_HEX }],
        });
      } catch (error: any) {
        const shouldAddChain =
          error?.code === 4902 || error?.data?.originalError?.code === 4902;

        if (!shouldAddChain) {
          throw error;
        }

        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ZKSYNC_ADD_ETHEREUM_CHAIN_PARAMETER],
        });
      }

      onClose();
      dispatch(connectWallet());
    } catch (error) {
      console.error("switchToZkSync error:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      <p>Please change your dapp browser to zkSync to continue</p>
      <Button
        variant="primary"
        className="success-button"
        disabled={isSwitching}
        onClick={switchToZkSync}
      >
        {isSwitching ? "Switching..." : "Switch to zkSync"}
      </Button>
    </>
  );
};

export default ZkSync;
