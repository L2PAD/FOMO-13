import React, { FC, useState } from "react";
import Image from "next/image";
import Modal from "../../common/Modal";
import { InputWrapper, QRCodeWrapper, SubmitButton, Text } from "./styles";
import qrcode from "../../../../public/static/common/qrcode.png";
import RefreshIcon from "../../Icons/RefreshIcon";

interface Props {
  onClose: () => void;
}

const ConnectAuthenticatorModal: FC<Props> = ({ onClose }) => {
  const [inputValue, setInputValue] = useState("");

  const handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        setInputValue(text);
      })
      .catch((error) => {
        console.error("Error pasting text: ", error);
      });
  };

  const handleChange = (e: any) => {
    setInputValue(e.target.value);
  };

  return (
    <Modal
      onClose={onClose}
      title="Connect the authenticator"
      variant="small-medium"
    >
      <Text>• Open the Authenticator app and click &apos;Add&apos;</Text>
      <Text>• Scan the QR code or use the connect key</Text>
      <QRCodeWrapper>
        <Image src={qrcode.src} alt="qr-code" width={120} height={120} />
        <div>
          <p>Connect the key</p>
          <span>V57O6EG5H2LSTBDR4PBMQ7SWOSGOGFCF</span>
          <br />
          <br />
          <p className="refresh">
            <RefreshIcon />
            Refresh
          </p>
        </div>
      </QRCodeWrapper>
      <Text>• The new code will be available in the list</Text>
      <Text>• Paste the code in the field below</Text>
      <InputWrapper>
        <p>Code from the authenticator</p>
        <div className="input">
          <input
            type="text"
            placeholder="123456"
            value={inputValue}
            onChange={handleChange}
          />
          <div className="paste" onClick={handlePaste}>
            Paste
          </div>
        </div>
      </InputWrapper>
      <br />
      <SubmitButton>Confirm</SubmitButton>
    </Modal>
  );
};

export default ConnectAuthenticatorModal;
