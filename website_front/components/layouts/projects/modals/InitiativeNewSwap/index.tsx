import React, { FC, useState } from "react";
import Modal from "../../../../global/common/Modal";
import Checkbox from "../../../../global/common/Checkbox";
import {
  FlexWrapper,
  DateWrapper,
  EndWrapper,
  SelectWrapper,
  SubmitButton,
  ThemeWrapper,
} from "./styles";

interface Props {
  onClose: () => void;
}

const InitiativeNewSwap: FC<Props> = ({ onClose }) => {
  const [checkAll, setCheckAll] = useState(true);

  return (
    <Modal onClose={onClose} title="Initiative new swap">
      <br />
      <ThemeWrapper>
        <p>Smart-contract address</p>
        <input type="text" placeholder="Enter smart contract address" />
      </ThemeWrapper>
      <FlexWrapper>
        <ThemeWrapper>
          <p>Amount</p>
          <input type="number" placeholder="0" />
        </ThemeWrapper>
        <Checkbox
          checked={checkAll}
          onChange={() => setCheckAll((prev) => !prev)}
          label="ALL"
        />
      </FlexWrapper>
      <ThemeWrapper>
        <p>Your tokens</p>
        <input type="text" placeholder="Select the desired token" />
      </ThemeWrapper>
      <EndWrapper>
        <b>+ Secret NFT Key #2</b>
        <b>+ Secret NFT Key #2</b>
        <b>+ Secret NFT Key #2</b>
      </EndWrapper>
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
        <p>Date and Time</p>
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

export default InitiativeNewSwap;
