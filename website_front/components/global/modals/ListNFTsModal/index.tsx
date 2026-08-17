import React, { FC, useRef } from "react";
import Modal from "../../common/Modal";
import { Description, Wrapper, SubmitButton } from "./styles";
import Input from "../../common/Input";
import Button from "../../common/Button";

interface Props {
  onClose: () => void;
}

const ListNFTsModal: FC<Props> = ({ onClose }) => {
  const hiddenFileInput = useRef(null);

  const handleClick = () => {
    // @ts-ignore
    hiddenFileInput.current.click();
  };

  const handleChange = () => {};

  return (
    <Modal onClose={onClose} title="List NFTs">
      <Wrapper>
        <Description>
          Сonsectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna
        </Description>
        <Input
          placeholder="newuser@gmail.com"
          labelText="Email"
          type="email"
          onChange={() => {}}
          value=""
        />
        <br />
        <Input
          placeholder="@username"
          labelText="Telegram username"
          type="text"
          onChange={() => {}}
          value=""
        />
        <br />
        <div className="flex">
          <p>Сonsectetur adipiscing elit, sed do eiusmod tempor</p>
          <Button variant="secondary" onClick={handleClick}>
            + Add file
          </Button>
          <input
            type="file"
            accept=".pdf,.docx"
            ref={hiddenFileInput}
            style={{ display: "none" }}
            onChange={handleChange}
          />
        </div>
        <br />
        <SubmitButton>Send</SubmitButton>
      </Wrapper>
    </Modal>
  );
};

export default ListNFTsModal;
