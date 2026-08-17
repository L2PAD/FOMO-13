import React, { FC, useState } from "react";
import { getTrackBackground, Range as DefaultRange } from "react-range";
import Modal from "../../../../global/common/Modal";
import {
  FooterWrapper,
  InputRow,
  RangeTitleWrapper,
  RangeWrapper,
  SubmitButton,
} from "./styles";

interface Props {
  onClose: () => void;
}

const StakeModal: FC<Props> = ({ onClose }) => {
  const [values, setValues] = useState([10]);

  return (
    <Modal title="Stake BEED" onClose={onClose} variant="small">
      <RangeWrapper>
        <RangeTitleWrapper>
          <p>
            Locked for: <span>12 months</span>
          </p>
          <p>
            Weight: <span>{values[0]}</span>
          </p>
        </RangeTitleWrapper>
        <DefaultRange
          onChange={setValues}
          min={0}
          max={10}
          step={0.01}
          values={values}
          renderTrack={({ props, children }) => {
            return (
              <div
                {...props}
                style={{
                  background: getTrackBackground({
                    values,
                    colors: ["#04A584", "rgba(39, 122, 210, 0.1)"],
                    min: 0,
                    max: 10,
                  }),
                  height: "8px",
                  width: "100%",
                  borderRadius: 8,
                }}
              >
                {children}
              </div>
            );
          }}
          renderThumb={({ props }) => {
            return (
              <div
                {...props}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "100%",
                  border: "3px solid white",
                  background: "#04A584",
                  cursor: "pointer",
                  position: "absolute",
                }}
              />
            );
          }}
        />
      </RangeWrapper>
      <InputRow>
        <input type="text" value={0} />
        <span>Max</span>
      </InputRow>
      <FooterWrapper>
        <div>Est APR:</div>
        <div>
          <p>Wallet: 0 BREED</p>
          <span>116%</span>
        </div>
      </FooterWrapper>
      <SubmitButton onClick={onClose}>Approve</SubmitButton>
    </Modal>
  );
};

export default StakeModal;
