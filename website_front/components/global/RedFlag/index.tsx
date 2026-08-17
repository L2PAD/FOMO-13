import React, { FC } from "react";
import { FlagIcon } from "../Icons";
import { RedFlagWrapper } from "./styles";

export interface RedFlagInterface {
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

const RedFlag: FC<RedFlagInterface> = ({ count, className, style }) => {
  return (
    <RedFlagWrapper className={className} style={style}>
      <FlagIcon fill="#FF5858" />
      <span>{count}</span>
    </RedFlagWrapper>
  );
};

export default RedFlag;
