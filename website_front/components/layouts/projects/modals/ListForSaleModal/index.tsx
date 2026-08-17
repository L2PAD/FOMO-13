import React, { FC, useState } from "react";
import Modal from "../../../../global/common/Modal";
import Checkbox from "../../../../global/common/Checkbox";
import {
  DateWrapper,
  EndWrapper,
  SelectWrapper,
  SubmitButton,
  ThemeWrapper,
} from "./styles";

interface Props {
  onClose: () => void;
}

const ListForSaleModal: FC<Props> = ({ onClose }) => {
  const [check, setCheck] = useState(true);

  return (
    <Modal onClose={onClose} title="List for sale">
      <br />
      <ThemeWrapper>
        <p>Collection name</p>
        <input type="text" placeholder="Name your collection" />
      </ThemeWrapper>
      <ThemeWrapper>
        <p>NFTs name</p>
        <input type="text" placeholder="Name your NFTs" />
      </ThemeWrapper>
      <EndWrapper>
        <b>+ Secret NFT Key #2</b>
        <p>FOMO key</p>
        <b className="start">Set a price</b>
        <b>
          Floor price: 0,0016 ETH{" "}
          <Checkbox
            checked={check}
            onChange={() => setCheck((prev) => !prev)}
          />
        </b>
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
        <p>Duration</p>
        <div>
          <input type="date" placeholder="08.08.2022" />
          <input type="time" placeholder="17:17" />
          <select>
            <option>7D</option>
          </select>
        </div>
      </DateWrapper>
      <div>
        <p>Listing price: 0,0016 ETH</p>
        <p>Royalty fee: 0%</p>
        <p>Total potential earnings: 0,0016 ETH</p>
      </div>
      <br />
      <SubmitButton onClick={onClose}>Complete Listing</SubmitButton>
    </Modal>
  );
};

export default ListForSaleModal;
