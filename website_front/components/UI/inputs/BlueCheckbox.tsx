/* eslint-disable */
import React, { FC } from "react";
import Image from "next/image";
import CheckIcon from "../../../assets/icons/check.svg";
import { BlueCheckboxStyles, BlueCheckboxWrapper } from "./styles";

interface IProps {
  isChecked: boolean;
  onClick: () => any;
}

const BlueCheckbox: FC<IProps> = ({ isChecked = false, onClick }) => {
  return (
    <BlueCheckboxWrapper>
      <BlueCheckboxStyles
        type="checkbox"
        defaultChecked={isChecked}
        onClick={onClick}
      ></BlueCheckboxStyles>
      {isChecked ? (
        <Image
          src={CheckIcon}
          alt={"Accept Privacy Policy and Terms and Conditions"}
        />
      ) : (
        <></>
      )}
    </BlueCheckboxWrapper>
  );
};

export default BlueCheckbox;
