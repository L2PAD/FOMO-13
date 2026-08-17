/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IModalsState, toggleModal } from "../../../store/slices/modalsSlice";
import ConnectWalletModal from "../modals/ConnectWalletModal";
import ConnectDiscordModal from "../modals/ConnectDiscordModal";

const WalletAuthSteps = () => {
  const modalsState: IModalsState = useSelector((state: any) => state.modals);
  const dispatch = useDispatch();

  return (
    <div>
      {modalsState.isWallet ? (
        <ConnectWalletModal
          onClose={() => {
            dispatch(toggleModal({ modal: "isWallet", value: false }));
          }}
        />
      ) : (
        <></>
      )}
      {modalsState.isDiscord ? (
        <ConnectDiscordModal
          onClose={() => {
            dispatch(toggleModal({ modal: "isDiscord", value: false }));
          }}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default WalletAuthSteps;
