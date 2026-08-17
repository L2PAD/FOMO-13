import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const CloseIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      className={className}
    >
      <path
        d="M18 6.5L6 18.5M18 18.5L6 6.5"
        stroke={fill || "#E42736"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default CloseIcon;
