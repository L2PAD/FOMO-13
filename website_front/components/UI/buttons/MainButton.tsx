/* eslint-disable */
import React, { FC } from "react";
import { MainButtonStyles, MainOrangeBtn } from "./styles";

interface IProps {
  onClick: () => any;
  children: string;
  id?: string;
  styles?: any;
  disabled?: boolean;
  type?: string;
}

const MainButton: FC<IProps> = ({
  onClick,
  children,
  id,
  styles,
  disabled = false,
  type,
}) => {
  if (type === "orange") {
    return (
      <MainOrangeBtn onClick={onClick} disabled={disabled}>
        {children}
      </MainOrangeBtn>
    );
  }

  return (
    <MainButtonStyles onClick={onClick} disabled={disabled}>
      {children}
    </MainButtonStyles>
  );
};

export default MainButton;
