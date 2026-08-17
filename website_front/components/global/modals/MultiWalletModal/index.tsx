import React, { useState, useContext, FC } from "react";
import { toast } from "react-toastify";
import { AuthContext, LoadingContext } from "../../Layout";
import Modal from "../../common/Modal";
import updateUser from "../../../../http/user/updateUser";
import { SubmitButton, Description, InputWrapper } from "./styles";

interface IWallets {
  solanaAddress: string;
  cosmosAddress: string;
  polkadotAddress: string;
  nearAddress: string;
  kusamaAddress: string;
}

interface Props {
  onClose: () => void;
}

const MultiWalletModal: FC<Props> = ({ onClose }) => {
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [wallets, setWallets] = useState<IWallets>({
    solanaAddress: userData?.solanaAddress || "",
    cosmosAddress: userData?.cosmosAddress || "",
    polkadotAddress: userData?.polkadotAddress || "",
    nearAddress: userData?.nearAddress || "",
    kusamaAddress: userData?.kusamaAddress || "",
  });

  const inputsHandler = (name: string, value: string): void => {
    setWallets((prev: IWallets) => {
      return { ...prev, [name]: value };
    });
  };

  const confirmUpdateWallets = async (): Promise<void> => {
    loadingStateHandler(true);

    const data = await updateUser(wallets);

    if (data) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Multichain wallet updated!</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  return (
    <Modal onClose={onClose} title="Multi-chain wallet">
      <Description>
        Сonsectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
        et dolore magna
      </Description>
      <InputWrapper>
        <p>Solana</p>
        <input
          value={wallets.solanaAddress}
          onChange={(e: any) => inputsHandler("solanaAddress", e.target.value)}
          type="text"
        />
      </InputWrapper>
      <InputWrapper>
        <p>Cosmos</p>
        <input
          onChange={(e: any) => inputsHandler("cosmosAddress", e.target.value)}
          value={wallets.cosmosAddress}
          type="text"
        />
      </InputWrapper>
      <InputWrapper>
        <p>Near</p>
        <input
          onChange={(e: any) => inputsHandler("nearAddress", e.target.value)}
          value={wallets.nearAddress}
          type="text"
        />
      </InputWrapper>
      <InputWrapper>
        <p>Polkadot</p>
        <input
          onChange={(e: any) =>
            inputsHandler("polkadotAddress", e.target.value)
          }
          value={wallets.polkadotAddress}
          type="text"
        />
      </InputWrapper>
      <InputWrapper>
        <p>Kusama</p>
        <input
          onChange={(e: any) => inputsHandler("kusamaAddress", e.target.value)}
          value={wallets.kusamaAddress}
          type="text"
        />
      </InputWrapper>
      <SubmitButton onClick={confirmUpdateWallets}>Save</SubmitButton>
    </Modal>
  );
};

export default MultiWalletModal;
