import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const FlagIcon: FC<IconInterface> = ({ className, stroke, fill = "#fff" }) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13.8333 0.5H2.31818V7.45652H13.8333L12.0152 3.97826L13.8333 0.5Z"
        fill={fill || "#FF5858"}
      />
      <path
        d="M0.5 13.8333H4.13636M2.31818 7.45652V0.5H13.8333L12.0152 3.97826L13.8333 7.45652H2.31818ZM2.31818 7.45652V13.2536"
        stroke={stroke || "#FF5858"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default FlagIcon;