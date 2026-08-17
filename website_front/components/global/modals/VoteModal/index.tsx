import React, { FC } from "react";
import Modal from "../../common/Modal";
import { ModalWrapper } from "./styles";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

interface Props {
  onClose: () => void;
}

const VoteModal: FC<Props> = ({ onClose }) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (e: any) => {
    setValue(e.target.value);
  };

  return (
    <Modal title="Vote" onClose={onClose}>
      <ModalWrapper>
        <p>
          You have: <b>10 NFT = 10 Votes</b>
        </p>
        <p>Enter the desired quantity of NFTs</p>
        <Slider
          trackStyle={{ background: "#04A584", height: 8 }}
          railStyle={{ background: "rgba(39, 122, 210, 0.1)", height: 8 }}
          handleStyle={{
            background: "#04A584",
            marginTop: -8,
            width: 24,
            height: 24,
            borderColor: "#fff",
          }}
          min={0}
          max={10708}
          value={value}
          // @ts-ignore
          onChange={setValue}
        />
        <div className="input">
          <input
            type="number"
            placeholder="0"
            value={value}
            onChange={handleChange}
          />
          <div className="max" onClick={() => setValue(10708)}>
            Max
          </div>
        </div>
        <p>
          Number of votes on this issue: <b>10 708</b>
        </p>
        <button>Contribute a vote</button>
      </ModalWrapper>
    </Modal>
  );
};

export default VoteModal;
