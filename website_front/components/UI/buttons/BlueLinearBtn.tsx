/* eslint-disable */
import React, { FC } from "react";
import { BlueLinear } from "./styles";

interface IProps {
  onClick: () => any;
  text: string;
  id?: string;
  styles?: any;
  disabled?: boolean;
}

const BlueLinearBtn: FC<IProps> = ({
  onClick,
  text,
  id,
  styles,
  disabled = false,
}) => {
  return (
    <BlueLinear onClick={onClick} disabled={disabled}>
      {text}
    </BlueLinear>
  );
};

export default BlueLinearBtn;
