import React, { FC } from "react";
import Modal from "../../../../global/common/Modal";
import {
  DateWrapper,
  SelectWrapper,
  SubmitButton,
  ThemeWrapper,
} from "./styles";

interface Props {
  onClose: () => void;
}

const ListForBuyModal: FC<Props> = ({ onClose }) => {
  return (
    <Modal onClose={onClose} title="List for buy">
      <br />
      <ThemeWrapper>
        <p>Project name</p>
        <input type="text" placeholder="Enter project name" />
      </ThemeWrapper>
      <ThemeWrapper>
        <p>Amount</p>
        <input type="number" placeholder="Enter Quantity" />
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
      <DateWrapper>
        <p>Duration</p>
        <div>
          <input type="date" placeholder="08.08.2022" />
          <input type="time" placeholder="17:17" />
          <select>
            <option>7D</option>
          </select>
        </div>
      </DateWrapper>
      <SubmitButton onClick={onClose}>Complete Listing</SubmitButton>
    </Modal>
  );
};

export default ListForBuyModal;
