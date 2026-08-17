import React, { FC } from "react";
import Modal from "../../../../global/common/Modal";
import { SelectWrapper, SubmitButton, ThemeWrapper } from "./styles";
import { SearchIcon } from "../../../../global/Icons";

interface Props {
  onClose: () => void;
}

const SellModal: FC<Props> = ({ onClose }) => {
  return (
    <Modal onClose={onClose} title="Sale of allocation">
      <br />
      <ThemeWrapper>
        <p>Your NFT</p>
        <div>
          <SearchIcon fill="#73809480" />
          <input type="text" placeholder="Enter the name of your NFT" />
        </div>
      </ThemeWrapper>
      <SelectWrapper>
        <p>Your price</p>
        <div>
          <input type="number" placeholder="0.00" />
          <select>
            <option>ETH</option>
            <option>USD</option>
          </select>
        </div>
      </SelectWrapper>
      <SubmitButton onClick={onClose}>Offer a deal</SubmitButton>
    </Modal>
  );
};

export default SellModal;
